import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    // Obtener módulo requerido de los datos de la ruta
    const requiredModule = route.data['module'];

    if (requiredModule && !this.authService.hasModuleAccess(requiredModule)) {
      console.warn(`RoleGuard - Usuario ${user.username} no tiene acceso al módulo ${requiredModule}`);
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}
