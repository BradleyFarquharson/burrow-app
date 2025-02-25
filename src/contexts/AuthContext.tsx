import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService } from '@/services/auth';

/**
 * Authentication context state
 */
interface AuthContextState {
  /** Current authenticated user */
  user: User | null;
  /** Whether authentication is still being determined */
  loading: boolean;
  /** Sign in with email and password */
  signInWithEmail: (email: string, password: string) => Promise<User>;
  /** Sign in with Google */
  signInWithGoogle: () => Promise<User>;
  /** Register with email and password */
  registerWithEmail: (email: string, password: string) => Promise<User>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Reset password for an email */
  resetPassword: (email: string) => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * Authentication Provider Component
 * 
 * Provides authentication state and methods to the app
 */
export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Listen for auth state changes when the component mounts
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  // Authentication methods
  const signInWithEmail = async (email: string, password: string): Promise<User> => {
    return authService.signInWithEmail(email, password);
  };

  const signInWithGoogle = async (): Promise<User> => {
    return authService.signInWithGoogle();
  };

  const registerWithEmail = async (email: string, password: string): Promise<User> => {
    return authService.registerWithEmail(email, password);
  };

  const signOut = async (): Promise<void> => {
    return authService.signOut();
  };

  const resetPassword = async (email: string): Promise<void> => {
    return authService.resetPassword(email);
  };

  // Create the value object for the context
  const value: AuthContextState = {
    user,
    loading,
    signInWithEmail,
    signInWithGoogle,
    registerWithEmail,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use the authentication context
 * 
 * @returns Authentication context state and methods
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 