// Base URL compartido para todos los servicios de la API
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Headers de autorización con el token guardado en localStorage
export function authHeaders(): HeadersInit {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
