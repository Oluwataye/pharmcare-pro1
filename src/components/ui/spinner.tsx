
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function Spinner({ size = "default", className }: SpinnerProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-center",
        className
      )}
    >
      <Loader 
        className={cn(
          "animate-spin text-primary", 
          size === "sm" && "h-4 w-4",
          size === "default" && "h-6 w-6",
          size === "lg" && "h-8 w-8" 
        )} 
      />
    </div>
  );
}
