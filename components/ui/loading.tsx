import { cn } from "@/lib/utils"
import { Loader2, RefreshCw, RotateCw } from "lucide-react"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "spinner" | "dots" | "pulse" | "icon"
  iconType?: "default" | "refresh" | "rotate"
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  variant = "spinner",
  iconType = "default"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  // Return different loading indicator based on variant
  if (variant === "dots") {
    return (
      <div className={cn("flex space-x-1", className)}>
        {[1, 2, 3].map((dot) => (
          <div 
            key={dot}
            className={cn(
              "bg-blue-600 rounded-full animate-pulse", 
              sizeClasses[size] === "h-4 w-4" ? "h-1 w-1" : 
              sizeClasses[size] === "h-6 w-6" ? "h-2 w-2" : "h-3 w-3",
              dot === 1 ? "animation-delay-0" : 
              dot === 2 ? "animation-delay-200" : "animation-delay-400"
            )}
          />
        ))}
      </div>
    )
  } else if (variant === "pulse") {
    return (
      <div 
        className={cn(
          "rounded-md bg-blue-600/10 animate-pulse", 
          sizeClasses[size],
          className
        )} 
      />
    )
  } else if (variant === "icon") {
    if (iconType === "refresh") {
      return <RefreshCw className={cn("animate-spin text-blue-600", sizeClasses[size], className)} />
    } else if (iconType === "rotate") {
      return <RotateCw className={cn("animate-spin text-blue-600", sizeClasses[size], className)} />
    } else {
      return <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size], className)} />
    }
  } else {
    // Default spinner
    return (
      <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-blue-600", sizeClasses[size], className)} />
    )
  }
}

interface LoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg"
  variant?: "spinner" | "dots" | "pulse" | "icon"
  iconType?: "default" | "refresh" | "rotate"
}

export function LoadingState({ 
  message = "Loading...", 
  size = "md",
  variant = "spinner",
  iconType = "default" 
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <LoadingSpinner size={size} variant={variant} iconType={iconType} />
      <p className="mt-2 text-sm text-gray-600">{message}</p>
    </div>
  )
}

export function PageLoadingState({ 
  message = "Loading page...",
  variant = "spinner" 
}: { 
  message?: string;
  variant?: "spinner" | "dots" | "pulse" | "icon";
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingState message={message} size="lg" variant={variant} />
    </div>
  )
}

export function InlineLoading({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <LoadingSpinner size={size} className={cn("inline-block mr-2", className)} />
  )
}

export function CardLoading() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-muted-foreground">Loading content...</p>
    </div>
  )
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full animate-pulse space-y-4">
      {/* Table header */}
      <div className="h-10 bg-blue-600/10 rounded-md w-full" />
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-blue-600/5 rounded-md w-full" />
      ))}
    </div>
  )
}

export function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Chart placeholder */}
      <div className="h-64 bg-blue-600/5 rounded-lg w-full" />
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-blue-600/10 rounded-lg w-full" />
        ))}
      </div>
    </div>
  )
}
