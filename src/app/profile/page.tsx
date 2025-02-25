'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Burrow</h1>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Back to Canvas
            </Link>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8 rounded-xl bg-card p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-card-foreground">Your Profile</h2>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground">{user?.email}</p>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-sm text-muted-foreground">Account Created</label>
                <p className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground">
                  {user?.metadata.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'Unknown'}
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Link
                href="/"
                className="block w-full rounded-md bg-secondary px-4 py-2 text-center text-secondary-foreground hover:bg-secondary/80"
              >
                Back to Canvas
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full rounded-md bg-destructive/10 px-4 py-2 text-center text-destructive hover:bg-destructive/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 