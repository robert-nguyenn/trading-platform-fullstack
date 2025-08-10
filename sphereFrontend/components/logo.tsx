import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500/30 to-blue-500/10 rounded-full blur-[2px]" />
        <div className="relative flex items-center justify-center bg-blue-500 text-white rounded-full p-1">
          <Image 
            src="/logo.png" 
            alt="Sphere Logo" 
            className={cn(sizeClasses[size])} 
            width={32}
            height={32}
          />
        </div>
      </div>
      {showText && <span className={cn("font-bold tracking-tight", textSizeClasses[size])}>Sphere</span>}
    </div>
  )
}

