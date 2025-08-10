import { ArrowRight, PlayCircle, TrendingUp, BarChart3, Brain, Zap, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-b from-white via-gray-50/30 to-white overflow-hidden">
      <div className="w-full px-6 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Early Access Available</span>
            </div>
            
            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="font-bold text-4xl md:text-5xl lg:text-6xl leading-tight text-gray-900">
                Build Trading Strategies
                <br />
                <span className="text-emerald-600">Without Code</span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                Transform market insights into profitable trading strategies using AI. 
                From earnings calls to macro events—no programming required.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 px-8 py-4 text-lg"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Right Visualization */}
          <div className="relative h-[500px] w-full animate-scale-in lg:animate-none lg:opacity-100" style={{ animationDelay: "0.3s" }}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-2xl">
              
              {/* Dashboard Preview */}
              <div className="h-full p-6 bg-gradient-to-br from-gray-50 to-white">
                
                {/* Top Bar */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Strategy Builder</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>

                {/* Content Cards */}
                <div className="space-y-4">
                  {/* AI Analysis Card */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-float">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Brain className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">AI Market Analysis</h4>
                        <p className="text-xs text-gray-600 mt-1">Processing earnings call sentiment...</p>
                        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-3/4 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strategy Card */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-float" style={{ animationDelay: "0.5s" }}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">Strategy Generated</h4>
                        <p className="text-xs text-gray-600 mt-1">&quot;If CPI &lt; 3%, long SPY, short TLT&quot;</p>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">+12.4%</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Backtested</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Execution Card */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-float" style={{ animationDelay: "1s" }}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Zap className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">Auto-Execute</h4>
                        <p className="text-xs text-gray-600 mt-1">Ready to deploy to live trading</p>
                        <button className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded-md text-xs hover:bg-emerald-700 transition-colors">
                          Deploy Strategy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Stats */}
                <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">15+</div>
                    <div className="text-xs text-gray-600">Data Sources</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-600">98%</div>
                    <div className="text-xs text-gray-600">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">24/7</div>
                    <div className="text-xs text-gray-600">Monitoring</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
