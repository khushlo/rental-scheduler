'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Immediately apply theme to DOM
function applyThemeToDOM(theme: Theme) {
  const html = document.documentElement;
  
  // Simply toggle the dark class on html element
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    applyThemeToDOM(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    // Get initial theme
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    // Force clean state first
    document.documentElement.classList.remove('dark');
    
    // Apply immediately
    setTheme(initialTheme);
    applyThemeToDOM(initialTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}