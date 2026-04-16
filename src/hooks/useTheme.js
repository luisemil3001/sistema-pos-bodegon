import { useState, useEffect } from 'react';

const themes = {
  light: {
    '--bg-main': '#ffffff',
    '--bg-sidebar': '#eff6ff',
    '--bg-card': '#f8fafc',
    '--bg-secondary': '#f1f5f9',
    '--text-main': '#1e293b',
    '--text-muted': '#475569',
    '--text-light': '#94a3b8',
    '--border': '#e2e8f0',
    '--primary': '#3b82f6',
    '--primary-hover': '#2563eb',
    '--success': '#10b981',
    '--danger': '#ef4444',
    '--warning': '#f59e0b',
    '--info': '#06b6d4',
    '--shadow': 'rgba(0, 0, 0, 0.1)',
    '--radius': '8px'
  },
  dark: {
    '--bg-main': '#0f172a',
    '--bg-sidebar': '#111827',
    '--bg-card': '#1e293b',
    '--bg-secondary': '#334155',
    '--text-main': '#f8fafc',
    '--text-muted': '#94a3b8',
    '--text-light': '#64748b',
    '--border': '#334155',
    '--primary': '#3b82f6',
    '--primary-hover': '#2563eb',
    '--success': '#10b981',
    '--danger': '#ef4444',
    '--warning': '#f59e0b',
    '--info': '#06b6d4',
    '--shadow': 'rgba(0, 0, 0, 0.3)',
    '--radius': '8px'
  },
  blue: {
    '--bg-main': '#f0f9ff',
    '--bg-sidebar': '#dbeafe',
    '--bg-card': '#ffffff',
    '--bg-secondary': '#e0f2fe',
    '--text-main': '#0c4a6e',
    '--text-muted': '#1e3a8a',
    '--text-light': '#0284c7',
    '--border': '#bae6fd',
    '--primary': '#0284c7',
    '--primary-hover': '#0369a1',
    '--success': '#059669',
    '--danger': '#dc2626',
    '--warning': '#d97706',
    '--info': '#0891b2',
    '--shadow': 'rgba(2, 132, 199, 0.1)',
    '--radius': '12px'
  },
  green: {
    '--bg-main': '#f0fdf4',
    '--bg-sidebar': '#dcfce7',
    '--bg-card': '#ffffff',
    '--bg-secondary': '#bbf7d0',
    '--text-main': '#14532d',
    '--text-muted': '#166534',
    '--text-light': '#22c55e',
    '--border': '#86efac',
    '--primary': '#16a34a',
    '--primary-hover': '#15803d',
    '--success': '#22c55e',
    '--danger': '#dc2626',
    '--warning': '#f59e0b',
    '--info': '#0891b2',
    '--shadow': 'rgba(34, 197, 94, 0.1)',
    '--radius': '12px'
  }
};

const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved && themes[saved] ? saved : 'dark';
  });

  useEffect(() => {
    const theme = themes[currentTheme] || themes.dark;
    Object.entries(theme).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const toggleTheme = () => {
    const themeNames = Object.keys(themes);
    const currentIndex = themeNames.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    setCurrentTheme(themeNames[nextIndex]);
  };

  return {
    currentTheme,
    themes: Object.keys(themes),
    changeTheme,
    toggleTheme
  };
};

export default useTheme;