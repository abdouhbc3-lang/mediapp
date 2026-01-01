import { motion } from "framer-motion";
import { Home, Pill, Calendar, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

export const BottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { icon: Home, label: t("home"), path: "/" },
    { icon: Pill, label: t("medicationsNav"), path: "/medications" },
    { icon: Calendar, label: t("history"), path: "/history" },
    { icon: User, label: t("profile"), path: "/profile" },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, type: "spring" }}
      className="fixed bottom-0 inset-x-0 z-30 pb-safe"
    >
      <div className="mx-4 mb-4 glass rounded-2xl shadow-elevated">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-primary/15 text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-all",
                    isActive && "stroke-[2.5]"
                  )} />
                </motion.div>
                <span className={cn(
                  "text-xs font-medium",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};
