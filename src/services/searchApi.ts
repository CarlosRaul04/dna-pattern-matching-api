import { API_BASE_URL, authHeaders } from "./config";

export interface SearchResponse {
  patron: string;
  total: number;
  nombres: string[];
  tiempoTotal?: number;
  registrosProcesados?: number;
  archivo?: string;
}

export async function searchPattern(patron: string): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/buscar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ patron }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error en la busqueda");
  }

  return data;
}
