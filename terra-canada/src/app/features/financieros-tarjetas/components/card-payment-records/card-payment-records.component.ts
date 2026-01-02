import { Component, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PagoService, Pago } from '../../../../core/services/pago.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PaginatedTableComponent, TableColumn, RowAction, ActionEvent } from '../../../../shared/components/paginated-table';
import { DatePickerModule } from 'primeng/datepicker';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-card-payment-records',
  standalone: true,
  imports: [CommonModule, TranslatePipe, PaginatedTableComponent, DatePickerModule],
  templateUrl: './card-payment-records.component.html',
  styleUrl: './card-payment-records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardPaymentRecordsComponent implements OnInit, OnDestroy {
  pagos: any[] = [];
  isLoading = false;
  errorMessage = '';

  // Filtros
  dateFilter: string = '';
  statusFilter: 'todos' | 'A PAGAR' | 'PAGADO' = 'todos';
  verificationFilter: 'todos' | 'verificados' | 'no-verificados' = 'todos';
  filteredPagos: any[] = [];
  searchTerm: string = '';
  filterTab: 'todos' | 'pendientes' | 'pagados' = 'todos';

  // Confirmación de eliminación (solo admin)
  showConfirmDelete = false;
  pagoToDelete: any | null = null;

  // Configuración de tabla genérica
  columns: TableColumn[] = [
    {
      key: 'fecha_creacion',
      label: 'Fecha',
      type: 'date',
      width: '100px'
    },
    {
      key: 'cliente.nombre',
      label: 'Cliente',
      type: 'text',
      width: '150px',
      formatter: (value, row) => row.cliente?.nombre || 'N/A'
    },
    {
      key: 'proveedor.nombre',
      label: 'Proveedor',
      type: 'text',
      width: '150px',
      formatter: (value, row) => row.proveedor?.nombre || 'N/A'
    },
    {
      key: 'monto',
      label: 'Monto',
      type: 'currency',
      width: '100px'
    },
    {
      key: 'numero_presta',
      label: 'N° Presta',
      type: 'text',
      width: '120px'
    },
    {
      key: 'tarjeta.numero_enmascarado',
      label: 'Tarjeta',
      type: 'text',
      width: '130px',
      formatter: (value, row) => row.tarjeta?.numero_enmascarado || 'N/A'
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      width: '100px',
      badgeClass: (value) => this.getStatusClass(value)
    },
    {
      key: 'esta_verificado',
      label: 'Verificación',
      type: 'badge',
      width: '100px',
      formatter: (value) => value ? 'Sí' : 'No',
      badgeClass: (value) => this.getVerificationClass(value)
    },
    {
      key: 'enviado_correo',
      label: 'Correo',
      type: 'custom',
      width: '90px'
    },
    {
      key: 'registrado_por.nombre_completo',
      label: 'Registrado por',
      type: 'text',
      width: '150px',
      formatter: (value, row) => row.registrado_por?.nombre_completo || 'N/A'
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
      disabled: (row) => !!row.esta_verificado
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'pi pi-trash',
      class: 'delete-btn',
      disabled: (row) => row?.estado?.toUpperCase() === 'PAGADO' || !!row.esta_verificado
    }
  ];

  private destroy$ = new Subject<void>();

  @Output() onEdit = new EventEmitter<any>();
  @Output() onView = new EventEmitter<any>();

  constructor(
    private pagoService: PagoService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.setupPagosSubscription();
    this.pagoService.cargarPagos();
  }

  private setupPagosSubscription(): void {
    console.log('CardPaymentRecordsComponent - Configurando suscripción a pagos');
    this.pagoService.pagos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (pagos: any[]) => {
          console.log('CardPaymentRecordsComponent - Pagos recibidos:', pagos);
          this.pagos = pagos;
          this.applyFilters();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        (error: any) => {
          console.error('Error cargando pagos:', error);
          this.errorMessage = 'Error al cargar los pagos';
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      );
  }

  /**
   * Maneja eventos de acciones de la tabla genérica
   */
  onTableAction(event: ActionEvent): void {
    console.log('CardPaymentRecordsComponent - Acción:', event.action, 'Pago:', event.row);
    
    switch (event.action) {
      case 'view':
        this.onViewPago(event.row);
        break;
      case 'edit':
        this.onEditPago(event.row);
        break;
      case 'delete':
        this.openDeleteModal(event.row);
        break;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onViewPago(pago: any): void {
    console.log('CardPaymentRecordsComponent - Ver pago:', pago);
    this.onView.emit(pago);
  }

  onEditPago(pago: any): void {
    console.log('CardPaymentRecordsComponent - Editar pago:', pago);
    this.onEdit.emit(pago);
  }

  openDeleteModal(pago: any): void {
    this.pagoToDelete = pago;
    this.showConfirmDelete = true;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (!this.pagoToDelete) return;
    const id = this.pagoToDelete.id || 0;
    this.pagoService.delete(id).subscribe({
      next: (response) => {
        this.notificationService.success('✅ Pago eliminado exitosamente');
        this.showConfirmDelete = false;
        this.pagoToDelete = null;
        setTimeout(() => this.pagoService.recargarPagos(), 300);
      },
      error: (error) => {
        console.error('Error eliminando pago:', error);
        this.notificationService.error(`❌ Error al eliminar pago: ${error.error?.error?.message || error.message || 'Error desconocido'}`);
      }
    });
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.pagoToDelete = null;
  }

  // Aplicar filtros
  applyFilters(): void {
    let data = [...this.pagos];

    if (this.dateFilter) {
      data = data.filter(r => (r.fecha_creacion || '').startsWith(this.dateFilter));
    }

    if (this.statusFilter !== 'todos') {
      data = data.filter(r => r.estado === this.statusFilter);
    }

    if (this.verificationFilter === 'verificados') {
      data = data.filter(r => !!r.esta_verificado);
    } else if (this.verificationFilter === 'no-verificados') {
      data = data.filter(r => !r.esta_verificado);
    }

    // Filtro por búsqueda libre
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      data = data.filter((r) =>
        (r.fecha_creacion || '').toLowerCase().includes(term) ||
        (r.cliente?.nombre || '').toLowerCase().includes(term) ||
        (r.proveedor?.nombre || '').toLowerCase().includes(term) ||
        (r.numero_presta || '').toLowerCase().includes(term) ||
        (r.registrado_por?.nombre_completo || '').toLowerCase().includes(term)
      );
    }

    this.filteredPagos = data;
    this.cdr.markForCheck();
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

  // Filtros con diseño de Equipo-Tarjetas
  onSearchChange(value: string): void {
    this.searchTerm = (value || '').toLowerCase();
    this.applyFilters();
  }

  setFilterTab(tab: 'todos' | 'pendientes' | 'pagados'): void {
    this.filterTab = tab;
    if (tab === 'todos') this.statusFilter = 'todos';
    if (tab === 'pendientes') this.statusFilter = 'A PAGAR';
    if (tab === 'pagados') this.statusFilter = 'PAGADO';
    this.applyFilters();
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

  getVerificationClass(verified: boolean): string {
    return verified ? 'verified' : 'not-verified';
  }
}
