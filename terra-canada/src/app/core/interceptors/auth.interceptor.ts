import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Obtener token
    let token = this.authService.getToken();

    console.log('AuthInterceptor - URL:', request.url);
    console.log('AuthInterceptor - Token disponible:', !!token);

    // Si no hay token en memoria, intentar obtener de localStorage
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('token');
      console.log('AuthInterceptor - Token recuperado de localStorage:', !!token);
    }

    // Agregar token a headers si existe
    if (token) {
      console.log('AuthInterceptor - Agregando token al header');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.warn('AuthInterceptor - No hay token disponible');
      // Aún así agregar Content-Type
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('AuthInterceptor - Error HTTP:', error.status, error.message);
        console.error('Detalles del error:', error.error);

        if (error.status === 401) {
          const errorCode = (error.error as any)?.error?.code;

          // Solo cerrar sesión si el backend indica claramente problema de token/autenticación
          if (
            errorCode === 'NO_TOKEN' ||
            errorCode === 'INVALID_TOKEN' ||
            errorCode === 'NOT_AUTHENTICATED'
          ) {
            console.warn('AuthInterceptor - Token inválido o no presente, redirigiendo a login');
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }

        return throwError(() => error);
      })
    );
  }
}
