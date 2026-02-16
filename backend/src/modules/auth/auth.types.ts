export interface RegisterRequest {
  username?: string;
  name: string;
  email: string;
  password: string;
  organizationalUnit: string;
  role: string;
  supervisorToken?: string;
}

export interface SupervisorTokenRequest {
  name: string;
  email: string;
  organizationalUnit: string;
}

export interface SupervisorTokenResponse {
  message: string;
  delivery: 'ethereal';
  previewUrl: string;
}

export interface LoginRequest {
  identifier?: string;
  username?: string;
  email?: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string | null;
  name: string;
  email: string;
  organizationalUnit: string;
  role: 'STANDARD' | 'SUPERVISOR';
}
