import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Interfaz para configurar columnas de la tabla
 */
export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'currency' | 'badge' | 'custom';
  width?: string;
  sortable?: boolean;
  formatter?: (value: any, row?: any) => string;
  badgeClass?: (value: any) => string;
}

/**
 * Interfaz para acciones de fila
 */
export interface RowAction {
  id: string;
  label: string;
  icon: string;
  class: string;
  disabled?: (row: any) => boolean;
}

/**
 * Interfaz para evento de acción
 */
export interface ActionEvent {
  action: string;
  row: any;
}

@Component({
  selector: 'app-paginated-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginated-table.component.html',
  styleUrl: './paginated-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginatedTableComponent implements OnInit {
  /**
   * Datos completos a paginar
   */
  @Input() data: any[] = [];

  /**
   * Configuración de columnas
   */
  @Input() columns: TableColumn[] = [];

  /**
   * Acciones disponibles por fila
   */
  @Input() actions: RowAction[] = [];

  /**
   * Registros por página
   */
  @Input() itemsPerPage: number = 10;

  /**
   * Altura máxima del contenedor (px)
   */
  @Input() maxHeight: string = '600px';

  /**
   * Mostrar información de paginación
   */
  @Input() showPaginationInfo: boolean = true;

  /**
   * Evento cuando se ejecuta una acción
   */
  @Output() onAction = new EventEmitter<ActionEvent>();

  /**
   * Datos paginados a mostrar
   */
  dataPaginada: any[] = [];

  /**
   * Página actual
   */
  currentPage: number = 1;

  /**
   * Total de páginas
   */
  totalPages: number = 1;

  /**
   * Exponer Math para el template
   */
  Math = Math;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.calculatePagination();
  }

  ngOnChanges(): void {
    this.currentPage = 1;
    this.calculatePagination();
  }

  /**
   * Calcula la paginación
   */
  private calculatePagination(): void {
    this.totalPages = Math.ceil(this.data.length / this.itemsPerPage);
    this.updatePaginatedData();
  }

  /**
   * Actualiza los datos paginados
   */
  private updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.dataPaginada = this.data.slice(startIndex, endIndex);
    this.cdr.markForCheck();
  }

  /**
   * Navega a una página específica
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  /**
   * Siguiente página
   */
  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Página anterior
   */
  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Obtiene los números de página a mostrar
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Formatea el valor según el tipo de columna
   */
  formatValue(value: any, column: TableColumn, row: any): string {
    if (column.formatter) {
      return column.formatter(value, row);
    }

    switch (column.type) {
      case 'date':
        return value ? new Date(value).toLocaleDateString('es-ES') : 'N/A';
      case 'currency':
        return value ? `$${parseFloat(value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
      case 'text':
      default:
        return value || 'N/A';
    }
  }

  /**
   * Obtiene la clase para un badge
   */
  getBadgeClass(value: any, column: TableColumn): string {
    if (column.badgeClass) {
      return column.badgeClass(value);
    }
    return '';
  }

  isEmailSent(row: any, column: TableColumn): boolean {
    const value = row?.[column.key];
    return !!value;
  }

  /**
   * Emite evento de acción
   */
  executeAction(action: RowAction, row: any): void {
    this.onAction.emit({
      action: action.id,
      row: row
    });
  }

  /**
   * Verifica si una acción está deshabilitada
   */
  isActionDisabled(action: RowAction, row: any): boolean {
    return action.disabled ? action.disabled(row) : false;
  }
}
