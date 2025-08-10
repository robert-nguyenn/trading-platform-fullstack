"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  type User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  onIdTokenChanged,
} from "firebase/auth"
import { auth } from "./firebase-config"
import { toast } from 'react-toastify'

import {createUser, setAuthToken, createTradingAccount} from "@/lib/apiClient"
// Development mode credentials
const DEV_MODE = process.env.NODE_ENV === "development"
const DEV_EMAIL = "demo@example.com"
const DEV_PASSWORD = "password123"

interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL?: string | null
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signupWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  getToken: () => Promise<string | null>
  // Development mode helper
  devModeLogin: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Convert Firebase user to our User type
  const formatUser = (firebaseUser: FirebaseUser): User => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email,

    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified
  })

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(formatUser(firebaseUser))
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Listen for token changes and refresh when needed
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get the token and store it
        const token = await firebaseUser.getIdToken()
        localStorage.setItem("authToken", token)
        setAuthToken(token)
      } else {
        localStorage.removeItem("authToken")
        setAuthToken(null)
      }
    })

    return () => unsubscribe()
  }, [])

    // On mount, if there’s already a logged-in user, get their token
  useEffect(() => {
    async function bootstrapAuth() {
      const user = auth.currentUser
      if (user) {
        const token = await user.getIdToken(true)
        localStorage.setItem("authToken", token)
        setAuthToken(token)
      }
    }
    bootstrapAuth()
  }, [])
  // Redirect unauthenticated users away from protected routes
  useEffect(() => {
    if (!loading) {
      const publicPaths = ["/login", "/signup", "/forgot-password", "/"]
      const isPublicPath = publicPaths.includes(pathname)

      if (!user && !isPublicPath ) {
       router.push("/login")
      } 

      // if( user && isPublicPath) {
      //   router.push("/")
      // }

    }
  }, [user, loading, pathname, router])

  // Helper function to convert Firebase error codes to user-friendly messages
  const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return "Incorrect email or password. Please try again.";
      case 'auth/invalid-email':
        return "Please enter a valid email address.";
      case 'auth/user-disabled':
        return "This account has been disabled. Please contact support.";
      case 'auth/too-many-requests':
        return "Too many failed login attempts. Please try again later.";
      case 'auth/network-request-failed':
        return "Network error. Please check your connection and try again.";
      case 'auth/operation-not-allowed':
        return "Email/password sign-in is not enabled. Please contact support.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  // Auth methods
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
      // *** Check if email is verified ***
      if (!userCredential.user.emailVerified) {
        // Important: Log them out again so they don't linger in an unverified state
        await signOut(auth); // Sign out immediately
        setUser(null);       // Clear local user state
        localStorage.removeItem("authToken"); // Clear token
        toast.error("Please verify your email before logging in. Check your inbox.");
        return;
      } else {
        // Email is verified, proceed as normal
        setUser(formatUser(userCredential.user));
        toast.success("Welcome back! You're now logged in.");
        // Token will be set by onIdTokenChanged listener
        router.push("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Handle Firebase authentication errors with user-friendly messages
      if (error.code) {
        const friendlyMessage = getFirebaseErrorMessage(error.code);
        toast.error(friendlyMessage);
      } else {
        toast.error(error.message || "Failed to login");
      }
    }
  };

  const signupWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Send veriication email immediately after creation
      if (userCredential.user) { 
        router.push("/login?message=check-email");
        await signOut(auth); // Sign out immediately
        setUser(null); 
        const fullName = `${firstName} ${lastName}`;
        await updateProfile(userCredential.user, {
          displayName: fullName, // Set the displayName field
        });  
        // Send verification email immediately after creation
        await sendEmailVerification(userCredential.user);
        console.log("Verification email sent.");
        toast.success("Account created! Please check your email to verify your account.");
      }
  
      
      try {
        // Create a trading account
        const res = await createTradingAccount({ 
          email : userCredential.user.email!,
          given_name: firstName,
          family_name: lastName,
          id : userCredential.user.uid
        });
        console.log("User with trading account created successfully." ,{res} );
      } catch (tradingAccountError) {
        console.error("Error creating trading account:", tradingAccountError);
        toast.error("Failed to create trading account.");
        return;
      }
      // Redirect to login or a specific "check your email" page
    // Example redirect
  
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Handle Firebase authentication errors with user-friendly messages
      if (error.code) {
        // Add some signup-specific error messages
        switch (error.code) {
          case 'auth/email-already-in-use':
            toast.error("An account with this email already exists. Please sign in instead.");
            break;
          case 'auth/weak-password':
            toast.error("Password is too weak. Please choose a stronger password.");
            break;
          case 'auth/invalid-email':
            toast.error("Please enter a valid email address.");
            break;
          case 'auth/operation-not-allowed':
            toast.error("Email/password sign-up is not enabled. Please contact support.");
            break;
          default:
            toast.error(getFirebaseErrorMessage(error.code));
        }
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      setUser(formatUser(userCredential.user))
      
      try {
        await createUser({
          email: userCredential.user.email!,
          id: userCredential.user.uid,
        });
        console.log("User created in backend.");
      } catch (backendError) {
        console.error("Error creating user in backend:", backendError);
        toast.error("Failed to create user in the backend.");
        return;
      }

      toast.success("Successfully signed in with Google!");
      router.push("/")
    } catch (error: any) {
      console.error("Google login error:", error)
      
      // Handle Firebase authentication errors with user-friendly messages
      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            toast.error("Sign-in was cancelled. Please try again.");
            break;
          case 'auth/popup-blocked':
            toast.error("Pop-up was blocked. Please allow pop-ups and try again.");
            break;
          case 'auth/cancelled-popup-request':
            toast.error("Sign-in was cancelled. Please try again.");
            break;
          case 'auth/account-exists-with-different-credential':
            toast.error("An account already exists with this email using a different sign-in method.");
            break;
          default:
            toast.error(getFirebaseErrorMessage(error.code));
        }
      } else {
        toast.error(error.message || "Failed to login with Google");
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      localStorage.removeItem("authToken")
      toast.success("You've been logged out successfully.")
      //router.push("/login")
    } catch (error: any) {
      console.error("Logout error:", error)
      toast.error(error.message || "Failed to logout")
    }
  }

  const getToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null
    try {
      return await auth.currentUser.getIdToken(true)
    } catch (error) {
      console.error("Error getting token:", error)
      return null
    }
  }

  // Development mode login helper
  const devModeLogin = async () => {
    if (DEV_MODE) {
      setLoading(true)
      try {
        // In dev mode, we can bypass the actual Firebase call
        console.log("DEV MODE: Logging in with demo credentials")

        // Simulate a successful login
        setUser({
          uid: "dev-user-123",
          email: DEV_EMAIL,
          displayName: "Development User",
          photoURL: null,
          emailVerified: true,
        })

        // Store a fake token
        localStorage.setItem("authToken", "dev-mode-fake-token")

        toast.success("Development mode: Logged in successfully!")
        router.push("/")
      } catch (error) {
        console.error("Dev mode login error:", error)
        toast.error("Failed to login in development mode")
      } finally {
        setLoading(false)
      }
    } else {
      // If not in dev mode, use regular login with dev credentials
      await login(DEV_EMAIL, DEV_PASSWORD)
    }
  }

  const value = {
    user,
    loading,
    login,
    signupWithEmail,
    loginWithGoogle,
    logout,
    getToken,
    devModeLogin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

