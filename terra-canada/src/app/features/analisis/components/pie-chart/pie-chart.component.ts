import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AnalisisDistribucionEmailEstado } from '../../../../shared/models/analisis.model';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss'
})
export class PieChartComponent implements OnInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  @Input() set distribucion(value: AnalisisDistribucionEmailEstado[] | null) {
    this._distribucion = value ?? [];
    this.updateChartDataFromDistribucion();
  }

  private _distribucion: AnalisisDistribucionEmailEstado[] = [];
  legendItems: { label: string; color: string }[] = [];

  private readonly palette = ['#2d7a7a', '#5a9b9b', '#8bb5b5', '#b8dedd', '#dcefee'];

  chartData = {
    labels: [] as string[],
    datasets: [
      {
        data: [] as number[],
        backgroundColor: [] as string[],
        borderColor: [] as string[],
        borderWidth: 2
      }
    ]
  };

  ngOnInit(): void {
    this.initChart();
  }

  private initChart(): void {
    // Chart will be initialized using canvas API
    setTimeout(() => {
      this.drawPieChart();
    }, 100);
  }

  private drawPieChart(): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;

    const data = this.chartData.datasets[0].data;
    const total = data.reduce((a, b) => a + b, 0);
    const colors = this.chartData.datasets[0].backgroundColor;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!total || !data.length) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Sin datos para mostrar', centerX, centerY);
      return;
    }

    let currentAngle = -Math.PI / 2;

    // Draw pie slices
    data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${value}`, labelX, labelY);

      currentAngle += sliceAngle;
    });
  }

  refreshChart(): void {
    this.drawPieChart();
  }

  private updateChartDataFromDistribucion(): void {
    if (!this._distribucion.length) {
      this.chartData.labels = [];
      this.chartData.datasets[0].data = [];
      this.chartData.datasets[0].backgroundColor = [];
      this.chartData.datasets[0].borderColor = [];
      this.legendItems = [];
      if (this.chartCanvas?.nativeElement) {
        this.drawPieChart();
      }
      return;
    }

    const estadosOrder = ['ENVIADO', 'FALLIDO', 'EN_COLA'];
    const labels: string[] = [];
    const data: number[] = [];

    estadosOrder.forEach((estado) => {
      const item = this._distribucion.find((d) => d.estado?.toUpperCase() === estado);
      if (item) {
        labels.push(estado);
        data.push(item.cantidad);
      }
    });

    // Agregar cualquier otro estado adicional
    this._distribucion.forEach((item) => {
      const key = (item.estado || '').toString();
      if (!labels.includes(key)) {
        labels.push(key);
        data.push(item.cantidad);
      }
    });

    if (!labels.length) {
      return;
    }

    this.chartData.labels = labels;
    this.chartData.datasets[0].data = data;
    this.chartData.datasets[0].backgroundColor = labels.map(
      (_, idx) => this.palette[idx % this.palette.length]
    );
    this.chartData.datasets[0].borderColor = labels.map(() => '#ffffff');

    this.legendItems = labels.map((label, idx) => ({
      label: `${label}: ${data[idx]}`,
      color: this.chartData.datasets[0].backgroundColor[idx] as string
    }));

    // Redibujar si el canvas ya está listo
    if (this.chartCanvas?.nativeElement) {
      this.drawPieChart();
    }
  }
}
