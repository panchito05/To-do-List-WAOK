import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-11 w-20 items-center rounded-full 
                 bg-[rgb(var(--bg-tertiary))] transition-colors duration-200
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]
                 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-primary))]"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span
        className={`${
          theme === 'dark' ? 'translate-x-10' : 'translate-x-1'
        } inline-block h-9 w-9 transform rounded-full 
          bg-[rgb(var(--bg-primary))] shadow-lg transition-transform duration-200
          flex items-center justify-center`}
      >
        {theme === 'dark' ? (
          <Moon size={20} className="text-[rgb(var(--primary-500))]" />
        ) : (
          <Sun size={20} className="text-[rgb(var(--warning))]" />
        )}
      </span>
    </button>
  );
}