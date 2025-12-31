import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PaginatedTableComponent, TableColumn, RowAction, ActionEvent } from '../../../../shared/components/paginated-table';
import { PagoBancarioService, PagoBancario } from '../../../../core/services/pago-bancario.service';
import { PaymentFormComponent } from '../payment-form/payment-form.component';
import { DatePickerModule } from 'primeng/datepicker';

export interface BancaryPaymentRecord {
  id: number;
  date: string;
  clienteNombre: string;
  proveedorNombre: string;
  cuentaNumero: string;
  amount: number;
  user: string;
  status: 'A PAGAR' | 'PAGADO';
  verification: boolean;
  code: string;
  enviado_correo?: boolean;
}

@Component({
  selector: 'app-bancary-payment-records',
  standalone: true,
  imports: [CommonModule, TranslatePipe, PaginatedTableComponent, PaymentFormComponent, DatePickerModule],
  templateUrl: './bancary-payment-records.component.html',
  styleUrl: './bancary-payment-records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BancaryPaymentRecordsComponent implements OnInit {
  registros: BancaryPaymentRecord[] = [];
  showPaymentModal = false;
  // Filtros
  dateFilter: string = '';
  statusFilter: 'todos' | 'A PAGAR' | 'PAGADO' = 'todos';
  verificationFilter: 'todos' | 'verificados' | 'no-verificados' = 'todos';
  filteredRegistros: BancaryPaymentRecord[] = [];
  searchTerm: string = '';
  filterTab: 'todos' | 'pendientes' | 'pagados' = 'todos';

  // Confirmación de eliminación
  showConfirmDelete = false;
  registroToDelete: BancaryPaymentRecord | null = null;

  // Configuración de tabla genérica
  columns: TableColumn[] = [
    {
      key: 'date',
      label: 'Fecha',
      type: 'date',
      width: '100px'
    },
    {
      key: 'clienteNombre',
      label: 'Cliente',
      type: 'text',
      width: '150px'
    },
    {
      key: 'proveedorNombre',
      label: 'Proveedor',
      type: 'text',
      width: '150px'
    },
    {
      key: 'amount',
      label: 'Monto',
      type: 'currency',
      width: '100px'
    },
    {
      key: 'code',
      label: 'NºPresta',
      type: 'text',
      width: '120px'
    },
    {
      key: 'cuentaNumero',
      label: 'Cuenta',
      type: 'text',
      width: '150px'
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      width: '100px',
      badgeClass: (value) => this.getStatusClass(value)
    },
    {
      key: 'verification',
      label: 'Verificación',
      type: 'badge',
      width: '100px',
      formatter: (value) => value === true ? 'Sí' : 'No',
      badgeClass: (value) => value === true ? 'verified' : 'not-verified'
    },
    {
      key: 'enviado_correo',
      label: 'Correo',
      type: 'custom',
      width: '90px'
    },
    {
      key: 'user',
      label: 'Usuario',
      type: 'text',
      width: '120px'
    }
  ];

  actions: RowAction[] = [
    {
      id: 'view',
      label: 'Ver',
      icon: 'pi pi-eye',
      class: 'view-btn'
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: 'pi pi-pencil',
      class: 'edit-btn',
      disabled: (row) => !!row.verification
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'pi pi-trash',
      class: 'delete-btn',
      disabled: (row) => row?.status?.toUpperCase() === 'PAGADO' || !!row.verification
    }
  ];

  @Output() onEdit = new EventEmitter<any>();
  @Output() onView = new EventEmitter<any>();

  constructor(
    private cdr: ChangeDetectorRef,
    private pagoBancarioService: PagoBancarioService
  ) {}

  ngOnInit(): void {
    this.loadPagoBancarios();
  }

  /**
   * Cargar pagos bancarios desde el servicio
   */
  loadPagoBancarios(): void {
    this.pagoBancarioService.getAll('todos', 'todos').subscribe({
      next: (response) => {
        if (response.data && Array.isArray(response.data)) {
          this.registros = this.mapPagoBancarioToRecords(response.data);
          this.applyFilters();
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('Error cargando pagos bancarios:', error);
      }
    });
  }

  /**
   * Mapear datos de PagoBancario a BancaryPaymentRecord
   */
  private mapPagoBancarioToRecords(pagos: PagoBancario[]): BancaryPaymentRecord[] {
    return pagos.map((pago) => ({
      id: pago.id,
      date: new Date(pago.fecha_creacion).toISOString().split('T')[0],
      clienteNombre: pago.cliente?.nombre || 'N/A',
      proveedorNombre: pago.proveedor?.nombre || 'N/A',
      cuentaNumero: pago.cuenta_bancaria?.numero_cuenta || 'N/A',
      amount: pago.monto,
      user: pago.registrado_por?.nombre_completo || 'N/A',
      status: pago.estado as 'A PAGAR' | 'PAGADO',
      verification: pago.esta_verificado,
      code: pago.numero_presta,
      enviado_correo: !!pago.enviado_correo
    }));
  }

  /**
   * Maneja eventos de acciones de la tabla genérica
   */
  onTableAction(event: ActionEvent): void {
    console.log('BancaryPaymentRecordsComponent - Acción:', event.action, 'Registro:', event.row);
    
    switch (event.action) {
      case 'view':
        this.onViewRegistro(event.row);
        break;
      case 'edit':
        this.onEditRegistro(event.row);
        break;
      case 'delete':
        this.openDeleteModal(event.row);
        break;
    }
  }

  onViewRegistro(registro: BancaryPaymentRecord): void {
    console.log('BancaryPaymentRecordsComponent - Ver registro:', registro);
    this.onView.emit(registro);
  }

  onEditRegistro(registro: BancaryPaymentRecord): void {
    console.log('BancaryPaymentRecordsComponent - Editar registro:', registro);
    this.onEdit.emit(registro);
  }

  openDeleteModal(registro: BancaryPaymentRecord): void {
    this.registroToDelete = registro;
    this.showConfirmDelete = true;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (!this.registroToDelete) return;
    const id = this.registroToDelete.id;
    this.pagoBancarioService.delete(id).subscribe({
      next: () => {
        this.showConfirmDelete = false;
        this.registroToDelete = null;
        this.loadPagoBancarios();
      },
      error: (error) => {
        console.error('Error eliminando registro:', error);
      }
    });
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.registroToDelete = null;
  }

  /**
   * Abrir modal para nuevo pago
   */
  openNewPaymentModal(): void {
    this.showPaymentModal = true;
    this.cdr.markForCheck();
  }

  /**
   * Cerrar modal de pago
   */
  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.cdr.markForCheck();
  }

  /**
   * Manejar envío del formulario de pago
   */
  onPaymentFormSubmit(event: any): void {
    console.log('Pago creado exitosamente:', event);
    this.closePaymentModal();
    this.loadPagoBancarios();
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PAGADO':
        return 'status-aprobado';
      case 'A PAGAR':
        return 'status-pendiente';
      default:
        return 'status-pendiente';
    }
  }

  // Filtros
  applyFilters(): void {
    let data = [...this.registros];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      data = data.filter(r =>
        (r.date || '').toLowerCase().includes(term) ||
        (r.clienteNombre || '').toLowerCase().includes(term) ||
        (r.proveedorNombre || '').toLowerCase().includes(term) ||
        (r.cuentaNumero || '').toLowerCase().includes(term) ||
        (r.user || '').toLowerCase().includes(term) ||
        (r.code || '').toLowerCase().includes(term)
      );
    }

    if (this.dateFilter) {
      data = data.filter(r => (r.date || '').startsWith(this.dateFilter));
    }

    if (this.statusFilter !== 'todos') {
      data = data.filter(r => r.status === this.statusFilter);
    }

    if (this.verificationFilter === 'verificados') {
      data = data.filter(r => !!r.verification);
    } else if (this.verificationFilter === 'no-verificados') {
      data = data.filter(r => !r.verification);
    }

    this.filteredRegistros = data;
  }

  onSearchChange(value: string): void {
    this.searchTerm = (value || '').toLowerCase();
    this.applyFilters();
  }

  onDateChange(value: any): void {
    const v = value instanceof Date ? value.toISOString().slice(0, 10) : (value || '');
    this.dateFilter = v;
    this.applyFilters();
  }

  onStatusFilterChange(value: 'todos' | 'A PAGAR' | 'PAGADO'): void {
    this.statusFilter = value;
    this.applyFilters();
  }

  onVerificationFilterChange(value: 'todos' | 'verificados' | 'no-verificados'): void {
    this.verificationFilter = value;
    this.applyFilters();
  }

  setVerificationFilter(value: 'todos' | 'verificados' | 'no-verificados'): void {
    this.verificationFilter = value;
    this.applyFilters();
  }

  setFilterTab(tab: 'todos' | 'pendientes' | 'pagados'): void {
    this.filterTab = tab;
    if (tab === 'todos') this.statusFilter = 'todos';
    if (tab === 'pendientes') this.statusFilter = 'A PAGAR';
    if (tab === 'pagados') this.statusFilter = 'PAGADO';
    this.applyFilters();
  }
}
