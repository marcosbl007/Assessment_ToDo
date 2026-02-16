import type {
  LoginFormData,
  RegisterFormData,
  SupervisorTokenRequestData,
  SupervisorTokenRequestResult,
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

interface AuthApiResponse {
  message: string;
  token: string;
  user: AuthApiUser;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'assessment_token';

function mapApiUser(user: AuthApiUser): User {
  return {
    id: String(user.id),
    username: user.username ?? user.name,
    email: user.email,
    unit: user.organizationalUnit,
    role: user.role,
  };
}

async function parseError(response: Response): Promise<never> {
  let message = 'Error inesperado en la solicitud';

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

export function saveSession(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

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
    user: { id: number; email: string; role: 'STANDARD' | 'SUPERVISOR'; unit: string };
    permissions: string[];
  };

  return {
    user: {
      id: String(payload.user.id),
      username: payload.user.email,
      email: payload.user.email,
      unit: payload.user.unit,
      role: payload.user.role,
    },
    permissions: payload.permissions,
  };
}
