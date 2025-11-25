// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface DNARecord {
  nombre: string;
  secuencia: string;
}

export interface SearchResponse {
  patron: string;
  total: number;
  nombres: string[];
  tiempoTotal?: number;
  registrosProcesados?: number;
}

// Obtener todas las secuencias
export async function getAllSequences(): Promise<DNARecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/secuencias`);
  if (!response.ok) {
    throw new Error('Error al obtener las secuencias');
  }
  return response.json();
}

// Obtener una secuencia por nombre
export async function getSequenceByName(nombre: string): Promise<DNARecord> {
  const response = await fetch(`${API_BASE_URL}/api/secuencias/${encodeURIComponent(nombre)}`);
  if (!response.ok) {
    throw new Error('Secuencia no encontrada');
  }
  return response.json();
}

// Buscar patrón en todas las secuencias
export async function searchPattern(patron: string, concurrencia?: number, useCache: boolean = true): Promise<SearchResponse> {
  const startTime = performance.now();
  console.log(`🔍 [Frontend] Iniciando búsqueda: "${patron}" (cache: ${useCache})`);
  
  let url = `${API_BASE_URL}/api/buscar?patron=${encodeURIComponent(patron)}`;
  if (concurrencia) {
    url += `&concurrencia=${concurrencia}`;
  }
  if (!useCache) {
    url += `&cache=false`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error en la búsqueda');
  }
  
  const data = await response.json();
  const totalTime = performance.now() - startTime;
  
  console.log(`✅ [Frontend] Búsqueda completada en ${totalTime.toFixed(2)}ms`);
  console.log(`📊 [Frontend] Resultados: ${data.total} coincidencias de ${data.registrosProcesados || 'N/A'} registros`);
  if (data.tiempoTotal) {
    console.log(`⚡ [Frontend] Tiempo backend: ${data.tiempoTotal}ms`);
    console.log(`🌐 [Frontend] Tiempo red: ${(totalTime - data.tiempoTotal).toFixed(2)}ms`);
  }
  
  return data;
}
