import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, TrendingUp } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="w-full px-6 py-4 max-w-7xl mx-auto">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Mercato
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors duration-200 relative group py-2"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors duration-200 relative group py-2"
            >
              How It Works
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors duration-200 relative group py-2"
            >
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3 ml-4">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-sm text-gray-700 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all duration-200"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 px-6">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-gray-100"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
