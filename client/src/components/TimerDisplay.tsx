import { useEffect, useState } from "react";

interface TimerDisplayProps {
  seconds: number;
  isActive: boolean;
  onComplete?: () => void;
  label?: string;
}

export default function TimerDisplay({ seconds, isActive, onComplete, label }: TimerDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      if (timeLeft === 0 && onComplete) {
        onComplete();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const remainingSeconds = timeLeft % 60;
  const isWarning = timeLeft <= 10 && timeLeft > 0;
  const isExpired = timeLeft === 0;

  return (
    <div className="flex flex-col items-center gap-2" data-testid="timer-display">
      {label && (
        <div className="text-sm text-muted-foreground font-medium">{label}</div>
      )}
      <div
        className={`text-5xl md:text-6xl font-mono font-bold transition-colors ${
          isExpired
            ? "text-destructive"
            : isWarning
            ? "text-yellow-500"
            : "text-primary"
        }`}
        data-testid="timer-value"
      >
        {String(minutes).padStart(2, "0")}:{String(remainingSeconds).padStart(2, "0")}
      </div>
    </div>
  );
}
