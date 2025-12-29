import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor funcional para autenticación JWT
 * Compatible con Angular 15+
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('authInterceptor - URL:', req.url);
  console.log('authInterceptor - localStorage disponible:', typeof localStorage !== 'undefined');
  console.log('authInterceptor - Todas las keys en localStorage:', Object.keys(localStorage || {}));
  // Solo añadimos el token a las peticiones internas del backend
  const isInternalApi = req.url.startsWith('http://localhost:3000/api/v1');

  let modifiedReq = req;

  if (isInternalApi) {
    console.log('authInterceptor - Petición interna, evaluando token JWT');

    // Obtener token directamente de localStorage primero
    let token: string | null = null;
    
    if (typeof localStorage !== 'undefined') {
      token = localStorage.getItem('token');
      console.log('authInterceptor - localStorage.getItem("token"):', token ? token.substring(0, 30) + '...' : 'NULL');
      console.log('authInterceptor - Token es null:', token === null);
      console.log('authInterceptor - Token es undefined:', token === undefined);
      console.log('authInterceptor - Token es string vacío:', token === '');
    }

    // Si no hay token en localStorage, intentar obtener del servicio
    if (!token) {
      console.log('authInterceptor - Token no encontrado en localStorage, intentando desde servicio');
      token = authService.getToken();
      console.log('authInterceptor - Token del servicio:', token ? token.substring(0, 30) + '...' : 'NULL');
    }

    // Clonar la solicitud y agregar token si existe
    if (token) {
      console.log('authInterceptor - ✅ Agregando token al header Authorization (Bearer)');
      modifiedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.warn('authInterceptor - ❌ No hay token disponible, enviando sin autenticación (solo Content-Type)');
      modifiedReq = req.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    }
  } else {
    console.log('authInterceptor - Petición externa, no se modifica Authorization ni Content-Type');
  }

  return next(modifiedReq).pipe(
    catchError((error: any) => {
      console.error('authInterceptor - Error HTTP:', error.status, error.statusText);
      console.error('authInterceptor - Detalles:', error.error);

      if (error.status === 401) {
        const errorCode = (error.error as any)?.error?.code;

        // Solo cerrar sesión si el backend indica claramente problema de token/autenticación
        if (
          errorCode === 'NO_TOKEN' ||
          errorCode === 'INVALID_TOKEN' ||
          errorCode === 'NOT_AUTHENTICATED'
        ) {
          console.warn('authInterceptor - Token inválido o ausente, redirigiendo a login');
          authService.logout();
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
