import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import {
  PagoDisplay,
  PagoService,
  WebhookArchivoPdf
} from '../../../../core/services/pago.service';
import { EventoService } from '../../../../core/services/evento.service';

interface DocumentCard {
  id: string;
  title: string;
  icon: string;
  description: string;
  files: File[];
  scanMessage: string | null;
  scanError: string | null;
  isScanSuccess: boolean;
}

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss'
})
export class DocumentUploadComponent {
  @Input() pago: PagoDisplay | null = null;
  @Input() modulo: 'tarjetas' | 'c_bancarias' = 'tarjetas';

  isScanning = false;
  activeScanCardId: string | null = null;

  documentCards: DocumentCard[] = [
    {
      id: 'invoices',
      title: 'Facturas',
      icon: 'pi pi-file-pdf',
      description: 'Adjunta archivos o haz clic',
      files: [],
      scanMessage: null,
      scanError: null,
      isScanSuccess: false
    },
    {
      id: 'bank-doc',
      title: 'Documento Banco',
      icon: 'pi pi-file-word',
      description: 'Adjunta un archivo o haz clic',
      files: [],
      scanMessage: null,
      scanError: null,
      isScanSuccess: false
    }
  ];

  constructor(
    private pagoService: PagoService,
    private cdr: ChangeDetectorRef,
    private eventoService: EventoService
  ) {}

  onFileSelected(event: Event, cardId: string): void {
    // La tarjeta "Documento Banco" este1 deshabilitada temporalmente
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const card = this.documentCards.find((c) => c.id === cardId);
      if (card) {
        // Límite: 1 PDF para Documento Banco, 3 PDFs para Facturas
        const maxFiles = cardId === 'bank-doc' ? 1 : 3;
        const allFiles = Array.from(input.files);
        const pdfFiles = allFiles.filter((file) => {
          const type = file.type;
          const name = file.name.toLowerCase();
          return (
            type === 'application/pdf' ||
            type === 'application/x-pdf' ||
            name.endsWith('.pdf')
          );
        });

        if (pdfFiles.length === 0) {
          card.scanError = 'Solo se permiten archivos PDF.';
          return;
        }

        // Total de archivos que habría si se agregan todos los seleccionados
        const totalArchivos = card.files.length + pdfFiles.length;

        // Si se supera el máximo permitido, avisamos al usuario
        if (totalArchivos > maxFiles) {
          const limiteTexto = maxFiles === 1 ? '1 archivo PDF' : '3 archivos PDF';
          card.scanError = `Solo se pueden subir hasta ${limiteTexto} a la vez.`;
        } else {
          card.scanError = null;
        }

        const espacioDisponible = maxFiles - card.files.length;
        if (espacioDisponible <= 0) {
          // Ya alcanzó el máximo en esta tarjeta
          if (!card.scanError) {
            const limiteTexto = maxFiles === 1 ? '1 archivo PDF' : '3 archivos PDF';
            card.scanError = `Solo se permiten hasta ${limiteTexto}.`;
          }
          return;
        }

        const archivosAAgregar = pdfFiles.slice(0, espacioDisponible);

        archivosAAgregar.forEach((file) => {
          card.files.push(file);
        });

        console.log(`Files selected for ${cardId}:`, card.files);
      }
    }
  }

  triggerFileInput(cardId: string): void {
    const input = document.getElementById(`file-input-${cardId}`) as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  removeFile(cardId: string, index: number): void {
    const card = this.documentCards.find(c => c.id === cardId);
    if (card) {
      card.files.splice(index, 1);
    }
  }

  onScanCard(cardId: string): void {
    this.activeScanCardId = cardId;
    const targetCard = this.documentCards.find(c => c.id === cardId);
    if (targetCard) {
      targetCard.scanError = null;
      targetCard.scanMessage = null;
      targetCard.isScanSuccess = false;
    }

    const card = this.documentCards.find(c => c.id === cardId);
    if (!card || card.files.length === 0) {
      if (card) {
        card.scanError = 'Debes adjuntar al menos un archivo PDF antes de escanear.';
      }
      return;
    }

    const pdfFiles = card.files.filter((file) => {
      const type = file.type;
      const name = file.name.toLowerCase();
      return (
        type === 'application/pdf' ||
        type === 'application/x-pdf' ||
        name.endsWith('.pdf')
      );
    });

    if (pdfFiles.length === 0) {
      if (card) {
        card.scanError = 'Solo se permiten archivos PDF.';
      }
      return;
    }

    const maxFiles = cardId === 'bank-doc' ? 1 : 5;
    const limitedFiles = pdfFiles.slice(0, maxFiles);
    const archivos: WebhookArchivoPdf[] = [];
    const cantidadArchivos = limitedFiles.length;

    const leerArchivo = (index: number) => {
      if (index >= limitedFiles.length) {
        if (cardId === 'bank-doc') {
          const archivo = archivos[0];
          this.scanDocumentoBanco(archivo, cantidadArchivos);
        } else if (this.pago) {
          // Cuando hay pago seleccionado (escaneo desde una fila específica),
          // usamos el webhook edit_pago a través de scanPagoDocumento.
          const primer = archivos[0];
          this.scanDocumento(primer.base64, cantidadArchivos);
        } else {
          // Cuando no hay pago seleccionado (botón Subida de documentos),
          // enviamos todos los PDFs al webhook recibiendo_pdf.
          this.scanDocumentosRecibiendo(archivos, cantidadArchivos);
        }
        return;
      }

      const file = limitedFiles[index];
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';

        if (!base64) {
          if (card) {
            card.scanError = 'No se pudo leer el contenido del archivo PDF.';
            card.scanMessage = null;
          }
          this.isScanning = false;
          return;
        }

        archivos.push({
          nombre: file.name,
          tipo: file.type || 'application/pdf',
          base64
        });

        leerArchivo(index + 1);
      };

      reader.onerror = () => {
        if (card) {
          card.scanError = 'Error leyendo el archivo PDF.';
          card.scanMessage = null;
        }
        this.isScanning = false;
      };

      reader.readAsDataURL(file);
    };

    this.isScanning = true;
    if (card) {
      card.scanMessage = 'Escaneando documento...';
      card.scanError = null;
    }
    leerArchivo(0);
  }

  private scanDocumento(pdfBase64: string, cantidadArchivos: number): void {
    const card = this.documentCards.find(c => c.id === this.activeScanCardId);
    this.isScanning = true;
    if (card) {
      card.scanError = null;
      card.scanMessage = 'Escaneando documento...';
      card.isScanSuccess = false;
    }

    const pagoId = this.pago?.id;
    const numeroPresta = this.pago?.numero_presta;

    this.pagoService.scanPagoDocumento(pdfBase64, pagoId, numeroPresta).subscribe({
      next: (response) => {
        if (response?.code === 200 && response?.estado === true) {
          if (card) {
            card.isScanSuccess = true;
            card.scanMessage = response.mensaje || 'Documento validado correctamente.';
            card.scanError = null;
          }

          // Registrar evento de auditoría por escaneo de PDF asociado a un pago
          this.registrarEventoSubidaPdf('FACTURA', cantidadArchivos);

          // Tras un escaneo exitoso, recargamos los pagos para reflejar
          // posibles cambios de estado en las tablas que usan PagoService.
          this.pagoService.recargarPagos();
        } else {
          const errorText =
            response?.error || response?.mensaje || 'Error al validar el documento.';
          if (card) {
            card.isScanSuccess = false;
            card.scanError = errorText;
            card.scanMessage = null;
          }
        }
        this.isScanning = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (card) {
          card.isScanSuccess = false;
          card.scanError =
          error.error?.error ||
          error.error?.mensaje ||
          error.message ||
          'Error desconocido al escanear el documento.';
          card.scanMessage = null;
        }
        this.isScanning = false;
        this.cdr.detectChanges();
      }
    });
  }

  private scanDocumentosRecibiendo(
    archivos: WebhookArchivoPdf[],
    cantidadArchivos: number
  ): void {
    const card = this.documentCards.find((c) => c.id === this.activeScanCardId);
    this.isScanning = true;
    if (card) {
      card.scanError = null;
      card.scanMessage = 'Escaneando documento...';
      card.isScanSuccess = false;
    }

    this.pagoService.enviarDocumentosRecibiendoPdf(archivos, this.modulo).subscribe({
      next: (response) => {
        if (response?.code === 200 && response?.estado === true) {
          if (card) {
            card.isScanSuccess = true;
            card.scanMessage =
              response.mensaje || 'Documentos enviados correctamente.';
            card.scanError = null;
          }

          // Registrar evento de auditoría por envío de uno o varios PDFs
          this.registrarEventoSubidaPdf('RECIBIENDO', cantidadArchivos);
        } else {
          const errorText =
            response?.error || response?.mensaje || 'Error al procesar los documentos.';
          if (card) {
            card.isScanSuccess = false;
            card.scanError = errorText;
            card.scanMessage = null;
          }
        }
        this.isScanning = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (card) {
          card.isScanSuccess = false;
          card.scanError =
            error.error?.error ||
            error.error?.mensaje ||
            error.message ||
            'Error desconocido al escanear el documento.';
          card.scanMessage = null;
        }
        this.isScanning = false;
        this.cdr.detectChanges();
      }
    });
  }

  private scanDocumentoBanco(
    archivo: WebhookArchivoPdf,
    cantidadArchivos: number
  ): void {
    const card = this.documentCards.find((c) => c.id === this.activeScanCardId);
    this.isScanning = true;
    if (card) {
      card.scanError = null;
      card.scanMessage = 'Escaneando documento...';
      card.isScanSuccess = false;
    }

    this.pagoService.enviarDocumentoBancoPdf(archivo, this.modulo).subscribe({
      next: (response) => {
        if (response?.code === 200 && response?.estado === true) {
          if (card) {
            card.isScanSuccess = true;
            card.scanMessage =
              response.mensaje || 'Documento de banco enviado correctamente.';
            card.scanError = null;
          }

          // Registrar evento de auditoría por envío de PDF de banco
          this.registrarEventoSubidaPdf('RECIBIENDO', cantidadArchivos);
        } else {
          const errorText =
            response?.error || response?.mensaje || 'Error al procesar el documento de banco.';
          if (card) {
            card.isScanSuccess = false;
            card.scanError = errorText;
            card.scanMessage = null;
          }
        }
        this.isScanning = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (card) {
          card.isScanSuccess = false;
          card.scanError =
          error.error?.error ||
          error.error?.mensaje ||
          error.message ||
          'Error desconocido al escanear el documento de banco.';
          card.scanMessage = null;
        }
        this.isScanning = false;
        this.cdr.detectChanges();
      }
    });
  }

  private registrarEventoSubidaPdf(
    origen: 'FACTURA' | 'RECIBIENDO',
    cantidadArchivos: number
  ): void {
    const tienePagoAsociado = !!this.pago;
    const tipo_entidad = tienePagoAsociado ? 'PAGO' : 'DOCUMENTO';
    const entidad_id = tienePagoAsociado ? this.pago!.id : undefined;

    const descripcionBase = origen === 'FACTURA'
      ? `Escaneo de ${cantidadArchivos} documento(s) PDF asociado al pago ${this.pago?.numero_presta ?? ''}`
      : `Subida de ${cantidadArchivos} documento(s) PDF desde el mf3dulo de Subida de documentos`;

    this.eventoService.registrarEvento({
      tipo_evento: 'ACCION',
      accion: 'VERIFICAR_PAGO',
      tipo_entidad,
      entidad_id,
      descripcion: descripcionBase
    }).subscribe({
      next: () => {
        console.log('Evento de subida/escaneo de PDF registrado correctamente');
      },
      error: (error) => {
        console.error('Error registrando evento de subida/escaneo de PDF:', error);
      }
    });
  }
}
