import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Search,
  History,
  BookOpen,
  Menu,
  X,
  Home,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Scanner', href: '/scanner', icon: Search },
  { name: 'History', href: '/history', icon: History },
  { name: 'Docs', href: '/docs', icon: BookOpen },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-500 transition-colors">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              XSSpect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-64 pb-4' : 'max-h-0'
          }`}
        >
          <div className="space-y-1 pt-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
