import { useEffect, useRef } from "react";
import { Medication } from "@/types/medication";
import { toast } from "sonner";

export const useMedicationAlerts = (
  medications: Medication[],
  onMedicationDue?: (medication: Medication) => void
) => {
  const alertedMedsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkMedications = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      medications.forEach((med) => {
        if (med.taken) return;
        
        const alertKey = `${med.id}-${now.toDateString()}`;
        if (alertedMedsRef.current.has(alertKey)) return;

        // Check if it's time (within 1 minute window)
        const [medHour, medMin] = med.time.split(":").map(Number);
        const [nowHour, nowMin] = currentTime.split(":").map(Number);
        
        const medTotalMins = medHour * 60 + medMin;
        const nowTotalMins = nowHour * 60 + nowMin;
        
        if (nowTotalMins >= medTotalMins && nowTotalMins <= medTotalMins + 1) {
          alertedMedsRef.current.add(alertKey);
          
          toast.info(`💊 ${med.name}`, {
            description: `Il est l'heure de prendre ${med.dosage}`,
            duration: 10000,
            action: {
              label: "Pris ✓",
              onClick: () => onMedicationDue?.(med),
            },
          });
        }
      });
    };

    // Check immediately and then every 30 seconds
    checkMedications();
    const interval = setInterval(checkMedications, 30000);

    return () => clearInterval(interval);
  }, [medications, onMedicationDue]);

  // Reset alerts at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      alertedMedsRef.current.clear();
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);
};
