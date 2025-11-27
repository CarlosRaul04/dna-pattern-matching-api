import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import SearchDNA from './components/SearchDNA';
import History from './components/History';
import Login from './components/Login';
import Register from './components/Register';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('auth_token')));

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(Boolean(localStorage.getItem('auth_token')));
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleAuthSuccess = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router basename="/">
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
          : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}>
        {isAuthenticated && <Navbar theme={theme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />}
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/search"
            element={
              <RequireAuth>
                <SearchDNA theme={theme} />
              </RequireAuth>
            }
          />
          <Route
            path="/history"
            element={
              <RequireAuth>
                <History theme={theme} />
              </RequireAuth>
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Login theme={theme} onAuthSuccess={handleAuthSuccess} />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Register theme={theme} />
            }
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}
