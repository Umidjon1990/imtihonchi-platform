import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export default function StatsCard({ title, value, icon: Icon, description }: StatsCardProps) {
  return (
    <Card data-testid={`card-stats-${title.toLowerCase()}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1" data-testid="text-stats-title">
              {title}
            </p>
            <p className="text-3xl font-bold" data-testid="text-stats-value">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-stats-description">
                {description}
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
