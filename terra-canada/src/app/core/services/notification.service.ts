  import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {}

  /**
   * Mostrar notificación de éxito
   */
  success(message: string, duration: number = 3000): void {
    this.show({
      type: 'success',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Mostrar notificación de error
   */
  error(message: string, duration: number = 5000): void {
    this.show({
      type: 'error',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Mostrar notificación de advertencia
   */
  warning(message: string, duration: number = 4000): void {
    this.show({
      type: 'warning',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Mostrar notificación de información
   */
  info(message: string, duration: number = 3000): void {
    this.show({
      type: 'info',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Mostrar notificación personalizada
   */
  private show(notification: Omit<Notification, 'id'>): void {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      id,
      ...notification
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, newNotification]);

    // Auto-dismiss si tiene duración
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
    }
  }

  /**
   * Descartar notificación
   */
  dismiss(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filtered = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filtered);
  }

  /**
   * Limpiar todas las notificaciones
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
  }
}
