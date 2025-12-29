import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TopHeaderComponent } from '../../shared/components/top-header/top-header';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card';
import { PieChartComponent } from './components/pie-chart/pie-chart.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { StatCard } from '../../shared/models/dashboard.model';
import { AnalisisService } from '../../core/services/analisis.service';
import { AnalisisCompleto } from '../../shared/models/analisis.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-analisis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    TopHeaderComponent,
    StatCardComponent,
    PieChartComponent,
    BarChartComponent,
    LineChartComponent,
    DatePickerModule,
    ButtonModule,
    ChipModule,
    TranslatePipe
  ],
  templateUrl: './analisis.html',
  styleUrl: './analisis.scss'
})
export class AnalisisComponent implements OnInit {
  stats: StatCard[] = [];
  analisis: AnalisisCompleto | null = null;

  // Rango de fechas actual del análisis (ISO yyyy-MM-dd)
  fechaDesde: string | null = null;
  fechaHasta: string | null = null;

  // Objetos Date para el filtro visual
  fechaDesdeDate: Date | null = null;
  fechaHastaDate: Date | null = null;
  today: Date = new Date();
  isDesdeFocused = false;
  isHastaFocused = false;

  periodoSeleccionado: 'dia' | 'semana' | 'mes' = 'mes';

  maxTotalProveedoresMonto = 0;

  constructor(
    private analisisService: AnalisisService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setDefaultMonthRange();
    this.loadAnalisis();
  }

  private setDefaultMonthRange(): void {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.periodoSeleccionado = 'mes';
    this.fechaDesdeDate = start;
    this.fechaHastaDate = end;
    this.fechaDesde = start.toISOString().slice(0, 10);
    this.fechaHasta = end.toISOString().slice(0, 10);
  }

  private loadAnalisis(): void {
    this.analisisService
      .getAnalisisCompleto(this.fechaDesde ?? undefined, this.fechaHasta ?? undefined)
      .subscribe((data) => {
        this.analisis = data;
        this.buildStatsFromAnalisis();
        this.updateTopProveedoresMetrics();
        this.cdr.detectChanges();
      });
  }

  private buildStatsFromAnalisis(): void {
    if (!this.analisis || !this.analisis.comparativo_medios) {
      this.stats = [];
      return;
    }

    const comparativo = this.analisis.comparativo_medios;

    this.stats = [
      {
        id: 'analisis-total-tarjetas',
        title: 'totalTarjetas',
        value: comparativo.total_tarjetas,
        icon: 'pi pi-credit-card',
        color: '#2d7a7a',
        trendDirection: 'up'
      },
      {
        id: 'analisis-total-cuentas-bancarias',
        title: 'totalCuentasBancarias',
        value: comparativo.total_cuentas_bancarias,
        icon: 'pi pi-wallet',
        color: '#2d7a7a',
        trendDirection: 'up'
      }
    ];
  }

  private updateTopProveedoresMetrics(): void {
    const lista = this.analisis?.top_proveedores || [];
    this.maxTotalProveedoresMonto = lista.reduce(
      (max, item) => Math.max(max, item.total_acumulado || 0),
      0
    );
  }

  aplicarFiltro(): void {
    const desde = this.fechaDesdeDate ? this.normalizarDia(this.fechaDesdeDate) : null;
    const hasta = this.fechaHastaDate ? this.normalizarDia(this.fechaHastaDate) : null;

    if (!desde || !hasta) {
      return;
    }

    let inicio = desde;
    let fin = hasta;

    if (inicio.getTime() > fin.getTime()) {
      [inicio, fin] = [fin, inicio];
      this.fechaDesdeDate = inicio;
      this.fechaHastaDate = fin;
    }

    this.fechaDesde = this.formatearFecha(inicio);
    this.fechaHasta = this.formatearFecha(fin);

    this.loadAnalisis();
  }

  limpiarFiltros(): void {
    this.setDefaultMonthRange();
    this.loadAnalisis();
  }

  get puedeAplicarFiltro(): boolean {
    return !!this.fechaDesdeDate && !!this.fechaHastaDate;
  }

  get filtroActivo(): boolean {
    return !!this.fechaDesde || !!this.fechaHasta;
  }

  setFocusedInput(tipo: 'desde' | 'hasta', value: boolean): void {
    if (tipo === 'desde') {
      this.isDesdeFocused = value;
    } else {
      this.isHastaFocused = value;
    }
  }

  setPeriodo(tipo: 'dia' | 'semana' | 'mes'): void {
    const hoy = new Date();

    if (tipo === 'dia') {
      const dia = this.normalizarDia(hoy);
      this.periodoSeleccionado = 'dia';
      this.fechaDesdeDate = dia;
      this.fechaHastaDate = dia;
      this.fechaDesde = this.formatearFecha(dia);
      this.fechaHasta = this.formatearFecha(dia);
      this.loadAnalisis();
      return;
    }

    if (tipo === 'semana') {
      const fin = this.normalizarDia(hoy);
      const inicio = new Date(fin);
      inicio.setDate(fin.getDate() - 6);

      this.periodoSeleccionado = 'semana';
      this.fechaDesdeDate = inicio;
      this.fechaHastaDate = fin;
      this.fechaDesde = this.formatearFecha(inicio);
      this.fechaHasta = this.formatearFecha(fin);
      this.loadAnalisis();
      return;
    }

    // Mes actual
    this.periodoSeleccionado = 'mes';
    this.setDefaultMonthRange();
    this.loadAnalisis();
  }

  private normalizarDia(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  exportExcel(): void {
    if (!this.analisis) {
      return;
    }

    const csv = this.buildCsvFromAnalisis();
    const nombre = `analisis-${this.fechaDesde ?? 'inicio'}_${
      this.fechaHasta ?? 'fin'
    }-excel.csv`;
    this.descargarArchivo(csv, nombre, 'text/csv;charset=utf-8;');
  }

  exportCSV(): void {
    if (!this.analisis) {
      return;
    }

    const csv = this.buildCsvFromAnalisis();
    const nombre = `analisis-${this.fechaDesde ?? 'inicio'}_${this.fechaHasta ?? 'fin'}.csv`;
    this.descargarArchivo(csv, nombre, 'text/csv;charset=utf-8;');
  }

  exportPDF(): void {
    if (!this.analisis || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const charts = this.captureChartImages();
    const contenido = this.buildPrintableHtml(charts);
    const ventana = window.open('', '_blank', 'width=1024,height=768');
    if (!ventana) {
      return;
    }

    ventana.document.open();
    ventana.document.write(
      '<html><head><title>Reporte de Análisis</title></head><body>' +
        contenido +
        '</body></html>'
    );
    ventana.document.close();
    ventana.focus();
    ventana.print();
  }

  exportJSON(): void {
    if (!this.analisis) {
      return;
    }

    const payload = {
      rango: {
        fechaDesde: this.fechaDesde,
        fechaHasta: this.fechaHasta
      },
      analisis: this.analisis
    };

    const nombre = `analisis-${this.fechaDesde ?? 'inicio'}_${this.fechaHasta ?? 'fin'}.json`;
    this.descargarArchivo(
      JSON.stringify(payload, null, 2),
      nombre,
      'application/json;charset=utf-8;'
    );
  }

  private descargarArchivo(contenido: string, nombreArchivo: string, tipoMime: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const blob = new Blob([contenido], { type: tipoMime });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private buildCsvFromAnalisis(): string {
    if (!this.analisis) {
      return '';
    }

    const partes: string[] = [];

    if (this.analisis.comparativo_medios) {
      const c = this.analisis.comparativo_medios;
      partes.push('Comparativo medios');
      partes.push('tipo,valor');
      partes.push(`tarjetas,${c.total_tarjetas}`);
      partes.push(`cuentas_bancarias,${c.total_cuentas_bancarias}`);
      partes.push('');
    }

    if (this.analisis.temporal_pagos?.length) {
      partes.push('Temporal pagos');
      partes.push('fecha,total_monto');
      this.analisis.temporal_pagos.forEach((p) => {
        partes.push(`${p.fecha},${p.total_monto}`);
      });
      partes.push('');
    }

    if (this.analisis.distribucion_emails?.length) {
      partes.push('Distribucion emails');
      partes.push('estado,cantidad');
      this.analisis.distribucion_emails.forEach((d) => {
        partes.push(`${this.escapeCsv(d.estado)},${d.cantidad}`);
      });
      partes.push('');
    }

    if (this.analisis.top_proveedores?.length) {
      partes.push('Top proveedores');
      partes.push('proveedor,numero_pagos,total_acumulado,ultimo_pago');
      this.analisis.top_proveedores.forEach((p) => {
        partes.push(
          `${this.escapeCsv(p.proveedor)},${p.numero_pagos},${p.total_acumulado},${p.ultimo_pago}`
        );
      });
      partes.push('');
    }

    return partes.join('\n');
  }

  private escapeCsv(valor: string | number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '';
    }
    const str = String(valor);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  private buildPrintableHtml(charts: { pie?: string; bar?: string; line?: string }): string {
    if (!this.analisis) {
      return '<p>No hay datos de análisis para el rango seleccionado.</p>';
    }

    const rango = `${this.fechaDesde ?? ''} → ${this.fechaHasta ?? ''}`;
    const c = this.analisis.comparativo_medios;

    const filasProveedores = (this.analisis.top_proveedores || [])
      .map(
        (p) =>
          `<tr><td>${this.escapeCsv(p.proveedor)}</td><td>${p.numero_pagos}</td><td>${p.total_acumulado}</td><td>${p.ultimo_pago}</td></tr>`
      )
      .join('');

    const seccionComparativo = c
      ? `<h2>Comparativo medios</h2><ul><li>Total tarjetas: ${c.total_tarjetas}</li><li>Total cuentas bancarias: ${c.total_cuentas_bancarias}</li></ul>`
      : '';

    const seccionProveedores = this.analisis.top_proveedores?.length
      ? `<h2>Top proveedores</h2><table><thead><tr><th>Proveedor</th><th>N° pagos</th><th>Total acumulado</th><th>Último pago</th></tr></thead><tbody>${filasProveedores}</tbody></table>`
      : '';

    const chartsHtmlParts: string[] = [];

    if (charts.pie) {
      chartsHtmlParts.push(
        `<div class="card"><h2>Distribución de emails automáticos</h2><img src="${charts.pie}" alt="Gráfico de torta - distribución de emails" /></div>`
      );
    }

    if (charts.bar) {
      chartsHtmlParts.push(
        `<div class="card"><h2>Comparativo medios de pago</h2><img src="${charts.bar}" alt="Gráfico de barras - comparativo medios" /></div>`
      );
    }

    if (charts.line) {
      chartsHtmlParts.push(
        `<div class="card"><h2>Línea temporal de pagos</h2><img src="${charts.line}" alt="Gráfico de línea - temporal pagos" /></div>`
      );
    }

    return `
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0;
          padding: 24px;
          background: #f5f5f5;
          color: #111827;
        }
        .report-root {
          max-width: 1024px;
          margin: 0 auto;
        }
        .report-header {
          margin-bottom: 16px;
        }
        .report-title {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .report-subtitle {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
        }
        .report-meta {
          margin: 16px 0;
          font-size: 13px;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }
        .card {
          background: #ffffff;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .card h2 {
          margin: 0 0 8px;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }
        .card img {
          width: 100%;
          height: auto;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .section {
          background: #ffffff;
          border-radius: 8px;
          padding: 16px 18px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          margin-top: 12px;
          page-break-inside: avoid;
        }
        .section h2 {
          margin: 0 0 8px;
          font-size: 15px;
          font-weight: 600;
        }
        .section ul {
          margin: 4px 0 0 18px;
          padding: 0;
          font-size: 13px;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 6px 8px;
          text-align: left;
        }
        thead th {
          background: #f3f4f6;
          font-weight: 600;
        }
        tbody tr:nth-child(even) {
          background: #f9fafb;
        }
        .footer {
          margin-top: 16px;
          font-size: 11px;
          color: #9ca3af;
          text-align: right;
        }
      </style>
      <div class="report-root">
        <div class="report-header">
          <p class="report-subtitle">${new Date().toLocaleDateString()} · Reporte de Análisis</p>
          <h1 class="report-title">Reporte de Análisis</h1>
        </div>
        <div class="report-meta">
          <strong>Rango:</strong> ${rango}
        </div>
        <div class="cards-grid">
          ${chartsHtmlParts.join('')}
        </div>
        <div class="section">
          ${seccionComparativo}
        </div>
        <div class="section">
          ${seccionProveedores}
        </div>
        <div class="footer">
          Terra Canada · Generado automáticamente
        </div>
      </div>
    `;
  }

  private captureChartImages(): {
    pie?: string;
    bar?: string;
    line?: string;
  } {
    const result: { pie?: string; bar?: string; line?: string } = {};

    if (typeof document === 'undefined') {
      return result;
    }

    const pieCanvas = document.querySelector('app-pie-chart canvas') as
      | HTMLCanvasElement
      | null;
    const barCanvas = document.querySelector('app-bar-chart canvas') as
      | HTMLCanvasElement
      | null;
    const lineCanvas = document.querySelector('app-line-chart canvas') as
      | HTMLCanvasElement
      | null;

    try {
      if (pieCanvas) {
        result.pie = pieCanvas.toDataURL('image/png');
      }
      if (barCanvas) {
        result.bar = barCanvas.toDataURL('image/png');
      }
      if (lineCanvas) {
        result.line = lineCanvas.toDataURL('image/png');
      }
    } catch {
      // Si ocurre un error al leer los canvas, ignoramos y seguimos con secciones de datos.
    }

    return result;
  }
}
