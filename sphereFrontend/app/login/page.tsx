"use client"

import React, { useState, useEffect } from "react" // Import useEffect
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LineChart, Eye, EyeOff, AlertCircle, Info } from "lucide-react" // Added Info icon
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // Added AlertTitle
import { useAuth } from "../auth-provider"
import { useSearchParams } from "next/navigation" // Keep this

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithGoogle, devModeLogin, loading: authLoading } = useAuth() // Renamed loading to authLoading to avoid conflict
  const [isLoading, setIsLoading] = useState(false) // Local loading state for form submission
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [infoMessage, setInfoMessage] = useState<string | null>(null); // State for info message
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const searchParams = useSearchParams(); // Hook to read query parameters

  // Check for the message parameter when the component loads or searchParams change
  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'check-email') {
      setInfoMessage("Account created! Please check your email inbox (and spam folder) for a verification link before logging in.");
      // Optional: Clear the message from the URL without reloading page, might be better UX
      // window.history.replaceState({}, '', '/login');
    } else {
      // Clear message if URL doesn't have the param anymore
      setInfoMessage(null);
    }
    // Add other message checks here if needed in the future
  }, [searchParams]); // Re-run effect if searchParams change

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setInfoMessage(null); // Clear info message on new attempt
    setIsLoading(true)

    try {
      await login(formData.email, formData.password)
      // Router push and success message are handled in the auth provider
    } catch (error: any) {
      // Errors are now handled by toast notifications in the auth provider
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setInfoMessage(null); // Clear info message on new attempt
    setIsLoading(true)

    try {
      await loginWithGoogle()
      // Router push and success message are handled in the auth provider
    } catch (error: any) {
      // Errors are now handled by toast notifications in the auth provider
      console.error("Google login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevLogin = async () => {
    setError("")
    setInfoMessage(null); // Clear info message on new attempt
    setIsLoading(true)

    try {
      await devModeLogin()
      // Router push and success message are handled in the auth provider
    } catch (error: any) {
      // Errors are now handled by toast notifications in the auth provider
      console.error("Dev login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Combine local loading and auth provider loading for disabling inputs/buttons
  const isProcessing = isLoading || authLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 dark:bg-primary/30 mr-3 shadow-lg">
              <LineChart className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground dark:text-white tracking-tight">StrategyFlow</h2>
          </div>
          <CardTitle className="text-xl text-center text-foreground dark:text-white">Welcome back</CardTitle>
          <CardDescription className="text-center text-muted-foreground dark:text-gray-300">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Informational Message Area */}
          {infoMessage && (
            <Alert variant="default" className="mb-4 border-blue-500/20 text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/30 backdrop-blur-sm">
              <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-200 font-semibold">Heads up!</AlertTitle>
              <AlertDescription className="dark:text-blue-300">{infoMessage}</AlertDescription>
            </Alert>
          )}

          {/* Error Message Area */}
          {error && (
            <Alert variant="destructive" className="mb-4 bg-destructive/10 dark:bg-red-950/30 border-destructive/20 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-semibold">Login Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground dark:text-gray-200 font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={isProcessing}
                className="dark:bg-muted/50 dark:border-border/50 dark:text-white dark:placeholder-gray-400 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground dark:text-gray-200 font-medium">Password</Label>
                <Link href="/forgot-password" className={`text-xs text-primary hover:text-primary/80 dark:text-primary-foreground dark:hover:text-primary-foreground/80 transition-colors ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isProcessing}
                  className="dark:bg-muted/50 dark:border-border/50 dark:text-white dark:placeholder-gray-400 focus:ring-primary/20 transition-all duration-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-muted/50 dark:hover:bg-muted/30 dark:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isProcessing}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl" disabled={isProcessing}>
              {isProcessing ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full dark:bg-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground dark:text-gray-400 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full border-border/50 dark:border-border/30 hover:bg-muted/50 dark:hover:bg-muted/30 dark:text-gray-200 transition-all duration-200 shadow-sm hover:shadow-md py-2.5" onClick={handleGoogleSignIn} disabled={isProcessing}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="font-medium">Sign in with Google</span>
            </Button>

            {/* Conditionally render dev login button based on environment */}
            {process.env.NODE_ENV === 'development' && (
               <Button variant="secondary" className="w-full bg-secondary/80 hover:bg-secondary dark:bg-secondary/50 dark:hover:bg-secondary/70 dark:text-gray-200 font-medium py-2.5 transition-all duration-200 shadow-sm hover:shadow-md" onClick={handleDevLogin} disabled={isProcessing}>
                 <span className="mr-2 text-lg">🔑</span>
                 Use Development Login
               </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-6">
          <div className="text-sm text-muted-foreground dark:text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup" className={`text-primary hover:text-primary/80 dark:text-primary-foreground dark:hover:text-primary-foreground/80 font-medium transition-colors ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}