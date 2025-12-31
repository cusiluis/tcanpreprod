import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TopHeaderComponent } from '../../shared/components/top-header/top-header';
import { PaymentFormComponent } from '../equipo-tarjetas/components/payment-form/payment-form.component';
import { DocumentUploadComponent } from '../equipo-tarjetas/components/document-upload/document-upload.component';
import { CardPaymentRecordsComponent } from './components/card-payment-records/card-payment-records.component';
import { NotificationComponent, Notification } from '../../shared/components/notification/notification.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { PagoService } from '../../core/services/pago.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { EventoService } from '../../core/services/evento.service';

@Component({
  selector: 'app-financieros-tarjetas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    TopHeaderComponent,
    PaymentFormComponent,
    DocumentUploadComponent,
    CardPaymentRecordsComponent,
    NotificationComponent,
    TranslatePipe
  ],
  templateUrl: './financieros-tarjetas.html',
  styleUrl: './financieros-tarjetas.scss'
})
export class FinancierosTarjetasComponent implements OnInit {
  showPaymentModal = false;
  showDocumentModal = false;
  showEditModal = false;
  showViewModal = false;
  paymentForm!: FormGroup;
  editForm!: FormGroup;
  pagoSeleccionado: any = null;
  notifications: Notification[] = [];

  webhookModalVisible = false;
  webhookModalMessage: string | null = null;
  webhookModalCodes: string[] = [];
  webhookModalIsError = false;

  editPdfBase64: string | null = null;
  editPdfFileName: string | null = null;
  isScanning = false;
  scanMessage: string | null = null;
  scanError: string | null = null;
  isScanSuccess = false;

  constructor(
    private formBuilder: FormBuilder,
    private pagoService: PagoService,
    public notificationService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private eventoService: EventoService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    // Suscribirse a notificaciones
    this.notificationService.notifications$.subscribe(
      (notifications) => {
        this.notifications = notifications;
      }
    );
    // NO llamar a cargarPagos aquí - CardPaymentRecordsComponent lo hace en su ngOnInit
    // Esto evita race condition donde se emiten datos antes de que la suscripción esté lista

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

    this.editForm.get('estado')?.disable({ emitEvent: false });
    this.editForm.get('esta_verificado')?.disable({ emitEvent: false });
  }

  openPaymentModal(): void {
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.paymentForm.reset();
  }

  openDocumentModal(): void {
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
    // Refrescar la tabla de pagos financieros (tarjetas)
    this.pagoService.recargarPagos();
  }

  openEditModal(pago: any): void {
    this.pagoSeleccionado = pago;

    this.editPdfBase64 = null;
    this.editPdfFileName = null;
    this.isScanning = false;
    this.scanMessage = null;
    this.scanError = null;
    this.isScanSuccess = false;

    this.editForm.patchValue({
      estado: pago.estado,
      esta_verificado: pago.esta_verificado,
      comentarios: pago.comentarios || ''
    });

    this.editForm.get('estado')?.disable({ emitEvent: false });
    this.editForm.get('esta_verificado')?.disable({ emitEvent: false });

    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.pagoSeleccionado = null;
    this.editForm.reset();

    this.editPdfBase64 = null;
    this.editPdfFileName = null;
    this.isScanning = false;
    this.scanMessage = null;
    this.scanError = null;
    this.isScanSuccess = false;
  }

  openViewModal(pago: any): void {
    this.pagoSeleccionado = pago;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.pagoSeleccionado = null;
  }

  onPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];

    this.scanError = null;
    this.scanMessage = null;
    this.editPdfBase64 = null;
    this.editPdfFileName = null;

    if (!file) {
      return;
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.type === 'application/x-pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      this.scanError = 'Solo se permiten archivos PDF.';
      this.cdr.detectChanges();
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';

      if (!base64) {
        this.scanError = 'No se pudo leer el contenido del archivo PDF.';
        this.cdr.detectChanges();
        return;
      }

      this.editPdfBase64 = base64;
      this.editPdfFileName = file.name;
      this.cdr.detectChanges();
    };

    reader.onerror = () => {
      this.scanError = 'Error leyendo el archivo PDF.';
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  onScanPdf(): void {
    if (!this.pagoSeleccionado) {
      this.scanError = 'No hay pago seleccionado para escanear.';
      return;
    }

    if (!this.editPdfBase64) {
      this.scanError = 'Debes subir un archivo PDF antes de escanear.';
      return;
    }

    this.isScanning = true;
    this.scanError = null;
    this.scanMessage = 'Escaneando documento...';

    this.pagoService
      .scanPagoDocumento(
        this.editPdfBase64,
        this.pagoSeleccionado.id,
        this.pagoSeleccionado.numero_presta
      )
      .subscribe({
        next: (response) => {
          console.log('Webhook edit_pago (tarjetas) respuesta:', response);

          if (response?.code === 200 && response?.estado === true) {
            console.log('Webhook edit_pago (tarjetas) OK - mensaje:', response.mensaje);
            this.isScanSuccess = true;
            this.editForm.patchValue({
              estado: 'PAGADO',
              esta_verificado: true
            });
            // Una vez validado correctamente el documento, habilitamos
            // los campos de estado y verificación para que el admin pueda
            // gestionarlos explícitamente.
            this.editForm.get('estado')?.enable({ emitEvent: false });
            this.editForm.get('esta_verificado')?.enable({ emitEvent: false });
            this.scanMessage = response.mensaje || 'Documento validado correctamente.';
            this.scanError = null;
            // Registrar evento de auditoria para escaneo de PDF de pago con tarjeta
            this.registrarEventoEscaneoPagoTarjeta();
          } else {
            console.warn(
              'Webhook edit_pago (tarjetas) ERROR lógico - code:',
              response?.code,
              'mensaje:',
              response?.mensaje,
              'error:',
              response?.error
            );
            this.isScanSuccess = false;
            this.scanError =
              response?.error || 'Error al validar el documento.';
            this.scanMessage = null;
            this.isScanning = false;
          }
        },
        error: (error) => {
          console.error('Webhook edit_pago (tarjetas) ERROR HTTP:', error);
          this.isScanSuccess = false;
          this.scanError =
            error.error?.error ||
            error.error?.mensaje ||
            error.message ||
            'Error desconocido al escanear el documento.';
          this.scanMessage = null;
          this.isScanning = false;
        },
        complete: () => {
          this.isScanning = false;
        }
      });
  }

  private registrarEventoEscaneoPagoTarjeta(): void {
    if (!this.pagoSeleccionado) {
      return;
    }

    const descripcion = `Escaneo de documento PDF para pago con tarjeta ${this.pagoSeleccionado.numero_presta ?? ''} (ID ${this.pagoSeleccionado.id})`;

    this.eventoService
      .registrarEvento({
        tipo_evento: 'ACCION',
        accion: 'VERIFICAR_PAGO',
        tipo_entidad: 'PAGO_TARJETA',
        entidad_id: this.pagoSeleccionado.id,
        descripcion
      })
      .subscribe({
        next: () => {
          console.log('Evento de escaneo de pago con tarjeta registrado');
        },
        error: (error: any) => {
          console.error('Error registrando evento de escaneo de pago con tarjeta:', error);
        }
      });
  }

  onSubmitEdit(): void {
    if (!this.editForm.valid || !this.pagoSeleccionado) {
      return;
    }

    const formValue = this.editForm.getRawValue();

    const requestedEstado = formValue.estado as 'A PAGAR' | 'PAGADO';
    const requestedVerificado = !!formValue.esta_verificado;

    const originalEstado = this.pagoSeleccionado?.estado as 'A PAGAR' | 'PAGADO';
    const originalVerificacion = !!this.pagoSeleccionado?.esta_verificado;

    if (requestedEstado === 'A PAGAR' && requestedVerificado === true) {
      this.notificationService.error('No se permite tener estado "A PAGAR" con verificado en TRUE.');
      return;
    }

    const isChangingEstadoOVerificacion =
      requestedEstado !== originalEstado || requestedVerificado !== originalVerificacion;

    if (isChangingEstadoOVerificacion && !this.isScanSuccess) {
      this.notificationService.error(
        'Debes subir y escanear un PDF válido antes de cambiar el estado o verificación.'
      );
      return;
    }

    const updateData = {
      estado: requestedEstado,
      esta_verificado: requestedVerificado,
      comentarios: formValue.comentarios || null
    };

    this.pagoService.update(this.pagoSeleccionado.id, updateData).subscribe({
      next: (response) => {
        console.log('Pago actualizado exitosamente:', response);
        this.notificationService.success('✅ Pago actualizado exitosamente');
        this.closeEditModal();
        setTimeout(() => {
          this.pagoService.recargarPagos();
        }, 500);
      },
      error: (error) => {
        console.error('Error actualizando pago:', error);
        this.notificationService.error(
          `❌ Error al actualizar pago: ${
            error.error?.error?.message || error.message || 'Error desconocido'
          }`
        );
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

  get canSubmitEdit(): boolean {
    if (!this.editForm || !this.pagoSeleccionado) {
      return false;
    }

    const formValue = this.editForm.getRawValue();
    const requestedEstado = formValue.estado as 'A PAGAR' | 'PAGADO';
    const requestedVerificado = !!formValue.esta_verificado;

    const originalEstado = this.pagoSeleccionado?.estado as 'A PAGAR' | 'PAGADO';
    const originalVerificacion = !!this.pagoSeleccionado?.esta_verificado;

    const isChanging = requestedEstado !== originalEstado || requestedVerificado !== originalVerificacion;
    if (isChanging && !this.isScanSuccess) {
      return false;
    }

    if (this.isScanning) {
      return false;
    }

    return this.editForm.valid;
  }
}
