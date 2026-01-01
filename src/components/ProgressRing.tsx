import { motion } from "framer-motion";
import { Activity } from "lucide-react";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export const ProgressRing = ({ progress, size = 130, strokeWidth = 10 }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect behind */}
      <motion.div
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(168 76% 42% / ${progress / 200}) 0%, transparent 70%)`,
        }}
      />

      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-30"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--healing))" />
            <stop offset="100%" stopColor="hsl(var(--success))" />
          </linearGradient>
        </defs>
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <Activity className="h-5 w-5 text-primary mb-1" />
        </motion.div>
        <span className="text-3xl font-bold text-foreground">{Math.round(progress)}%</span>
        <span className="text-xs text-muted-foreground font-medium">complété</span>
      </div>
    </div>
  );
};
