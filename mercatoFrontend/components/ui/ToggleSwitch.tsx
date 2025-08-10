"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ToggleSwitchProps {
  isActive: boolean
  onChange: () => void
  size?: "sm" | "md" | "lg"
  activeColor?: "green" | "blue" | "purple"
  className?: string
}

export function ToggleSwitch({ isActive, onChange, size = "sm", activeColor = "green", className }: ToggleSwitchProps) {
  // Size mappings
  const sizeClasses = {
    sm: "w-12 h-6",
    md: "w-14 h-7",
    lg: "w-16 h-8",
  }

  // Indicator size mappings
  const indicatorSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  // Color mappings
  const colorClasses = {
    green: {
      bg: "bg-green-100 border-green-500 text-green-700 hover:bg-green-200",
      indicator: "bg-green-500",
    },
    blue: {
      bg: "bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200",
      indicator: "bg-blue-500",
    },
    purple: {
      bg: "bg-purple-100 border-purple-500 text-purple-700 hover:bg-purple-200",
      indicator: "bg-purple-500",
    },
  }

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      aria-pressed={isActive}
      aria-label={isActive ? "Active" : "Inactive"}
      className={cn(
        sizeClasses[size],
        "p-0.5 flex items-center rounded-full transition-colors duration-200",
        isActive
          ? `justify-end ${colorClasses[activeColor].bg}`
          : "justify-start bg-gray-100 border-gray-400 text-gray-600 hover:bg-gray-200",
        className,
      )}
      onClick={onChange}
    >
      <span
        className={cn(
          indicatorSizes[size],
          "rounded-full transition-all duration-200",
          isActive ? colorClasses[activeColor].indicator : "bg-gray-400",
        )}
      />
    </Button>
  )
}
