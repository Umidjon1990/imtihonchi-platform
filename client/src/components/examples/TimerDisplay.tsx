import TimerDisplay from "../TimerDisplay";

export default function TimerDisplayExample() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <TimerDisplay seconds={120} isActive={true} label="Gapirish vaqti" />
    </div>
  );
}
