import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Pill, MoreVertical, Pencil, Trash2, Syringe, Heart, Cross, Sparkles, AlertCircle } from "lucide-react";
import { Medication } from "@/types/medication";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MedicationCardProps {
  medication: Medication;
  onToggleTaken: (id: string) => void;
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => void;
  index: number;
}

const iconColors: Record<string, { gradient: string; shadow: string; glow: string }> = {
  blue: { gradient: "from-medical to-medical/70", shadow: "shadow-[0_4px_20px_hsl(200_80%_55%_/_0.3)]", glow: "hsl(200 80% 55%)" },
  orange: { gradient: "from-accent to-accent/70", shadow: "shadow-[0_4px_20px_hsl(340_75%_55%_/_0.3)]", glow: "hsl(340 75% 55%)" },
  green: { gradient: "from-success to-healing", shadow: "shadow-[0_4px_20px_hsl(152_70%_45%_/_0.3)]", glow: "hsl(152 70% 45%)" },
  pink: { gradient: "from-primary to-primary/70", shadow: "shadow-[0_4px_20px_hsl(168_76%_42%_/_0.3)]", glow: "hsl(168 76% 42%)" },
};

const medicationIcons = [Pill, Heart, Syringe, Cross];

export const MedicationCard = ({ medication, onToggleTaken, onEdit, onDelete, index }: MedicationCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const colorStyle = iconColors[medication.color] || iconColors.pink;
  const IconComponent = medicationIcons[index % medicationIcons.length];
  const isPending = !medication.taken;

  // Check if medication time has passed
  const now = new Date();
  const [medHour, medMin] = medication.time.split(":").map(Number);
  const medTime = new Date();
  medTime.setHours(medHour, medMin, 0, 0);
  const isOverdue = isPending && now > medTime;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4, type: "spring" }}
      whileHover={{ scale: isPending ? 1.02 : 1.01, y: -2 }}
      className={cn(
        "relative rounded-3xl p-4 transition-all duration-300 overflow-hidden",
        medication.taken 
          ? "glass opacity-70" 
          : "bg-gradient-to-br from-card via-card to-card/80 border-2 border-primary/20 shadow-elevated"
      )}
    >
      {/* Animated background for pending medications */}
      {isPending && (
        <>
          {/* Glowing border effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl opacity-50"
            style={{
              background: `linear-gradient(135deg, ${colorStyle.glow}20 0%, transparent 50%, ${colorStyle.glow}10 100%)`,
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/40"
                style={{
                  left: `${20 + i * 30}%`,
                  top: "50%",
                }}
                animate={{
                  y: [-10, -20, -10],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
            }}
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          />
        </>
      )}

      {/* Overdue indicator */}
      {isOverdue && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 z-10"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center gap-1 bg-destructive/10 text-destructive rounded-full px-2 py-0.5"
          >
            <AlertCircle className="h-3 w-3" />
            <span className="text-[10px] font-medium">En retard</span>
          </motion.div>
        </motion.div>
      )}

      {/* Background decoration */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 transition-all",
        isPending ? "bg-primary/10" : "bg-primary/5"
      )} />
      
      <div className="flex items-center gap-4 relative">
        {/* Icon with enhanced pulse effect for pending */}
        <motion.div 
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br transition-all duration-300 relative",
            colorStyle.gradient,
            colorStyle.shadow,
            medication.taken && "grayscale"
          )}
          animate={isPending ? { 
            scale: [1, 1.05, 1],
            boxShadow: [
              `0 4px 20px ${colorStyle.glow}30`,
              `0 8px 30px ${colorStyle.glow}50`,
              `0 4px 20px ${colorStyle.glow}30`,
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <IconComponent className="h-7 w-7 text-primary-foreground" />
          
          {/* Sparkle for pending */}
          {isPending && (
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-warning" />
            </motion.div>
          )}
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold truncate text-base",
            medication.taken ? "line-through opacity-70 text-muted-foreground" : "text-foreground"
          )}>
            {medication.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "text-sm font-medium",
              isPending ? "text-foreground/80" : "text-muted-foreground"
            )}>
              {medication.dosage}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <motion.div 
              className={cn(
                "flex items-center gap-1 text-sm",
                isOverdue ? "text-destructive" : isPending ? "text-primary" : "text-muted-foreground"
              )}
              animate={isPending && !isOverdue ? { opacity: [1, 0.6, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{medication.time}</span>
            </motion.div>
          </div>
        </div>

        {/* More Actions Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowActions(!showActions)}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted/50 transition-colors"
        >
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </motion.button>

        {/* Check Button - Enhanced for pending */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={isPending ? { scale: 1.1 } : {}}
          onClick={() => onToggleTaken(medication.id)}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 relative",
            medication.taken
              ? "gradient-success shadow-soft"
              : "border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/20"
          )}
        >
          {medication.taken ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <Check className="h-6 w-6 text-success-foreground" />
            </motion.div>
          ) : (
            <>
              {/* Pulsing ring for pending */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div 
                className="h-4 w-4 rounded-full bg-gradient-to-br from-primary/60 to-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </>
          )}
        </motion.button>
      </div>

      {medication.notes && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "mt-3 text-xs pl-[4.5rem] italic",
            isPending ? "text-foreground/70" : "text-muted-foreground"
          )}
        >
          💊 {medication.notes}
        </motion.p>
      )}

      {/* Actions Dropdown */}
      <AnimatePresence>
        {showActions && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" 
              onClick={() => setShowActions(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-16 top-4 z-50 glass rounded-2xl shadow-elevated border border-border overflow-hidden"
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 rounded-none hover:bg-primary/10 px-4 py-3"
                onClick={() => {
                  onEdit(medication);
                  setShowActions(false);
                }}
              >
                <Pencil className="h-4 w-4 text-primary" />
                Modifier
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive px-4 py-3"
                onClick={() => {
                  onDelete(medication.id);
                  setShowActions(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
