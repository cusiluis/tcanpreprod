import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  category: string;
}

@Component({
  selector: 'app-configuracion-notificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './configuracion-notificaciones.component.html',
  styleUrl: './configuracion-notificaciones.component.scss'
})
export class ConfiguracionNotificacionesComponent implements OnInit {
  notificationPreferences: NotificationPreference[] = [
    {
      id: 'email-pagos',
      label: 'Notificaciones por Email',
      description: 'Recibe alertas de pagos y transacciones',
      enabled: true,
      category: 'email'
    },
    {
      id: 'email-documentos',
      label: 'Documentos Disponibles',
      description: 'Notificación cuando nuevos documentos estén listos',
      enabled: true,
      category: 'email'
    },
    {
      id: 'email-actualizaciones',
      label: 'Actualizaciones del Sistema',
      description: 'Recibe información sobre actualizaciones y mantenimiento',
      enabled: false,
      category: 'email'
    },
    {
      id: 'push-pagos',
      label: 'Alertas de Pagos Pendientes',
      description: 'Notificaciones push para pagos próximos a vencer',
      enabled: true,
      category: 'push'
    },
    {
      id: 'push-transacciones',
      label: 'Transacciones en Tiempo Real',
      description: 'Alertas inmediatas de movimientos en tus cuentas',
      enabled: true,
      category: 'push'
    },
    {
      id: 'sms-critico',
      label: 'Alertas Críticas por SMS',
      description: 'Solo para eventos críticos de seguridad',
      enabled: true,
      category: 'sms'
    }
  ];

  isSaving: boolean = false;

  ngOnInit(): void {
    // Initialize
  }

  toggleNotification(preference: NotificationPreference): void {
    preference.enabled = !preference.enabled;
  }

  savePreferences(): void {
    this.isSaving = true;
    // Simular guardado
    setTimeout(() => {
      this.isSaving = false;
      console.log('Preferencias guardadas:', this.notificationPreferences);
    }, 1000);
  }

  getNotificationsByCategory(category: string): NotificationPreference[] {
    return this.notificationPreferences.filter(n => n.category === category);
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      email: 'Notificaciones por Email',
      push: 'Notificaciones Push',
      sms: 'Notificaciones SMS'
    };
    return labels[category] || category;
  }
}
