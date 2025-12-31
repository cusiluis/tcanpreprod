import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Activity } from '../../models/dashboard.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.scss',
})
export class RecentActivityComponent {
  @Input() activities: Activity[] = [];

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: Activity['status']): string {
    if (status === 'completado') {
      return 'Completado';
    }
    return 'Sin verificación';
  }

  getPaymentStatusClass(paymentStatus: Activity['paymentStatus'] | undefined): string {
    if (!paymentStatus) {
      return 'status-desconocido';
    }
    const normalized = String(paymentStatus).toUpperCase();
    if (normalized === 'PAGADO') {
      return 'status-completado';
    }
    if (normalized === 'POR_PAGAR' || normalized === 'PENDIENTE') {
      return 'status-sin-verificacion';
    }
    return 'status-desconocido';
  }

  getPaymentStatusLabel(paymentStatus: Activity['paymentStatus'] | undefined): string {
    if (!paymentStatus) {
      return '-';
    }
    const normalized = String(paymentStatus).toUpperCase();
    if (normalized === 'PAGADO') {
      return 'Pagado';
    }
    if (normalized === 'POR_PAGAR' || normalized === 'PENDIENTE') {
      return 'Por pagar';
    }
    return normalized;
  }
}
