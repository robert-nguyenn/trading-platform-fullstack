import { Brain, Code2 } from "lucide-react"

export default function ProblemSection() {
  return (
    <section className="bg-gray-50 py-20 w-full">
      <div className="w-full px-4 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">
            Stop Clicking Around Charts.
            <br />
            Start Trading Your Conviction.
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Institutional quants have powerful tools for macro analysis, NLP, and event-driven trading. Retail investors
            get charts and news feeds. Acting on real-world events like Fed shifts or earnings surprises requires
            coding... until now.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-lg border border-gray-200 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <Code2 className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">The Old Way</h3>
            <p className="text-gray-600">
              Complex coding requirements, fragmented tools, and manual processes make it nearly impossible for retail
              investors to implement sophisticated trading strategies.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg border border-gray-300 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <Brain className="h-8 w-8 text-gray-700" />
            </div>
            <h3 className="text-xl font-semibold mb-4">The Sphere Way</h3>
            <p className="text-gray-600">
              AI-powered, no-code platform that translates your market insights into automated trading strategies with
              just a few clicks or simple text prompts.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
