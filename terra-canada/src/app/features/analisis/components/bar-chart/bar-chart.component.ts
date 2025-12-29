import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AnalisisComparativoMedios } from '../../../../shared/models/analisis.model';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss'
})
export class BarChartComponent implements OnInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;

  @Input() set comparativo(value: AnalisisComparativoMedios | null) {
    this._comparativo = value;
    this.updateChartDataFromComparativo();
  }

  private _comparativo: AnalisisComparativoMedios | null = null;
  legendItems: { label: string; color: string }[] = [];

  private readonly palette = ['#2d7a7a', '#5a9b9b'];

  chartData = {
    labels: [] as string[],
    values: [] as number[],
    colors: [] as string[]
  };

  ngOnInit(): void {
    this.initChart();
  }

  private initChart(): void {
    setTimeout(() => {
      this.drawBarChart();
    }, 100);
  }

  private drawBarChart(): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear and draw background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const gridLines = 5;
    const maxValue = this.chartData.values.length
      ? Math.max(...this.chartData.values) * 1.1
      : 1;

    if (!this.chartData.values.length || maxValue === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Sin datos para mostrar', width / 2, height / 2);
      return;
    }

    // Grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    const barWidth = chartWidth / (this.chartData.labels.length * 1.8);
    const spacing = chartWidth / this.chartData.labels.length;

    this.chartData.labels.forEach((label, index) => {
      const value = this.chartData.values[index];
      const barHeight = (value / maxValue) * chartHeight;
      const barX = padding + spacing * index + spacing / 2 - barWidth / 2;
      const barY = height - padding - barHeight;

      ctx.fillStyle = this.chartData.colors[index] ?? '#2d7a7a';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Value label
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${value}`, barX + barWidth / 2, barY - 8);

      // Category label
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.fillText(label, barX + barWidth / 2, height - padding + 18);
    });

    // Y axis labels
    ctx.fillStyle = '#666666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridLines; i++) {
      const value = Math.round((maxValue / gridLines) * i);
      const y = height - padding - (chartHeight / gridLines) * i;
      ctx.fillText(`${value}`, padding - 10, y + 4);
    }
  }

  refreshChart(): void {
    this.drawBarChart();
  }

  private updateChartDataFromComparativo(): void {
    if (!this._comparativo) {
      this.chartData = { labels: [], values: [], colors: [] };
      this.legendItems = [];
      if (this.chartCanvas?.nativeElement) {
        this.drawBarChart();
      }
      return;
    }

    const etiquetas = ['Tarjetas', 'Cuentas bancarias'];
    const valores = [
      this._comparativo.total_tarjetas ?? 0,
      this._comparativo.total_cuentas_bancarias ?? 0
    ];
    const colores = etiquetas.map((_, idx) => this.palette[idx % this.palette.length]);

    this.chartData = {
      labels: etiquetas,
      values: valores,
      colors: colores
    };

    this.legendItems = etiquetas.map((label, idx) => ({
      label: `${label}: ${valores[idx]}`,
      color: colores[idx]
    }));

    if (this.chartCanvas?.nativeElement) {
      this.drawBarChart();
    }
  }
}
