import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export default function FinalCTASection() {
  return (
    <section className="bg-emerald-600 text-white py-20 w-full">
      <div className="w-full px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to transform your trading?
        </h2>
        <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
          Join thousands of traders already using AI to build smarter strategies. 
          Start your free trial today—no credit card required.
        </p>

        {/* CTA Form */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            />
            <Button 
              size="lg" 
              className="bg-white text-emerald-600 hover:bg-gray-50 font-semibold shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cancel anytime</span>
          </div>
        </div>

        {/* Additional CTA */}
        <div className="mt-8 pt-8 border-t border-emerald-500">
          <p className="text-emerald-100 mb-4">
            Want to see it in action first?
          </p>
          <Button 
            variant="outline" 
            className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 transition-all duration-300"
          >
            Watch Demo Video
          </Button>
        </div>
      </div>
    </section>
  )
}
