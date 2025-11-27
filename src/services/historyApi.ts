import { API_BASE_URL, authHeaders } from "./config";

export interface HistoryRecord {
  _id: string;
  patron: string;
  resultados: string[];
  totalCoincidencias: number;
  archivoCsv: string;
  duracionMs: number;
  fecha: string;
}

export interface HistoryListResponse {
  total: number;
  paginaActual: number;
  totalPaginas: number;
  resultados: HistoryRecord[];
}

export interface CreateHistoryPayload {
  patron: string;
  resultados: string[];
  totalCoincidencias: number;
  archivoCsv: string;
  duracionMs: number;
}

export async function createHistory(payload: CreateHistoryPayload): Promise<HistoryRecord> {
  const response = await fetch(`${API_BASE_URL}/api/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "No se pudo guardar el historial");
  }
  return data;
}

export async function listHistory(page = 1, limit = 10): Promise<HistoryListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/history?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "No se pudo obtener el historial");
  }
  return data;
}

export async function getHistory(id: string): Promise<HistoryRecord> {
  const response = await fetch(`${API_BASE_URL}/api/history/${id}`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "No se pudo obtener el detalle del historial");
  }
  return data;
}
