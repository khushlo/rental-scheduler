'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeDebug() {
  const { theme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [htmlClasses, setHtmlClasses] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const observer = new MutationObserver(() => {
        setHtmlClasses(document.documentElement.className);
      });
      
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Initial check
      setHtmlClasses(document.documentElement.className);
      
      return () => observer.disconnect();
    }
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg text-sm max-w-xs">
      <div className="space-y-1">
        <div><strong>Theme:</strong> {theme}</div>
        <div><strong>Resolved:</strong> {resolvedTheme}</div>
        <div><strong>System:</strong> {systemTheme}</div>
        <div><strong>HTML Classes:</strong> {htmlClasses || 'none'}</div>
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
          <div className="text-gray-600 dark:text-gray-300">
            Test text that should change color
          </div>
          <div className="text-red-500 dark:text-red-300">
            Red text test
          </div>
          <div className="bg-blue-500 dark:bg-blue-700 text-white p-1 rounded text-xs mt-1">
            Background test
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          If dark mode works, this debug panel should change colors when you toggle the theme.
        </div>
      </div>
    </div>
  );
}