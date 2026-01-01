import { motion } from "framer-motion";
import { Pill, Heart, Cross, Stethoscope, Activity } from "lucide-react";

export const MedicalBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Gradient overlays */}
      <div className="absolute inset-0 medical-pattern" />
      
      {/* Floating medical icons */}
      <motion.div
        animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-8 opacity-[0.08]"
      >
        <Pill className="h-16 w-16 text-primary rotate-45" />
      </motion.div>

      <motion.div
        animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-40 left-6 opacity-[0.06]"
      >
        <Heart className="h-12 w-12 text-accent" />
      </motion.div>

      <motion.div
        animate={{ y: [-5, 15, -5], scale: [1, 1.1, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-40 right-12 opacity-[0.07]"
      >
        <Cross className="h-14 w-14 text-medical" />
      </motion.div>

      <motion.div
        animate={{ y: [5, -15, 5], rotate: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/2 left-4 opacity-[0.05]"
      >
        <Stethoscope className="h-20 w-20 text-primary" />
      </motion.div>

      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-60 left-1/3 opacity-[0.06]"
      >
        <Activity className="h-10 w-10 text-success" />
      </motion.div>

      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-medical/5 blur-3xl" />
      <div className="absolute top-1/3 -right-16 w-48 h-48 rounded-full bg-accent/5 blur-2xl" />
    </div>
  );
};
