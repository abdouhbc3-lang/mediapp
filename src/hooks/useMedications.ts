import { useState, useCallback, useEffect, useRef } from "react";
import { Medication } from "@/types/medication";
import { NotificationService } from "@/services/notifications";
import { databaseService } from "@/services/database";
import { useLanguage } from "@/hooks/useLanguage";
import { useNotificationSound } from "@/hooks/useNotificationSound";

export interface DailyHistory {
  date: string; // YYYY-MM-DD format
  totalMedications: number;
  takenMedications: number;
  medications: { id: string; name: string; time: string; taken: boolean }[];
}



const getTodayKey = () => new Date().toISOString().split("T")[0];

export const useMedications = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [history, setHistory] = useState<DailyHistory[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const initRef = useRef(false);
  const { language } = useLanguage();
  const { selectedSound } = useNotificationSound();

  // Initialize database and load data
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initDatabase = async () => {
      try {
        setIsLoading(true);
        await databaseService.initialize();
        await databaseService.migrateFromLocalStorage();

        const meds = await databaseService.getAllMedications();
        const hist = await databaseService.getAllHistory();

        setMedications(meds);
        setHistory(hist);
        setDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Fallback to empty state
        setMedications([]);
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  // Force reload medications when page becomes visible to ensure persistence
  useEffect(() => {
    if (!dbReady) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        databaseService.getAllMedications().then(meds => {
          setMedications(meds);
        }).catch(error => {
          console.error('Failed to reload medications on visibility change:', error);
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [dbReady]);

  // Initialize notifications after medications are loaded (ONLY ONCE PER DAY)
  const notificationsInitRef = useRef(false);
  const todayKey = useRef(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!dbReady || medications.length === 0 || notificationsInitRef.current) return;

    notificationsInitRef.current = true; // Prevent re-initialization

    const initNotifications = async () => {
      const hasPermission = await NotificationService.requestPermission();
      setNotificationsEnabled(hasPermission);

      if (hasPermission) {
        // Vérifier si notifications déjà programmées pour aujourd'hui
        const notificationsAlreadyProgrammed = await databaseService.getMetaValue(`notifications_programmed_${todayKey.current}`);
        const pendingNotifications = await NotificationService.checkPendingNotifications();

        if (notificationsAlreadyProgrammed !== 'true' || pendingNotifications.length === 0) {
          console.log('Programming notifications for today...');
          await NotificationService.scheduleAllMedications(medications, selectedSound);
          await databaseService.setMetaValue(`notifications_programmed_${todayKey.current}`, 'true');
          console.log('Notifications programmed and saved for today');
        } else {
          console.log('Notifications already programmed for today, skipping reprogramming');
        }

        // Setup listeners for notification actions
        NotificationService.setupListeners(
          (medicationId) => {
            console.log('Notification received for:', medicationId);
            // Could show a modal or toast here if needed
          },
          (medicationId) => {
            console.log('Remind pressed for:', medicationId);
            // Les rappels en cascade sont déjà programmés automatiquement,
            // pas besoin de rappels manuels supplémentaires pour éviter les répétitions
          },
          (medicationId) => {
            console.log('View pressed for:', medicationId);
            // Navigate to the app or show details
          }
        );
      }
    };

    initNotifications();

    // Cleanup listeners on unmount only (not on other changes)
    return () => {
      NotificationService.removeListeners();
    };
  }, [dbReady]); // Only depend on dbReady

  // Check if medication should be shown on a specific date
  const shouldShowOnDate = useCallback((medication: Medication, date: Date): boolean => {
    const dayOfWeek = date.getDay();
    const dateOfMonth = date.getDate();

    switch (medication.frequency) {
      case "daily":
        return true;
      case "weekly":
        return medication.selectedDays?.includes(dayOfWeek) ?? true;
      case "monthly":
        return medication.selectedDates?.includes(dateOfMonth) ?? true;
      case "as-needed":
        return true;
      default:
        return true;
    }
  }, []);

  // Update today's history
  const updateTodayHistory = useCallback(async (updatedMeds: Medication[]) => {
    if (!dbReady) return;

    const today = getTodayKey();
    const todayDate = new Date();
    const medsForToday = updatedMeds.filter(m => shouldShowOnDate(m, todayDate));
    
    const todayHistory: DailyHistory = {
      date: today,
      totalMedications: medsForToday.length,
      takenMedications: medsForToday.filter(m => m.taken).length,
      medications: medsForToday.map(m => ({
        id: m.id,
        name: m.name,
        time: m.time,
        taken: m.taken,
      })),
    };

    try {
      await databaseService.saveHistory(todayHistory);
      setHistory(prev => {
        const filtered = prev.filter(h => h.date !== today);
        return [...filtered, todayHistory];
      });
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }, [dbReady, shouldShowOnDate]);

  // Update history when medications change
  useEffect(() => {
    if (dbReady && medications.length > 0) {
      updateTodayHistory(medications);
    }
  }, [medications, dbReady, updateTodayHistory]);

  const toggleTaken = useCallback(async (id: string) => {
    const medication = medications.find((m) => m.id === id);
    if (!medication) return;

    const newTakenStatus = !medication.taken;

    // Optimistic update
    setMedications((prev) =>
      prev.map((med) =>
        med.id === id ? { ...med, taken: newTakenStatus } : med
      )
    );

    try {
      await databaseService.toggleMedicationTaken(id, newTakenStatus);

      // Handle notifications
      if (newTakenStatus) {
        await NotificationService.cancelMedicationReminder(id);
      } else {
        await NotificationService.scheduleMedicationReminder(medication);
      }
    } catch (error) {
      console.error('Failed to toggle medication:', error);
      // Revert on error
      setMedications((prev) =>
        prev.map((med) =>
          med.id === id ? { ...med, taken: !newTakenStatus } : med
        )
      );
    }
  }, [medications]);

  const addMedication = useCallback(async (medication: Omit<Medication, "id" | "taken">) => {
    const newMed: Medication = {
      ...medication,
      id: Date.now().toString(),
      taken: false,
    };

    try {
      await databaseService.addMedication(newMed);

      if (notificationsEnabled) {
        await NotificationService.scheduleMedicationReminder(newMed, selectedSound);
      }

      // Direct update from database to avoid multiple state changes
      const updatedMeds = await databaseService.getAllMedications();
      setMedications(updatedMeds);

    } catch (error) {
      console.error('Failed to add medication:', error);
      // Show error but don't change state pessimistically
    }
  }, [notificationsEnabled]);

  const deleteMedication = useCallback(async (id: string) => {
    const medication = medications.find(m => m.id === id);
    
    // Optimistic update
    setMedications((prev) => prev.filter((med) => med.id !== id));

    try {
      await NotificationService.cancelMedicationReminder(id);
      await databaseService.deleteMedication(id);
    } catch (error) {
      console.error('Failed to delete medication:', error);
      // Revert on error
      if (medication) {
        setMedications((prev) => [...prev, medication]);
      }
    }
  }, [medications]);

  const editMedication = useCallback(async (id: string, updates: Omit<Medication, "id" | "taken">) => {
    const oldMedication = medications.find(m => m.id === id);
    if (!oldMedication) return;

    const updatedMed: Medication = { ...oldMedication, ...updates };

    // Optimistic update
    setMedications((prev) =>
      prev.map((med) =>
        med.id === id ? updatedMed : med
      )
    );
    
    try {
      await databaseService.updateMedication(updatedMed);
      
      if (notificationsEnabled) {
        await NotificationService.cancelMedicationReminder(id);
        await NotificationService.scheduleMedicationReminder(updatedMed, selectedSound);
      }
    } catch (error) {
      console.error('Failed to edit medication:', error);
      // Revert on error
      setMedications((prev) =>
        prev.map((med) =>
          med.id === id ? oldMedication : med
        )
      );
    }
  }, [medications, notificationsEnabled]);

  const getTimePeriod = (time: string): "morning" | "afternoon" | "evening" | "night" => {
    const hour = parseInt(time.split(":")[0], 10);
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  };

  // Check if medication should be shown today based on frequency
  const shouldShowToday = (medication: Medication): boolean => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dateOfMonth = today.getDate();

    switch (medication.frequency) {
      case "daily":
        return true;
      case "weekly":
        return medication.selectedDays?.includes(dayOfWeek) ?? true;
      case "monthly":
        return medication.selectedDates?.includes(dateOfMonth) ?? true;
      case "as-needed":
        return true;
      default:
        return true;
    }
  };

  // Filter medications to show only those scheduled for today
  const todayMedications = medications.filter(shouldShowToday);

  const groupedMedications = {
    morning: todayMedications.filter((m) => getTimePeriod(m.time) === "morning"),
    afternoon: todayMedications.filter((m) => getTimePeriod(m.time) === "afternoon"),
    evening: todayMedications.filter((m) => getTimePeriod(m.time) === "evening"),
    night: todayMedications.filter((m) => getTimePeriod(m.time) === "night"),
  };

  const progress = todayMedications.length > 0
    ? (todayMedications.filter((m) => m.taken).length / todayMedications.length) * 100
    : 0;

  const takenCount = todayMedications.filter((m) => m.taken).length;

  const toggleNotifications = useCallback(async () => {
    if (notificationsEnabled) {
      await NotificationService.cancelAllReminders();
      setNotificationsEnabled(false);
    } else {
      const hasPermission = await NotificationService.requestPermission();
      if (hasPermission) {
        setNotificationsEnabled(true);
        await NotificationService.scheduleAllMedications(medications, selectedSound);
      }
    }
  }, [notificationsEnabled, medications]);

  const getHistoryForDate = useCallback((date: string): DailyHistory | undefined => {
    return history.find(h => h.date === date);
  }, [history]);

  const getCompletionForDate = useCallback((date: string): number => {
    const dayHistory = history.find(h => h.date === date);
    if (!dayHistory || dayHistory.totalMedications === 0) return 0;
    return Math.round((dayHistory.takenMedications / dayHistory.totalMedications) * 100);
  }, [history]);

  return {
    medications,
    groupedMedications,
    toggleTaken,
    addMedication,
    deleteMedication,
    editMedication,
    progress,
    takenCount,
    totalCount: todayMedications.length,
    notificationsEnabled,
    toggleNotifications,
    history,
    getHistoryForDate,
    getCompletionForDate,
    isLoading,
  };
};
