import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Stethoscope, Heart, Activity } from "lucide-react";
import { Header } from "@/components/Header";
import { ProgressRing } from "@/components/ProgressRing";
import { TimeSection } from "@/components/TimeSection";
import { MedicationSheet } from "@/components/MedicationSheet";
import { MedicalBackground } from "@/components/MedicalBackground";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useMedications } from "@/hooks/useMedications";
import { useMedicationAlerts } from "@/hooks/useMedicationAlerts";
import { useLanguage } from "@/hooks/useLanguage";
import { Medication } from "@/types/medication";

const Index = () => {
  const [sheetMode, setSheetMode] = useState<"add" | "edit">("add");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const { t } = useLanguage();
  
  const {
    medications,
    groupedMedications,
    toggleTaken,
    addMedication,
    deleteMedication,
    editMedication,
    progress,
    takenCount,
    totalCount,
    notificationsEnabled,
    toggleNotifications,
    isLoading,
  } = useMedications();

  // Force show content after 10 seconds to prevent white screen
  const [forcedShow, setForcedShow] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoading || forcedShow) return;

    const timeout = setTimeout(() => {
      console.warn('Forcing show content due to loading timeout');
      setForcedShow(true);
    }, 10000);

    setLoadingTimeout(timeout);
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading, forcedShow]);

  // Hooks must be called unconditionally - before any conditional returns
  const handleMedicationDue = useCallback((medication: Medication) => {
    toggleTaken(medication.id);
  }, [toggleTaken]);

  useMedicationAlerts(medications, handleMedicationDue);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loading") || "Chargement des médicaments..."}</p>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    setSheetMode("add");
    setEditingMedication(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (medication: Medication) => {
    setSheetMode("edit");
    setEditingMedication(medication);
    setIsSheetOpen(true);
  };

  const handleSubmit = (data: Omit<Medication, "id" | "taken">) => {
    if (sheetMode === "add") {
      addMedication(data);
    } else if (editingMedication) {
      editMedication(editingMedication.id, data);
    }
  };

  return (
    <div className="min-h-screen pb-24 relative">
      <MedicalBackground />
      
      <div className="relative z-10">
        <Header 
          notificationsEnabled={notificationsEnabled} 
          onToggleNotifications={toggleNotifications} 
        />

        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="px-4 py-4"
        >
          <div className="glass rounded-3xl p-6 shadow-elevated relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-primary/10 to-success/5 -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-gradient-to-tr from-medical/10 to-transparent translate-y-1/2 -translate-x-1/4" />
            
            <div className="flex items-center justify-between relative">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Heart className="h-5 w-5 text-accent fill-accent/30" />
                  </motion.div>
                  <h2 className="font-bold text-foreground text-lg">{t("yourHealth")}</h2>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground font-semibold">{takenCount}</span> {t("onOf")} <span className="text-foreground font-semibold">{totalCount}</span> {t("medications")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {progress === 100
                      ? t("allDone")
                      : progress >= 50
                      ? t("keepGoing")
                      : t("dontForget")}
                  </p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-xl px-3 py-2 mt-2"
                >
                  <Stethoscope className="h-4 w-4" />
                  <span>{t("healthTip")}</span>
                </motion.div>
              </div>
              
              <ProgressRing progress={progress} />
            </div>
          </div>
        </motion.section>

        <main className="px-4 space-y-6 mt-2">
          <TimeSection
            title={t("morning")}
            period="morning"
            medications={groupedMedications.morning}
            onToggleTaken={toggleTaken}
            onEdit={handleEdit}
            onDelete={deleteMedication}
          />
          <TimeSection
            title={t("afternoon")}
            period="afternoon"
            medications={groupedMedications.afternoon}
            onToggleTaken={toggleTaken}
            onEdit={handleEdit}
            onDelete={deleteMedication}
          />
          <TimeSection
            title={t("evening")}
            period="evening"
            medications={groupedMedications.evening}
            onToggleTaken={toggleTaken}
            onEdit={handleEdit}
            onDelete={deleteMedication}
          />
          <TimeSection
            title={t("night")}
            period="night"
            medications={groupedMedications.night}
            onToggleTaken={toggleTaken}
            onEdit={handleEdit}
            onDelete={deleteMedication}
          />

          {totalCount === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-medical/10 mb-4"
              >
                <Activity className="h-12 w-12 text-primary" />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{t("noMeds")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("addFirst")}
              </p>
            </motion.div>
          )}
        </main>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="fixed bottom-24 right-6 z-20"
        >
          <Button
            variant="fab"
            size="fab"
            onClick={handleAdd}
            className="shadow-glow animate-pulse-glow"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>

        <BottomNav />
        <MedicationSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onSubmit={handleSubmit}
          medication={editingMedication}
          mode={sheetMode}
        />
      </div>
    </div>
  );
};

export default Index;
