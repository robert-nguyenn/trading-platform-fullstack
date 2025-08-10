import { Brain, LineChart, Puzzle, Rocket } from "lucide-react"

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-20 w-full">
      <div className="w-full px-4 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">
            Go From Idea to Automated Trade in Minutes
          </h2>
          <div className="mt-4 w-20 h-1 bg-gray-800 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Brain className="h-8 w-8 text-gray-800" />
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-800 text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-4">Research & Ideate</h3>
            <p className="text-gray-600">
              Use the AI Copilot to analyze market data or bring your own investment thesis.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Puzzle className="h-8 w-8 text-gray-800" />
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-800 text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-4">Build Your Logic</h3>
            <p className="text-gray-600">Use text-to-strategy AI or the visual builder to create your trading rules.</p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <LineChart className="h-8 w-8 text-gray-800" />
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-800 text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-4">Test & Validate</h3>
            <p className="text-gray-600">
              Run instant backtests to see how your strategy would have performed historically.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Rocket className="h-8 w-8 text-gray-800" />
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-800 text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
              4
            </div>
            <h3 className="text-xl font-semibold mb-4">Automate & Execute</h3>
            <p className="text-gray-600">Deploy via paper trading or connect to your broker for live automation.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
