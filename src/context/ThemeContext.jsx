import React, { createContext, useLayoutEffect, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Start undefined until localStorage preference is known
  const [isDarkMode, setIsDarkMode] = useState(undefined);

  // Load stored preference AFTER mount
  useEffect(() => {
    const stored = localStorage.getItem('isDarkMode');
    if (stored === 'true' || stored === 'false') {
      setIsDarkMode(stored === 'true');
    } else {
      // Default to light on first load (can also use matchMedia if you want OS-based)
      setIsDarkMode(false);
    }
  }, []);

  const applyTheme = (dark) => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark-mode');
    else root.classList.remove('dark-mode');
  };

  // Apply only once isDarkMode is known (not undefined)
  useLayoutEffect(() => {
    if (typeof isDarkMode === 'boolean') applyTheme(isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('isDarkMode', next);
      applyTheme(next);
      return next;
    });
  };

  // Avoid flashing / wrong theme during undefined phase
  if (isDarkMode === undefined) return null;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
