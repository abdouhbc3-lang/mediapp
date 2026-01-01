import { useState, useEffect } from "react";

export type NotificationSound = "ringtone1" | "ringtone2" | "ringtone3" | "ringtone4" | "ringtone5" | "ringtone6" | "ringtone7";

export const notificationSounds: Record<NotificationSound, { name: string; file: string }> = {
  "ringtone1": { name: "Son 1", file: "ringtone1.mp3" },
  "ringtone2": { name: "Son 2", file: "ringtone2.mp3" },
  "ringtone3": { name: "Son 3", file: "ringtone3.mp3" },
  "ringtone4": { name: "Son 4", file: "ringtone4.mp3" },
  "ringtone5": { name: "Son 5", file: "ringtone5.mp3" },
  "ringtone6": { name: "Son 6", file: "ringtone6.mp3" },
  "ringtone7": { name: "Son 7", file: "ringtone7.mp3" },
};

export const useNotificationSound = () => {
  const [selectedSound, setSelectedSound] = useState<NotificationSound>(() => {
    const saved = localStorage.getItem("notification-sound");
    return (saved as NotificationSound) || "ringtone1";
  });

  useEffect(() => {
    localStorage.setItem("notification-sound", selectedSound);
  }, [selectedSound]);

  const playSound = async (sound: NotificationSound) => {
    try {
      console.log(`Attempting to play sound: ${sound}, file: ${notificationSounds[sound].file}`);

      // Try to play the actual sound file first
      const audio = new Audio(`./sounds/${notificationSounds[sound].file}`);
      audio.volume = 0.5; // Increased volume for better hearing

      console.log(`Audio object created, src: ${audio.src}`);

      // Handle audio context suspension on some browsers
      if (audio.context && audio.context.state === 'suspended') {
        console.log("Resuming audio context");
        await audio.context.resume();
      }

      // Add event listeners for debugging
      audio.addEventListener('loadstart', () => console.log('Audio load started'));
      audio.addEventListener('canplay', () => console.log('Audio can play'));
      audio.addEventListener('error', (e) => console.log('Audio error:', e));

      await audio.play();
      console.log('Audio playback started');

      // Stop after 10 seconds for preview
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        console.log('Audio preview stopped');
      }, 10000);

    } catch (error) {
      console.log("Audio file not found or failed to play, using fallback beep:", error);

      // Fallback to simple beep if audio file fails
      try {
        if (typeof window !== 'undefined' && 'AudioContext' in window) {
          console.log("Playing fallback beep");
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 800; // Frequency in Hz
          gainNode.gain.value = 0.3; // Slightly higher volume

          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5); // Play for 500ms
        }
      } catch (fallbackError) {
        console.log("Audio playback not supported in this context:", fallbackError);
      }
    }
  };

  return {
    selectedSound,
    setSelectedSound,
    playSound,
    sounds: notificationSounds,
  };
};
