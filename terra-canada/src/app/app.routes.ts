import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard';
import { EquipoTarjetasComponent } from './features/equipo-tarjetas/equipo-tarjetas';
import { FinancierosBancariaComponent } from './features/financieros-bancaria/financieros-bancaria';
import { FinancierosTarjetasComponent } from './features/financieros-tarjetas/financieros-tarjetas';
import { AnalisisComponent } from './features/analisis/analisis';
import { EventosComponent } from './features/eventos/eventos';
import { DocumentosComponent } from './features/documentos/documentos';
import { TarjetasComponent } from './features/tarjetas/tarjetas';
import { ConfiguracionComponent } from './features/configuracion/configuracion';
import { ConfiguracionPerfilComponent } from './features/configuracion/components/configuracion-perfil/configuracion-perfil.component';
import { ConfiguracionSeguridadComponent } from './features/configuracion/components/configuracion-seguridad/configuracion-seguridad.component';
import { ConfiguracionUsuariosComponent } from './features/configuracion/components/configuracion-usuarios/configuracion-usuarios.component';
import { GmailGenComponent } from './features/gmail-gen/gmail-gen';
import { AuthService } from './core/services/auth.service';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Verificar si está autenticado en memoria
  if (authService.isAuthenticated()) {
    console.log('authGuard - Usuario autenticado en memoria');
    return true;
  }
  
  // Si no está en memoria, verificar si hay token en localStorage
  // Solo en navegador, no en SSR
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      console.log('authGuard - Token encontrado en localStorage, permitiendo acceso');
      // Retornar Observable que espera a que se cargue la autenticación
      return authService.isAuthenticated$.pipe(
        map(isAuth => {
          if (isAuth) {
            console.log('authGuard - Autenticación cargada, permitiendo acceso');
            return true;
          } else {
            console.log('authGuard - Autenticación no válida, redirigiendo a login');
            router.navigate(['/login']);
            return false;
          }
        })
      );
    }
  } else {
    console.log('authGuard - localStorage no disponible (SSR)');
  }
  
  // Si no hay token, redirigir a login
  console.log('authGuard - No hay autenticación, redirigiendo a login');
  router.navigate(['/login']);
  return false;
};

const roleGuard = (requiredModule: string) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  
  if (!authService.hasModuleAccess(requiredModule)) {
    const user = authService.getCurrentUser();
    console.warn(`roleGuard - Usuario ${user?.username} no tiene acceso al módulo ${requiredModule}`);
    // Redirigir según rol del usuario a su módulo inicial por defecto
    let targetRoute = '/login';

    if (authService.isAdmin()) {
      targetRoute = '/dashboard';
    } else if (authService.isEquipo()) {
      targetRoute = '/equipo-tarjetas';
    } else {
      const modules = authService.getAccessibleModules();
      if (modules.length > 0) {
        targetRoute = `/${modules[0]}`;
      }
    }

    router.navigate([targetRoute]);
    return false;
  }
  
  return true;
};

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, () => roleGuard('dashboard')]
  },
  {
    path: 'equipo-tarjetas',
    component: EquipoTarjetasComponent,
    canActivate: [authGuard, () => roleGuard('equipo-tarjetas')]
  },
  {
    path: 'financieros',
    component: FinancierosBancariaComponent,
    canActivate: [authGuard, () => roleGuard('financieros')]
  },
  {
    path: 'financieros-tarjetas',
    component: FinancierosTarjetasComponent,
    canActivate: [authGuard, () => roleGuard('financieros-tarjetas')]
  },
  {
    path: 'analisis',
    component: AnalisisComponent,
    canActivate: [authGuard, () => roleGuard('analisis')]
  },
  {
    path: 'gmail-gen',
    component: GmailGenComponent,
    canActivate: [authGuard, () => roleGuard('gmail-gen')]
  },
  {
    path: 'eventos',
    component: EventosComponent,
    canActivate: [authGuard, () => roleGuard('eventos')]
  },
  {
    path: 'documentos',
    component: DocumentosComponent,
    canActivate: [authGuard, () => roleGuard('documentos')]
  },
  {
    path: 'tarjetas',
    component: TarjetasComponent,
    canActivate: [authGuard, () => roleGuard('tarjetas')]
  },
  {
    path: 'configuracion',
    component: ConfiguracionComponent,
    canActivate: [authGuard, () => roleGuard('configuracion')],
    children: [
      {
        path: '',
        redirectTo: 'perfil',
        pathMatch: 'full'
      },
      {
        path: 'perfil',
        component: ConfiguracionPerfilComponent
      },
      {
        path: 'usuarios',
        component: ConfiguracionUsuariosComponent
      },
      {
        path: 'seguridad',
        component: ConfiguracionSeguridadComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
