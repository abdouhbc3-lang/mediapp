import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Medication } from "@/types/medication";
import { useLanguage } from "@/hooks/useLanguage";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface ReminderModalProps {
  isOpen: boolean;
  medication: Medication | null;
  onTaken: () => void;
  onRemindLater: () => void;
  onClose: () => void;
}

export const ReminderModal = ({
  isOpen,
  medication,
  onTaken,
  onRemindLater,
  onClose
}: ReminderModalProps) => {
  const { t } = useLanguage();
  const { playSound } = useNotificationSound();

  React.useEffect(() => {
    if (isOpen && medication) {
      // Play notification sound when modal appears
      playSound();
    }
  }, [isOpen, medication, playSound]);

  if (!medication) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[425px] glass border-2 border-orange-200">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-20 w-20 rounded-full bg-orange-500 flex items-center justify-center mb-4 shadow-lg"
              >
                <span className="text-3xl">⏰</span>
              </motion.div>

              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {t("timeToTake")}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground space-y-2">
                  <div className="text-lg font-semibold text-primary">
                    {medication.name}
                  </div>
                  <div className="text-sm">
                    {medication.dosage} • {medication.time}
                  </div>
                  {medication.notes && (
                    <div className="text-xs text-muted-foreground italic">
                      {medication.notes}
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex gap-3 pt-6 w-full">
                <Button
                  variant="outline"
                  onClick={onRemindLater}
                  className="flex-1"
                >
                  {t("remind")} (5 min)
                </Button>
                <Button
                  onClick={onTaken}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {t("taken")}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
