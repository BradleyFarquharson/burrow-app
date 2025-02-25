'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoaded: boolean;
  isChanging: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark to match HTML class
  const [isLoaded, setIsLoaded] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  // Set theme with transition handling
  const setTheme = useCallback((newTheme: Theme) => {
    // Don't do anything if the theme is already changing
    if (isChanging) return;
    
    // Set changing state to true
    setIsChanging(true);
    
    // Update the theme state
    setThemeState(newTheme);
    
    // Apply the theme class immediately to the document
    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Reset changing state after transition completes
    setTimeout(() => {
      setIsChanging(false);
    }, 200); // Reduced from 350ms to 200ms to match faster CSS transitions
    
    // Save to localStorage
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [isChanging]);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // This code only runs on the client
    try {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      
      if (storedTheme) {
        setThemeState(storedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeState('dark');
      } else {
        setThemeState('light');
      }
    } catch (error) {
      // Fallback to dark theme if localStorage is not available
      console.error('Error accessing localStorage:', error);
    }
    
    setIsLoaded(true);
  }, []);

  // Update document class when theme changes
  useEffect(() => {
    if (!isLoaded) return;
    
    const root = window.document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [theme, isLoaded]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [setTheme, theme]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isLoaded,
    isChanging
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 