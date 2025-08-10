// app/client-layout-wrapper.tsx
"use client"; // <--- MARK AS CLIENT COMPONENT

import type React from "react";
import { AuthProvider, useAuth } from "./auth-provider"; // Assuming path is correct
import { ThemeProvider } from "@/components/theme-provider"; // Assuming path is correct
import { Navbar } from "@/components/Navbar";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// This component now handles the client-side context providers and logic
export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        {/* AuthenticatedLayout can stay separate or be integrated here */}
        <AuthenticatedLayoutContent>
          {children}
        </AuthenticatedLayoutContent>
        {/* Add ToastContainer for notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

// You can keep this separate or merge its logic directly into ClientLayoutWrapper
// if it's simple enough. Keeping it separate might be cleaner.
function AuthenticatedLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Optional: Render a loading state while auth is resolving
  if (loading) {
    // return <div>Loading Authentication...</div>; // Or a spinner
    return null; // Or just render nothing until loaded
  }

  return (
    <>
      {user && <Navbar />}
      <main className={user ? "px-4 md:px-6 py-4 pt-16 md:pt-20 transition-all duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)]" : "px-4 md:px-6 py-4"}>
        {children}
      </main>
    </>
  );
}

// You no longer need the original AuthenticatedLayout function defined in layout.tsx