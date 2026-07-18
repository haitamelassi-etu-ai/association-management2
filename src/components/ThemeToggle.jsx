import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={isLight ? 'Activer le mode sombre' : 'Activer le mode clair'}
      aria-label={isLight ? 'Activer le mode sombre' : 'Activer le mode clair'}
      type="button"
    >
      {isLight ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
};

export default ThemeToggle;
