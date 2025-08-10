import { TrendingUp, Twitter, Linkedin, Github, Mail } from "lucide-react"

export default function Footers() {
  return (
    <footer className="w-full bg-white border-t border-gray-200">
      <div className="w-full px-6 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Mercato</span>
            </div>
            <p className="text-gray-600 max-w-md mb-6">
              The intelligent, no-code platform that transforms market insights into executable trading strategies. 
              Trade smarter with AI-powered analysis and automation.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-3 text-gray-600">
              <li>
                <a href="#features" className="hover:text-emerald-600 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-emerald-600 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#integrations" className="hover:text-emerald-600 transition-colors">
                  Integrations
                </a>
              </li>
              <li>
                <a href="#api" className="hover:text-emerald-600 transition-colors">
                  API Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-3 text-gray-600">
              <li>
                <a href="#about" className="hover:text-emerald-600 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-emerald-600 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#careers" className="hover:text-emerald-600 transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-emerald-600 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Mercato. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#privacy" className="hover:text-emerald-600 transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-emerald-600 transition-colors">
              Terms of Service
            </a>
            <a href="#security" className="hover:text-emerald-600 transition-colors">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
