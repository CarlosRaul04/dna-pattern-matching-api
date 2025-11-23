import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Hash, Users, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryEntry {
  id: string;
  pattern: string;
  date: string;
  matchCount: number;
  foundNames: string[];
}

interface HistoryProps {
  theme: 'light' | 'dark';
}

export default function History({ theme }: HistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = localStorage.getItem('dna_search_history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  const clearHistory = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todo el historial?')) {
      localStorage.removeItem('dna_search_history');
      setHistory([]);
      toast.success('Historial eliminado correctamente');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className={`text-4xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            📊 Historial de Búsquedas
          </h1>

          {history.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearHistory}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
                  : 'bg-red-500/20 text-red-600 hover:bg-red-500/30 border border-red-500/50'
              }`}
            >
              <Trash2 className="w-5 h-5" />
              Limpiar Historial
            </motion.button>
          )}
        </div>

        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-12 rounded-2xl backdrop-blur-xl border shadow-2xl text-center ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10'
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No hay búsquedas guardadas aún
            </p>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              Realiza una búsqueda de ADN para ver el historial aquí
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence>
              {history.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 rounded-2xl backdrop-blur-xl border shadow-xl hover:shadow-2xl transition-all ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-white/80 border-gray-200 hover:bg-white'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`px-4 py-2 rounded-lg ${
                          theme === 'dark'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-blue-500/20 text-blue-600'
                        }`}>
                          <p className="text-sm">Patrón:</p>
                          <p className="text-xl font-mono">{entry.pattern}</p>
                        </div>

                        <div className={`px-4 py-2 rounded-lg ${
                          entry.matchCount > 0
                            ? theme === 'dark'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-green-500/20 text-green-600'
                            : theme === 'dark'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-orange-500/20 text-orange-600'
                        }`}>
                          <p className="text-sm">Coincidencias:</p>
                          <p className="text-xl">{entry.matchCount}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className={`w-4 h-4 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                        <span className={`${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {formatDate(entry.date)}
                        </span>
                      </div>

                      {entry.foundNames.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className={`w-4 h-4 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`} />
                            <span className={`${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Nombres encontrados:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {entry.foundNames.slice(0, 10).map((name, idx) => (
                              <span
                                key={idx}
                                className={`px-3 py-1 rounded-full ${
                                  theme === 'dark'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-purple-500/20 text-purple-600'
                                }`}
                              >
                                {name}
                              </span>
                            ))}
                            {entry.foundNames.length > 10 && (
                              <span className={`px-3 py-1 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                +{entry.foundNames.length - 10} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mt-8 p-6 rounded-2xl backdrop-blur-xl border ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10'
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <Hash className={`w-8 h-8 mx-auto mb-2 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <p className={`text-2xl mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {history.length}
                </p>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Búsquedas Totales
                </p>
              </div>

              <div>
                <Users className={`w-8 h-8 mx-auto mb-2 ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`} />
                <p className={`text-2xl mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {history.reduce((sum, entry) => sum + entry.matchCount, 0)}
                </p>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Coincidencias Totales
                </p>
              </div>

              <div>
                <Calendar className={`w-8 h-8 mx-auto mb-2 ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <p className={`text-2xl mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {new Set(history.map(h => h.pattern)).size}
                </p>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Patrones Únicos
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
