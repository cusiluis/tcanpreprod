import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar';
import { TopHeaderComponent } from '../../../shared/components/top-header/top-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { RecentActivityComponent } from '../../../shared/components/recent-activity/recent-activity';
import { DashboardService } from '../../../core/services/dashboard.service';
import { StatCard, Activity } from '../../../shared/models/dashboard.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    TopHeaderComponent,
    StatCardComponent,
    RecentActivityComponent,
    TranslatePipe
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  stats: StatCard[] = [];
  activities: Activity[] = [];

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Cargar datos de dashboard sólo cuando se entra al módulo Dashboard
    // (evita llamadas 403 para usuarios sin permiso cuando navegan
    // a otros módulos como Equipo-Tarjetas).
    this.dashboardService.loadDashboardData();

    this.dashboardService.getDashboardData().subscribe((data) => {
      if (data) {
        this.stats = [...data.stats];
        this.activities = [...data.activities];
      } else {
        this.stats = [];
        this.activities = [];
      }
      this.cdr.markForCheck();
    });
  }

}
