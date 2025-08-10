"use client";
import LandingPage from "@/components/Landing";
// import Dashboard from "@/components/dashboard";
import Dashboard from "@/app/dashboard/page"; // Adjust path as needed
import { useAuth } from "./auth-provider"; // Ensure this path is correct

// --- IMPORT LoadingSpinner (or LoadingPage if you change your mind) ---
import { LoadingSpinner } from "@/components/ui/loading-spinner"; // Adjust path as needed

export default function Page() {
  const { user, loading } = useAuth(); // Get user AND loading state

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
        <div className="text-center space-y-6">
          <LoadingSpinner
            size="lg"
            variant="default"
            showText={false}
          />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Checking your session...</h2>
            <p className="text-muted-foreground">Please wait while we set things up</p>
          </div>
        </div>
      </div>
    );
  }

  // Only proceed *after* loading is false
  if (user) {
    return <Dashboard />;
  } else {
    return <LandingPage />;
  }
}