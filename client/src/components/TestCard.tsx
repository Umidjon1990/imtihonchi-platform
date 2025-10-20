import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

interface TestCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  duration?: string;
  isPurchased?: boolean;
  onPurchase?: (id: string) => void;
  onStart?: (id: string) => void;
}

export default function TestCard({
  id,
  title,
  description,
  price,
  imageUrl,
  duration = "45 daqiqa",
  isPurchased = false,
  onPurchase,
  onStart,
}: TestCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-test-${id}`}>
      <div className="aspect-video overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          data-testid={`img-test-${id}`}
        />
      </div>
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-semibold" data-testid={`text-title-${id}`}>
            {title}
          </h3>
          {isPurchased && (
            <Badge variant="secondary" data-testid={`badge-purchased-${id}`}>
              Sotib olingan
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground" data-testid={`text-description-${id}`}>
          {description}
        </p>
      </CardHeader>
      <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{duration}</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-4">
        {!isPurchased ? (
          <>
            <div className="text-2xl font-bold text-primary" data-testid={`text-price-${id}`}>
              {price.toLocaleString()} so'm
            </div>
            <Button
              onClick={() => onPurchase?.(id)}
              data-testid={`button-purchase-${id}`}
            >
              Sotib olish
            </Button>
          </>
        ) : (
          <Button
            className="w-full"
            onClick={() => onStart?.(id)}
            data-testid={`button-start-${id}`}
          >
            Boshlash
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
