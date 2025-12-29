export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  nombre_completo: string;
  rol_id: number;
  rol_nombre: string;
  permisos: string[];
  role: string;
}
