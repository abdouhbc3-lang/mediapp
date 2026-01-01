import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ReminderModal } from "@/components/ReminderModal";
import { useLanguage } from "@/hooks/useLanguage";
import { useMedications } from "@/hooks/useMedications";
import { toast } from "@/components/ui/sonner";
import { Medication } from "@/types/medication";
import Index from "./pages/Index";
import AllMedications from "./pages/AllMedications";
import History from "./pages/History";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const { setLanguage, t } = useLanguage();
  const [snoozeTimeout, setSnoozeTimeout] = useState<NodeJS.Timeout | null>(null);
  const { medications, toggleTaken, isLoading: medicationsLoading } = useMedications();

  // Reminder modal state
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [currentReminderMedication, setCurrentReminderMedication] = useState<Medication | null>(null);

  useEffect(() => {
    try {
      const onboardingCompleted = localStorage.getItem("hasCompletedOnboarding");
      setHasCompletedOnboarding(onboardingCompleted === "true");
    } catch (error) {
      console.error('Error loading onboarding status:', error);
      setHasCompletedOnboarding(false); // Default to show onboarding
    }
  }, []);

  // Force show onboarding after 5 seconds if stuck loading
  useEffect(() => {
    if (hasCompletedOnboarding !== null) return;

    const timeout = setTimeout(() => {
      console.warn('Forcing onboarding due to loading timeout');
      setHasCompletedOnboarding(false);
    }, 5000);

    setLoadingTimeout(timeout);
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [hasCompletedOnboarding]);

  const handleOnboardingSubmit = (name: string, language: any) => {
    try {
      console.log('Setting up onboarding:', name, language);
      localStorage.setItem("user-name", name);
      localStorage.setItem("hasCompletedOnboarding", "true");
      setLanguage(language);
      setHasCompletedOnboarding(true);
      console.log('Onboarding setup complete');
    } catch (error) {
      console.error('Error in onboarding submit:', error);
      // Fallback: still proceed
      setHasCompletedOnboarding(true);
    }
  };

  // Reminder modal handlers
  const handleMedicationTaken = () => {
    if (currentReminderMedication) {
      toggleTaken(currentReminderMedication.id);
      setIsReminderOpen(false);
      setCurrentReminderMedication(null);
      toast.success(`✅ ${currentReminderMedication.name} marqué comme pris`);
    }
  };

  const handleRemindLater = () => {
    const medicationToRemind = currentReminderMedication;
    setIsReminderOpen(false);
    setCurrentReminderMedication(null);

    // Schedule reminder for 5 minutes later
    if (medicationToRemind) {
      const timeout = setTimeout(() => {
        setCurrentReminderMedication(medicationToRemind);
        setIsReminderOpen(true);
      }, 5 * 60 * 1000); // 5 minutes
      setSnoozeTimeout(timeout);
      toast.info(`⏰ Rappel programmé dans 5 minutes pour ${medicationToRemind.name}`);
    }
  };

  const handleReminderClose = () => {
    setIsReminderOpen(false);
    setCurrentReminderMedication(null);
  };

  // Check for due medications every minute
  useEffect(() => {
    if (!hasCompletedOnboarding || medicationsLoading) return;

    console.log('Checking for due medications, medications loaded:', medications.length);

    const checkForDueMedications = () => {
      console.log('Running checkForDueMedications, medications count:', medications.length);
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const currentTimeInMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);
      const currentDay = now.getDay();
      const currentDate = now.getDate();

      const dueMedication = medications.find(med => {
        console.log('Checking medication:', med.name, 'time:', med.time, 'taken:', med.taken, 'frequency:', med.frequency);
        if (med.taken) {
          console.log('Medication already taken, skipping');
          return false;
        }

        // Check frequency rules
        let isScheduledToday = false;
        switch (med.frequency) {
          case "daily":
            isScheduledToday = true;
            break;
          case "weekly":
            isScheduledToday = med.selectedDays?.includes(currentDay) ?? true;
            break;
          case "monthly":
            isScheduledToday = med.selectedDates?.includes(currentDate) ?? true;
            break;
          case "as-needed":
            isScheduledToday = true;
            break;
          default:
            isScheduledToday = true;
        }

        if (!isScheduledToday) {
          console.log('Medication not scheduled today');
          return false;
        }

        // Check if medication time is near (within +/- 2 minutes)
        const medTimeInMinutes = parseInt(med.time.split(':')[0]) * 60 + parseInt(med.time.split(':')[1]);
        const timeDiff = medTimeInMinutes - currentTimeInMinutes;
        console.log('Time diff for', med.name, 'is', timeDiff, 'minutes');
        return timeDiff >= -1 && timeDiff <= 0; // Due now or 1 minute ago (for catch-up only)
      });

      // Show reminder modal for due medication
      if (dueMedication && !isReminderOpen) {
        console.log('Medication due:', dueMedication.name, '- showing reminder modal');
        // Clear any existing snooze timeout when a new medication becomes due
        if (snoozeTimeout) {
          clearTimeout(snoozeTimeout);
          setSnoozeTimeout(null);
        }
        setCurrentReminderMedication(dueMedication);
        setIsReminderOpen(true);
      }
    };

    // Check immediately and then every 30 seconds for more responsiveness
    checkForDueMedications();
    const interval = setInterval(checkForDueMedications, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      // Clear snooze timeout when effect cleans up
      if (snoozeTimeout) {
        clearTimeout(snoozeTimeout);
        setSnoozeTimeout(null);
      }
    };
  }, [hasCompletedOnboarding, medications, medicationsLoading, t, toggleTaken, isReminderOpen, snoozeTimeout]);

  if (hasCompletedOnboarding === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {hasCompletedOnboarding ? (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/medications" element={<AllMedications />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      ) : (
        <OnboardingModal
          isOpen={!hasCompletedOnboarding}
          onSubmit={handleOnboardingSubmit}
        />
      )}

      <ReminderModal
        isOpen={isReminderOpen}
        medication={currentReminderMedication}
        onTaken={handleMedicationTaken}
        onRemindLater={handleRemindLater}
        onClose={handleReminderClose}
      />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
