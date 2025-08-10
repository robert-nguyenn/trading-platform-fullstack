import { LoadingSpinner } from "@/components/loading-spinner"

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-card/30">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-75"></div>
            <div className="relative rounded-full bg-primary/20 p-4">
              <BarChart2 className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
        <LoadingSpinner size="lg" text="Loading AI Trading Copilot..." />
        <p className="mt-4 text-muted-foreground max-w-md">
          Connecting to market data and preparing your personalized trading assistant.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }}></div>
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }}></div>
        </div>
      </div>
    </div>
  )
}

function BarChart2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" x2="18" y1="20" y2="10"></line>
      <line x1="12" x2="12" y1="20" y2="4"></line>
      <line x1="6" x2="6" y1="20" y2="14"></line>
    </svg>
  )
}
