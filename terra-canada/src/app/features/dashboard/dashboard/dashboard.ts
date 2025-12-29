import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
})
export class DashboardComponent implements OnInit {
  stats: StatCard[] = [];
  activities: Activity[] = [];

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dashboardService.getDashboardData().subscribe((data) => {
      if (data) {
        this.stats = data.stats;
        this.activities = data.activities;
        this.cdr.detectChanges();
      }
    });
  }

}
