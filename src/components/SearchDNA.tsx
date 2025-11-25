import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { toast } from 'sonner';
import { searchPattern, getAllSequences, DNARecord } from '../services/api';

// Usar DNARecord directamente en lugar de SearchResult
type SearchResult = DNARecord;

interface SearchDNAProps {
  theme: 'light' | 'dark';
}

interface SearchMetadata {
  backendTotal: number;
  frontendTotal: number;
  hasDiscrepancy: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function SearchDNA({ theme }: SearchDNAProps) {
  const [allSequences, setAllSequences] = useState([] as DNARecord[]);
  const [pattern, setPattern] = useState('');
  const [searchResults, setSearchResults] = useState([] as SearchResult[]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTime, setSearchTime] = useState(null as number | null);
  const [backendTime, setBackendTime] = useState(null as number | null);
  const [searchMetadata, setSearchMetadata] = useState(null as SearchMetadata | null);

  // Cargar todas las secuencias al montar el componente
  useEffect(() => {
    loadAllSequences();
  }, []);

  const loadAllSequences = async () => {
    try {
      setIsLoading(true);
      const sequences = await getAllSequences();
      setAllSequences(sequences);
      toast.success(`✅ ${sequences.length} secuencias cargadas desde la API`);
    } catch (error) {
      toast.error('❌ Error al conectar con la API. Verifica que esté corriendo en el puerto 3000');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadAllSequences();
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // Solo permitir A, C, G, T
    if (/^[ACGT]*$/.test(value)) {
      setPattern(value);
    }
  };

  const handleSearch = async () => {
    if (!pattern) {
      toast.error('Por favor, ingresa un patrón de búsqueda');
      return;
    }

    if (allSequences.length === 0) {
      toast.error('No hay secuencias cargadas. Verifica la conexión con la API');
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    setNameFilter('');
    setCurrentPage(1);
    setSearchTime(null);
    setBackendTime(null);
    setSearchMetadata(null);

    const startTime = performance.now();
    console.log('\n' + '='.repeat(60));
    console.log(`🔍 [SearchDNA] Iniciando búsqueda del patrón: "${pattern}"`);
    console.log('='.repeat(60));

    try {
      // Llamar a la API para buscar el patrón
      const response = await searchPattern(pattern, 250, true); // 500 búsquedas paralelas, con caché
      
      const totalTime = performance.now() - startTime;
      setSearchTime(totalTime);
      setBackendTime(response.tiempoTotal || null);

      console.log(`⏱️  [SearchDNA] Tiempo total UI: ${totalTime.toFixed(2)}ms`);
      console.log(`📊 [SearchDNA] Backend reporta: ${response.total} coincidencias`);
      console.log(`📊 [SearchDNA] Backend devolvió ${response.nombres.length} nombres`);
      
      // Verificar si hay duplicados en la respuesta del backend
      const nombresUnicos = new Set(response.nombres);
      if (nombresUnicos.size !== response.nombres.length) {
        console.warn(`⚠️  [SearchDNA] Backend devolvió nombres duplicados: ${response.nombres.length} nombres, ${nombresUnicos.size} únicos`);
      }
      
      // Crear un mapa de nombres a secuencias para búsqueda rápida
      const secuenciasPorNombre = new Map(allSequences.map(seq => [seq.nombre, seq]));
      
      // Obtener los detalles completos SOLO de los nombres únicos que devolvió el backend
      const matchedSequences: SearchResult[] = [];
      const nombresNoEncontrados: string[] = [];
      
      for (const nombre of nombresUnicos) {
        const secuencia = secuenciasPorNombre.get(nombre);
        if (secuencia) {
          matchedSequences.push(secuencia);
        } else {
          nombresNoEncontrados.push(nombre);
        }
      }

      console.log(`📊 [SearchDNA] Frontend encontró: ${matchedSequences.length} secuencias con detalles`);
      
      // Detectar discrepancias
      const hasDiscrepancy = matchedSequences.length !== response.total;
      if (hasDiscrepancy) {
        console.warn(`⚠️  [SearchDNA] DISCREPANCIA: Backend=${response.total}, Frontend=${matchedSequences.length}`);
        
        if (nombresNoEncontrados.length > 0) {
          console.warn(`⚠️  [SearchDNA] Nombres en backend pero no en frontend (${nombresNoEncontrados.length}):`, nombresNoEncontrados.slice(0, 5));
        }
        
        // Verificar si hay duplicados en allSequences
        const nombresEnFrontend = allSequences.map(s => s.nombre);
        const nombresEnFrontendUnicos = new Set(nombresEnFrontend);
        if (nombresEnFrontend.length !== nombresEnFrontendUnicos.size) {
          const duplicados = nombresEnFrontend.length - nombresEnFrontendUnicos.size;
          console.warn(`⚠️  [SearchDNA] Frontend tiene ${duplicados} nombres duplicados en allSequences`);
        }
        
        toast.warning(`⚠️ Discrepancia: Backend=${response.total}, Frontend=${matchedSequences.length}. Revisa la consola para detalles.`);
      } else {
        console.log(`✅ [SearchDNA] Conteos coinciden perfectamente`);
      }
      
      setSearchResults(matchedSequences);
      setSearchMetadata({
        backendTotal: response.total,
        frontendTotal: matchedSequences.length,
        hasDiscrepancy
      });
      setHasSearched(true);

      // Guardar en historial
      const historyEntry = {
        id: Date.now().toString(),
        pattern,
        date: new Date().toISOString(),
        matchCount: response.total,
        foundNames: response.nombres
      };

      const history = JSON.parse(localStorage.getItem('dna_search_history') || '[]');
      history.unshift(historyEntry);
      localStorage.setItem('dna_search_history', JSON.stringify(history));

      // Toast removido - los resultados se muestran en la UI

      console.log(`✅ [SearchDNA] Búsqueda completada exitosamente`);
      console.log('='.repeat(60) + '\n');
    } catch (error) {
      toast.error('❌ Error al realizar la búsqueda');
      console.error('❌ [SearchDNA] Error:', error);
      console.log('='.repeat(60) + '\n');
    } finally {
      setIsSearching(false);
    }
  };

  // Filtrar resultados por nombre
  const filteredResults = useMemo(() => {
    return searchResults.filter(r => 
      r.nombre.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }, [searchResults, nameFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage]);

  // Usar siempre el conteo del backend como fuente de verdad
  const matchCount = searchMetadata?.backendTotal ?? searchResults.length;

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
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-4xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            🧬 Búsqueda de Patrones de ADN
          </h1>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              theme === 'dark'
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50'
                : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 border border-blue-500/50'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Recargar ({allSequences.length})
              </>
            )}
          </motion.button>
        </div>

        {/* API Status */}
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Estado de la API
              </h2>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {isLoading ? (
                  'Conectando con la API...'
                ) : allSequences.length > 0 ? (
                  `✅ Conectado - ${allSequences.length} secuencias disponibles`
                ) : (
                  '❌ No se pudo conectar con la API. Verifica que esté corriendo en http://localhost:3000'
                )}
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full ${
              allSequences.length > 0 ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`} />
          </div>
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
            Ingresar Patrón de Búsqueda
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
              disabled={isSearching || !pattern || allSequences.length === 0}
              className={`px-8 py-3 rounded-xl transition-all flex items-center gap-2 ${
                isSearching || !pattern || allSequences.length === 0
                  ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
              }`}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Buscando con KMP...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar con API
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl ${
                  theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-500/10'
                }`}>
                  <p className={`mb-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
                  <p className={`mb-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Coincidencias:
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
                    {matchCount} / {allSequences.length}
                  </motion.p>
                  {searchMetadata?.hasDiscrepancy && (
                    <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      ⚠️ {searchMetadata.frontendTotal} con detalles
                    </p>
                  )}
                </div>

                {backendTime !== null && (
                  <div className={`p-4 rounded-xl ${
                    theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-500/10'
                  }`}>
                    <p className={`mb-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Tiempo Backend:
                    </p>
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                      className={`text-2xl ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}
                    >
                      {(backendTime / 1000).toFixed(2)}s
                    </motion.p>
                  </div>
                )}

                {searchTime !== null && (
                  <div className={`p-4 rounded-xl ${
                    theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-500/10'
                  }`}>
                    <p className={`mb-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Tiempo Total:
                    </p>
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                      className={`text-2xl ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}
                    >
                      {(searchTime / 1000).toFixed(2)}s
                    </motion.p>
                  </div>
                )}
              </div>

              {/* Performance Info */}
              {backendTime !== null && searchTime !== null && (
                <div className={`mt-4 p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
                }`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    ⚡ Velocidad: {(allSequences.length / (backendTime / 1000)).toFixed(2)} búsquedas/segundo
                    {' • '}
                    🌐 Latencia de red: {((searchTime - backendTime) / 1000).toFixed(3)}s
                  </p>
                </div>
              )}

              {/* Discrepancy Warning */}
              {searchMetadata?.hasDiscrepancy && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-yellow-500/10 border-yellow-500/30' 
                    : 'bg-yellow-50 border-yellow-300'
                }`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    ⚠️ <strong>Discrepancia detectada:</strong> El backend encontró {searchMetadata.backendTotal} coincidencias, 
                    pero solo se pudieron cargar {searchMetadata.frontendTotal} registros con detalles completos. 
                    Esto puede deberse a que el backend tiene datos más actualizados. 
                    Intenta recargar las secuencias.
                  </p>
                </div>
              )}
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
                                  {result.nombre}
                                </td>
                                <td className={`px-4 py-3 font-mono ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {result.secuencia.length > 50
                                    ? result.secuencia.substring(0, 50) + '...'
                                    : result.secuencia}
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
                                const pages: number[] = [];
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