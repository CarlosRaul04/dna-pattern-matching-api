import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Search, Loader2, FileText, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';

interface DNARecord {
  Nombre: string;
  Secuencia: string;
}

interface SearchResult extends DNARecord {
  matches: boolean;
}

interface SearchDNAProps {
  theme: 'light' | 'dark';
}

const ITEMS_PER_PAGE = 10;

export default function SearchDNA({ theme }: SearchDNAProps) {
  const [dnaData, setDnaData] = useState<DNARecord[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [pattern, setPattern] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecciona un archivo CSV válido');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        // Validar que tenga las columnas correctas
        if (data.length === 0) {
          toast.error('El archivo CSV está vacío');
          return;
        }

        const firstRow = data[0];
        if (!firstRow.hasOwnProperty('Nombre') || !firstRow.hasOwnProperty('Secuencia')) {
          toast.error('El CSV debe tener las columnas: Nombre,Secuencia');
          return;
        }

        // Validar que las secuencias solo contengan A, C, G, T
        const validData = data.filter(row => {
          if (!row.Nombre || !row.Secuencia) return false;
          const sequence = row.Secuencia.toUpperCase();
          return /^[ACGT]+$/.test(sequence);
        });

        if (validData.length === 0) {
          toast.error('No se encontraron secuencias válidas (deben contener solo A, C, G, T)');
          return;
        }

        setDnaData(validData.map(row => ({
          Nombre: row.Nombre,
          Secuencia: row.Secuencia.toUpperCase()
        })));
        setFileName(file.name);
        setSearchResults([]);
        setHasSearched(false);
        setNameFilter('');
        setCurrentPage(1);
        toast.success(`✅ Archivo cargado: ${validData.length} secuencias encontradas`);
      },
      error: () => {
        toast.error('Error al leer el archivo CSV');
      }
    });
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // Solo permitir A, C, G, T
    if (/^[ACGT]*$/.test(value)) {
      setPattern(value);
    }
  };

  const handleSearch = () => {
    if (!pattern) {
      toast.error('Por favor, ingresa un patrón de búsqueda');
      return;
    }

    if (dnaData.length === 0) {
      toast.error('Por favor, carga un archivo CSV primero');
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    setNameFilter('');
    setCurrentPage(1);

    // Simular procesamiento
    setTimeout(() => {
      const results: SearchResult[] = dnaData.map(record => ({
        ...record,
        matches: record.Secuencia.includes(pattern)
      }));

      setSearchResults(results);
      setIsSearching(false);
      setHasSearched(true);

      const matchCount = results.filter(r => r.matches).length;

      // Guardar en historial
      const historyEntry = {
        id: Date.now().toString(),
        pattern,
        date: new Date().toISOString(),
        matchCount,
        foundNames: results.filter(r => r.matches).map(r => r.Nombre)
      };

      const history = JSON.parse(localStorage.getItem('dna_search_history') || '[]');
      history.unshift(historyEntry);
      localStorage.setItem('dna_search_history', JSON.stringify(history));

      if (matchCount > 0) {
        toast.success(`🎉 Se encontraron ${matchCount} coincidencias`);
      } else {
        toast.info('🔍 No se encontraron coincidencias');
      }
    }, 1000);
  };

  // Filtrar solo coincidencias y aplicar filtro de nombre
  const filteredResults = useMemo(() => {
    return searchResults
      .filter(r => r.matches) // Solo mostrar coincidencias
      .filter(r => r.Nombre.toLowerCase().includes(nameFilter.toLowerCase()));
  }, [searchResults, nameFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage]);

  const matchCount = searchResults.filter(r => r.matches).length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className={`text-4xl mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          🧬 Búsqueda de Patrones de ADN
        </h1>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border shadow-2xl ${
            theme === 'dark'
              ? 'bg-white/5 border-white/10'
              : 'bg-white/80 border-gray-200'
          }`}
        >
          <h2 className={`text-2xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            1. Cargar Archivo CSV
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50'
                  : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 border border-blue-500/50'
              }`}
            >
              <Upload className="w-5 h-5" />
              Seleccionar CSV
            </motion.button>

            {fileName && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-green-500/20 text-green-600'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>{fileName}</span>
                <span className="ml-2">({dnaData.length} registros)</span>
              </motion.div>
            )}
          </div>

          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            El archivo debe tener las columnas: <strong>Nombre,Secuencia</strong>
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border shadow-2xl ${
            theme === 'dark'
              ? 'bg-white/5 border-white/10'
              : 'bg-white/80 border-gray-200'
          }`}
        >
          <h2 className={`text-2xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            2. Ingresar Patrón de Búsqueda
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={pattern}
              onChange={handlePatternChange}
              placeholder="Ejemplo: ACGT"
              className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              disabled={isSearching || !pattern || dnaData.length === 0}
              className={`px-8 py-3 rounded-xl transition-all flex items-center gap-2 ${
                isSearching || !pattern || dnaData.length === 0
                  ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
              }`}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar Coincidencias
                </>
              )}
            </motion.button>
          </div>

          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Solo se permiten las letras: <strong>A, C, G, T</strong>
          </p>
        </motion.div>

        {/* Results Summary */}
        <AnimatePresence>
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border shadow-2xl ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white/80 border-gray-200'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-4 rounded-xl ${
                  theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-500/10'
                }`}>
                  <p className={`mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Patrón Buscado:
                  </p>
                  <p className={`text-2xl ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    {pattern}
                  </p>
                </div>

                <div className={`p-4 rounded-xl ${
                  matchCount > 0
                    ? theme === 'dark' ? 'bg-green-500/10' : 'bg-green-500/10'
                    : theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-500/10'
                }`}>
                  <p className={`mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Coincidencias Encontradas:
                  </p>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className={`text-2xl ${
                      matchCount > 0
                        ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                        : theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                    }`}
                  >
                    {matchCount} / {searchResults.length}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Table */}
        <AnimatePresence>
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`p-6 rounded-2xl backdrop-blur-xl border shadow-2xl ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white/80 border-gray-200'
              }`}
            >
              <h2 className={`text-2xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Resultados de Búsqueda ({matchCount} coincidencias)
              </h2>

              {matchCount === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center py-12 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">🔍 No se encontraron coincidencias</p>
                  <p className="mt-2">Intenta con un patrón diferente</p>
                </motion.div>
              ) : (
                <>
                  {/* Name Filter */}
                  <div className="mb-6">
                    <input
                      type="text"
                      value={nameFilter}
                      onChange={(e) => {
                        setNameFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="🔍 Buscar por nombre..."
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        theme === 'dark'
                          ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    {nameFilter && (
                      <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Mostrando {filteredResults.length} de {matchCount} coincidencias
                      </p>
                    )}
                  </div>

                  {filteredResults.length === 0 ? (
                    <div className={`text-center py-8 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <p className="text-lg">No se encontraron resultados con ese nombre</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className={`border-b ${
                              theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                            }`}>
                              <th className={`px-4 py-3 text-left ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>#</th>
                              <th className={`px-4 py-3 text-left ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>Nombre</th>
                              <th className={`px-4 py-3 text-left ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>Secuencia</th>
                              <th className={`px-4 py-3 text-left ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedResults.map((result, index) => (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`border-b transition-colors ${
                                  theme === 'dark'
                                    ? 'border-gray-800 hover:bg-white/5'
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <td className={`px-4 py-3 ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                </td>
                                <td className={`px-4 py-3 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {result.Nombre}
                                </td>
                                <td className={`px-4 py-3 font-mono ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {result.Secuencia.length > 50
                                    ? result.Secuencia.substring(0, 50) + '...'
                                    : result.Secuencia}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                                    theme === 'dark'
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-green-500/20 text-green-600'
                                  }`}>
                                    <CheckCircle className="w-4 h-4" />
                                    Coincide
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Página {currentPage} de {totalPages} • Mostrando {paginatedResults.length} de {filteredResults.length} resultados
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                                currentPage === 1
                                  ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                  : theme === 'dark'
                                  ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                  : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30'
                              }`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                              Anterior
                            </motion.button>

                            <div className="flex gap-2">
                              {(() => {
                                const pages = [];
                                const maxVisible = 5;
                                
                                if (totalPages <= maxVisible) {
                                  // Mostrar todas las páginas si son pocas
                                  for (let i = 1; i <= totalPages; i++) {
                                    pages.push(i);
                                  }
                                } else {
                                  // Mostrar páginas con elipsis
                                  if (currentPage <= 3) {
                                    // Inicio: 1 2 3 4 5
                                    for (let i = 1; i <= maxVisible; i++) {
                                      pages.push(i);
                                    }
                                  } else if (currentPage >= totalPages - 2) {
                                    // Final: (n-4) (n-3) (n-2) (n-1) n
                                    for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
                                      pages.push(i);
                                    }
                                  } else {
                                    // Medio: (current-2) (current-1) current (current+1) (current+2)
                                    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                                      pages.push(i);
                                    }
                                  }
                                }
                                
                                return pages.map((pageNum) => (
                                  <motion.button
                                    key={pageNum}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-10 h-10 rounded-lg transition-all ${
                                      currentPage === pageNum
                                        ? theme === 'dark'
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-blue-500 text-white'
                                        : theme === 'dark'
                                        ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                  >
                                    {pageNum}
                                  </motion.button>
                                ));
                              })()}
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                                currentPage === totalPages
                                  ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                  : theme === 'dark'
                                  ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                  : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30'
                              }`}
                            >
                              Siguiente
                              <ChevronRight className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}