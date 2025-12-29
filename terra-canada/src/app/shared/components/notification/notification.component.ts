import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <div
        *ngFor="let notification of notifications"
        class="notification"
        [ngClass]="'notification-' + notification.type"
      >
        <div class="notification-content">
          <i class="notification-icon" [ngClass]="getIconClass(notification.type)"></i>
          <span class="notification-message">{{ notification.message }}</span>
        </div>
        <button
          *ngIf="notification.dismissible !== false"
          class="notification-close"
          (click)="dismiss(notification.id)"
          type="button"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    }

    .notification {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-size: 14px;
      font-weight: 500;
      backdrop-filter: blur(10px);
      animation: slideInRight 0.3s ease-out;
    }

    .notification-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .notification-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .notification-message {
      word-break: break-word;
    }

    .notification-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 4px 8px;
      margin-left: 12px;
      opacity: 0.7;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }

    .notification-close:hover {
      opacity: 1;
    }

    /* Success */
    .notification-success {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      border-left: 4px solid #2d7a2d;
    }

    /* Error */
    .notification-error {
      background: linear-gradient(135deg, #f44336 0%, #da190b 100%);
      color: white;
      border-left: 4px solid #c41c00;
    }

    /* Warning */
    .notification-warning {
      background: linear-gradient(135deg, #ff9800 0%, #e68900 100%);
      color: white;
      border-left: 4px solid #e65100;
    }

    /* Info */
    .notification-info {
      background: linear-gradient(135deg, #2196f3 0%, #0b7dda 100%);
      color: white;
      border-left: 4px solid #0056b3;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .notifications-container {
        left: 10px;
        right: 10px;
        max-width: none;
      }

      .notification {
        margin-bottom: 10px;
        padding: 12px;
      }

      .notification-icon {
        font-size: 16px;
      }

      .notification-message {
        font-size: 13px;
      }
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  @Input() notifications: Notification[] = [];
  @Output() notificationDismissed = new EventEmitter<string>();

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Auto-dismiss notifications con duración
    this.notifications.forEach(notification => {
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          this.dismiss(notification.id);
        }, notification.duration);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dismiss(id: string): void {
    this.notificationDismissed.emit(id);
  }

  getIconClass(type: NotificationType): string {
    const iconMap = {
      success: 'pi pi-check-circle',
      error: 'pi pi-exclamation-circle',
      warning: 'pi pi-exclamation-triangle',
      info: 'pi pi-info-circle'
    };
    return iconMap[type];
  }
}
