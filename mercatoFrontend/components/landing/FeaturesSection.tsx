import { BarChart3, Brain, ChevronRight, Zap, Target, TrendingUp, MessageSquare, Settings } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-20 md:py-24 bg-gray-50">
      <div className="w-full px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to trade smarter
          </h2>
          <p className="text-xl text-gray-600">
            From AI analysis to automated execution, Mercato provides institutional-grade tools in a simple interface.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Feature 1 - AI Analysis */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
                <Brain className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Market Intelligence</h3>
              <p className="text-gray-600 leading-relaxed">
                Ask questions in plain English. Get instant analysis of earnings calls, market sentiment, and macro events.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 - Natural Language */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Natural Language Strategies</h3>
              <p className="text-gray-600 leading-relaxed">
                Describe your trading idea in simple terms. Our AI converts it into precise, executable trading logic.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 - Backtesting */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Backtesting</h3>
              <p className="text-gray-600 leading-relaxed">
                Test your strategies against historical data with institutional-grade risk metrics and performance analysis.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 - Auto Execution */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Automated Execution</h3>
              <p className="text-gray-600 leading-relaxed">
                Deploy strategies with confidence. Real-time monitoring and execution with built-in risk management.
              </p>
            </CardContent>
          </Card>

          {/* Feature 5 - Portfolio Management */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Portfolio Optimization</h3>
              <p className="text-gray-600 leading-relaxed">
                Manage multiple strategies with intelligent position sizing and portfolio rebalancing algorithms.
              </p>
            </CardContent>
          </Card>

          {/* Feature 6 - Broker Integration */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <Settings className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Broker Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect seamlessly with major brokers. Start with paper trading, then deploy live when you&apos;re ready.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            Join thousands of traders already using Mercato
          </p>
          <div className="flex justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span>15+ Data Sources</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" />
              <span>98% Accuracy</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              <span>24/7 Monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
