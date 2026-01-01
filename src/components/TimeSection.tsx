import { motion } from "framer-motion";
import { Medication } from "@/types/medication";
import { MedicationCard } from "./MedicationCard";
import { Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface TimeSectionProps {
  title: string;
  period: "morning" | "afternoon" | "evening" | "night";
  medications: Medication[];
  onToggleTaken: (id: string) => void;
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => void;
}

const periodConfig = {
  morning: { 
    icon: Sunrise, 
    gradient: "from-accent/20 to-warning/10",
    iconColor: "text-accent",
    label: "☀️"
  },
  afternoon: { 
    icon: Sun, 
    gradient: "from-warning/20 to-accent/10",
    iconColor: "text-warning",
    label: "🌤️"
  },
  evening: { 
    icon: Sunset, 
    gradient: "from-primary/20 to-medical/10",
    iconColor: "text-primary",
    label: "🌅"
  },
  night: { 
    icon: Moon, 
    gradient: "from-medical/20 to-muted/20",
    iconColor: "text-medical",
    label: "🌙"
  },
};

export const TimeSection = ({ title, period, medications, onToggleTaken, onEdit, onDelete }: TimeSectionProps) => {
  const { t } = useLanguage();
  const config = periodConfig[period];
  const Icon = config.icon;

  if (medications.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-3 px-1">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 10 }}
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient}`}
        >
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </motion.div>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            {title}
            <span className="text-sm">{config.label}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {medications.length} {medications.length > 1 ? t("medicationsPlural") : t("medication")}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {medications.map((med, index) => (
          <MedicationCard
            key={med.id}
            medication={med}
            onToggleTaken={onToggleTaken}
            onEdit={onEdit}
            onDelete={onDelete}
            index={index}
          />
        ))}
      </div>
    </motion.section>
  );
};
