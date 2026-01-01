import { useState } from "react";
import { motion } from "framer-motion";
import { Pill, Search, Plus, Clock, Check } from "lucide-react";
import { MedicalBackground } from "@/components/MedicalBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMedications } from "@/hooks/useMedications";
import { useLanguage } from "@/hooks/useLanguage";
import { BottomNav } from "@/components/BottomNav";
import { MedicationSheet } from "@/components/MedicationSheet";
import { Medication } from "@/types/medication";
import { cn } from "@/lib/utils";

const AllMedications = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "taken" | "pending">("all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"add" | "edit">("add");
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const { t } = useLanguage();

  const {
    medications,
    toggleTaken,
    addMedication,
    deleteMedication,
    editMedication,
  } = useMedications();

  const filteredMedications = medications.filter((med) => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.dosage.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "taken") return matchesSearch && med.taken;
    if (filter === "pending") return matchesSearch && !med.taken;
    return matchesSearch;
  });

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

  const iconColors: Record<string, string> = {
    blue: "from-medical to-medical/70",
    orange: "from-accent to-accent/70",
    green: "from-success to-healing",
    pink: "from-primary to-primary/70",
  };

  return (
    <div className="min-h-screen pb-24 relative">
      <MedicalBackground />
      
      <div className="relative z-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("myMedications")}</h1>
              <p className="text-sm text-muted-foreground">{medications.length} {t("medicationsRegistered")}</p>
            </div>
            <Button
              onClick={handleAdd}
              className="rounded-xl gradient-primary"
              size="icon"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-2xl bg-card/80 border-border/50"
            />
          </div>

          <div className="flex gap-2 mt-4">
            {[
              { key: "all", label: t("all") },
              { key: "pending", label: t("toTake") },
              { key: "taken", label: t("taken") },
            ].map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key as typeof filter)}
                className={cn(
                  "rounded-full",
                  filter === f.key && "gradient-primary"
                )}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </motion.header>

        <main className="px-4 space-y-3">
          {filteredMedications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
                <Pill className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {searchQuery ? t("noResult") : t("noMeds")}
              </p>
            </motion.div>
          ) : (
            filteredMedications.map((med, index) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "glass rounded-2xl p-4 shadow-soft",
                  med.taken && "opacity-60"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br",
                    iconColors[med.color] || iconColors.pink
                  )}>
                    <Pill className="h-6 w-6 text-primary-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-semibold text-foreground truncate",
                      med.taken && "line-through opacity-70"
                    )}>
                      {med.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{med.dosage}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <Clock className="h-3 w-3" />
                      <span>{med.time}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl hover:bg-primary/10"
                      onClick={() => handleEdit(med)}
                    >
                      <Pill className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-xl",
                        med.taken ? "bg-success/20" : "hover:bg-success/10"
                      )}
                      onClick={() => toggleTaken(med.id)}
                    >
                      {med.taken ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-dashed border-muted-foreground/40" />
                      )}
                    </Button>
                  </div>
                </div>

                {med.notes && (
                  <p className="mt-2 text-xs text-muted-foreground pl-16 italic">
                    💊 {med.notes}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </main>

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

export default AllMedications;
