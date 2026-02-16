/**
 * - Cliente HTTP de autenticación para login, registro y perfil.
 * - Centraliza token de sesión y mapeo de respuestas API a tipos frontend.
 */
import type {
  LoginFormData,
  RegisterFormData,
  SupervisorTokenRequestData,
  SupervisorTokenRequestResult,
  UpdatePasswordData,
  UpdateProfileData,
  User,
} from '../types';

interface AuthApiUser {
  id: number;
  username: string | null;
  name: string;
  email: string;
  organizationalUnit: string;
  role: 'STANDARD' | 'SUPERVISOR';
}

/** Contrato de respuesta estándar en endpoints auth que devuelven token+usuario. */
interface AuthApiResponse {
  message: string;
  token: string;
  user: AuthApiUser;
}

/** Base URL configurable por entorno para las llamadas del cliente auth. */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
/** Clave única usada para persistir el JWT en localStorage. */
const TOKEN_KEY = 'assessment_token';

/** Adapta shape de usuario backend al modelo consumido por la UI. */
function mapApiUser(user: AuthApiUser): User {
  return {
    id: String(user.id),
    username: user.username ?? user.name,
    email: user.email,
    unit: user.organizationalUnit,
    role: user.role,
  };
}

/** Intenta extraer mensaje de error HTTP y lanza excepción legible. */
async function parseError(response: Response): Promise<never> {
  let message = 'Error inesperado en la solicitud';

  /** Prioriza `message` JSON del backend cuando está disponible. */
  try {
    const payload = (await response.json()) as { message?: string };
    if (payload.message) {
      message = payload.message;
    }
  } catch {
    message = response.statusText || message;
  }

  throw new Error(message);
}

/** Ejecuta login con credenciales y retorna token + usuario normalizado. */
export async function loginRequest(data: LoginFormData): Promise<{ token: string; user: User }> {
  const body = {
    identifier: data.username,
    password: data.password,
  };

  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return parseError(response);
  }

  const payload = (await response.json()) as AuthApiResponse;
  return {
    token: payload.token,
    user: mapApiUser(payload.user),
  };
}

/** Registra usuario nuevo y retorna sesión inicial. */
export async function registerRequest(data: RegisterFormData): Promise<{ token: string; user: User }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return parseError(response);
  }

  const payload = (await response.json()) as AuthApiResponse;
  return {
    token: payload.token,
    user: mapApiUser(payload.user),
  };
}

/** Solicita token temporal de supervisor para habilitar registro de ese rol. */
export async function requestSupervisorToken(
  data: SupervisorTokenRequestData,
): Promise<SupervisorTokenRequestResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/supervisor-token/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return parseError(response);
  }

  return (await response.json()) as SupervisorTokenRequestResult;
}

/** Persiste token JWT en almacenamiento local. */
export function saveSession(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Elimina token de sesión almacenado. */
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Recupera token persistido de sesión, si existe. */
export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Obtiene perfil actual y permisos del usuario autenticado. */
export async function meRequest(): Promise<{ user: User; permissions: string[] }> {
  const token = getSessionToken();
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return parseError(response);
  }

  const payload = (await response.json()) as {
    user: AuthApiUser;
    permissions: string[];
  };

  return {
    user: mapApiUser(payload.user),
    permissions: payload.permissions,
  };
}

/** Actualiza datos de perfil del usuario autenticado. */
export async function updateProfileRequest(data: UpdateProfileData): Promise<User> {
  const token = getSessionToken();
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return parseError(response);
  }

  const payload = (await response.json()) as { user: AuthApiUser };
  return mapApiUser(payload.user);
}

/** Actualiza contraseña del usuario autenticado. */
export async function updatePasswordRequest(data: UpdatePasswordData): Promise<void> {
  const token = getSessionToken();
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me/password`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return parseError(response);
  }
}
