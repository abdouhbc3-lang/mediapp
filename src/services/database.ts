import { Medication } from '@/types/medication';
import { DailyHistory } from '@/hooks/useMedications';

const STORAGE_KEYS = {
  medications: 'mediremind_medications',
  history: 'mediremind_history',
  lastDate: 'mediremind_lastDate',
  defaultSeeded: 'mediremind_default_seeded',
};

// Native SQLite implementation for Capacitor (works in web and native)
class NativeSQLiteDatabase {
  private sqlite: any = null;
  private db: any = null;
  private initialized = false;
  private static initLock: Promise<void> | null = null;

  async initialize(): Promise<void> {
    // Prevent concurrent initialization calls
    if (NativeSQLiteDatabase.initLock) {
      console.log('SQLite initialization already in progress, waiting...');
      return NativeSQLiteDatabase.initLock;
    }

    if (this.initialized) return;

    NativeSQLiteDatabase.initLock = this.performInitialization();
    return NativeSQLiteDatabase.initLock;
  }

  private async performInitialization(): Promise<void> {
    try {
      // Dynamically import to avoid issues in web preview
      const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
      this.sqlite = new SQLiteConnection(CapacitorSQLite);

      // First try to retrieve existing connection
      try {
        this.db = await this.sqlite.retrieveConnection('mediremind_db', false);
        console.log('Retrieved existing SQLite connection');
      } catch (retrieveError) {
        // If retrieval fails, create new connection
        console.log('Creating new SQLite connection');
        this.db = await this.sqlite.createConnection(
          'mediremind_db',
          false,
          'no-encryption',
          1,
          false
        );
      }

      await this.db.open();
      await this.createTables();
      this.initialized = true;
      console.log('Native SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize native SQLite:', error);
      throw error;
    } finally {
      // Clear the lock after initialization completes or fails
      NativeSQLiteDatabase.initLock = null;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createMedicationsTable = `
      CREATE TABLE IF NOT EXISTS medications (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        time TEXT NOT NULL,
        frequency TEXT NOT NULL,
        selectedDays TEXT,
        selectedDates TEXT,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        taken INTEGER DEFAULT 0,
        notes TEXT,
        takenDate TEXT
      );
    `;

    const createHistoryTable = `
      CREATE TABLE IF NOT EXISTS daily_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        totalMedications INTEGER NOT NULL,
        takenMedications INTEGER NOT NULL,
        medications TEXT NOT NULL
      );
    `;

    const createMetaTable = `
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `;

    await this.db.execute(createMedicationsTable);
    await this.db.execute(createHistoryTable);
    await this.db.execute(createMetaTable);
  }

  private async getMetaValue(key: string): Promise<string | null> {
    if (!this.db) return null;
    const result = await this.db.query('SELECT value FROM meta WHERE key = ?', [key]);
    return result.values?.[0]?.value || null;
  }

  private async setMetaValue(key: string, value: string): Promise<void> {
    if (!this.db) return;
    await this.db.run(
      'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
      [key, value]
    );
  }

  async getAllMedications(): Promise<Medication[]> {
    if (!this.db) throw new Error('Database not initialized');

    const today = new Date().toISOString().split('T')[0];
    const lastDate = await this.getMetaValue('lastDate');

    const result = await this.db.query('SELECT * FROM medications');
    
    if (!result.values) return [];

    const medications = result.values.map((row: any) => ({
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      time: row.time,
      frequency: row.frequency as Medication['frequency'],
      selectedDays: row.selectedDays ? JSON.parse(row.selectedDays) : undefined,
      selectedDates: row.selectedDates ? JSON.parse(row.selectedDates) : undefined,
      color: row.color,
      icon: row.icon,
      taken: lastDate === today ? Boolean(row.taken) : false,
      notes: row.notes || undefined,
    }));

    // Reset taken status if new day
    if (lastDate !== today) {
      await this.setMetaValue('lastDate', today);
      await this.db.run('UPDATE medications SET taken = 0, takenDate = NULL');
    }

    return medications;
  }

  async addMedication(medication: Medication): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT INTO medications (id, name, dosage, time, frequency, selectedDays, selectedDates, color, icon, taken, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      medication.id,
      medication.name,
      medication.dosage,
      medication.time,
      medication.frequency,
      medication.selectedDays ? JSON.stringify(medication.selectedDays) : null,
      medication.selectedDates ? JSON.stringify(medication.selectedDates) : null,
      medication.color,
      medication.icon,
      medication.taken ? 1 : 0,
      medication.notes || null,
    ]);
  }

  async updateMedication(medication: Medication): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      UPDATE medications 
      SET name = ?, dosage = ?, time = ?, frequency = ?, selectedDays = ?, selectedDates = ?, color = ?, icon = ?, taken = ?, notes = ?, takenDate = ?
      WHERE id = ?
    `;

    const today = new Date().toISOString().split('T')[0];

    await this.db.run(query, [
      medication.name,
      medication.dosage,
      medication.time,
      medication.frequency,
      medication.selectedDays ? JSON.stringify(medication.selectedDays) : null,
      medication.selectedDates ? JSON.stringify(medication.selectedDates) : null,
      medication.color,
      medication.icon,
      medication.taken ? 1 : 0,
      medication.notes || null,
      medication.taken ? today : null,
      medication.id,
    ]);
  }

  async deleteMedication(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.run('DELETE FROM medications WHERE id = ?', [id]);
  }

  async toggleMedicationTaken(id: string, taken: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const today = new Date().toISOString().split('T')[0];
    await this.db.run(
      'UPDATE medications SET taken = ?, takenDate = ? WHERE id = ?',
      [taken ? 1 : 0, taken ? today : null, id]
    );
  }

  async getAllHistory(): Promise<DailyHistory[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query('SELECT * FROM daily_history ORDER BY date DESC LIMIT 30');
    
    if (!result.values) return [];

    return result.values.map((row: any) => ({
      date: row.date,
      totalMedications: row.totalMedications,
      takenMedications: row.takenMedications,
      medications: JSON.parse(row.medications),
    }));
  }

  async saveHistory(history: DailyHistory): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO daily_history (date, totalMedications, takenMedications, medications)
      VALUES (?, ?, ?, ?)
    `;

    await this.db.run(query, [
      history.date,
      history.totalMedications,
      history.takenMedications,
      JSON.stringify(history.medications),
    ]);
  }

  async migrateFromLocalStorage(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const migrated = await this.getMetaValue('migrated_from_localstorage');
    if (migrated === 'true') return;

    try {
      const storedMeds = localStorage.getItem('mediremind_medications');
      if (storedMeds) {
        const medications: Medication[] = JSON.parse(storedMeds);
        for (const med of medications) {
          try {
            await this.addMedication(med);
          } catch (e) {
            console.log('Medication already exists:', med.id);
          }
        }
      }

      const storedHistory = localStorage.getItem('mediremind_history');
      if (storedHistory) {
        const histories: DailyHistory[] = JSON.parse(storedHistory);
        for (const history of histories) {
          try {
            await this.saveHistory(history);
          } catch (e) {
            console.log('History already exists:', history.date);
          }
        }
      }

      await this.setMetaValue('migrated_from_localstorage', 'true');
      console.log('Migration from localStorage completed');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  async seedDefaultMedications(defaultMeds: Medication[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const seeded = await this.getMetaValue('default_seeded');
    const defaultWithIds = defaultMeds.map((med, index) => ({
      ...med,
      id: `default_${index + 1}`
    }));

    if (seeded !== 'true') {
      const result = await this.db.query('SELECT COUNT(*) as count FROM medications');
      const count = result.values?.[0]?.count || 0;

      if (count === 0) {
        for (const med of defaultWithIds) {
          await this.addMedication(med);
        }
        await this.setMetaValue('default_seeded', 'true');
        console.log('Default medications seeded');
      }
    } else {
      // Verify default medications are present, restore if missing
      for (const defaultMed of defaultWithIds) {
        const result = await this.db.query('SELECT id FROM medications WHERE id = ?', [defaultMed.id]);
        if (!result.values || result.values.length === 0) {
          await this.addMedication(defaultMed);
          console.log('Restored missing default medication:', defaultMed.name);
        }
      }
    }
  }

  async closeConnection(): Promise<void> {
    if (this.db && this.sqlite) {
      await this.sqlite.closeConnection('mediremind_db', false);
      this.db = null;
      this.initialized = false;
    }
  }
}

// Database interface
interface DatabaseInterface {
  initialize(): Promise<void>;
  getAllMedications(): Promise<Medication[]>;
  addMedication(medication: Medication): Promise<void>;
  updateMedication(medication: Medication): Promise<void>;
  deleteMedication(id: string): Promise<void>;
  toggleMedicationTaken(id: string, taken: boolean): Promise<void>;
  getAllHistory(): Promise<DailyHistory[]>;
  saveHistory(history: DailyHistory): Promise<void>;
  migrateFromLocalStorage(): Promise<void>;
  seedDefaultMedications(defaultMeds: Medication[]): Promise<void>;
  closeConnection(): Promise<void>;
}

// Factory function to create database (SQLite for both web and native)
function createDatabase(): DatabaseInterface {
  console.log('Using SQLite database (works in both web and native)');
  return new NativeSQLiteDatabase();
}

export const databaseService = createDatabase();
