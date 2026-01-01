import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Moon, Shield, HelpCircle, LogOut, ChevronRight, Globe, Volume2 } from "lucide-react";
import { MedicalBackground } from "@/components/MedicalBackground";
import { BottomNav } from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { useMedications } from "@/hooks/useMedications";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage, Language, languageNames } from "@/hooks/useLanguage";
import { useNotificationSound, NotificationSound, notificationSounds } from "@/hooks/useNotificationSound";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Profile = () => {
  const { notificationsEnabled, toggleNotifications } = useMedications();
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { selectedSound, setSelectedSound, playSound } = useNotificationSound();

  const menuItems = [
    { icon: Bell, label: t("notifications"), hasSwitch: true, enabled: notificationsEnabled, onToggle: toggleNotifications },
    { icon: Volume2, label: "Son de notification", hasSoundSelect: true },
    { icon: Moon, label: t("darkMode"), hasSwitch: true, enabled: isDarkMode, onToggle: toggleTheme },
    { icon: Globe, label: t("language"), hasLanguageSelect: true },
    { icon: Shield, label: t("privacy"), hasArrow: true },
    { icon: HelpCircle, label: t("helpSupport"), hasArrow: true },
  ];

  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("user-name");
    setUserName(storedName || t("user"));
  }, [t]);

  return (
    <div className="min-h-screen pb-24 relative">
      <MedicalBackground />

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-6"
        >
          <h1 className="text-2xl font-bold text-foreground">{t("profile")}</h1>
          <p className="text-sm text-muted-foreground">{t("manageSettings")}</p>
        </motion.header>

        {/* Profile Card */}
        <section className="px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 shadow-soft"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center">
                  <User className="h-10 w-10 text-primary-foreground" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-success flex items-center justify-center"
                >
                  <span className="text-xs">✓</span>
                </motion.div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{userName}</h2>
                <p className="text-sm text-muted-foreground">{t("activeAccount")}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                    💊 MedReminder
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Settings Menu */}
        <section className="px-4">
          <h2 className="font-semibold text-foreground mb-3">{t("settings")}</h2>
          <div className="glass rounded-2xl overflow-hidden shadow-soft">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 ${
                  index < menuItems.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
                {item.hasSwitch ? (
                  <Switch 
                    checked={item.enabled} 
                    onCheckedChange={item.onToggle}
                  />
                ) : item.hasLanguageSelect ? (
                  <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(languageNames) as Language[]).map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {languageNames[lang]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : item.hasSoundSelect ? (
                  <Select value={selectedSound} onValueChange={(val) => {
                    setSelectedSound(val as NotificationSound);
                    playSound(val as NotificationSound);
                  }}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(notificationSounds) as NotificationSound[]).map((sound) => (
                        <SelectItem key={sound} value={sound}>
                          {notificationSounds[sound].name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : item.hasArrow ? (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                ) : null}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Logout */}
        <section className="px-4 mt-6">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full glass rounded-2xl p-4 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">{t("logout")}</span>
          </motion.button>
        </section>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 pb-4"
        >
          <p className="text-xs text-muted-foreground">{t("appVersion")}</p>
          <p className="text-xs text-muted-foreground">{t("healthPriority")}</p>
        </motion.div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Profile;
