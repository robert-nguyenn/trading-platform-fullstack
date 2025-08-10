import { Brain, AlertCircle, TrendingUp } from "lucide-react"

export default function ProblemSection() {
  return (
    <section className="bg-gray-50 py-20 w-full">
      <div className="w-full px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            The problem with traditional trading
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            While institutional traders have access to sophisticated tools and algorithms, 
            retail investors are stuck with basic charts and manual processes.
          </p>
        </div>

        {/* Problem vs Solution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Problem Side */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Traditional Challenges</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Complex Technical Setup</h4>
                  <p className="text-gray-600">Requires coding skills, API knowledge, and technical infrastructure.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Fragmented Tools</h4>
                  <p className="text-gray-600">Data scattered across multiple platforms with no unified analysis.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Manual Processes</h4>
                  <p className="text-gray-600">Time-consuming manual monitoring and execution of trades.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Limited Analysis</h4>
                  <p className="text-gray-600">Basic charts and indicators miss deeper market insights.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Solution Side */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">The Mercato Solution</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">No-Code Platform</h4>
                  <p className="text-gray-600">Build sophisticated strategies using natural language and visual tools.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Unified Intelligence</h4>
                  <p className="text-gray-600">AI-powered analysis of earnings, sentiment, and macro events in one place.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Automated Execution</h4>
                  <p className="text-gray-600">Set-and-forget automation with real-time monitoring and adjustments.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Deep Market Insights</h4>
                  <p className="text-gray-600">Advanced AI analysis reveals hidden patterns and opportunities.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-emerald-600 mb-2">10x</div>
              <div className="text-sm text-gray-600">Faster strategy development</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600 mb-2">95%</div>
              <div className="text-sm text-gray-600">Reduction in manual work</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600">Automated monitoring</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
