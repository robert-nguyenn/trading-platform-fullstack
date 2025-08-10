import { Button } from "@/components/ui/button"

export default function FinalCTASection() {
  return (
    <section className="bg-gray-900 text-white py-20 w-full">
      <div className="w-full px-4 max-w-7xl mx-auto text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold">Ready to Automate Your Edge?</h2>
        <p className="mt-6 text-lg text-gray-100 max-w-2xl mx-auto">
          Join the waitlist and be the first to access the future of AI-powered retail investing.
        </p>
        <div className="mt-10 max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <Button size="lg" className="bg-gray-700 hover:bg-gray-800">
              Request Access
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-300">We'll notify you when early access is available.</p>
        </div>
      </div>
    </section>
  )
}
