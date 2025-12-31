import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TopHeaderComponent } from '../../shared/components/top-header/top-header';
import { DocumentUploadComponent } from '../equipo-tarjetas/components/document-upload/document-upload.component';
import { BancaryPaymentRecordsComponent } from './components/bancary-payment-records/bancary-payment-records.component';
import { PaymentFormComponent } from './components/payment-form/payment-form.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NotificationComponent, Notification } from '../../shared/components/notification/notification.component';
import { NotificationService } from '../../core/services/notification.service';
import { PagoBancarioService } from '../../core/services/pago-bancario.service';
import { EventoService } from '../../core/services/evento.service';
import { AuthService } from '../../core/services/auth.service';
import { PagoService } from '../../core/services/pago.service';

@Component({
  selector: 'app-financieros-bancaria',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    TopHeaderComponent,
    DocumentUploadComponent,
    BancaryPaymentRecordsComponent,
    PaymentFormComponent,
    TranslatePipe,
    NotificationComponent
  ],
  templateUrl: './financieros-bancaria.html',
  styleUrl: './financieros-bancaria.scss'
})
export class FinancierosBancariaComponent implements OnInit {
  showPaymentModal = false;
  showDocumentModal = false;
  showEditModal = false;
  showViewModal = false;
  paymentForm!: FormGroup;
  editForm!: FormGroup;
  registroSeleccionado: any = null;
  notifications: Notification[] = [];

  editPdfBase64: string | null = null;
  editPdfFileName: string | null = null;
  isScanning = false;
  scanMessage: string | null = null;
  scanError: string | null = null;
  isScanSuccess = false;

  webhookModalVisible = false;
  webhookModalMessage: string | null = null;
  webhookModalCodes: string[] = [];
  webhookModalIsError = false;

  @ViewChild(BancaryPaymentRecordsComponent) paymentRecordsComponent!: BancaryPaymentRecordsComponent;

  constructor(
    private formBuilder: FormBuilder,
    public notificationService: NotificationService,
    private pagoBancarioService: PagoBancarioService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private eventoService: EventoService,
    private pagoService: PagoService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.notificationService.notifications$.subscribe((n) => {
      this.notifications = n;
    });

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
      banco: ['', Validators.required],
      tipoCuenta: ['', Validators.required],
      referencia: ['', Validators.required],
      monto: ['', [Validators.required, Validators.min(0)]],
      moneda: ['', Validators.required],
      comentarios: ['']
    });

    this.editForm = this.formBuilder.group({
      estado: ['', Validators.required],
      verificado: [false],
      comentarios: ['']
    });

    // Los controles de estado y verificado son solo de lectura en el modal de edición
    this.editForm.get('estado')?.disable({ emitEvent: false });
    this.editForm.get('verificado')?.disable({ emitEvent: false });
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
    // Refrescar la tabla de pagos bancarios para reflejar cambios del webhook
    if (this.paymentRecordsComponent) {
      this.paymentRecordsComponent.loadPagoBancarios();
    }
  }

  openEditModal(registro: any): void {
    this.registroSeleccionado = registro;

    // Resetear estado de escaneo de documento
    this.editPdfBase64 = null;
    this.editPdfFileName = null;
    this.isScanning = false;
    this.scanMessage = null;
    this.scanError = null;
    this.isScanSuccess = false;

    this.editForm.patchValue({
      estado: registro.status,
      verificado: !!registro.verification,
      comentarios: ''
    });

    this.editForm.get('estado')?.disable({ emitEvent: false });
    this.editForm.get('verificado')?.disable({ emitEvent: false });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.registroSeleccionado = null;
    this.editForm.reset();

    this.editPdfBase64 = null;
    this.editPdfFileName = null;
    this.isScanning = false;
    this.scanMessage = null;
    this.scanError = null;
    this.isScanSuccess = false;
  }

  openViewModal(registro: any): void {
    this.registroSeleccionado = registro;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.registroSeleccionado = null;
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
    if (!this.registroSeleccionado) {
      this.scanError = 'No hay registro seleccionado para escanear.';
      return;
    }

    if (!this.editPdfBase64) {
      this.scanError = 'Debes subir un archivo PDF antes de escanear.';
      return;
    }

    this.isScanning = true;
    this.scanError = null;
    this.scanMessage = 'Escaneando documento...';

    this.pagoBancarioService
      .scanPagoDocumento(
        this.editPdfBase64,
        this.registroSeleccionado.id,
        this.registroSeleccionado.code
      )
      .subscribe({
        next: (response) => {
          console.log('Webhook edit_pago (bancario) respuesta:', response);

          if (response?.code === 200 && response?.estado === true) {
            console.log('Webhook edit_pago (bancario) OK - mensaje:', response.mensaje);
            this.isScanSuccess = true;
            this.editForm.patchValue({
              estado: 'PAGADO',
              verificado: true
            });
            // Una vez que el documento fue validado correctamente, habilitamos
            // los campos de estado y verificado para que el admin pueda ajustarlos.
            this.editForm.get('estado')?.enable({ emitEvent: false });
            this.editForm.get('verificado')?.enable({ emitEvent: false });
            this.scanMessage = response.mensaje || 'Documento validado correctamente.';
            this.scanError = null;
            this.isScanning = false;
            this.cdr.detectChanges();
            // Registrar evento de auditoria para escaneo de PDF de pago bancario
            this.registrarEventoEscaneoPagoBancario();
          } else {
            console.log('salesss', response.error);
            this.isScanSuccess = false;
            const errorText =
              response?.error || response?.mensaje || 'Error al validar el documento.';
            this.scanError = errorText;
            this.scanMessage = errorText;
            this.isScanning = false;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Webhook edit_pago (bancario) ERROR HTTP:', error);
          this.isScanSuccess = false;
          const errorText =
            error.error?.error ||
            error.error?.mensaje ||
            error.message ||
            'Error desconocido al escanear el documento.';
          this.scanError = errorText;
          this.scanMessage = errorText;
          this.isScanning = false;
          this.cdr.detectChanges();
        },
        complete: () => {
          this.isScanning = false;
          this.cdr.detectChanges();
        }
      });
  }

  private registrarEventoEscaneoPagoBancario(): void {
    if (!this.registroSeleccionado) {
      return;
    }

    const descripcion = `Escaneo de documento PDF para pago bancario ${this.registroSeleccionado.code ?? ''} (ID ${this.registroSeleccionado.id})`;

    this.eventoService
      .registrarEvento({
        tipo_evento: 'ACCION',
        accion: 'VERIFICAR_PAGO',
        tipo_entidad: 'PAGO_BANCARIO',
        entidad_id: this.registroSeleccionado.id,
        descripcion
      })
      .subscribe({
        next: () => {
          console.log('Evento de escaneo de pago bancario registrado');
        },
        error: (error: any) => {
          console.error('Error registrando evento de escaneo de pago bancario:', error);
        }
      });
  }

  onSubmitEdit(): void {
    if (!this.editForm.valid || !this.registroSeleccionado) {
      return;
    }

    const formValue = this.editForm.getRawValue();

    const requestedEstado = formValue.estado as 'A PAGAR' | 'PAGADO';
    const requestedVerificado = !!formValue.verificado;

    const originalEstado = this.registroSeleccionado?.status as 'A PAGAR' | 'PAGADO';
    const originalVerificacion = !!this.registroSeleccionado?.verification;

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

    const currentUser = this.authService.getCurrentUser();
    const verificadoPorUsuarioId =
      requestedVerificado && currentUser ? Number(currentUser.id) : undefined;

    this.pagoBancarioService
      .update(this.registroSeleccionado.id, {
        nuevoEstado: requestedEstado,
        nuevaVerificacion: requestedVerificado,
        verificadoPorUsuarioId
      })
      .subscribe({
        next: (response) => {
          console.log('Pago bancario actualizado exitosamente:', response);
          this.notificationService.success('Registro actualizado exitosamente');
          this.closeEditModal();

          if (this.paymentRecordsComponent) {
            this.paymentRecordsComponent.loadPagoBancarios();
          }
        },
        error: (error) => {
          console.error('Error actualizando pago bancario:', error);
          const message =
            error.error?.error?.message ||
            error.error?.message ||
            error.message ||
            'Error desconocido';
          this.notificationService.error(`Error al actualizar registro: ${message}`);
        }
      });
  }

  get canSubmitEdit(): boolean {
    if (!this.editForm || !this.registroSeleccionado) {
      return false;
    }

    const formValue = this.editForm.getRawValue();
    const requestedEstado = formValue.estado as 'A PAGAR' | 'PAGADO';
    const requestedVerificacion = !!formValue.verificado;

    const originalEstado = this.registroSeleccionado?.status as 'A PAGAR' | 'PAGADO';
    const originalVerificacion = !!this.registroSeleccionado?.verification;

    const isChanging = requestedEstado !== originalEstado || requestedVerificacion !== originalVerificacion;
    if (isChanging && !this.isScanSuccess) {
      return false;
    }

    if (this.isScanning) {
      return false;
    }

    return this.editForm.valid;
  }

  onSubmitPayment(): void {
    console.log('FinancierosBancariaComponent.onSubmitPayment() - Pago enviado exitosamente');
    // El modal se cierra automáticamente desde el componente hijo
    if (this.paymentRecordsComponent) {
      this.paymentRecordsComponent.loadPagoBancarios();
    }
  }

  onCancel(): void {
    this.closePaymentModal();
  }
}
