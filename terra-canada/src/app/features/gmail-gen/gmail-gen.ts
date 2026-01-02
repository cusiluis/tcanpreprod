import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TopHeaderComponent } from '../../shared/components/top-header/top-header';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import {
  GmailGenService,
  GmailEmailGroup,
  GmailEnvioHistorial
} from '../../core/services/gmail-gen.service';

interface EmailInfoViewModel {
  proveedorNombre: string;
  correoElectronico: string;
  asunto: string;
  mensaje: string;
  totalPagos: number;
  totalMonto: number;
  fechaEnvioTexto: string;
  pagosDetallados?: {
    id_pago: number;
    cliente: string;
    monto: number;
    codigo: string;
    fecha_creacion?: string;
    tipo_pago?: string;
    medio_pago?: {
      titular?: string;
      numero?: string;
      tipo_tarjeta?: string;
      cuenta?: string;
      moneda?: string;
    };
  }[];
}

@Component({
  selector: 'app-gmail-gen',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    TopHeaderComponent,
    TranslatePipe
  ],
  templateUrl: './gmail-gen.html',
  styleUrls: ['./gmail-gen.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GmailGenComponent implements OnInit {
  filter: 'todos' | 'pasados' = 'todos';

  /** Pagos pendientes generales (sin filtro por fecha) para la vista "Todos". */
  generalPendingGroups: GmailEmailGroup[] = [];
  sentGroupsToday: GmailEmailGroup[] = [];
  historialEnvios: GmailEnvioHistorial[] = [];

  get enviosHoy(): GmailEnvioHistorial[] {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayKey = `${year}-${month}-${day}`;

    return this.historialEnvios.filter((envio: GmailEnvioHistorial) => {
      if (!envio.fecha_resumen) {
        return false;
      }

      const fecha = new Date(envio.fecha_resumen);
      if (Number.isNaN(fecha.getTime())) {
        return false;
      }

      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(
        fecha.getDate()
      ).padStart(2, '0')}`;
      return key === todayKey;
    });
  }

  get enviosPasados(): GmailEnvioHistorial[] {
    // Ahora "Pasados" debe mostrar todo el historial de correos enviados
    // sin filtrar por fecha. La separación de "hoy" se maneja en la vista
    // de la pestaña "Todos" mediante sentGroupsToday.
    return this.historialEnvios;
  }

  showComposeModal = false;
  showDetailsModal = false;

  selectedGroup: GmailEmailGroup | null = null;
  selectedEmailInfo: EmailInfoViewModel | null = null;

  composeForm = {
    para: '',
    asunto: '',
    mensaje: ''
  };

  isLoading = false;
  isSending = false;

  // Toasts de confirmación
  showSuccessToast = false;
  successToastMessage = '';
  showErrorToast = false;
  errorToastMessage = '';

  constructor(
    private gmailGenService: GmailGenService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  get filteredGroups(): GmailEmailGroup[] {
    if (this.filter === 'todos') {
      return this.generalPendingGroups;
    }

    return [];
  }

  cargarPendientesGenerales(): void {
    this.gmailGenService.getCorreosPendientesGeneral().subscribe({
      next: (response) => {
        console.log('[Gmail-GEN] Pendientes GENERALES API response:', response);

        if (response.success && response.data) {
          this.generalPendingGroups = [...response.data];
        } else {
          this.generalPendingGroups = [];
        }

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error(
          '[Gmail-GEN] Error HTTP obteniendo pendientes GENERALES para Gmail-GEN',
          error
        );
        this.generalPendingGroups = [];
        this.cdr.markForCheck();
      }
    });
  }

  private cargarResumen(): void {
    this.cargarPendientesGenerales();
    this.cargarEnviadosHoy();
    this.cargarHistorial();
  }

  cargarEnviadosHoy(fecha?: string): void {
    this.gmailGenService.getResumenEnviosFecha(fecha).subscribe({
      next: (response) => {
        console.log('[Gmail-GEN] Enviados HOY API response:', response);

        if (response.success && response.data) {
          this.sentGroupsToday = [...response.data];
        } else {
          this.sentGroupsToday = [];
        }

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error(
          '[Gmail-GEN] Error HTTP obteniendo resumen de envíos HOY para Gmail-GEN',
          error
        );
        this.sentGroupsToday = [];
        this.cdr.markForCheck();
      }
    });
  }

  cargarHistorial(limit: number = 50, offset: number = 0): void {
    this.gmailGenService.getHistorialEnvios(limit, offset).subscribe({
      next: (response) => {
        console.log('[Gmail-GEN] Historial API response:', response);

        if (response.success && response.data) {
          this.historialEnvios = [...response.data];
        } else {
          this.historialEnvios = [];
        }

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('[Gmail-GEN] Error HTTP obteniendo historial de envíos', error);
        this.historialEnvios = [];
        this.cdr.markForCheck();
      }
    });
  }

  setFilter(filter: 'todos' | 'pasados'): void {
    this.filter = filter;
    this.cdr.markForCheck();
  }

  openComposeModal(group: GmailEmailGroup): void {
    this.selectedGroup = group;
    this.composeForm.para = group.correoContacto;
    this.composeForm.asunto = 'Confirmation de paiement';
    this.composeForm.mensaje = 'Bonjour, je vous envoie les paiements que nous vous avons faits. Allez les voir.';
    this.showComposeModal = true;
  }

  closeComposeModal(): void {
    this.showComposeModal = false;
  }

  onSendEmail(): void {
    if (!this.selectedGroup) {
      return;
    }

    const proveedorId = this.selectedGroup.id;
    const fechaResumen = this.selectedGroup.fechaResumen;
    this.isSending = true;

    this.gmailGenService
      .enviarCorreoProveedor({
        proveedorId,
        fecha: fechaResumen,
        asunto: this.composeForm.asunto,
        mensaje: this.composeForm.mensaje
      })
      .subscribe({
        next: (response) => {
          this.isSending = false;

          if (!response.success) {
            console.error(
              'Error enviando correo de confirmación a proveedor',
              response
            );
            this.errorToastMessage =
              (response as any)?.error?.message ||
              'Error enviando correo de confirmación a proveedor';
            this.showErrorToast = true;
            this.cdr.markForCheck();
            setTimeout(() => {
              this.showErrorToast = false;
              this.cdr.markForCheck();
            }, 3000);
            return;
          }

          // Refrescar listas para que el lote enviado desaparezca de pendientes
          // y aparezca en el historial y en las tarjetas de enviados HOY.
          this.showComposeModal = false;
          this.selectedGroup = null;
          this.cargarResumen();

          this.successToastMessage = 'Correo enviado correctamente';
          this.showSuccessToast = true;
          this.cdr.markForCheck();
          setTimeout(() => {
            this.showSuccessToast = false;
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (error) => {
          this.isSending = false;
          console.error(
            'Error HTTP enviando correo de confirmación a proveedor',
            error
          );
          this.errorToastMessage = 'Error enviando correo de confirmación a proveedor';
          this.showErrorToast = true;
          this.cdr.markForCheck();
          setTimeout(() => {
            this.showErrorToast = false;
            this.cdr.markForCheck();
          }, 3000);
        }
      });
  }

  openEmailInfo(group: GmailEmailGroup): void {
    const info = group.ultimoEnvio;
    const fechaRaw = info?.fechaEnvio;
    const fecha = fechaRaw ? new Date(fechaRaw) : new Date();

    this.selectedEmailInfo = {
      proveedorNombre: group.proveedorNombre,
      correoElectronico: info?.correoElectronico || group.correoContacto,
      asunto: info?.asunto || 'Confirmation de paiement',
      mensaje: info?.mensaje || 'Détails des paiements envoyés.',
      totalPagos: group.totalPagos,
      totalMonto: group.totalMonto,
      fechaEnvioTexto: fecha.toLocaleString()
    };

    this.showDetailsModal = true;
  }

  openEnvioHistorialInfo(envio: GmailEnvioHistorial): void {
    const fechaEnvioRaw = envio.fecha_envio;
    const fechaEnvio = fechaEnvioRaw ? new Date(fechaEnvioRaw) : new Date();

    const proveedorNombre = envio.proveedor?.nombre || 'Proveedor';
    const correo =
      envio.proveedor?.correo ||
      (envio as any).correo ||
      (envio as any).correo_destino ||
      (envio as any).correo_contacto ||
      '';

    const mensaje =
      envio.cuerpo_correo ||
      (envio as any).mensaje ||
      (envio as any).cuerpo_correo ||
      '';

    const pagosDetallados = ((envio as any).pagos || []) as {
      id_pago: number;
      cliente: string;
      monto: number;
      codigo: string;
      fecha_creacion?: string;
      tipo_pago?: string;
      medio_pago?: {
        titular?: string;
        numero?: string;
        tipo_tarjeta?: string;
        cuenta?: string;
        moneda?: string;
      };
    }[];

    this.selectedEmailInfo = {
      proveedorNombre,
      correoElectronico: correo,
      asunto: envio.asunto,
      mensaje,
      totalPagos: envio.cantidad_pagos,
      totalMonto: envio.monto_total,
      fechaEnvioTexto: fechaEnvio.toLocaleString(),
      pagosDetallados
    };

    this.showDetailsModal = true;
    this.cdr.markForCheck();
  }

  openEnvioFromSummary(group: GmailEmailGroup): void {
    const envioMatch = this.enviosHoy.find((envio) => {
      const nombreProveedor = envio.proveedor?.nombre || '';
      return nombreProveedor === group.proveedorNombre;
    });

    if (envioMatch) {
      this.openEnvioHistorialInfo(envioMatch);
      return;
    }

    this.openEmailInfo(group);
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
  }
}
