import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard</h1>
      <p>Próximamente: Interfaz de gestión completa</p>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      background: #f5f5f5;
      min-height: 100vh;
    }
  `]
})
export class DashboardComponent {}
