'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ 
  children,
  defaultDark 
}: { 
  children: React.ReactNode;
  defaultDark: boolean;
}) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (defaultDark) {
      setTheme('dark');
    }
    setMounted(true);
  }, [defaultDark]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // We wrap the context provider
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ClientThemeWrapperProps {
  children: React.ReactNode;
  config: {
    themeColor: string;
    buttonColor?: string;
    bgColor: string;
    cardColor: string;
    textColor: string;
    fontFamily: string;
  };
}

export function ClientThemeWrapper({ children, config }: ClientThemeWrapperProps) {
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  const themeColor = config.themeColor || '#e11d48';
  const buttonColor = config.buttonColor || 'var(--color-card)';
  
  // Custom dark mode overrides
  const bgColor = isDark ? '#121212' : (config.bgColor || '#ffffff');
  const cardColor = isDark ? '#1e1e1e' : (config.cardColor || '#ffffff');
  const textColor = isDark ? '#f3f4f6' : (config.textColor || '#1a1a1a');
  const fontFamily = config.fontFamily || 'Inter';

  const borderVal = isDark ? '#2d2d2d' : '#eeeeee';
  const textLightVal = isDark ? '#9ca3af' : '#666666';
  const redLightVal = isDark ? '#3b1216' : '#ffebec';
  const greenLightVal = isDark ? '#062923' : '#e6f7f5';

  const cssVariables = {
    '--color-bg': bgColor,
    '--color-card': cardColor,
    '--color-text': textColor,
    '--color-text-light': textLightVal,
    '--color-border': borderVal,
    '--color-red-primary': themeColor,
    '--color-category-btn': buttonColor,
    '--color-red-light': redLightVal,
    '--color-green-light': greenLightVal,
    '--font-sans': fontFamily === 'Inter' ? `'Inter', system-ui, -apple-system, sans-serif` : `'${fontFamily}', sans-serif`,
  } as React.CSSProperties;

  return (
    <div style={{ ...cssVariables, backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh', fontFamily: 'var(--font-sans)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      {children}
    </div>
  );
}
