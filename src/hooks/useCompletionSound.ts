import { useCallback, useEffect, useRef } from 'react';

export function useCompletionSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    // Check localStorage for sound preference
    const savedPref = localStorage.getItem('adaptmind-sound-enabled');
    soundEnabledRef.current = savedPref !== 'false';
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabledRef.current = enabled;
    localStorage.setItem('adaptmind-sound-enabled', String(enabled));
  }, []);

  const playCompletionSound = useCallback(() => {
    if (!soundEnabledRef.current) return;

    try {
      // Create or reuse audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      
      // Resume context if suspended
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create a pleasant completion sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Pleasant two-tone sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play completion sound:', error);
    }
  }, []);

  return {
    playCompletionSound,
    setSoundEnabled,
    isSoundEnabled: () => soundEnabledRef.current,
  };
}
