import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import SearchDNA from './components/SearchDNA';
import History from './components/History';
import Login from './components/Login';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router basename="/">
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
          : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchDNA theme={theme} />} />
          <Route path="/history" element={<History theme={theme} />} />
          <Route path="/login" element={<Login theme={theme} />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}
