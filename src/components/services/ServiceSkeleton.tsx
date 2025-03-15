import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ServiceSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-8 w-1/2 mt-2" />
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </CardFooter>
    </Card>
  );
} 