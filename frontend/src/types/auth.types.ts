/**
 * - Define contratos compartidos usados por páginas, formularios y servicios.
 * - Centraliza los tipos para mantener consistencia y reutilización.
 */

/** Payload de credenciales para la acción de login. */
export interface LoginFormData {
  username: string;
  password: string;
}

/** Payload requerido por el formulario de registro e integración con endpoint. */
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationalUnit: string;
  role: string;
  supervisorToken?: string;
}

export interface SupervisorTokenRequestData {
  name: string;
  email: string;
  organizationalUnit: string;
}

export interface SupervisorTokenRequestResult {
  message: string;
  delivery: 'ethereal';
  previewUrl: string;
}

/** Estructura mínima de estado auth para escenarios de gestión de estado. */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

/** Representación de usuario autenticado usada por el frontend. */
export interface User {
  id: string;
  username: string;
  email: string;
  unit: string;
  role: 'STANDARD' | 'SUPERVISOR';
}

export interface UpdateProfileData {
  name: string;
  email: string;
}

export interface UpdatePasswordData {
  newPassword: string;
}
