import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pill, Clock, FileText, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Medication } from "@/types/medication";
import { useLanguage } from "@/hooks/useLanguage";

interface MedicationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (medication: Omit<Medication, "id" | "taken">) => void;
  medication?: Medication | null;
  mode: "add" | "edit";
}

const colors = [
  { name: "blue", class: "bg-gradient-to-br from-cyan-400 to-blue-500" },
  { name: "orange", class: "bg-gradient-to-br from-orange-400 to-rose-500" },
  { name: "green", class: "bg-gradient-to-br from-emerald-400 to-teal-500" },
  { name: "pink", class: "bg-gradient-to-br from-pink-400 to-purple-500" },
  { name: "yellow", class: "bg-gradient-to-br from-yellow-400 to-orange-400" },
];

type Frequency = "daily" | "weekly" | "monthly" | "as-needed";

export const MedicationSheet = ({ isOpen, onClose, onSubmit, medication, mode }: MedicationSheetProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("08:00");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [notes, setNotes] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Default: Mon, Wed, Fri
  const [selectedDates, setSelectedDates] = useState<number[]>([1, 15]); // Default: 1st and 15th

  const frequencies: { value: Frequency; labelKey: string }[] = [
    { value: "daily", labelKey: "frequencyDaily" },
    { value: "weekly", labelKey: "frequencyWeekly" },
    { value: "monthly", labelKey: "frequencyMonthly" },
    { value: "as-needed", labelKey: "frequencyAsNeeded" },
  ];

  const days = [
    { value: 0, labelKey: "sunday" },
    { value: 1, labelKey: "monday" },
    { value: 2, labelKey: "tuesday" },
    { value: 3, labelKey: "wednesday" },
    { value: 4, labelKey: "thursday" },
    { value: 5, labelKey: "friday" },
    { value: 6, labelKey: "saturday" },
  ];

  useEffect(() => {
    if (medication && mode === "edit") {
      setName(medication.name);
      setDosage(medication.dosage);
      setTime(medication.time);
      setSelectedColor(medication.color);
      setNotes(medication.notes || "");
      setFrequency((medication.frequency as Frequency) || "daily");
      setSelectedDays(medication.selectedDays || [1, 3, 5]);
      setSelectedDates(medication.selectedDates || [1, 15]);
    } else if (mode === "add") {
      resetForm();
    }
  }, [medication, mode, isOpen]);

  const resetForm = () => {
    setName("");
    setDosage("");
    setTime("08:00");
    setSelectedColor("blue");
    setNotes("");
    setFrequency("daily");
    setSelectedDays([1, 3, 5]);
    setSelectedDates([1, 15]);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const toggleDate = (date: number) => {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date].sort((a, b) => a - b)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage) return;

    onSubmit({
      name,
      dosage,
      time,
      frequency,
      selectedDays: frequency === "weekly" ? selectedDays : undefined,
      selectedDates: frequency === "monthly" ? selectedDates : undefined,
      color: selectedColor,
      icon: "pill",
      notes: notes || undefined,
    });

    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-md z-40"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] bg-card shadow-2xl max-h-[90vh] overflow-y-auto pb-safe"
          >
            {/* Header avec effet glassmorphism */}
            <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border/50">
              <div className="flex justify-center pt-3 pb-2">
                <motion.div 
                  className="h-1.5 w-14 rounded-full bg-muted-foreground/30"
                  whileHover={{ scale: 1.1 }}
                />
              </div>

              <div className="flex items-center justify-between px-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {mode === "add" ? t("addMedication") : t("editMedication")}
                    </h2>
                    <p className="text-xs text-muted-foreground">{t("healthTip")}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {/* Nom du médicament */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Pill className="h-4 w-4 text-primary" />
                  </div>
                  {t("medicationName")}
                </Label>
                <Input
                  id="name"
                  placeholder={t("exampleName")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 rounded-2xl border-2 border-muted bg-muted/30 focus:bg-card focus:border-primary/50 text-base transition-all"
                />
              </motion.div>

              {/* Dosage */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Label htmlFor="dosage" className="text-sm font-medium text-foreground">{t("dosage")}</Label>
                <Input
                  id="dosage"
                  placeholder={t("exampleDosage")}
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="h-14 rounded-2xl border-2 border-muted bg-muted/30 focus:bg-card focus:border-primary/50 text-base transition-all"
                />
              </motion.div>

              {/* Heure et Fréquence en grille */}
              <motion.div 
                className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Heure */}
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-accent-foreground" />
                    </div>
                    {t("intakeTime")}
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-14 rounded-2xl border-2 border-muted bg-muted/30 focus:bg-card focus:border-primary/50 text-base transition-all"
                  />
                </div>

                {/* Fréquence dropdown-like */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-emerald-500" />
                    </div>
                    {t("frequency")}
                  </Label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as Frequency)}
                    className="w-full h-14 rounded-2xl border-2 border-muted bg-muted/30 focus:bg-card focus:border-primary/50 text-base transition-all px-4 text-foreground appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
                  >
                    {frequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {t(freq.labelKey as keyof typeof t)}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>

              {/* Sélection des jours pour fréquence hebdomadaire */}
              <AnimatePresence>
                {frequency === "weekly" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <Label className="text-sm font-medium text-foreground">{t("selectDays")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {days.map((day) => (
                        <motion.button
                          key={day.value}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleDay(day.value)}
                          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                            selectedDays.includes(day.value)
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {t(day.labelKey as keyof typeof t)}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sélection des dates pour fréquence mensuelle */}
              <AnimatePresence>
                {frequency === "monthly" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <Label className="text-sm font-medium text-foreground">{t("selectDates")}</Label>
                    <div className="grid grid-cols-7 gap-1.5">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                        <motion.button
                          key={date}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleDate(date)}
                          className={`h-10 w-10 rounded-xl font-medium text-sm transition-all ${
                            selectedDates.includes(date)
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {date}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Couleur - design moderne avec sélection */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Label className="text-sm font-medium text-foreground">{t("color")}</Label>
                <div className="flex gap-3 justify-between">
                  {colors.map((color) => (
                    <motion.button
                      key={color.name}
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedColor(color.name)}
                      className={`relative h-12 w-12 rounded-2xl ${color.class} shadow-lg transition-all ${
                        selectedColor === color.name
                          ? "ring-4 ring-primary ring-offset-2 ring-offset-background scale-110"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {selectedColor === color.name && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="h-3 w-3 rounded-full bg-white shadow-sm" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Notes */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-orange-500" />
                  </div>
                  {t("notes")}
                </Label>
                <Input
                  id="notes"
                  placeholder={t("exampleNotes")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-14 rounded-2xl border-2 border-muted bg-muted/30 focus:bg-card focus:border-primary/50 text-base transition-all"
                />
              </motion.div>

              {/* Bouton de soumission */}
              <motion.div 
                className="pt-4 pb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Button 
                  type="submit" 
                  size="xl" 
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold text-lg shadow-xl shadow-primary/25 transition-all"
                >
                  {mode === "add" ? t("addMedicationBtn") : t("saveChanges")}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
