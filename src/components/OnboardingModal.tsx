import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Language, languageNames } from "@/hooks/useLanguage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OnboardingModalProps {
  isOpen: boolean;
  onSubmit: (name: string, language: Language) => void;
}

export const OnboardingModal = ({ isOpen, onSubmit }: OnboardingModalProps) => {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<Language>("en");

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim(), language);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px] glass">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="h-16 w-16 rounded-full bg-primary flex items-center justify-center mb-4"
          >
            <span className="text-2xl">💊</span>
          </motion.div>

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Welcome to MedTime Companion
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Let's set up your medication management experience. Please enter your name and choose your preferred language.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 w-full">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Your Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="col-span-3"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="language" className="text-right">
                Language
              </Label>
              <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                <SelectTrigger className="col-span-3">
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
            </div>
          </div>

          <DialogFooter className="w-full pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="w-full"
              size="lg"
            >
              Get Started
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
