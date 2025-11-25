import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Dna, Search, History, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Navbar({ theme, toggleTheme }: NavbarProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Inicio', icon: Dna },
    { path: '/search', label: 'Buscar ADN', icon: Search },
    { path: '/history', label: 'Historial', icon: History },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`sticky top-0 z-50 backdrop-blur-xl ${
        theme === 'dark'
          ? 'bg-gray-900/70 border-gray-700/50'
          : 'bg-white/70 border-gray-200/50'
      } border-b shadow-lg`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Dna className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              ADN Matcher
            </span>
          </Link>

          <div className="flex items-center gap-1 md:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-blue-500/20 text-blue-600'
                        : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-800/50'
                        : 'text-gray-700 hover:bg-gray-200/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`ml-2 p-2 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800/50 text-yellow-400 hover:bg-gray-700/50'
                  : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}