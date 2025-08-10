import { Users, GraduationCap, Briefcase, TrendingUp } from "lucide-react"

export default function WhoIsItForSection() {
  return (
    <section className="py-20 w-full bg-white">
      <div className="w-full px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for traders who think differently
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Whether you&apos;re a student testing theories, a professional with market insights, 
            or an active trader seeking better tools—Mercato is designed for you.
          </p>
        </div>

        {/* User Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Retail Investors */}
          <div className="text-center group">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-200 transition-colors duration-300">
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Active Traders</h3>
            <p className="text-gray-600 leading-relaxed">
              Individual investors who want sophisticated strategies without the complexity. 
              Move beyond basic buy-and-hold with AI-powered automation.
            </p>
          </div>

          {/* Students */}
          <div className="text-center group">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Students & Learners</h3>
            <p className="text-gray-600 leading-relaxed">
              Finance students and curious learners who want to test theories and learn by doing. 
              No coding required—just your ideas and insights.
            </p>
          </div>

          {/* Professionals */}
          <div className="text-center group">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors duration-300">
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Busy Professionals</h3>
            <p className="text-gray-600 leading-relaxed">
              Industry experts with market insights but limited time for manual trading. 
              Automate your expertise with systematic strategies.
            </p>
          </div>
        </div>

        {/* Success Stories Preview */}
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Join thousands of successful traders
            </h3>
            <p className="text-gray-600 mb-8">
              From day traders to long-term investors, our community is building smarter strategies every day.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-gray-900">5,000+</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-gray-900">50,000+</div>
                  <div className="text-sm text-gray-600">Strategies Created</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-gray-900">$10M+</div>
                  <div className="text-sm text-gray-600">Assets Managed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
