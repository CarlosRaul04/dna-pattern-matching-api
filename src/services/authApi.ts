import { API_BASE_URL } from "./config";

export interface AuthCredentials {
  correo: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  apellido: string;
  dni: string;
  numero: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
}

export interface AuthResponse {
  token: string;
  usuario: AuthUser;
}

async function parseJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Error de autenticacion");
  }
  return data;
}

export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  return parseJson(response);
}

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson(response);
}
