import { Bell, BellOff, Pill, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
}

export const Header = ({ notificationsEnabled, onToggleNotifications }: HeaderProps) => {
  const today = new Date();
  const dayName = today.toLocaleDateString("fr-FR", { weekday: "long" });
  const date = today.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative px-4 py-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Medical Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="relative"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-soft">
              <Pill className="h-6 w-6 text-primary-foreground" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="h-4 w-4 text-accent" />
            </motion.div>
          </motion.div>

          <div>
            <p className="text-sm text-muted-foreground capitalize">{dayName}</p>
            <h1 className="text-xl font-bold text-foreground">{date}</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="glass" 
            size="icon" 
            className={`rounded-2xl relative overflow-hidden transition-all duration-300 ${
              notificationsEnabled 
                ? 'bg-primary/15 border-primary/30 shadow-soft' 
                : 'bg-muted/50'
            }`}
            onClick={onToggleNotifications}
          >
            <AnimatePresence mode="wait">
              {notificationsEnabled ? (
                <motion.div
                  key="bell-on"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <Bell className="h-5 w-5 text-primary" />
                </motion.div>
              ) : (
                <motion.div
                  key="bell-off"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                  transition={{ duration: 0.2 }}
                >
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
            {notificationsEnabled && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-background"
              />
            )}
          </Button>
        </div>
      </div>
    </motion.header>
  );
};
