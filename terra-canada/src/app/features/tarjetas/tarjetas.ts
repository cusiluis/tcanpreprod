import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TopHeaderComponent } from '../../shared/components/top-header/top-header';
import { TarjetasListComponent } from './components/tarjetas-list/tarjetas-list.component';
import { TarjetasFormComponent } from './components/tarjetas-form/tarjetas-form.component';
import { NotificationComponent, Notification } from '../../shared/components/notification/notification.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TarjetaService, Tarjeta } from '../../core/services/tarjeta.service';
import { NotificationService } from '../../core/services/notification.service';

/**
 * TarjetasComponent
 * Componente principal para la gestión de tarjetas
 * 
 * Funcionalidades:
 * - Visualizar tarjetas en grid dinámico desde BD
 * - Agregar nueva tarjeta mediante modal
 * - Agregar saldo a tarjeta mediante modal
 * - Gestión de estado de modales
 * - Integración con TarjetaService para CRUD
 */
@Component({
  selector: 'app-tarjetas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    TopHeaderComponent,
    TarjetasListComponent,
    TarjetasFormComponent,
    NotificationComponent,
    TranslatePipe
  ],
  templateUrl: './tarjetas.html',
  styleUrl: './tarjetas.scss'
})
export class TarjetasComponent implements OnInit {
  // Modal states
  mostrarModalNuevaTarjeta = false;
  mostrarModalAnadirSaldo = false;
  mostrarModalCambiarEstado = false;
  mostrarModalConfirmacionEliminar = false;
  tarjetaSeleccionada: Tarjeta | null = null;

  // Estados disponibles
  estadosDisponibles = [
    { id: 1, nombre: 'Activo' },
    { id: 2, nombre: 'Bloqueado' },
    { id: 3, nombre: 'Cancelado' },
    { id: 4, nombre: 'Desactivado' }
  ];

  // Notificaciones
  notifications: Notification[] = [];

  diasHastaReset: number = 0;
  fechaResetTexto: string = '';
  mensajeResetTarjetas: string = '';

  constructor(
    private tarjetaService: TarjetaService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Suscribirse a notificaciones
    this.notificationService.notifications$.subscribe(
      (notifications) => {
        this.notifications = notifications;
      }
    );

    // NO llamar a cargarTarjetas aquí - TarjetasListComponent lo hace en su ngOnInit
    // Esto evita race condition donde se emiten datos antes de que la suscripción esté lista

    this.calcularResetTarjetas();
  }

  private calcularResetTarjetas(): void {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();

    const proximoMes = mes === 11 ? 0 : mes + 1;
    const anioProximoMes = mes === 11 ? anio + 1 : anio;

    const fechaReset = new Date(anioProximoMes, proximoMes, 1);

    const msPorDia = 1000 * 60 * 60 * 24;
    const diffMs = fechaReset.getTime() - hoy.getTime();
    const dias = Math.max(0, Math.ceil(diffMs / msPorDia));
    this.diasHastaReset = dias;

    const dia = fechaReset.getDate().toString().padStart(2, '0');
    const mesNumero = (fechaReset.getMonth() + 1).toString().padStart(2, '0');
    const anioNumero = fechaReset.getFullYear();
    this.fechaResetTexto = `${dia}/${mesNumero}/${anioNumero}`;

    const plural = this.diasHastaReset === 1 ? '' : 's';
    this.mensajeResetTarjetas =
      `Aviso: dentro de ${this.diasHastaReset} día${plural} las tarjetas ` +
      `se restablecerán automáticamente a su saldo máximo (el ${this.fechaResetTexto}).`;
  }

  /**
   * Abre el modal para crear una nueva tarjeta
   */
  abrirModalNuevaTarjeta(): void {
    this.mostrarModalNuevaTarjeta = true;
  }

  /**
   * Cierra el modal de nueva tarjeta
   */
  cerrarModalNuevaTarjeta(): void {
    this.mostrarModalNuevaTarjeta = false;
  }

  /**
   * Abre el modal para añadir saldo a una tarjeta
   * @param tarjeta - Tarjeta seleccionada
   */
  abrirModalAnadirSaldo(tarjeta: Tarjeta): void {
    this.tarjetaSeleccionada = tarjeta;
    this.mostrarModalAnadirSaldo = true;
  }

  /**
   * Cierra el modal de añadir saldo
   */
  cerrarModalAnadirSaldo(): void {
    this.mostrarModalAnadirSaldo = false;
    this.tarjetaSeleccionada = null;
  }

  /**
   * Abre el modal para cambiar estado de una tarjeta
   * @param tarjeta - Tarjeta seleccionada
   */
  abrirModalCambiarEstado(tarjeta: Tarjeta): void {
    this.tarjetaSeleccionada = tarjeta;
    this.mostrarModalCambiarEstado = true;
  }

  /**
   * Cierra el modal de cambiar estado
   */
  cerrarModalCambiarEstado(): void {
    this.mostrarModalCambiarEstado = false;
    this.tarjetaSeleccionada = null;
  }

  /**
   * Maneja el envío del formulario de nueva tarjeta
   * Cierra el modal y recarga las tarjetas
   */
  onNuevaTarjetaSubmit(): void {
    this.notificationService.success('Tarjeta creada exitosamente');
    this.cerrarModalNuevaTarjeta();
    this.tarjetaService.refreshTarjetas();
  }

  /**
   * Maneja el envío del formulario de añadir saldo
   * Cierra el modal y recarga las tarjetas
   */
  onAnadirSaldoSubmit(): void {
    this.notificationService.success('Saldo añadido exitosamente');
    this.cerrarModalAnadirSaldo();
    this.tarjetaService.refreshTarjetas();
  }

  /**
   * Descartar notificación
   */
  onNotificationDismissed(id: string): void {
    this.notificationService.dismiss(id);
  }

  /**
   * Selecciona un nuevo estado y lo aplica a la tarjeta
   * @param estado - Estado seleccionado
   */
  onSeleccionarEstado(estado: any): void {
    if (!this.tarjetaSeleccionada) return;

    if (estado.id === this.tarjetaSeleccionada.estado.id) {
      this.notificationService.warning('El estado seleccionado es igual al actual');
      return;
    }

    this.tarjetaService.cambiarEstado(this.tarjetaSeleccionada.id, estado.id).subscribe(
      (response) => {
        this.notificationService.success(`Tarjeta ${estado.nombre.toLowerCase()} exitosamente`);
        this.cerrarModalCambiarEstado();
        this.tarjetaService.refreshTarjetas();
      },
      (error) => {
        console.error('Error al cambiar estado:', error);
        this.notificationService.error('Error al cambiar el estado de la tarjeta');
      }
    );
  }

  /**
   * Abre el modal de confirmación para eliminar una tarjeta
   * @param tarjeta - Tarjeta a eliminar
   */
  onEliminarTarjeta(tarjeta: Tarjeta): void {
    this.tarjetaSeleccionada = tarjeta;
    this.mostrarModalConfirmacionEliminar = true;
  }

  /**
   * Cierra el modal de confirmación de eliminación
   */
  cerrarModalConfirmacionEliminar(): void {
    this.mostrarModalConfirmacionEliminar = false;
    this.tarjetaSeleccionada = null;
  }

  /**
   * Confirma la eliminación permanente de la tarjeta
   */
  confirmarEliminarTarjeta(): void {
    if (!this.tarjetaSeleccionada) return;

    this.tarjetaService.deletePermanente(this.tarjetaSeleccionada.id).subscribe({
      next: (response) => {
        this.notificationService.success('✅ Tarjeta eliminada permanentemente');
        this.cerrarModalConfirmacionEliminar();
        this.tarjetaService.refreshTarjetas();
      },
      error: (error) => {
        console.error('Error eliminando tarjeta:', error);
        this.notificationService.error(`❌ ${error.error?.error?.message || 'Error al eliminar la tarjeta'}`);
      }
    });
  }

  /**
   * Retorna el icono para un estado específico
   * @param estado - Nombre del estado
   * @returns Clase del icono
   */
  getIconoEstado(estado: string): string {
    const iconos: { [key: string]: string } = {
      'Activo': 'pi-check-circle',
      'Bloqueado': 'pi-lock',
      'Cancelado': 'pi-times-circle',
      'Desactivado': 'pi-ban'
    };
    return iconos[estado] || 'pi-info-circle';
  }

  /**
   * Retorna la descripción de un estado
   * @param estado - Nombre del estado
   * @returns Descripción del estado
   */
  getDescripcionEstado(estado: string): string {
    const descripciones: { [key: string]: string } = {
      'Activo': 'La tarjeta está activa y puede realizar transacciones normalmente',
      'Bloqueado': 'La tarjeta está bloqueada y no puede realizar transacciones',
      'Cancelado': 'La tarjeta ha sido cancelada permanentemente',
      'Desactivado': 'La tarjeta está desactivada temporalmente'
    };
    return descripciones[estado] || 'Estado desconocido';
  }
}
