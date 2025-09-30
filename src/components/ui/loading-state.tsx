import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ message, className, size = "md" }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}

export function PageLoadingState({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingState message={message} size="lg" />
    </div>
  );
}

export function CardLoadingState({ message }: { message?: string }) {
  return (
    <div className="kipo-card">
      <LoadingState message={message} size="md" />
    </div>
  );
}