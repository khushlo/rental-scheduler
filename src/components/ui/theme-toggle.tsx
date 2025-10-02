'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <div className="flex items-center gap-3">
      <Sun size={16} className={`transition-colors ${!isDark ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`} />
      <button
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
          ${isDark ? 'bg-blue-600' : 'bg-gray-300'}
        `}
        title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        role="switch"
        aria-checked={isDark}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
            ${isDark ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      <Moon size={16} className={`transition-colors ${isDark ? 'text-blue-400 dark:text-blue-300' : 'text-gray-400'}`} />
    </div>
  );
}

export function SimpleThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}