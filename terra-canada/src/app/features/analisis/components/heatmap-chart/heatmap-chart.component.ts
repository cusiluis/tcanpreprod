import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-heatmap-chart',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './heatmap-chart.component.html',
  styleUrl: './heatmap-chart.component.scss'
})
export class HeatmapChartComponent implements OnInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;

  heatmapData = [
    { hour: 0, activity: 1.2 },
    { hour: 2, activity: 0.8 },
    { hour: 4, activity: 0.5 },
    { hour: 6, activity: 2.1 },
    { hour: 8, activity: 4.5 },
    { hour: 10, activity: 6.2 },
    { hour: 12, activity: 5.8 },
    { hour: 14, activity: 7.1 },
    { hour: 16, activity: 6.5 },
    { hour: 18, activity: 5.3 },
    { hour: 20, activity: 4.2 },
    { hour: 22, activity: 2.8 }
  ];

  ngOnInit(): void {
    this.initChart();
  }

  private initChart(): void {
    setTimeout(() => {
      this.drawHeatmap();
    }, 100);
  }

  private drawHeatmap(): void {
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

    // Draw axes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw bubbles
    const maxActivity = 7.5;
    const spacing = chartWidth / (this.heatmapData.length - 1);

    this.heatmapData.forEach((data, index) => {
      const x = padding + spacing * index;
      const y = height - padding - (data.activity / maxActivity) * chartHeight;
      const radius = (data.activity / maxActivity) * 25;

      // Draw bubble
      const intensity = data.activity / maxActivity;
      const hue = 180 - intensity * 60; // From teal to lighter
      ctx.fillStyle = `hsla(${hue}, 60%, 50%, 0.6)`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#2d7a7a';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw labels
    ctx.fillStyle = '#666666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    this.heatmapData.forEach((data, index) => {
      const x = padding + spacing * index;
      ctx.fillText(`${data.hour}h`, x, height - padding + 20);
    });

    // Draw Y-axis label
    ctx.textAlign = 'right';
    ctx.fillText('Actividad por Hora', padding - 10, padding - 10);
  }

  refreshChart(): void {
    this.drawHeatmap();
  }
}
