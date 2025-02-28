'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function Template({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, isLoaded } = useTheme();

  useEffect(() => {
    // When the route changes, set loading to false
    setIsLoading(false);
  }, [pathname, searchParams]);

  // This effect handles navigation start
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsLoading(true);
    };

    const handleRouteChangeComplete = () => {
      setIsLoading(false);
    };

    // Add event listeners for route changes
    window.addEventListener('beforeunload', handleRouteChangeStart);
    
    return () => {
      window.removeEventListener('beforeunload', handleRouteChangeStart);
    };
  }, []);

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background no-transition">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary mx-auto"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background no-transition">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary mx-auto"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`theme-${theme} active`}>
      {children}
    </div>
  );
} 