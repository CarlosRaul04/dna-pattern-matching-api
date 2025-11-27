import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Hash, Users, AlertCircle, Clock, Database } from 'lucide-react';
import { listHistory, type HistoryRecord } from '../services/historyApi';
import { toast } from 'sonner';

interface HistoryProps {
  theme: 'light' | 'dark';
}

export default function History({ theme }: HistoryProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const textMain = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textMuted = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const cardBase = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200';

  useEffect(() => {
    loadHistory(page);
  }, [page]);

  const loadHistory = async (pageNumber: number) => {
    try {
      setLoading(true);
      const data = await listHistory(pageNumber, 8);
      setHistory(data.resultados);
      setTotalPages(Math.max(1, data.totalPaginas || 1));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar el historial';
      toast.error(message);
      setHistory([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
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

  const stats = useMemo(() => {
    const totalSearches = history.length;
    const totalMatches = history.reduce((sum, entry) => sum + (entry.totalCoincidencias || 0), 0);
    const uniquePatterns = new Set(history.map((h) => h.patron)).size;
    return { totalSearches, totalMatches, uniquePatterns };
  }, [history]);

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && page > 1) setPage(page - 1);
    if (direction === 'next' && page < totalPages) setPage(page + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className={`text-4xl ${textMain}`}>Historial de Busquedas</h1>
            <p className={textMuted}>Tus consultas guardadas en el backend.</p>
          </div>
          {history.length > 0 && (
            <div className={`px-3 py-1 rounded-full text-sm ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/10 text-blue-700'}`}>
              Pagina {page} de {totalPages}
            </div>
          )}
        </div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className={`p-12 rounded-2xl backdrop-blur-xl border shadow-2xl text-center ${cardBase}`}
          >
            <p className={`text-xl ${textMain}`}>Cargando historial...</p>
          </motion.div>
        ) : history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-12 rounded-2xl backdrop-blur-xl border shadow-2xl text-center ${cardBase}`}
          >
            <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-xl ${textMain}`}>
              No hay busquedas guardadas aun
            </p>
            <p className={`mt-2 ${textMuted}`}>
              Realiza una busqueda de ADN para ver el historial aqui
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence>
              {history.map((entry, index) => (
                <motion.div
                  key={entry._id}
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
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className={`px-4 py-2 rounded-lg ${
                          theme === 'dark'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-blue-500/20 text-blue-600'
                        }`}>
                          <p className="text-sm">Patron:</p>
                          <p className="text-xl font-mono">{entry.patron}</p>
                        </div>

                        <div className={`px-4 py-2 rounded-lg ${
                          entry.totalCoincidencias > 0
                            ? theme === 'dark'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-green-500/20 text-green-600'
                            : theme === 'dark'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-orange-500/20 text-orange-600'
                        }`}>
                          <p className="text-sm">Coincidencias:</p>
                          <p className="text-xl">{entry.totalCoincidencias}</p>
                        </div>

                        <div className={`px-4 py-2 rounded-lg ${
                          theme === 'dark'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-purple-500/20 text-purple-700'
                        }`}>
                          <p className="text-sm">Archivo</p>
                          <p className="text-md">{entry.archivoCsv}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${textMuted}`} />
                          <span className={textMuted}>{formatDate(entry.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${textMuted}`} />
                          <span className={textMuted}>{(entry.duracionMs / 1000).toFixed(2)}s</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Database className={`w-4 h-4 ${textMuted}`} />
                          <span className={textMuted}>{entry.resultados.length} nombres devueltos</span>
                        </div>
                      </div>

                      {entry.resultados.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className={`w-4 h-4 ${textMuted}`} />
                            <span className={textMuted}>Nombres encontrados:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {entry.resultados.slice(0, 12).map((name, idx) => (
                              <span
                                key={idx}
                                className={`px-3 py-1 rounded-full ${
                                  theme === 'dark'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-purple-500/20 text-purple-700'
                                }`}
                              >
                                {name}
                              </span>
                            ))}
                            {entry.resultados.length > 12 && (
                              <span className={`px-3 py-1 ${textMuted}`}>
                                +{entry.resultados.length - 12} mas
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
                <p className={`text-2xl mb-1 ${textMain}`}>
                  {stats.totalSearches}
                </p>
                <p className={textMuted}>
                  Busquedas Totales
                </p>
              </div>

              <div>
                <Users className={`w-8 h-8 mx-auto mb-2 ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`} />
                <p className={`text-2xl mb-1 ${textMain}`}>
                  {stats.totalMatches}
                </p>
                <p className={textMuted}>
                  Coincidencias Totales
                </p>
              </div>

              <div>
                <Calendar className={`w-8 h-8 mx-auto mb-2 ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <p className={`text-2xl mb-1 ${textMain}`}>
                  {stats.uniquePatterns}
                </p>
                <p className={textMuted}>
                  Patrones unicos
                </p>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={() => handlePageChange('prev')}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-lg border ${
                    page === 1
                      ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      : theme === 'dark'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-blue-500/10 text-blue-700 border-blue-300'
                  }`}
                >
                  Anterior
                </button>
                <span className={textMuted}>Pagina {page} de {totalPages}</span>
                <button
                  onClick={() => handlePageChange('next')}
                  disabled={page === totalPages}
                  className={`px-4 py-2 rounded-lg border ${
                    page === totalPages
                      ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      : theme === 'dark'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-blue-500/10 text-blue-700 border-blue-300'
                  }`}
                >
                  Siguiente
                </button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
