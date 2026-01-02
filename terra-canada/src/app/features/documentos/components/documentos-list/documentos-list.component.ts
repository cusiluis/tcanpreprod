import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import {
  DocumentosUsuarioService,
  DocumentoUsuarioResumen
} from '../../../../core/services/documentos-usuario.service';
import { AuthService } from '../../../../core/services/auth.service';

interface Documento {
  id: number;
  nombre: string;
  fecha: string;
  tipo: string;
  proveedor?: string | null;
  codigo_reserva?: string | null;
}

interface ModuloDocumentos {
  nombre: string;
  modulo: 'equipo-tarjetas' | 'financieros-bancaria' | 'financieros-tarjetas';
  documentos: Documento[];
}

@Component({
  selector: 'app-documentos-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './documentos-list.component.html',
  styleUrl: './documentos-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentosListComponent implements OnInit, OnChanges {
  @Input() dateFilter: string = '';
  @Input() searchTerm: string = '';

  modulosDocumentos: ModuloDocumentos[] = [];
  filteredModulosDocumentos: ModuloDocumentos[] = [];

  loading = false;
  errorMessage: string | null = null;
  isAdmin: boolean;
  private isEquipo: boolean;
  canView: boolean;
  canDelete: boolean;
  private currentUserNombre: string | null;

  // Estado para visor de documentos (modal)
  documentModalVisible = false;
  documentModalNombre: string | null = null;
  documentModalUrl: SafeResourceUrl | null = null;
  documentModalLoading = false;
  documentModalError: string | null = null;
  private documentObjectUrl: string | null = null;

  // Toasts de confirmación
  showSuccessToast = false;
  successToastMessage = '';
  showErrorToast = false;
  errorToastMessage = '';

  // Modal de confirmación de eliminación
  confirmDeleteVisible = false;
  deleting = false;
  confirmDeleteError: string | null = null;
  documentoPendienteEliminar: Documento | null = null;

  constructor(
    private documentosService: DocumentosUsuarioService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {
    this.isAdmin = this.authService.isAdmin();
    this.isEquipo = this.authService.isEquipo();
    this.canView =
      this.isAdmin || this.authService.hasPermission('ver_documentos_usuario');
    this.canDelete =
      this.isAdmin || this.authService.hasPermission('eliminar_documento_usuario');
    const currentUser = this.authService.getCurrentUser();
    const nombre =
      (currentUser?.nombre_completo || currentUser?.username || '').toLowerCase();
    this.currentUserNombre = nombre || null;
  }

  ngOnInit(): void {
    this.loadDocumentos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dateFilter'] || changes['searchTerm']) {
      this.loadDocumentos();
    }
  }

  private loadDocumentos(): void {
    this.loading = true;
    this.errorMessage = null;

    console.log('DocumentosListComponent.loadDocumentos() - filtros', {
      fecha: this.dateFilter,
      terminoBusqueda: this.searchTerm
    });

    this.documentosService
      .getDocumentos({
        fecha: this.dateFilter || undefined,
        terminoBusqueda: this.searchTerm || undefined
      })
      .subscribe({
        next: (response) => {
          console.log(
            'DocumentosListComponent.loadDocumentos() - respuesta del backend',
            response
          );
          if (response.success && Array.isArray(response.data)) {
            this.mapDocumentos(response.data as DocumentoUsuarioResumen[]);
          } else {
            this.modulosDocumentos = [];
            this.filteredModulosDocumentos = [];
            this.errorMessage =
              (response as any)?.error?.message || 'Error obteniendo documentos';
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('DocumentosListComponent.loadDocumentos - Error', error);
          this.modulosDocumentos = [];
          this.filteredModulosDocumentos = [];
          this.errorMessage =
            error?.error?.error?.message || 'Error obteniendo documentos';
          this.loading = false;
           this.cdr.markForCheck();
        }
      });
  }

  private mapDocumentos(data: DocumentoUsuarioResumen[]): void {
    console.log('DocumentosListComponent.mapDocumentos() - data cruda', data);
    const baseModulos: ModuloDocumentos[] = [
      {
        nombre: 'Tarjetas',
        modulo: 'equipo-tarjetas',
        documentos: []
      },
      {
        nombre: 'Financieros - C. Bancaria',
        modulo: 'financieros-bancaria',
        documentos: []
      },
      {
        nombre: 'Financieros - Tarjetas',
        modulo: 'financieros-tarjetas',
        documentos: []
      }
    ];

    data.forEach((doc) => {
      const fecha = doc.fecha_subida ? doc.fecha_subida.substring(0, 10) : '';
      const tipo = this.getDisplayTipo(doc);

      const documentoVista: Documento = {
        id: doc.id_documento,
        nombre: doc.nombre_documento,
        fecha,
        tipo,
        proveedor: doc.proveedor,
        codigo_reserva: doc.codigo_reserva
      };

      const origen = (doc.origen_pago || '').toUpperCase();
      const prominencia = (doc.prominencia || '').toLowerCase();
      const usuarioCargo = (doc.usuario_cargo || '').toLowerCase();
      const subidoPorUsuarioActual =
        !!this.currentUserNombre && usuarioCargo === this.currentUserNombre;

      if (prominencia === 'c_bancarias') {
        const moduloBancario = baseModulos.find(
          (m) => m.modulo === 'financieros-bancaria'
        );
        moduloBancario?.documentos.push(documentoVista);
      } else if (prominencia === 'tarjetas') {
        if (this.isAdmin && subidoPorUsuarioActual) {
          const moduloTarjetas = baseModulos.find(
            (m) => m.modulo === 'financieros-tarjetas'
          );
          moduloTarjetas?.documentos.push(documentoVista);
        } else {
          const moduloEquipo = baseModulos.find(
            (m) => m.modulo === 'equipo-tarjetas'
          );
          moduloEquipo?.documentos.push(documentoVista);
        }
      } else {
        // Fallback para documentos antiguos sin prominencia: usar origen_pago
        if (origen === 'BANCARIO') {
          const moduloBancario = baseModulos.find(
            (m) => m.modulo === 'financieros-bancaria'
          );
          moduloBancario?.documentos.push(documentoVista);
        } else {
          if (this.isAdmin && subidoPorUsuarioActual) {
            const moduloTarjetas = baseModulos.find(
              (m) => m.modulo === 'financieros-tarjetas'
            );
            moduloTarjetas?.documentos.push(documentoVista);
          } else {
            const moduloEquipo = baseModulos.find(
              (m) => m.modulo === 'equipo-tarjetas'
            );
            moduloEquipo?.documentos.push(documentoVista);
          }
        }
      }
    });

    this.modulosDocumentos = baseModulos;
    console.log(
      'DocumentosListComponent.mapDocumentos() - modulosDocumentos mapeados',
      this.modulosDocumentos
    );
    this.applyRoleFilter();
  }

  private applyRoleFilter(): void {
    if (this.isAdmin) {
      this.filteredModulosDocumentos = this.modulosDocumentos.filter(
        (m) => m.modulo !== 'financieros-tarjetas'
      );
    } else if (this.isEquipo) {
      this.filteredModulosDocumentos = this.modulosDocumentos.filter(
        (m) => m.modulo === 'equipo-tarjetas'
      );
    } else {
      this.filteredModulosDocumentos = this.modulosDocumentos.filter(
        (m) => m.modulo !== 'financieros-tarjetas'
      );
    }
    this.cdr.markForCheck();
  }

  private getDisplayTipo(doc: DocumentoUsuarioResumen): string {
    const tipo = (doc.tipo_documento || '').toLowerCase();
    const nombre = (doc.nombre_documento || '').toLowerCase();

    if (tipo.includes('pdf') || nombre.endsWith('.pdf')) {
      return 'PDF';
    }
    if (
      tipo.includes('jpg') ||
      tipo.includes('jpeg') ||
      nombre.endsWith('.jpg') ||
      nombre.endsWith('.jpeg')
    ) {
      return 'JPG';
    }
    if (tipo.includes('png') || nombre.endsWith('.png')) {
      return 'PNG';
    }

    return 'OTRO';
  }

  getFileIcon(tipo: string): string {
    if (tipo === 'PDF') return 'pi pi-file-pdf';
    if (tipo === 'JPG' || tipo === 'PNG') return 'pi pi-image';
    if (tipo === 'DOC' || tipo === 'DOCX') return 'pi pi-file-word';
    if (tipo === 'XLS' || tipo === 'XLSX') return 'pi pi-file-excel';
    return 'pi pi-file';
  }

  private getMimeType(tipo: string): string {
    const t = tipo.toUpperCase();
    if (t === 'PDF') {
      return 'application/pdf';
    }
    if (t === 'JPG' || t === 'JPEG') {
      return 'image/jpeg';
    }
    if (t === 'PNG') {
      return 'image/png';
    }
    return 'application/octet-stream';
  }

  viewDocument(documento: Documento): void {
    // Solo usuarios con permiso pueden ver documentos en el visor
    if (!this.canView) {
      return;
    }

    this.openDocumento(documento, 'view');
  }

  downloadDocument(documento: Documento): void {
    // Solo usuarios con permiso pueden descargar documentos
    if (!this.canView) {
      return;
    }

    this.openDocumento(documento, 'download');
  }

  private openDocumento(
    documento: Documento,
    action: 'view' | 'download'
  ): void {
    if (action === 'view') {
      // Preparar estado del modal
      this.documentModalVisible = true;
      this.documentModalLoading = true;
      this.documentModalError = null;
      this.documentModalNombre = documento.nombre;
      this.documentModalUrl = null;
      this.cdr.markForCheck();
    }

    this.documentosService.getDocumento(documento.id).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          console.error('No se pudo obtener el documento');
          if (action === 'view') {
            this.documentModalLoading = false;
            this.documentModalError = 'No se pudo obtener el documento';
            this.cdr.markForCheck();
          }
          return;
        }

        const detalle: any = response.data as any;
        const base64 = detalle.base64 as string;
        const tipo = documento.tipo;
        const mimeType = this.getMimeType(tipo);

        try {
          const byteCharacters = atob(base64);
          const byteNumbers = Array.from(byteCharacters, (c) =>
            c.charCodeAt(0)
          );
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const url = URL.createObjectURL(blob);

          if (action === 'download') {
            const a = document.createElement('a');
            a.href = url;
            a.download = documento.nombre;
            a.click();
            URL.revokeObjectURL(url);
          } else {
            // Visor en modal
            if (this.documentObjectUrl) {
              URL.revokeObjectURL(this.documentObjectUrl);
            }
            this.documentObjectUrl = url;
            this.documentModalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
              url
            );
            this.documentModalLoading = false;
          }

          this.cdr.markForCheck();
        } catch (error) {
          console.error('Error convirtiendo documento base64:', error);
          if (action === 'view') {
            this.documentModalLoading = false;
            this.documentModalError = 'Error mostrando el documento';
            this.cdr.markForCheck();
          }
        }
      },
      error: (error) => {
        console.error('Error obteniendo documento', error);
        if (action === 'view') {
          this.documentModalLoading = false;
          const backendMessage =
            error?.error?.error?.message || error?.error?.message || null;
          this.documentModalError =
            backendMessage || 'Error obteniendo el documento';
          this.cdr.markForCheck();
        }
      }
    });
  }

  closeDocumentModal(): void {
    if (this.documentObjectUrl) {
      URL.revokeObjectURL(this.documentObjectUrl);
      this.documentObjectUrl = null;
    }

    this.documentModalVisible = false;
    this.documentModalUrl = null;
    this.documentModalNombre = null;
    this.documentModalError = null;
    this.documentModalLoading = false;
    this.cdr.markForCheck();
  }

  deleteDocument(documento: Documento): void {
    // Solo usuarios con permiso explícito pueden eliminar
    if (!this.canDelete) {
      return;
    }

    this.documentoPendienteEliminar = documento;
    this.confirmDeleteError = null;
    this.confirmDeleteVisible = true;
    this.cdr.markForCheck();
  }

   confirmDelete(): void {
    if (!this.documentoPendienteEliminar) {
      return;
    }

    this.deleting = true;
    this.confirmDeleteError = null;
    const documento = this.documentoPendienteEliminar;

    this.documentosService.deleteDocumento(documento.id).subscribe({
      next: (response) => {
        this.deleting = false;

        if (!response.success) {
          const anyResp: any = response as any;
          const message =
            anyResp?.error?.message || 'Error eliminando documento';
          console.error('Error eliminando documento:', message);
          this.confirmDeleteError = message;
          this.errorToastMessage = message;
          this.showErrorToast = true;
          this.cdr.markForCheck();
          setTimeout(() => {
            this.showErrorToast = false;
            this.cdr.markForCheck();
          }, 3000);
          return;
        }

        // Éxito
        this.confirmDeleteVisible = false;
        this.documentoPendienteEliminar = null;
        this.successToastMessage = 'Documento eliminado correctamente';
        this.showSuccessToast = true;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.showSuccessToast = false;
          this.cdr.markForCheck();
        }, 3000);

        this.loadDocumentos();
      },
      error: (error) => {
        console.error('Error HTTP eliminando documento', error);
        this.deleting = false;
        this.confirmDeleteError = 'Error eliminando documento';
        this.errorToastMessage = 'Error eliminando documento';
        this.showErrorToast = true;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.showErrorToast = false;
          this.cdr.markForCheck();
        }, 3000);
      }
    });
  }

  cancelDelete(): void {
    this.confirmDeleteVisible = false;
    this.deleting = false;
    this.confirmDeleteError = null;
    this.documentoPendienteEliminar = null;
    this.cdr.markForCheck();
  }
}
