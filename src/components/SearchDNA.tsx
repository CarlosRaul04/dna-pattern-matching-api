import { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Upload,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import { DNARecord, getActiveCsv, getCsvRegistros, listCsvFiles, setActiveCsv as setActiveCsvApi, uploadCsv } from '../services/csvApi';
import { searchPattern } from '../services/searchApi';
import { createHistory } from '../services/historyApi';

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
  const [csvFiles, setCsvFiles] = useState([] as string[]);
  const [activeCsv, setActiveCsv] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

  // Cargar datos desde la API al montar el componente
  useEffect(() => {
    loadCsvData();
  }, []);

  const loadCsvData = async () => {
    try {
      setIsLoading(true);
      const [files, active] = await Promise.all([
        listCsvFiles(),
        getActiveCsv(),
      ]);

      setCsvFiles(files);
      setActiveCsv(active);

      if (active) {
        const sequences = await getCsvRegistros();
        setAllSequences(sequences);
        toast.success(`API lista: ${sequences.length} secuencias en ${active}`);
      } else {
        setAllSequences([]);
        toast.warning('No hay un CSV activo. Sube uno o selecciona de la lista.');
      }
    } catch (error) {
      setAllSequences([]);
      toast.error('Error al conectar con la API. Verifica que el backend este disponible.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadCsvData();
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleUploadCsv = async () => {
    if (!selectedFile) {
      toast.error('Selecciona un archivo CSV para subir');
      return;
    }

    try {
      setIsUploading(true);
      const response = await uploadCsv(selectedFile);
      toast.success(response.mensaje || 'CSV subido correctamente');
      setActiveCsv(response.filename);
      setSelectedFile(null);
      await loadCsvData();
    } catch (error) {
      toast.error('Error al subir el CSV');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetActiveCsv = async (filename: string) => {
    if (!filename || filename === activeCsv) return;

    try {
      setIsLoading(true);
      await setActiveCsvApi(filename);
      setActiveCsv(filename);
      const sequences = await getCsvRegistros();
      setAllSequences(sequences);
      toast.success(`CSV activo: ${filename} (${sequences.length} secuencias)`);
    } catch (error) {
      toast.error('No se pudo activar el CSV seleccionado');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatternChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    if (/^[ACGT]*$/.test(value)) {
      setPattern(value);
    }
  };

  const handleSearch = async () => {
    if (!pattern) {
      toast.error('Por favor, ingresa un patron de busqueda');
      return;
    }

    if (!activeCsv) {
      toast.error('Selecciona o sube un CSV antes de buscar');
      return;
    }

    if (allSequences.length === 0) {
      toast.error('No hay secuencias cargadas. Verifica la conexion con la API');
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

    try {
      const response = await searchPattern(pattern);

      const totalTime = performance.now() - startTime;
      setSearchTime(totalTime);
      setBackendTime(response.tiempoTotal || null);

      const nombresUnicos = new Set(response.nombres || []);
      const secuenciasPorNombre = new Map(allSequences.map((seq) => [seq.nombre, seq]));

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

      const hasDiscrepancy = matchedSequences.length !== response.total;
      if (hasDiscrepancy) {
        toast.warning(`Discrepancia: backend=${response.total}, frontend=${matchedSequences.length}`);
        if (nombresNoEncontrados.length) {
          console.warn('Nombres sin detalle en frontend:', nombresNoEncontrados.slice(0, 5));
        }
      }

      setSearchResults(matchedSequences);
      setSearchMetadata({
        backendTotal: response.total,
        frontendTotal: matchedSequences.length,
        hasDiscrepancy,
      });
      setHasSearched(true);

      try {
        await createHistory({
          patron: pattern,
          resultados: response.nombres || [],
          totalCoincidencias: response.total,
          archivoCsv: activeCsv || 'desconocido',
          duracionMs: response.tiempoTotal || totalTime,
        });
      } catch (historyError) {
        console.warn('No se pudo guardar historial remoto', historyError);
      }
    } catch (error) {
      toast.error('Error al realizar la busqueda');
      console.error('[SearchDNA] Error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredResults = useMemo(() => {
    return searchResults.filter((r) => r.nombre.toLowerCase().includes(nameFilter.toLowerCase()));
  }, [searchResults, nameFilter]);

  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE) || 1;
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage]);

  const matchCount = searchMetadata?.backendTotal ?? searchResults.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cardBase = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200';
  const textMuted = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const textMain = theme === 'dark' ? 'text-white' : 'text-gray-900';

  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-4xl ${textMain}`}>
            Busqueda de Patrones de ADN
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

        {/* Gestor de CSV */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border shadow-2xl ${cardBase}`}
        >
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className={`text-2xl mb-1 ${textMain}`}>Fuente de datos (CSV)</h2>
                  <p className={textMuted}>Selecciona el CSV que usara el backend para las busquedas.</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  activeCsv
                    ? theme === 'dark'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-green-100 text-green-700'
                    : theme === 'dark'
                    ? 'bg-orange-500/20 text-orange-300'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {activeCsv ? `Activo: ${activeCsv}` : 'Sin CSV activo'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className={`flex items-center gap-3 flex-1 px-3 py-2 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800/70 border-gray-700' : 'bg-gray-100 border-gray-300'
                }`}>
                  <FileSpreadsheet className={theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} />
                  <select
                    className={`w-full bg-transparent focus:outline-none ${textMain} ${
                      theme === 'dark'
                        ? 'text-white placeholder-gray-500'
                        : 'text-gray-900'
                    }`}
                    value={activeCsv || ''}
                    onChange={(e) => handleSetActiveCsv(e.target.value)}
                  >
                    <option value="">Selecciona un CSV</option>
                    {csvFiles.map((file) => (
                      <option key={file} value={file}>
                        {file}
                      </option>
                    ))}
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                      : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30'
                  }`}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  Actualizar lista
                </motion.button>
              </div>
              <p className={`mt-2 text-sm ${textMuted}`}>
                Archivos encontrados en el servidor: {csvFiles.length}
              </p>
            </div>

            <div className="w-full lg:w-80">
              <p className={`mb-2 font-medium ${textMain}`}>Subir nuevo CSV</p>
              <div className={`flex flex-col sm:flex-row gap-3 items-center p-4 rounded-xl border ${
                theme === 'dark' ? 'border-gray-700 bg-gray-900/40' : 'border-gray-300 bg-gray-50'
              }`}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className={`w-full text-sm cursor-pointer py-3 px-3 rounded-lg border-2 border-dashed focus:outline-none transition ${
                    theme === 'dark'
                      ? 'file:bg-blue-500/20 file:text-blue-200 file:border-none file:px-4 file:py-2 bg-gray-950/70 text-white border-blue-500/40 hover:border-blue-400'
                      : 'file:bg-blue-50 file:text-blue-700 file:border-none file:px-4 file:py-2 bg-white text-gray-800 border-blue-200 hover:border-blue-400'
                  }`}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUploadCsv}
                  disabled={!selectedFile || isUploading}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    !selectedFile || isUploading
                      ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed'
                      : theme === 'dark'
                      ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      : 'bg-green-500/20 text-green-700 hover:bg-green-500/30'
                  }`}
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  Subir CSV
                </motion.button>
              </div>
              {selectedFile && (
                <p className={`mt-2 text-sm ${textMuted}`}>Seleccionado: {selectedFile.name}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Estado de la API */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border shadow-2xl ${cardBase}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl mb-2 ${textMain}`}>Estado de la API</h2>
              <p className={textMuted}>
                {isLoading
                  ? 'Cargando datos desde el backend...'
                  : allSequences.length > 0
                  ? `Conectado. Registros cargados: ${allSequences.length}${activeCsv ? ` (CSV: ${activeCsv})` : ''}`
                  : 'No se pudo obtener un CSV activo. Sube uno o selecciona de la lista.'}
              </p>
            </div>
            <div
              className={`w-4 h-4 rounded-full ${
                allSequences.length > 0 ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}
            />
          </div>
        </motion.div>

        {/* Busqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border shadow-2xl ${cardBase}`}
        >
          <h2 className={`text-2xl mb-4 ${textMain}`}>Ingresar patron de busqueda</h2>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
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
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar con API
                </>
              )}
            </motion.button>
          </div>

          <p className={`mt-4 ${textMuted}`}>
            Solo se permiten las letras: <strong>A, C, G, T</strong>
          </p>
        </motion.div>

        {/* Resumen de resultados */}
        <AnimatePresence>
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border shadow-2xl ${cardBase}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-100'} p-4 rounded-xl`}>
                  <p className={`mb-2 text-sm ${textMuted}`}>Patron buscado:</p>
                  <p className={`text-2xl ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>{pattern}</p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    matchCount > 0
                      ? theme === 'dark'
                        ? 'bg-green-500/10'
                        : 'bg-green-100'
                      : theme === 'dark'
                      ? 'bg-orange-500/10'
                      : 'bg-orange-100'
                  }`}
                >
                  <p className={`mb-2 text-sm ${textMuted}`}>Coincidencias:</p>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className={`text-2xl ${
                      matchCount > 0
                        ? theme === 'dark' ? 'text-green-400' : 'text-green-700'
                        : theme === 'dark' ? 'text-orange-400' : 'text-orange-700'
                    }`}
                  >
                    {matchCount}
                  </motion.p>
                </div>

                <div className={`${theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-100'} p-4 rounded-xl`}>
                  <p className={`mb-2 text-sm ${textMuted}`}>Tiempo total:</p>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className={`text-2xl ${theme === 'dark' ? 'text-cyan-300' : 'text-cyan-700'}`}
                  >
                    {searchTime !== null ? `${(searchTime / 1000).toFixed(2)}s` : 'N/D'}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

        {/* Tabla de resultados */}
        <AnimatePresence>
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`p-6 rounded-2xl backdrop-blur-xl border shadow-2xl ${cardBase}`}
            >
              <h2 className={`text-2xl mb-4 ${textMain}`}>
                Resultados de busqueda ({matchCount} coincidencias)
              </h2>

              {matchCount === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center py-12 ${textMuted}`}
                >
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">No se encontraron coincidencias</p>
                  <p className="mt-2">Intenta con un patron diferente</p>
                </motion.div>
              ) : (
                <>
                  <div className="mb-6">
                    <input
                      type="text"
                      value={nameFilter}
                      onChange={(e) => {
                        setNameFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Buscar por nombre..."
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        theme === 'dark'
                          ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    {nameFilter && (
                      <p className={`mt-2 ${textMuted}`}>
                        Mostrando {filteredResults.length} de {matchCount} coincidencias
                      </p>
                    )}
                  </div>

                  {filteredResults.length === 0 ? (
                    <div className={`text-center py-8 ${textMuted}`}>
                      <p className="text-lg">No se encontraron resultados con ese nombre</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                              <th className={`px-4 py-3 text-left ${textMuted}`}>#</th>
                              <th className={`px-4 py-3 text-left ${textMuted}`}>Nombre</th>
                              <th className={`px-4 py-3 text-left ${textMuted}`}>Secuencia</th>
                              <th className={`px-4 py-3 text-left ${textMuted}`}>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedResults.map((result, index) => (
                              <motion.tr
                                key={result.nombre + index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`border-b transition-colors ${
                                  theme === 'dark'
                                    ? 'border-gray-800 hover:bg-white/5'
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <td className={`px-4 py-3 ${textMuted}`}>
                                  {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                </td>
                                <td className={`px-4 py-3 ${textMain}`}>
                                  {result.nombre}
                                </td>
                                <td className={`px-4 py-3 font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {result.secuencia.length > 50
                                    ? `${result.secuencia.substring(0, 50)}...`
                                    : result.secuencia}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                                      theme === 'dark'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-green-500/20 text-green-600'
                                    }`}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Coincide
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {totalPages > 1 && (
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <p className={textMuted}>
                            Pagina {currentPage} de {totalPages} Ã¯Â¿Â½ Mostrando {paginatedResults.length} de {filteredResults.length} resultados
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
                                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                                } else if (currentPage <= 3) {
                                  for (let i = 1; i <= maxVisible; i++) pages.push(i);
                                } else if (currentPage >= totalPages - 2) {
                                  for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
                                } else {
                                  for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
                                }

                                return pages.map((pageNum) => (
                                  <motion.button
                                    key={pageNum}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-10 h-10 rounded-lg transition-all ${
                                      currentPage === pageNum
                                        ? 'bg-blue-500 text-white'
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
