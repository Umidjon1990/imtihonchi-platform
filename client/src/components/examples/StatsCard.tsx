import StatsCard from "../StatsCard";
import { FileText, Users, CheckCircle, Clock } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        <StatsCard title="Jami testlar" value={24} icon={FileText} />
        <StatsCard title="O'quvchilar" value={1247} icon={Users} />
        <StatsCard title="Tugatilgan" value={856} icon={CheckCircle} />
        <StatsCard title="Kutilmoqda" value={42} icon={Clock} />
      </div>
    </div>
  );
}
