"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, BarChart2, Briefcase, Compass } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/portfolio", label: "Portfolio", icon: BarChart2 },
    { href: "/strategies", label: "Strategies", icon: Briefcase },
    { href: "/discover", label: "Discover", icon: Compass },
  ];

  return (
    // Fixed header with smooth transitions
    <header className="fixed top-0 z-50 w-full">
      <div 
        className="w-full px-4 md:px-6"
        style={{
          paddingTop: isScrolled ? '16px' : '0px',
          transition: 'padding-top 300ms ease-out'
        }}
      >
        <div 
          className="mx-auto flex items-center justify-between"
          style={{
            height: isScrolled ? '48px' : '64px',
            maxWidth: isScrolled ? '896px' : 'none',
            padding: isScrolled ? '0 24px' : '0',
            backgroundColor: isScrolled ? 'hsl(var(--background) / 0.95)' : 'transparent',
            backdropFilter: isScrolled ? 'blur(12px)' : 'none',
            border: isScrolled ? '1px solid hsl(var(--border) / 0.4)' : '1px solid transparent',
            borderRadius: isScrolled ? '9999px' : '0px',
            boxShadow: isScrolled ? '0 10px 15px -3px rgba(0, 0, 0, 0.05)' : '0 0 0 0 rgba(0, 0, 0, 0)',
            transition: 'all 300ms ease-out'
          }}
        >
          {/* Left side: Logo and Navigation Links */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Logo links to dashboard */}
            <Link 
              href="/" 
              className="flex items-center space-x-2 flex-shrink-0"
              style={{
                marginRight: isScrolled ? '8px' : '24px',
                transition: 'margin-right 300ms ease-out'
              }}
            >
              <div className="transition-transform duration-300 ease-out">
                <Logo />
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden items-center md:flex">
              <div 
                style={{
                  gap: isScrolled ? '12px' : '24px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'gap 300ms ease-out'
                }}
              >
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center font-medium hover:text-primary relative group",
                      pathname === item.href
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    style={{
                      fontSize: isScrolled ? '14px' : '16px',
                      padding: '8px 0',
                      transition: 'font-size 300ms ease-out'
                    }}
                  >
                    <item.icon 
                      style={{
                        width: isScrolled ? '16px' : '20px',
                        height: isScrolled ? '16px' : '20px',
                        marginRight: '8px',
                        transition: 'width 300ms ease-out, height 300ms ease-out'
                      }}
                    />
                    <span className="relative">
                      {item.label}
                      {/* Active indicator */}
                      {pathname === item.href && (
                        <span 
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                          style={{
                            transition: 'all 300ms ease-out'
                          }}
                        ></span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {/* Right side: Theme Toggle and User Navigation */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isScrolled ? '8px' : '12px',
              transition: 'gap 300ms ease-out'
            }}
          >
            <div className="transition-transform duration-300 ease-out">
              <ThemeToggle />
            </div>
            <div className="transition-transform duration-300 ease-out">
              <UserNav />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
