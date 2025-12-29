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
  filter: 'hoy' | 'pasados' = 'hoy';

  pendingGroups: GmailEmailGroup[] = [];
  sentGroupsToday: GmailEmailGroup[] = [];
  historialEnvios: GmailEnvioHistorial[] = [];

  get enviosHoy(): GmailEnvioHistorial[] {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return this.historialEnvios.filter((envio) => {
      if (!envio.fecha_resumen) {
        return false;
      }

      const fecha = new Date(envio.fecha_resumen);
      if (Number.isNaN(fecha.getTime())) {
        return false;
      }

      const key = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      return key === todayKey;
    });
  }

  get enviosPasados(): GmailEnvioHistorial[] {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return this.historialEnvios.filter((envio) => {
      if (!envio.fecha_resumen) {
        return false;
      }

      const fecha = new Date(envio.fecha_resumen);
      if (Number.isNaN(fecha.getTime())) {
        return false;
      }

      const key = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      return key < todayKey;
    });
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
    this.cargarEnviadosHoy();
    this.cargarHistorial();
  }

  get filteredGroups(): GmailEmailGroup[] {
    if (this.filter !== 'hoy') {
      return [];
    }

    return this.pendingGroups;
  }

  cargarResumen(fecha?: string): void {
    this.isLoading = true;

    this.gmailGenService.getResumenPagosDia(fecha).subscribe({
      next: (response) => {
        this.isLoading = false;

        console.log('[Gmail-GEN] Resumen API response:', response);

        if (response.success && response.data) {
          this.pendingGroups = [...response.data];
          console.log('[Gmail-GEN] groups cargados (pendientes):', this.pendingGroups);
        } else {
          console.error(
            'Error obteniendo resumen de pagos para Gmail-GEN',
            response
          );
          this.pendingGroups = [];
        }

        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        console.error(
          'Error HTTP obteniendo resumen de pagos para Gmail-GEN',
          error
        );
        this.pendingGroups = [];
        this.cdr.markForCheck();
      }
    });
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

  setFilter(filter: 'hoy' | 'pasados'): void {
    this.filter = filter;
    this.cdr.markForCheck();
  }

  openComposeModal(group: GmailEmailGroup): void {
    this.selectedGroup = group;
    this.composeForm.para = group.correoContacto;
    this.composeForm.asunto = 'Confirmación de Pago';
    this.composeForm.mensaje = 'Hola, te envío los pagos que te hicimos. Revísalos.';
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
    this.isSending = true;

    this.gmailGenService
      .enviarCorreoProveedor({
        proveedorId,
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
          this.cargarEnviadosHoy();
          this.cargarHistorial();

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
      asunto: info?.asunto || 'Confirmación de Pago',
      mensaje: info?.mensaje || 'Detalle de pagos enviados.',
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
      (envio as any).correo ||
      (envio as any).correo_destino ||
      (envio as any).correo_contacto ||
      '';

    const mensaje =
      (envio as any).mensaje ||
      (envio as any).cuerpo_correo ||
      '';

    this.selectedEmailInfo = {
      proveedorNombre,
      correoElectronico: correo,
      asunto: envio.asunto,
      mensaje,
      totalPagos: envio.cantidad_pagos,
      totalMonto: envio.monto_total,
      fechaEnvioTexto: fechaEnvio.toLocaleString()
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
