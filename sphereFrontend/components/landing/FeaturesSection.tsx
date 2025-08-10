import { BarChart3, Brain, ChevronRight, LineChart, Zap, Target, Layers, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-20 md:py-32 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/30 to-transparent rounded-full blur-3xl"></div>
      
      <div className="relative w-full px-4 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 mb-6">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Core Features</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Mercato brings <span className="text-emerald-600">institutional power</span>, simplified.
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform complex market analysis into actionable trading strategies with the power of AI and no-code automation.
          </p>
          
          <div className="mt-8 w-24 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
          {/* Feature 1 - AI Analyst */}
          <Card className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm">
            <div className="h-80 bg-gradient-to-br from-emerald-50 to-blue-50 p-8 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-4 right-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"></div>
              
              <div className="relative h-full flex items-center justify-center">
                <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 transform group-hover:scale-105 transition-transform duration-300">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Brain className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-medium">Analyze the latest earnings call for NVDA</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <p className="font-semibold text-gray-900 mb-3">Key insights from NVDA Q1 2024:</p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        Revenue: $26.3B (+262% YoY)
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        Data Center: $18.4B (+427% YoY)
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-blue-500" />
                        AI demand exceeds supply
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Brain className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">AI-Powered Market Intelligence</h3>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Ask questions in plain English. Instantly summarize earnings calls, analyze market sentiment, understand
                macro reports, and discover hidden correlations. <span className="font-semibold text-emerald-600">Mercato's AI cuts through the noise.</span>
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 - Strategy Builder */}
          <Card className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm">
            <div className="h-80 bg-gradient-to-br from-blue-50 to-purple-50 p-8 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute bottom-4 left-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>
              
              <div className="relative h-full flex items-center justify-center">
                <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 transform group-hover:scale-105 transition-transform duration-300">
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 font-medium bg-blue-50 p-3 rounded-lg">
                      "If CPI comes in below 3%, go long SPY and short TLT"
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-3">
                      <div className="p-1 bg-emerald-200 rounded">
                        <BarChart3 className="h-4 w-4 text-emerald-700" />
                      </div>
                      <span className="text-sm font-medium text-emerald-800">CPI Data &lt; 3.0%</span>
                    </div>
                    
                    <div className="flex justify-center">
                      <ChevronRight className="h-6 w-6 text-gray-400" />
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg flex items-center gap-3">
                      <div className="p-1 bg-blue-200 rounded">
                        <Target className="h-4 w-4 text-blue-700" />
                      </div>
                      <span className="text-sm font-medium text-blue-800">Execute Trade Strategy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">From Insight to Algorithm</h3>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Have a thesis? Just describe it. "If Trump wins, short solar ETFs." <span className="font-semibold text-blue-600">Mercato's AI
                translates your plain English idea</span> into precise, testable trading logic in seconds.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
