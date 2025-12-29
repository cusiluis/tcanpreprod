import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { LoginRequest, AuthResponse, User } from '../../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  private readonly API_URL = 'https://terra-canada-test-back.vamw1k.easypanel.host/api/v1';
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos de inactividad
  private sessionTimeoutId: any = null;
  private lastActivityTime: number = Date.now();

  constructor(private http: HttpClient) {
    this.loadStoredAuth();
    this.initializeSessionTimeout();
  }

  /**
   * Inicializar detector de inactividad
   */
  private initializeSessionTimeout(): void {
    // Solo en navegador
    if (typeof window === 'undefined') {
      return;
    }

    // Detectar actividad del usuario
    ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
      window.addEventListener(event, () => this.resetSessionTimeout(), true);
    });
  }

  /**
   * Resetear timeout de sesión
   */
  private resetSessionTimeout(): void {
    this.lastActivityTime = Date.now();

    // Limpiar timeout anterior
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
    }

    // Solo resetear si está autenticado
    if (!this.isAuthenticatedSubject.value) {
      return;
    }

    // Establecer nuevo timeout
    this.sessionTimeoutId = setTimeout(() => {
      console.warn('AuthService - Sesión expirada por inactividad');
      this.clearAuth();
    }, this.SESSION_TIMEOUT);
  }

  /**
   * Cargar autenticación almacenada en localStorage
   * Solo se ejecuta en el navegador, no en SSR
   */
  private loadStoredAuth(): void {
    // Verificar que estamos en el navegador (no en SSR)
    if (typeof localStorage === 'undefined') {
      console.log('AuthService - localStorage no disponible (SSR)');
      return;
    }

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    console.log('AuthService.loadStoredAuth() - Token en localStorage:', !!token);
    console.log('AuthService.loadStoredAuth() - User en localStorage:', !!user);

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(parsedUser);
        this.isAuthenticatedSubject.next(true);
        console.log('AuthService.loadStoredAuth() - Autenticación cargada correctamente');
        // Resetear timeout cuando se carga autenticación
        this.resetSessionTimeout();
      } catch (error) {
        console.error('AuthService.loadStoredAuth() - Error parseando user:', error);
        this.clearAuth();
      }
    } else {
      console.log('AuthService.loadStoredAuth() - No hay token o user en localStorage');
      this.isAuthenticatedSubject.next(false);
    }
  }

  /**
   * Login con credenciales (nombre_usuario + contraseña)
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, {
      nombre_usuario: credentials.username,
      contrasena: credentials.password
    }).pipe(
      tap((response) => {
        console.log('AuthService.login() - Respuesta del backend recibida');
        
        // Extraer token PRIMERO
        const token = response.data.token;
        console.log('AuthService.login() - Token recibido:', token ? token.substring(0, 30) + '...' : 'NULL');

        // GUARDAR TOKEN EN LOCALSTORAGE INMEDIATAMENTE
        if (typeof localStorage !== 'undefined') {
          console.log('AuthService.login() - Guardando token en localStorage AHORA');
          localStorage.setItem('token', token);
          const verificacion = localStorage.getItem('token');
          console.log('AuthService.login() - Verificación de token en localStorage:', verificacion ? 'OK' : 'FALLO');
        }

        // Mapear respuesta del backend a modelo local
        const user: User = {
          id: response.data.usuario.id.toString(),
          username: response.data.usuario.nombre_usuario,
          email: response.data.usuario.correo,
          nombre_completo: response.data.usuario.nombre_completo,
          rol_id: response.data.usuario.rol_id,
          rol_nombre: response.data.usuario.rol_nombre,
          permisos: response.data.usuario.permisos,
          role: response.data.usuario.rol_nombre.toLowerCase()
        };

        // Guardar user en localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
          console.log('AuthService.login() - User guardado en localStorage');
        }

        // Actualizar BehaviorSubjects
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        console.log('AuthService.login() - BehaviorSubjects actualizados');
        
        // Resetear timeout cuando hace login
        this.resetSessionTimeout();
      }),
      map((response) => {
        const user: User = {
          id: response.data.usuario.id.toString(),
          username: response.data.usuario.nombre_usuario,
          email: response.data.usuario.correo,
          nombre_completo: response.data.usuario.nombre_completo,
          rol_id: response.data.usuario.rol_id,
          rol_nombre: response.data.usuario.rol_nombre,
          permisos: response.data.usuario.permisos,
          role: response.data.usuario.rol_nombre.toLowerCase()
        };

        return {
          token: response.data.token,
          user: user
        };
      }),
      catchError((error) => {
        const errorMessage = error.error?.error?.message || 'Error en autenticación';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Logout
   */
  logout(): void {
    this.clearAuth();
  }

  /**
   * Limpiar autenticación
   */
  private clearAuth(): void {
    // Solo acceder a localStorage si estamos en el navegador
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Actualizar usuario actual (en memoria y en localStorage)
   */
  updateStoredUser(user: User): void {
    // Actualizar BehaviorSubject
    this.currentUserSubject.next(user);

    // Persistir en localStorage si está disponible
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Obtener token
   */
  getToken(): string | null {
    // Primero intenta obtener del BehaviorSubject
    let token = this.tokenSubject.value;
    
    // Si no hay token en memoria, intenta obtener de localStorage
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('token');
      console.log('AuthService.getToken() - Token recuperado de localStorage:', !!token);
      if (token) {
        this.tokenSubject.next(token);
      }
    }
    
    console.log('AuthService.getToken() - Token disponible:', !!token);
    return token;
  }

  /**
   * Verificar si usuario tiene permiso
   */
  hasPermission(permiso: string): boolean {
    const user = this.getCurrentUser();
    return user?.permisos?.includes(permiso) ?? false;
  }

  /**
   * Verificar si usuario tiene rol
   */
  hasRole(rol: string): boolean {
    const user = this.getCurrentUser();
    return user?.rol_nombre?.toLowerCase() === rol.toLowerCase();
  }

  /**
   * Verificar si usuario tiene alguno de los roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return roles.some(rol => user?.rol_nombre?.toLowerCase() === rol.toLowerCase());
  }

  /**
   * Verificar si usuario tiene acceso a un módulo específico
   */
  hasModuleAccess(moduleName: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Admin tiene acceso a todo EXCEPTO equipo-tarjetas
    if (user.rol_nombre?.toLowerCase() === 'administrador') {
      // Solo restringimos explícitamente equipo-tarjetas; otros módulos como gmail-gen son accesibles
      return moduleName.toLowerCase() !== 'equipo-tarjetas';
    }

    // Equipo tiene acceso a módulo de equipo, tarjetas (solo lectura), eventos,
    // configuración, Documentos y Gmail-GEN para gestión de correos de confirmación.
    if (user.rol_nombre?.toLowerCase() === 'equipo') {
      return (
        moduleName.toLowerCase() === 'equipo-tarjetas' ||
        moduleName.toLowerCase() === 'tarjetas' ||
        moduleName.toLowerCase() === 'documentos' ||
        moduleName.toLowerCase() === 'eventos' ||
        moduleName.toLowerCase() === 'configuracion' ||
        moduleName.toLowerCase() === 'gmail-gen'
      );
    }

    return false;
  }

  /**
   * Obtener lista de módulos accesibles para el usuario actual
   */
  getAccessibleModules(): string[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    if (user.rol_nombre?.toLowerCase() === 'administrador') {
      return ['dashboard', 'tarjetas', 'financieros-tarjetas', 'pagos', 'clientes', 'proveedores', 'eventos', 'configuracion', 'gmail-gen'];
    }

    if (user.rol_nombre?.toLowerCase() === 'equipo') {
      return ['dashboard', 'equipo-tarjetas', 'tarjetas', 'documentos', 'eventos', 'configuracion', 'gmail-gen'];
    }

    return [];
  }

  /**
   * Verificar si usuario tiene permiso para una acción específica
   */
  hasActionPermission(action: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Admin tiene todos los permisos
    if (user.rol_nombre?.toLowerCase() === 'administrador') {
      return true;
    }

    // Equipo solo puede leer (no crear, editar, eliminar)
    if (user.rol_nombre?.toLowerCase() === 'equipo') {
      return action.toLowerCase() === 'leer' || action.toLowerCase() === 'read';
    }

    return false;
  }

  /**
   * Verificar si usuario es admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.rol_nombre?.toLowerCase() === 'administrador';
  }

  /**
   * Verificar si usuario es equipo
   */
  isEquipo(): boolean {
    const user = this.getCurrentUser();
    return user?.rol_nombre?.toLowerCase() === 'equipo';
  }
}
