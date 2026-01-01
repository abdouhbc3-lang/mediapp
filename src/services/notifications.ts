import { LocalNotifications, ScheduleOptions, ActionType } from '@capacitor/local-notifications';
import { Medication } from '@/types/medication';
import { translations, Language } from '@/hooks/useLanguage';
import { NotificationSound } from '@/hooks/useNotificationSound';

export const NotificationService = {
  async registerActionTypes(language: Language): Promise<void> {
    const t = (key: keyof typeof translations.fr) => translations[language][key] || key;

    const medicationActionType: ActionType = {
      id: 'medication_reminders',
      actions: [
        {
          id: 'remind',
          title: t('remind'),
        },
        {
          id: 'view',
          title: t('view'),
        },
      ],
    };

    try {
      await LocalNotifications.registerActionTypes({
        types: [medicationActionType],
      });
      console.log('Notification action types registered');
    } catch (error) {
      console.error('Error registering action types:', error);
    }
  },

  async requestPermission(): Promise<boolean> {
    const permission = await LocalNotifications.requestPermissions();
    const granted = permission.display === 'granted';

    if (granted) {
      console.log('✅ Notification permissions granted');
      // Additional setup for Android to ensure notifications appear on lock screen
      try {
        // Create channel with maximum priority for lock screen visibility
        await this.createNotificationChannel('ringtone1');
        console.log('📱 Notification channel optimized for lock screen');
      } catch (error) {
        console.warn('⚠️ Could not optimize notification channel:', error);
      }
    } else {
      console.warn('❌ Notification permissions denied - notifications will not work');
    }

    return granted;
  },

  async checkPermission(): Promise<boolean> {
    const permission = await LocalNotifications.checkPermissions();
    return permission.display === 'granted';
  },

  async checkPendingNotifications(): Promise<number[]> {
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications.map(n => n.id);
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  },

  async createNotificationChannel(sound: NotificationSound = 'ringtone1'): Promise<void> {
    try {
      await LocalNotifications.createChannel({
        id: `medication_reminders_${sound}`,
        name: 'Medication Reminders',
        description: 'Critical notifications for medication reminders',
        sound: sound,
        vibration: [0, 1000, 500, 1000, 500, 1000], // Stronger vibration pattern
        importance: 5, // High importance (MAX)
        visibility: 1, // Public
        lights: true,
        lightColor: '#FF0000', // Red light
        showWhen: true,
        lockScreen: true,
      });
      console.log(`Notification channel created with high priority for: ${sound}`);
    } catch (error) {
      console.error('Error creating notification channel:', error);
    }
  },

  async scheduleMedicationReminder(medication: Medication, sound: NotificationSound = 'ringtone1'): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    // Create notification channel for Android
    await this.createNotificationChannel(sound);

    const [hours, minutes] = medication.time.split(':').map(Number);

    // Create a date for today at the medication time
    const now = new Date();
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);

    // Handle past times - add a small delay to make it future
    if (scheduledDate <= now) {
      scheduledDate.setTime(now.getTime() + 10000); // Schedule 10 seconds from now
    }

    // Create a stable notification ID using medication ID hash
    let baseId = medication.id.split('').reduce((hash, char) => {
      hash = ((hash << 5) - hash) + char.charCodeAt(0);
      return hash & hash;
    }, 0);
    baseId = Math.abs(baseId) % 900000 + 100000; // Ensure ID is 100000-999999

    // Schedule up to 3 cascading reminders
    const reminders = [
      { id: baseId, title: '💊 Rappel médicament', body: `Il est l'heure de prendre ${medication.name} (${medication.dosage})`, delay: 0, level: 1 },
      { id: baseId + 1000000, title: '💊 Premier rappel', body: `N'oubliez pas de prendre ${medication.name} (${medication.dosage})`, delay: 10 * 60 * 1000, level: 2 }, // 10 minutes
      { id: baseId + 2000000, title: '💊 Deuxième rappel', body: `Rappel important: prenez ${medication.name} (${medication.dosage})`, delay: 30 * 60 * 1000, level: 3 }, // 30 minutes
      { id: baseId + 3000000, title: '💊 Dernier rappel', body: `NE PAS OUBLIER: ${medication.name} (${medication.dosage}) doit être pris`, delay: 60 * 60 * 1000, level: 4 }, // 1 hour
    ];

    const nowTime = Date.now();
    const notificationOptions: ScheduleOptions['notifications'] = [];

    for (const reminder of reminders) {
      const reminderTime = scheduledDate.getTime() + reminder.delay;

      if (reminderTime > nowTime + 24 * 60 * 60 * 1000) {
        // Skip if more than 24 hours in the future
        break;
      }

      const options = {
        id: reminder.id,
        title: reminder.title,
        body: reminder.body,
        schedule: {
          at: reminderTime > nowTime ? new Date(reminderTime) : new Date(nowTime + 10000), // 10 seconds minimum delay
          repeats: false,
        },
        sound: sound,
        vibrationPattern: [0, 1000, 500, 1000], // Vibration pattern for Android
        smallIcon: 'ic_stat_icon',
        largeIcon: 'ic_launcher',
        channelId: `medication_reminders_${sound}`, // Use our notification channel
        actions: [
          {
            id: 'remind',
            title: 'Rappeler',
          },
          {
            id: 'view',
            title: 'Voir',
          },
        ],
        extra: {
          medicationId: medication.id,
          reminderLevel: reminder.level,
        },
      };

      notificationOptions.push(options);
    }

    try {
      if (notificationOptions.length > 0) {
        await LocalNotifications.schedule({
          notifications: notificationOptions
        });
        console.log(`Scheduled ${notificationOptions.length} cascading reminders for ${medication.name}`);
      }
    } catch (error) {
      console.error('Error scheduling cascading notifications:', error);
    }
  },

  async cancelMedicationReminder(medicationId: string): Promise<void> {
    // Cancel all cascading notifications (initial + up to 3 reminders)
    let baseId = medicationId.split('').reduce((hash, char) => {
      hash = ((hash << 5) - hash) + char.charCodeAt(0);
      return hash & hash;
    }, 0);
    baseId = Math.abs(baseId) % 900000 + 100000; // Ensure ID is 100000-999999

    const notificationIds = [
      baseId,           // Initial notification
      baseId + 1000000, // Reminder level 2
      baseId + 2000000, // Reminder level 3
      baseId + 3000000, // Reminder level 4
    ];

    try {
      await LocalNotifications.cancel({
        notifications: notificationIds.map(id => ({ id })),
      });
      console.log(`All cascading notifications cancelled for medication ${medicationId}`);
    } catch (error) {
      console.error('Error cancelling cascading notifications:', error);
    }
  },

  async cancelAllReminders(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications,
        });
      }
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  },

  async scheduleReminder(medication: Medication, minutesDelay: number = 5, sound: NotificationSound = 'ringtone1'): Promise<void> {
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    // Check if reminder already exists for this medication
    const pendingIds = await this.checkPendingNotifications();
    let reminderId = medication.id.split('').reduce((hash, char) => {
      hash = ((hash << 5) - hash) + char.charCodeAt(0);
      return hash & hash;
    }, 0);
    reminderId = (Math.abs(reminderId) % 900000 + 100000) + 1000000; // Reminder ID is 1100000-1999999

    if (pendingIds.includes(reminderId)) {
      console.log(`Reminder already exists for medication ${medication.id}`);
      return;
    }

    await this.createNotificationChannel(sound);

    const reminderDate = new Date();
    reminderDate.setTime(reminderDate.getTime() + minutesDelay * 60 * 1000);

    const options: ScheduleOptions = {
      notifications: [
        {
          id: reminderId,
          title: '💊 Rappel médicament',
          body: `Rappel: Il est l'heure de prendre ${medication.name} (${medication.dosage})`,
          schedule: {
            at: reminderDate,
            repeats: false,
          },
          sound: sound,
          vibrationPattern: [0, 1000, 500, 1000], // Vibration pattern for Android
          smallIcon: 'ic_stat_icon',
          largeIcon: 'ic_launcher',
          channelId: `medication_reminders_${sound}`,
          actions: [
            {
              id: 'remind',
              title: 'Rappeler',
            },
            {
              id: 'view',
              title: 'Voir',
            },
          ],
          extra: {
            medicationId: medication.id,
          },
        },
      ],
    };

    try {
      await LocalNotifications.schedule(options);
      console.log(`Reminder scheduled for ${medication.name} in ${minutesDelay} minutes`);
    } catch (error) {
      console.error('Error scheduling reminder:', error);
    }
  },

  async scheduleAllMedications(medications: Medication[], sound: NotificationSound = 'ringtone1'): Promise<void> {
    for (const medication of medications) {
      if (!medication.taken) {
        await this.scheduleMedicationReminder(medication, sound);
      }
    }
  },

  async showNotificationSettingsGuide(): Promise<void> {
    // Show guide for enabling lock screen notifications
    console.log('🔧 Guide pour activer les notifications écran verrouillé :');
    console.log('1. Ouvrir Paramètres → Applications → MedTime Companion → Notifications');
    console.log('2. Activer "Afficher sur écran verrouillé": Montrer le contenu');
    console.log('3. Activer "Réveiller l\'appareil" si disponible');
    console.log('4. Ouvrir Paramètres → Batterie → Optimisation → Tout afficher → MedTime Companion → Ne pas optimiser');
    console.log('5. Activer "Réveil et rappels" si demandé');
  },

  setupListeners(
    onNotificationReceived: (medicationId: string) => void,
    onRemindPressed: (medicationId: string) => void,
    onViewPressed: (medicationId: string) => void
  ): void {
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
      const medicationId = notification.extra?.medicationId;
      if (medicationId) {
        onNotificationReceived(medicationId);
      }
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('Notification action performed:', action);
      const medicationId = action.notification.extra?.medicationId;
      if (medicationId) {
        if (action.actionId === 'remind') {
          onRemindPressed(medicationId);
        } else if (action.actionId === 'view') {
          onViewPressed(medicationId);
        }
      }
    });
  },

  removeListeners(): void {
    LocalNotifications.removeAllListeners();
  },
};
