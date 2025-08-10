"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  text?: string
  className?: string
}

export function LoadingSpinner({ size = "md", showText = true, text = "Loading...", className }: LoadingSpinnerProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4",
  }

  const isDark = theme === "dark"

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        {/* Main spinner */}
        <div className={cn("rounded-full animate-spin", sizeClasses[size], "border-t-transparent border-primary/80")} />

        {/* Pulse effect */}
        <div
          className={cn(
            "absolute top-0 left-0 rounded-full animate-ping opacity-20",
            sizeClasses[size],
            "border border-primary/60",
          )}
        />
      </div>

      {showText && <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>}
    </div>
  )
}

// Full page loading overlay
export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card shadow-lg">
        <LoadingSpinner size="lg" text={message} />
      </div>
    </div>
  )
}

// Loading page for route transitions
export function LoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="space-y-6 text-center">
        <LoadingSpinner size="lg" />
        <h3 className="text-xl font-medium">Loading content...</h3>
        <p className="text-sm text-muted-foreground max-w-md">Preparing your data. This will only take a moment.</p>
      </div>
    </div>
  )
}
