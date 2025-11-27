import { API_BASE_URL, authHeaders } from "./config";

export interface DNARecord {
  nombre: string;
  secuencia: string;
}

export interface UploadCsvResponse {
  filename: string;
  cantidad: number;
  mensaje: string;
}

export async function uploadCsv(file: File): Promise<UploadCsvResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/csv/upload`, {
    method: "POST",
    body: formData,
    headers: authHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al subir el CSV");
  }

  return data;
}

export async function getCsvRegistros(): Promise<DNARecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/csv/registros`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al obtener los registros del CSV");
  }
  return data.registros;
}

export async function listCsvFiles(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/csv/list`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al listar los CSV");
  }
  return data.archivos;
}

export async function getActiveCsv(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/api/csv/active`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al obtener el CSV activo");
  }
  return data.active ?? null;
}

export async function setActiveCsv(filename: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/csv/set-active/${encodeURIComponent(filename)}`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al establecer el CSV activo");
  }
  return data.active;
}
