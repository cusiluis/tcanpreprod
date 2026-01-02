import { Component, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TarjetaService, Tarjeta } from '../../../../core/services/tarjeta.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * TarjetasListComponent
 * Componente para visualizar tarjetas en un grid dinámico
 * 
 * Funcionalidades:
 * - Grid responsivo de tarjetas desde BD
 * - Botón para añadir nueva tarjeta
 * - Botón para añadir saldo en cada tarjeta
 * - Carga automática de tarjetas del backend
 * - Estados de tarjeta (activa, bloqueada, etc.)
 * 
 * Eventos:
 * - anadirTarjeta: Se emite cuando el usuario hace clic en el botón "+"
 * - anadirSaldo: Se emite cuando el usuario hace clic en "Añadir Saldo" de una tarjeta
 */
@Component({
  selector: 'app-tarjetas-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './tarjetas-list.component.html',
  styleUrl: './tarjetas-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TarjetasListComponent implements OnInit, OnDestroy {
  // Array de tarjetas desde BD
  tarjetas: Tarjeta[] = [];

  // Estado de carga
  isLoading = false;
  errorMessage = '';

  // Permisos del usuario
  isAdmin = false;
  canCreate = false;
  canEdit = false;
  canDelete = false;

  // Subject para desuscribirse
  private destroy$ = new Subject<void>();

  // Eventos emitidos al componente padre
  @Output() anadirTarjeta = new EventEmitter<void>();
  @Output() anadirSaldo = new EventEmitter<Tarjeta>();
  @Output() cambiarEstado = new EventEmitter<Tarjeta>();
  @Output() eliminarTarjeta = new EventEmitter<Tarjeta>();

  constructor(
    private tarjetaService: TarjetaService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    
    // Verificar si el usuario es admin
    this.isAdmin = this.authService.isAdmin();
    console.log('TarjetasListComponent - isAdmin:', this.isAdmin);
    this.canCreate = this.isAdmin || this.authService.hasPermission('tarjetas.crear');
    this.canEdit = this.isAdmin || this.authService.hasPermission('tarjetas.editar');
    this.canDelete = this.isAdmin || this.authService.hasPermission('tarjetas.eliminar_permanente');
    
    // Configurar suscripción PRIMERO
    this.setupTarjetasSubscription();
    
    // Cargar tarjetas INMEDIATAMENTE después de suscribirse
    this.tarjetaService.loadTarjetas();
  }

  private setupTarjetasSubscription(): void {
    console.log('TarjetasListComponent - Configurando suscripción a tarjetas');
    this.tarjetaService.tarjetas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (tarjetas: any[]) => {
          console.log('TarjetasListComponent - Tarjetas recibidas:', tarjetas);
          this.tarjetas = tarjetas;
          this.isLoading = false;
          // Forzar detección de cambios con OnPush strategy
          this.cdr.markForCheck();
        },
        (error: any) => {
          console.error('Error cargando tarjetas:', error);
          this.errorMessage = 'Error al cargar las tarjetas';
          this.isLoading = false;
          // Forzar detección de cambios incluso en error
          this.cdr.markForCheck();
        }
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Emite evento para añadir nueva tarjeta
   */
  onAnadirTarjeta(): void {
    this.anadirTarjeta.emit();
  }

  /**
   * Emite evento para añadir saldo a una tarjeta
   * @param tarjeta - Tarjeta seleccionada
   */
  onAnadirSaldo(tarjeta: Tarjeta): void {
    this.anadirSaldo.emit(tarjeta);
  }

  /**
   * Abre el modal para cambiar el estado de una tarjeta
   * @param tarjeta - Tarjeta seleccionada
   */
  onAbrirModalCambiarEstado(tarjeta: Tarjeta): void {
    this.cambiarEstado.emit(tarjeta);
  }

  /**
   * Emite evento para eliminar una tarjeta
   * @param tarjeta - Tarjeta a eliminar
   */
  onEliminarTarjeta(tarjeta: Tarjeta): void {
    this.eliminarTarjeta.emit(tarjeta);
  }

  /**
   * Retorna la clase CSS para el estado de la tarjeta
   * @param estado - Nombre del estado (activo, desactivado, etc.)
   * @returns Clase CSS correspondiente
   */
  getStatusClass(estado: string): string {
    return estado?.toLowerCase() === 'activo' ? 'status-activa' : 'status-bloqueada';
  }

  /**
   * Calcula el porcentaje de uso basado en saldo actual y límite
   * @param saldo - Saldo actual
   * @param limite - Límite de crédito
   * @returns Porcentaje de uso (0-100)
   */
  calculateUsagePercentage(saldo: number, limite: number): number {
    if (!limite || limite === 0) return 0;
    return Math.round((saldo / limite) * 100);
  }

  /**
   * Retorna el color de la barra de progreso según el porcentaje de saldo
   * Verde cuando hay mucho saldo (100%), rojo cuando está vacío (0%)
   * @param porcentaje - Porcentaje de saldo disponible (0-100)
   * @returns Color en formato hexadecimal
   */
  getProgressColor(porcentaje: number): string {
    if (porcentaje >= 90) return '#4caf50'; // Verde - Saldo muy alto (90-100%)
    if (porcentaje >= 75) return '#8bc34a'; // Verde claro - Saldo alto (75-90%)
    if (porcentaje >= 60) return '#ffc107'; // Amarillo - Saldo medio (60-75%)
    if (porcentaje >= 40) return '#ff9800'; // Naranja - Saldo bajo (40-60%)
    if (porcentaje >= 20) return '#f44336'; // Rojo - Saldo muy bajo (20-40%)
    return '#d32f2f'; // Rojo oscuro - Crítico (0-20%)
  }

  /**
   * Formatea un valor numérico como moneda
   * @param valor - Valor a formatear
   * @param moneda - Código de moneda (CAD, USD, etc.)
   * @returns Valor formateado como moneda
   */
  formatCurrency(valor: number, moneda: string): string {
    return `$${valor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moneda}`;
  }
}
