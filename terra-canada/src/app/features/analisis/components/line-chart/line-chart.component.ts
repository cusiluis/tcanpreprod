import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AnalisisTemporalPagoDia } from '../../../../shared/models/analisis.model';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss'
})
export class LineChartComponent implements OnInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  @Input() set temporal(value: AnalisisTemporalPagoDia[] | null) {
    this._temporal = value ?? [];
    this.updateChartData();
  }

  private _temporal: AnalisisTemporalPagoDia[] = [];

  private chartLabels: string[] = [];
  private chartValues: number[] = [];

  private readonly strokeColor = '#2d7a7a';
  private readonly fillColor = 'rgba(45, 122, 122, 0.1)';

  private maxValue = 0;

  ngOnInit(): void {
    this.initChart();
  }

  private initChart(): void {
    setTimeout(() => {
      this.drawLineChart();
    }, 100);
  }

  private drawLineChart(): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (!this.chartLabels.length || !this.chartValues.length) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Sin datos para mostrar', width / 2, height / 2);
      return;
    }

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    const spacing = chartWidth / Math.max(this.chartLabels.length - 1, 1);

    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    this.chartValues.forEach((value, index) => {
      const x = padding + spacing * index;
      const y = height - padding - (value / this.maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = this.strokeColor;
    this.chartValues.forEach((value, index) => {
      const x = padding + spacing * index;
      const y = height - padding - (value / this.maxValue) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Fill area
    ctx.fillStyle = this.fillColor;
    ctx.lineTo(padding + spacing * (this.chartValues.length - 1), height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw labels
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    this.chartLabels.forEach((label, index) => {
      const x = padding + spacing * index;
      ctx.fillText(label, x, height - padding + 20);
    });

    // Draw Y-axis labels
    ctx.textAlign = 'right';
    ctx.font = '11px Arial';
    for (let i = 0; i <= gridLines; i++) {
      const value = Math.round((this.maxValue / gridLines) * i);
      const y = height - padding - (chartHeight / gridLines) * i;
      ctx.fillText(`${value}`, padding - 10, y + 4);
    }
  }

  refreshChart(): void {
    this.drawLineChart();
  }

  private updateChartData(): void {
    if (!this._temporal.length) {
      this.chartLabels = [];
      this.chartValues = [];
      this.maxValue = 0;
      if (this.chartCanvas?.nativeElement) {
        this.drawLineChart();
      }
      return;
    }

    this.chartLabels = this._temporal.map((p) => p.fecha.slice(5));
    this.chartValues = this._temporal.map((p) => p.total_monto);
    const max = Math.max(...this.chartValues, 1);
    this.maxValue = max * 1.1;

    if (this.chartCanvas?.nativeElement) {
      this.drawLineChart();
    }
  }
}
