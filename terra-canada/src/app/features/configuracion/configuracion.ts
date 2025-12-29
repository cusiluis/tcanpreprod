import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TopHeaderComponent } from '../../shared/components/top-header/top-header';
import { ConfiguracionPerfilComponent } from './components/configuracion-perfil/configuracion-perfil.component';
import { ConfiguracionSeguridadComponent } from './components/configuracion-seguridad/configuracion-seguridad.component';
import { ConfiguracionUsuariosComponent } from './components/configuracion-usuarios/configuracion-usuarios.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NotificationComponent, Notification } from '../../shared/components/notification/notification.component';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent,
    TopHeaderComponent,
    ConfiguracionPerfilComponent,
    ConfiguracionSeguridadComponent,
    ConfiguracionUsuariosComponent,
    TranslatePipe,
    NotificationComponent
  ],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss'
})
export class ConfiguracionComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Suscribirse a notificaciones para mostrar toasts en el módulo de Configuración
    this.notificationService.notifications$.subscribe((notifications: Notification[]) => {
      this.notifications = notifications;
    });
  }

  onNotificationDismissed(id: string): void {
    this.notificationService.dismiss(id);
  }
}
