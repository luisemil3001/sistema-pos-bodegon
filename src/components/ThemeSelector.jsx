import React from 'react';
import { Palette, Sun, Moon, Droplets, Leaf } from 'lucide-react';

const ThemeSelector = ({ currentTheme, onThemeChange, className = '' }) => {
  const themeIcons = {
    light: Sun,
    dark: Moon,
    blue: Droplets,
    green: Leaf
  };

  const themeLabels = {
    light: 'Claro',
    dark: 'Oscuro',
    blue: 'Azul',
    green: 'Verde'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Palette size={16} className="text-gray-500" />
      <div className="flex space-x-1">
        {Object.entries(themeIcons).map(([theme, Icon]) => (
          <button
            key={theme}
            onClick={() => onThemeChange(theme)}
            className={`p-2 rounded-md transition-colors ${
              currentTheme === theme
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={`Cambiar a tema ${themeLabels[theme]}`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;