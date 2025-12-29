import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-funnel-chart',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './funnel-chart.component.html',
  styleUrl: './funnel-chart.component.scss'
})
export class FunnelChartComponent implements OnInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;

  funnelData = [
    { label: 'Visitantes', value: 10000, percentage: 100 },
    { label: 'Registros', value: 7500, percentage: 75 },
    { label: 'Compras', value: 3750, percentage: 37.5 }
  ];

  ngOnInit(): void {
    this.initChart();
  }

  private initChart(): void {
    setTimeout(() => {
      this.drawFunnel();
    }, 100);
  }

  private drawFunnel(): void {
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

    // Draw funnel
    const barHeight = chartHeight / this.funnelData.length;
    const maxWidth = chartWidth * 0.8;

    this.funnelData.forEach((data, index) => {
      const y = padding + barHeight * index;
      const barWidth = maxWidth * (data.percentage / 100);
      const x = padding + (chartWidth - barWidth) / 2;

      // Draw bar
      ctx.fillStyle = '#2d7a7a';
      ctx.globalAlpha = 1 - index * 0.2;
      ctx.fillRect(x, y, barWidth, barHeight - 10);
      ctx.globalAlpha = 1;

      // Draw label and value
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(data.label, padding + 10, y + barHeight / 2 + 5);

      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${data.percentage}%`, width - padding - 10, y + barHeight / 2 + 5);
    });
  }

  refreshChart(): void {
    this.drawFunnel();
  }
}
