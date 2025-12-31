import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TopHeaderComponent } from '../../shared/components/top-header/top-header';
import { PaymentFormComponent } from './components/payment-form/payment-form.component';
import { DocumentUploadComponent } from './components/document-upload/document-upload.component';
import { PaymentRecordsComponent } from './components/payment-records/payment-records.component';
import { NotificationComponent, Notification } from '../../shared/components/notification/notification.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { PagoService, PagoDisplay } from '../../core/services/pago.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-equipo-tarjetas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    TopHeaderComponent,
    PaymentFormComponent,
    DocumentUploadComponent,
    PaymentRecordsComponent,
    NotificationComponent,
    TranslatePipe
  ],
  templateUrl: './equipo-tarjetas.html',
  styleUrl: './equipo-tarjetas.scss'
})
export class EquipoTarjetasComponent implements OnInit {
  showPaymentModal = false;
  showDocumentModal = false;
  showEditModal = false;
  showViewModal = false;
  paymentForm!: FormGroup;
  editForm!: FormGroup;
  pagoSeleccionado: any = null;
  notifications: Notification[] = [];
  isEquipoUser = false;
  showEditRestriction = false;

  webhookModalVisible = false;
  webhookModalMessage: string | null = null;
  webhookModalCodes: string[] = [];
  webhookModalIsError = false;

  diasHastaReset: number = 0;
  fechaResetTexto: string = '';
  mensajeResetTarjetas: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private pagoService: PagoService,
    public notificationService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    // Suscribirse a notificaciones
    this.notificationService.notifications$.subscribe(
      (notifications) => {
        this.notifications = notifications;
      }
    );
    this.isEquipoUser = this.authService.isEquipo();
    // NO llamar a cargarPagos aquí - PaymentRecordsComponent lo hace en su ngOnInit
    // Esto evita race condition donde se emiten datos antes de que la suscripción esté lista

    this.calcularResetTarjetas();

    this.pagoService.webhookModal$.subscribe((event) => {
      if (event) {
        this.webhookModalMessage = event.message;
        this.webhookModalCodes = event.codes || [];
        this.webhookModalIsError = !!event.isError;
        this.webhookModalVisible = true;
        this.cdr.detectChanges();
      }
    });
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

  private initializeForm(): void {
    this.paymentForm = this.formBuilder.group({
      clienteNombre: ['', Validators.required],
      cliente: ['', Validators.required],
      proveedorNombre: ['', Validators.required],
      proveedor: ['', Validators.required],
      correo: [''],
      moneda: ['', Validators.required],
      tarjeta: ['', Validators.required],
      monto: ['', [Validators.required, Validators.min(0)]],
      numeroPresta: ['', Validators.required],
      comentarios: ['']
    });

    this.editForm = this.formBuilder.group({
      estado: ['', Validators.required],
      esta_verificado: [false],
      comentarios: ['']
    });
  }

  openPaymentModal(): void {
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.paymentForm.reset();
  }

  openDocumentModal(pago?: PagoDisplay): void {
    if (pago) {
      this.pagoSeleccionado = pago;
    }
    this.showDocumentModal = true;
  }

  closeDocumentModal(): void {
    this.showDocumentModal = false;
  }

  closeWebhookModal(): void {
    this.webhookModalVisible = false;
    // Cerrar también el modal de subida de documentos si está abierto
    if (this.showDocumentModal) {
      this.closeDocumentModal();
    }
    // Refrescar tabla de pagos para reflejar cambios realizados por el webhook
    this.pagoService.recargarPagos();
  }

  openEditModal(pago: any): void {
    this.showEditRestriction = false;
    this.pagoSeleccionado = pago;
    this.editForm.patchValue({
      estado: pago.estado,
      esta_verificado: pago.esta_verificado,
      comentarios: pago.comentarios || ''
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.pagoSeleccionado = null;
    this.editForm.reset();
    this.showEditRestriction = false;
  }

  openViewModal(pago: any): void {
    this.pagoSeleccionado = pago;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.pagoSeleccionado = null;
  }

  onSubmitEdit(): void {
    if (!this.editForm.valid || !this.pagoSeleccionado) {
      return;
    }

    // Restringir cambios desde este modal para usuarios de rol Equipo
    if (this.authService.isEquipo()) {
      this.showEditRestriction = true;
      return;
    }

    const formValue = this.editForm.value;
    console.log('Edit submitted:', formValue);

    const updateData = {
      estado: formValue.estado,
      esta_verificado: formValue.esta_verificado,
      comentarios: formValue.comentarios || null
    };

    console.log('Actualizando pago:', this.pagoSeleccionado.id, updateData);

    this.pagoService.update(this.pagoSeleccionado.id, updateData).subscribe({
      next: (response) => {
        console.log('Pago actualizado exitosamente:', response);
        this.notificationService.success('✅ Pago actualizado exitosamente');
        this.closeEditModal();
        // Recargar pagos después de cerrar el modal
        setTimeout(() => {
          console.log('Recargando pagos después de editar');
          this.pagoService.recargarPagos();
        }, 500);
      },
      error: (error) => {
        console.error('Error actualizando pago:', error);
        this.notificationService.error(`❌ Error al actualizar pago: ${error.error?.error?.message || error.message || 'Error desconocido'}`);
      }
    });
  }

  onSubmitPayment(): void {
    if (this.paymentForm.valid) {
      const formValue = this.paymentForm.value;
      console.log('Payment submitted:', formValue);

      // Obtener usuario actual
      const currentUser = this.authService.getCurrentUser();
      const usuarioId = currentUser?.id ? parseInt(currentUser.id) : null;

      if (!usuarioId) {
        this.notificationService.error('❌ Error: No se pudo obtener el usuario actual');
        return;
      }

      // Preparar datos para enviar al backend
      const pagoData = {
        cliente_id: parseInt(formValue.cliente),
        proveedor_id: parseInt(formValue.proveedor),
        correo_proveedor: formValue.correo || null,
        tarjeta_id: parseInt(formValue.tarjeta),
        monto: parseFloat(formValue.monto),
        numero_presta: formValue.numeroPresta,
        comentarios: formValue.comentarios || null,
        registrado_por_usuario_id: usuarioId
      };

      console.log('Enviando pago:', pagoData);
      console.log('Usuario actual:', currentUser?.username, '(ID:', usuarioId, ')');

      this.pagoService.create(pagoData).subscribe({
        next: (response) => {
          console.log('Pago creado exitosamente:', response);
          this.notificationService.success('✅ Pago registrado exitosamente');
          // Recargar pagos para actualizar la tabla dinámicamente
          setTimeout(() => {
            console.log('Recargando pagos después de crear');
            this.pagoService.recargarPagos();
          }, 500);
          this.closePaymentModal();
        },
        error: (error) => {
          console.error('Error creando pago:', error);
          this.notificationService.error(`❌ Error al registrar pago: ${error.error?.error?.message || error.message || 'Error desconocido'}`);
        }
      });
    }
  }
}
