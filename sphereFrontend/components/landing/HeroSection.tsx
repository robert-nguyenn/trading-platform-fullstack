import { ArrowRight, PlayCircle, TrendingUp, BarChart3, Brain, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="w-full relative overflow-hidden">
      {/* Enhanced background with multiple gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-100/30 to-transparent"></div>
      
      <div className="relative w-full px-4 py-20 md:py-32 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-fade-in">
            {/* Announcement badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-emerald-200 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-700">Now in Beta</span>
            </div>
            
            <div className="space-y-6">
              <h1 className="font-bold text-5xl md:text-6xl lg:text-7xl leading-tight">
                <span className="text-gray-900">Automate Your</span>
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 bg-clip-text text-transparent">
                  Trading Edge.
                </span>
                <br />
                <span className="text-gray-700 text-4xl md:text-5xl lg:text-6xl">No Code Needed.</span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                Mercato is the intelligent, no-code platform that turns your market insights—from macro events to earnings
                calls—into <span className="font-semibold text-emerald-700">executable trading strategies</span>.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-xl hover:shadow-emerald-200 transition-all duration-300 transform hover:scale-105 text-lg px-8 py-4"
              >
                Request Early Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 text-lg px-8 py-4"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Connect your broker</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Start paper trading</span>
              </div>
            </div>
          </div>

          {/* Enhanced visualization */}
          <div className="relative h-[500px] w-full animate-scale-in" style={{ animationDelay: "0.3s" }}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white via-emerald-50 to-blue-50 border border-emerald-200/50 shadow-2xl backdrop-blur-sm">
              
              {/* Central hub with enhanced design */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Outer rings with better animations */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-2 border-emerald-200/30 animate-pulse"></div>
                  <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 border-emerald-300/40 animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                  <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-emerald-400/50 animate-pulse"
                    style={{ animationDelay: "1s" }}
                  ></div>
                  
                  {/* Central core with gradient */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg flex items-center justify-center">
                    <Brain className="h-10 w-10 text-white" />
                  </div>
                </div>
              </div>

              {/* Enhanced data streams */}
              <div className="absolute top-[15%] left-[8%] p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-100 animate-float">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">Earnings Call Data</span>
                </div>
              </div>
              
              <div 
                className="absolute top-[25%] right-[12%] p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100 animate-float"
                style={{ animationDelay: "0.7s" }}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Market Sentiment</span>
                </div>
              </div>
              
              <div 
                className="absolute bottom-[25%] left-[15%] p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 animate-float"
                style={{ animationDelay: "1.4s" }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Macro Events</span>
                </div>
              </div>
              
              <div 
                className="absolute bottom-[15%] right-[8%] p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-orange-100 animate-float"
                style={{ animationDelay: "2.1s" }}
              >
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">AI Analysis</span>
                </div>
              </div>

              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                
                {/* Animated connection lines */}
                <line x1="20%" y1="20%" x2="50%" y2="50%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5">
                  <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite" />
                </line>
                <line x1="80%" y1="30%" x2="50%" y2="50%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5">
                  <animate attributeName="stroke-dashoffset" values="0;10" dur="2.5s" repeatCount="indefinite" />
                </line>
                <line x1="25%" y1="75%" x2="50%" y2="50%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5">
                  <animate attributeName="stroke-dashoffset" values="0;10" dur="3s" repeatCount="indefinite" />
                </line>
                <line x1="80%" y1="80%" x2="50%" y2="50%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5">
                  <animate attributeName="stroke-dashoffset" values="0;10" dur="2.2s" repeatCount="indefinite" />
                </line>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
