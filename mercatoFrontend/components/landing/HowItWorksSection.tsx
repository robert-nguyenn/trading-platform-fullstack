import { Brain, LineChart, Puzzle, Rocket } from "lucide-react"

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-20 w-full">
      <div className="w-full px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            From idea to automated trade in minutes
          </h2>
          <p className="text-xl text-gray-600">
            Our simple 4-step process gets you from market insight to live trading strategy.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Step 1 */}
          <div className="text-center group">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto group-hover:bg-emerald-200 transition-colors duration-300">
                <Brain className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Research & Analyze</h3>
            <p className="text-gray-600 leading-relaxed">
              Ask our AI about market events, earnings calls, or economic data. Get instant, actionable insights.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center group">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto group-hover:bg-blue-200 transition-colors duration-300">
                <Puzzle className="h-8 w-8 text-blue-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Build Strategy</h3>
            <p className="text-gray-600 leading-relaxed">
              Describe your trading idea in plain English. Our AI converts it into precise trading logic automatically.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center group">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto group-hover:bg-purple-200 transition-colors duration-300">
                <LineChart className="h-8 w-8 text-purple-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Test & Optimize</h3>
            <p className="text-gray-600 leading-relaxed">
              Run comprehensive backtests with risk metrics. Optimize parameters to maximize performance.
            </p>
          </div>

          {/* Step 4 */}
          <div className="text-center group">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto group-hover:bg-orange-200 transition-colors duration-300">
                <Rocket className="h-8 w-8 text-orange-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">
                4
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Deploy & Monitor</h3>
            <p className="text-gray-600 leading-relaxed">
              Start with paper trading or go live with your broker. Monitor performance and adjust as needed.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-gray-50 rounded-full">
            <span className="text-sm text-gray-600">Ready to get started?</span>
            <span className="text-sm font-medium text-emerald-600">Join the waitlist →</span>
          </div>
        </div>
      </div>
    </section>
  )
}
