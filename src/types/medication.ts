export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: "daily" | "weekly" | "monthly" | "as-needed";
  selectedDays?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  selectedDates?: number[]; // 1-31 for monthly frequency
  color: string;
  icon: string;
  taken: boolean;
  notes?: string;
}

export interface MedicationReminder {
  id: string;
  medicationId: string;
  scheduledTime: string;
  status: "pending" | "taken" | "missed" | "snoozed";
}
