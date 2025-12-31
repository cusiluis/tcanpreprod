import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PagoService, PagoDisplay } from '../../../../core/services/pago.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-payment-records',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './payment-records.component.html',
  styleUrl: './payment-records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentRecordsComponent implements OnInit, OnDestroy {
  @Output() onEdit = new EventEmitter<PagoDisplay>();
  @Output() onView = new EventEmitter<PagoDisplay>();
  @Output() onScan = new EventEmitter<PagoDisplay>();

  searchForm!: FormGroup;
  filterTab: 'todos' | 'pendientes' | 'pagados' = 'todos';
  private destroy$ = new Subject<void>();
  
  allRecords: PagoDisplay[] = [];
  displayedRecords: PagoDisplay[] = [];

  // Estado modal "Contacte a administradores" al intentar eliminar
  showContactAdminModal = false;
  recordToDelete: PagoDisplay | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private pagoService: PagoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}
  
  // Observable para usar con async pipe
  get pagos$() {
    return this.pagoService.pagos$;
  }

  ngOnInit(): void {
    this.initializeForm();
    // Configurar suscripción PRIMERO
    this.setupPagosSubscription();
    // Cargar pagos INMEDIATAMENTE después de suscribirse
    this.cargarPagosConUsuario();
  }

  /**
   * Cargar pagos del usuario actual
   * - Admin: ve todos los pagos
   * - Equipo: ve solo sus propios pagos
   */
  private cargarPagosConUsuario(): void {
    const currentUser = this.authService.getCurrentUser();
    const usuarioId = currentUser?.id ? parseInt(currentUser.id) : undefined;
    const rolNombre = currentUser?.rol_nombre;

    console.log('PaymentRecordsComponent.cargarPagosConUsuario() - Usuario:', {
      username: currentUser?.username,
      rol: rolNombre,
      usuarioId
    });

    // Si es Equipo, pasar su usuario_id para filtrar
    // Si es Admin, no pasar usuario_id para ver todos
    if (rolNombre?.toLowerCase() === 'equipo') {
      this.pagoService.cargarPagos(usuarioId);
    } else {
      this.pagoService.cargarPagos();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPagosSubscription(): void {
    console.log('PaymentRecordsComponent - Configurando suscripción a pagos');
    this.pagoService.pagos$
      .pipe(takeUntil(this.destroy$))
      .subscribe((pagos: PagoDisplay[]) => {
        console.log('PaymentRecordsComponent - Pagos recibidos:', pagos);
        // Clonar arreglo para asegurar detección de cambios con OnPush
        this.allRecords = [...pagos];
        this.filterRecords();
        this.cdr.markForCheck();
      });
  }

  private initializeForm(): void {
    this.searchForm = this.formBuilder.group({
      search: ['']
    });

    this.searchForm.get('search')?.valueChanges.subscribe(() => {
      this.filterRecords();
    });
  }

  setFilterTab(tab: 'todos' | 'pendientes' | 'pagados'): void {
    this.filterTab = tab;
    this.filterRecords();
  }

  private filterRecords(): void {
    let filtered = this.allRecords;

    // Filter by tab
    if (this.filterTab === 'pendientes') {
      filtered = filtered.filter(r => r.estado === 'A PAGAR');
    } else if (this.filterTab === 'pagados') {
      filtered = filtered.filter(r => r.estado === 'PAGADO');
    }

    // Filter by search
    const searchTerm = this.searchForm.get('search')?.value?.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.fecha_creacion.includes(searchTerm) ||
        r.proveedor.nombre.toLowerCase().includes(searchTerm) ||
        r.cliente.nombre.toLowerCase().includes(searchTerm) ||
        r.numero_presta.toLowerCase().includes(searchTerm) ||
        r.registrado_por.nombre_completo.toLowerCase().includes(searchTerm)
      );
    }

    // Asignar una nueva referencia para que OnPush detecte el cambio
    this.displayedRecords = [...filtered];
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'PAGADO':
        return 'status-pagado';
      case 'A PAGAR':
        return 'status-apagar';
      default:
        return '';
    }
  }

  onAction(action: string, record: PagoDisplay): void {
    console.log(`Action: ${action}, Record:`, record);
    if (action === 'edit') {
      this.onEdit.emit(record);
    } else if (action === 'view') {
      this.onView.emit(record);
    } else if (action === 'scan') {
      this.onScan.emit(record);
    } else if (action === 'delete') {
      this.recordToDelete = record;
      this.showContactAdminModal = true;
    }
  }

  closeContactAdminModal(): void {
    this.showContactAdminModal = false;
    this.recordToDelete = null;
  }
}
