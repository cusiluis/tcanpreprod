import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }

  /**
   * Verificar autenticación y permiso específico
   */
  canActivateWithPermission(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredPermission = route.data['permission'];
    if (requiredPermission && !this.authService.hasPermission(requiredPermission)) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }

  /**
   * Verificar autenticación y rol específico
   */
  canActivateWithRole(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRole = route.data['role'];
    if (requiredRole && !this.authService.hasRole(requiredRole)) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }

  /**
   * Verificar autenticación y alguno de los roles
   */
  canActivateWithAnyRole(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRoles = route.data['roles'];
    if (requiredRoles && !this.authService.hasAnyRole(requiredRoles)) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}

/**
 * Guard funcional para autenticación básica
 */
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

/**
 * Guard funcional para autenticación + permiso
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredPermission = route.data['permission'];
  if (requiredPermission && !authService.hasPermission(requiredPermission)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};

/**
 * Guard funcional para autenticación + rol
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRole = route.data['role'];
  if (requiredRole && !authService.hasRole(requiredRole)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};

/**
 * Guard funcional para autenticación + múltiples roles
 */
export const rolesGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRoles = route.data['roles'];
  if (requiredRoles && !authService.hasAnyRole(requiredRoles)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
