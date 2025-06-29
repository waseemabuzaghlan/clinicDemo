'use client';

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ 
  fullScreen = true, 
  message = "Loading...",
  variant = 'default',
  size = 'md'
}: LoadingProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'text-primary';
      case 'secondary':
        return 'text-secondary-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-16 w-16';
      default:
        return 'h-12 w-12';
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-background/50 backdrop-blur-sm",
        fullScreen ? "fixed inset-0 z-50" : "w-full h-full min-h-[400px]"
      )}
    >
      <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative">
          <div className={cn(
            "absolute inset-0 rounded-full bg-primary/10 animate-ping",
            getSizeStyles()
          )} />
          <Loader2 className={cn(
            "animate-spin",
            getSizeStyles(),
            getVariantStyles()
          )} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className={cn(
            "text-lg font-medium",
            size === 'lg' && "text-xl",
            size === 'sm' && "text-base",
            getVariantStyles()
          )}>
            {message}
          </p>
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}