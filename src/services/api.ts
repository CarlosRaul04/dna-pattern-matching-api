// ConfiguraciÃ³n de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface DNARecord {
  nombre: string;
  secuencia: string;
}

export interface UploadCsvResponse {
  filename: string;
  cantidad: number;
  mensaje: string;
}

export interface SearchResponse {
  patron: string;
  total: number;
  nombres: string[];
  tiempoTotal?: number;
  registrosProcesados?: number;
  archivo?: string;
}

// ----------------------------
// CSV endpoints (/api/csv/*)
// ----------------------------
export async function uploadCsv(file: File): Promise<UploadCsvResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/csv/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al subir el CSV");
  }

  return data;
}

export async function getCsvRegistros(): Promise<DNARecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/csv/registros`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al obtener los registros del CSV");
  }
  return data.registros;
}

export async function listCsvFiles(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/csv/list`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al listar los CSV");
  }
  return data.archivos;
}

export async function getActiveCsv(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/api/csv/active`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al obtener el CSV activo");
  }
  return data.active ?? null;
}

export async function setActiveCsv(filename: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/csv/set-active/${encodeURIComponent(filename)}`, {
    method: "POST",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al establecer el CSV activo");
  }
  return data.active;
}

// ----------------------------
// BÃºsqueda (/api/buscar)
// ----------------------------
export async function searchPattern(patron: string): Promise<SearchResponse> {
  const startTime = performance.now();
  console.log(`[Frontend] Buscando: "${patron}"`);

  const response = await fetch(`${API_BASE_URL}/api/buscar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ patron }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error en la busqueda");
  }

  const totalTime = performance.now() - startTime;
  console.log(`[Frontend] BÃºsqueda completada en ${totalTime.toFixed(2)}ms`);
  console.log(`[Frontend] Resultados: ${data.total} coincidencias`);
  if (data.tiempoTotal) {
    console.log(`[Frontend] Tiempo backend: ${data.tiempoTotal}ms`);
    console.log(`[Frontend] Tiempo red: ${(totalTime - data.tiempoTotal).toFixed(2)}ms`);
  }

  return data;
}
