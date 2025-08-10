import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full relative">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/50"></div>

      <div className="relative w-full px-4 py-6 max-w-7xl mx-auto">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg group-hover:shadow-emerald-200 transition-all duration-300">
              <Sparkles className="h-5 w-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/20 to-transparent"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-900 bg-clip-text text-transparent">
              Sphere
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors duration-200 relative group"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors duration-200 relative group"
            >
              How It Works
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors duration-200 relative group"
            >
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
                >
                  Sign In
                </Button>
              </Link>
              <Button className="text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-emerald-200 transition-all duration-300 transform hover:scale-105">
                Request Access
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-emerald-50"
          >
            <Menu className="h-5 w-5 text-emerald-700" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
