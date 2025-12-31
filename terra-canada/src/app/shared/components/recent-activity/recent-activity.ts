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
}
