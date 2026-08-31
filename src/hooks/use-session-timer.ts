import { useEffect, useRef, useState } from "react";

export function useSessionTimer(timerMinutes: number, onExpire: () => void) {
  const [secondsRemaining, setSecondsRemaining] = useState(timerMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start the timer
  const start = () => {
    setSecondsRemaining(timerMinutes * 60);
    setIsRunning(true);
  };

  // Reset the timer (agent replied "I'm fine")
  const reset = () => {
    setSecondsRemaining(timerMinutes * 60);
    setIsRunning(true);
  };

  // Stop the timer (agent checked out)
  const stop = () => {
    setIsRunning(false);
    setSecondsRemaining(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Format as MM:SS for display
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  return { display, secondsRemaining, isRunning, start, reset, stop };
}
