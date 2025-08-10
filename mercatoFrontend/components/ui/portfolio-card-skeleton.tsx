// components/PortfolioCardSkeleton.tsx (or similar location)
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PortfolioCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2 space-y-1">
        {/* Skeleton for Description */}
        <div className="h-4 w-2/3 bg-muted rounded animate-pulse"></div>
        {/* Skeleton for Title */}
        <div className="h-7 w-1/2 bg-muted rounded animate-pulse"></div>
      </CardHeader>
      <CardContent>
         {/* Skeleton for Content Line */}
        <div className="h-4 w-1/3 bg-muted rounded animate-pulse"></div>
      </CardContent>
    </Card>
  );
}