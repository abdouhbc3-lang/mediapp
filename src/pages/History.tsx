import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { MedicalBackground } from "@/components/MedicalBackground";
import { BottomNav } from "@/components/BottomNav";
import { useMedications } from "@/hooks/useMedications";
import { useLanguage } from "@/hooks/useLanguage";

const History = () => {
  const { medications, progress, getCompletionForDate, getHistoryForDate } = useMedications();
  const { t, language } = useLanguage();
  
  const todayKey = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  
  // Get data for selected day
  const selectedHistory = getHistoryForDate(selectedDate);
  const isToday = selectedDate === todayKey;
  
  // For today, use live medications data; for past days, use history
  const displayMedications = isToday 
    ? medications 
    : (selectedHistory?.medications || []);
  
  const takenCount = displayMedications.filter(m => m.taken).length;
  const pendingCount = displayMedications.filter(m => !m.taken).length;

  const localeMap: Record<string, string> = {
    fr: "fr-FR",
    en: "en-US",
    es: "es-ES",
    ar: "ar-SA",
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateKey = date.toISOString().split("T")[0];
    const isDayToday = dateKey === todayKey;
    const isSelected = dateKey === selectedDate;
    
    return {
      day: date.toLocaleDateString(localeMap[language] || "fr-FR", { weekday: "short" }),
      date: date.getDate(),
      dateKey,
      isDayToday,
      isSelected,
      completion: isDayToday ? progress : getCompletionForDate(dateKey),
      historyData: getHistoryForDate(dateKey),
    };
  });

  const handleDayClick = (dateKey: string) => {
    setSelectedDate(dateKey);
  };

  // Get label for selected date
  const getSelectedDateLabel = () => {
    if (isToday) return t("todayActivity");
    const date = new Date(selectedDate);
    return date.toLocaleDateString(localeMap[language] || "fr-FR", { 
      weekday: "long", 
      day: "numeric", 
      month: "long" 
    });
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
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-medical">
              <Calendar className="h-5 w-5 text-medical-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("history")}</h1>
              <p className="text-sm text-muted-foreground">{t("trackingIntakes")}</p>
            </div>
          </div>
        </motion.header>

        <section className="px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-5 shadow-soft"
          >
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t("weeklyOverview")}
            </h2>
            
            <div className="flex justify-between">
              {last7Days.map((day, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleDayClick(day.dateKey)}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <span className="text-xs text-muted-foreground capitalize">{day.day}</span>
                  <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                      day.isSelected
                        ? "gradient-primary text-primary-foreground shadow-soft ring-2 ring-primary/50" 
                        : day.completion === 100
                        ? "bg-success/20 text-success hover:bg-success/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {day.date}
                  </div>
                  <div className="h-1 w-6 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${day.completion}%` }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={`h-full rounded-full ${
                        day.completion === 100 ? "bg-success" : "bg-primary"
                      }`}
                    />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="px-4 grid grid-cols-2 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{takenCount}</p>
            <p className="text-sm text-muted-foreground">
              {isToday ? t("takenToday") : t("taken")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
                <XCircle className="h-5 w-5 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">{t("pending")}</p>
          </motion.div>
        </section>

        <section className="px-4">
          <h2 className="font-semibold text-foreground mb-3 capitalize">{getSelectedDateLabel()}</h2>
          <div className="space-y-2">
            {displayMedications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl p-4 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  {t("noMedicationsForDate")}
                </p>
              </motion.div>
            ) : (
              displayMedications.map((med, index) => (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-xl p-3 flex items-center gap-3"
                >
                  <div className={`w-2 h-2 rounded-full ${med.taken ? "bg-success" : "bg-muted-foreground/30"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.time}</p>
                  </div>
                  {med.taken ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                  )}
                </motion.div>
              ))
            )}
          </div>
        </section>

        <BottomNav />
      </div>
    </div>
  );
};

export default History;
