import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { MenuItem } from '../../models/dashboard.model';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationKey } from '../../models/translations.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItem[] = [];
  activeRoute: string = '/dashboard';
  userInitials: string = 'AD';
  userName: string = 'Administrador';
  expandedItemId: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getMenuItems().subscribe((items) => {
      // Filtrar items según acceso del usuario y aplicar reglas adicionales para submódulos
      const filtered = items
        .filter(item => this.canAccessModule(item.route))
        .map(item => {
          if (item.id === 'configuracion' && item.children?.length) {
            const isAdmin = this.authService.isAdmin();
            const isSupervisor = this.authService.hasRole('supervisor');
            return {
              ...item,
              children: item.children.filter(child =>
                child.id !== 'configuracion-usuarios' || isAdmin || isSupervisor
              )
            };
          }
          return item;
        });

      this.menuItems = filtered;
      this.updateExpandedFromRoute(this.router.url);
    });

    this.activeRoute = this.router.url;
    
    // Actualizar información del usuario
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userName = currentUser.nombre_completo || currentUser.username;
      this.userInitials = this.extractInitials(this.userName);
    }
  }

  navigateTo(route: string): void {
    this.activeRoute = route;
    this.updateExpandedFromRoute(route);
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.activeRoute === route;
  }

  isParentActive(item: MenuItem): boolean {
    if (!item.children || item.children.length === 0) {
      return this.isActive(item.route);
    }

    return item.children.some(child => this.isActive(child.route));
  }

  getMenuLabel(item: MenuItem): TranslationKey {
    return (item.translationKey as TranslationKey) || (item.label as TranslationKey);
  }

  onItemClick(item: MenuItem): void {
    if (item.children && item.children.length > 0) {
      this.toggleExpanded(item.id);
      return;
    }

    this.navigateTo(item.route);
  }

  /**
   * Verificar si el usuario tiene acceso al módulo
   */
  canAccessModule(route: string): boolean {
    // Extraer nombre del módulo de la ruta
    const moduleName = route.replace(/^\//, '').split('/')[0];
    return this.authService.hasModuleAccess(moduleName);
  }

  isExpanded(id: string): boolean {
    return this.expandedItemId === id;
  }

  private toggleExpanded(id: string): void {
    this.expandedItemId = this.expandedItemId === id ? null : id;
  }

  private updateExpandedFromRoute(url: string): void {
    const parent = this.menuItems.find(item =>
      item.children?.some(child => url.startsWith(child.route))
    );

    this.expandedItemId = parent ? parent.id : null;
  }

  /**
   * Extraer iniciales del nombre del usuario
   */
  private extractInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
}
