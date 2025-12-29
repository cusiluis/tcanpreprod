import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, shareReplay, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Pago {
  id?: number;
  cliente_id: number;
  proveedor_id: number;
  correo_proveedor?: string;
  tarjeta_id: number;
  monto: number;
  numero_presta: string;
  registrado_por_usuario_id?: number;
  comentarios?: string;
  estado?: string;
  esta_verificado?: boolean;
  fecha_creacion?: string;
  fecha_verificacion?: string;
  enviado_correo?: boolean;
}

export interface PagoDisplay {
  id: number;
  monto: number;
  numero_presta: string;
  estado: string;
  esta_verificado: boolean;
  enviado_correo?: boolean;
  fecha_creacion: string;
  cliente: {
    id: number;
    nombre: string;
  };
  proveedor: {
    id: number;
    nombre: string;
    servicio?: string;
  };
  tarjeta: {
    id: number;
    tipo: string;
    numero_enmascarado: string;
  };
  registrado_por: {
    id: number;
    nombre_completo: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
}

export interface PagoScanResponse {
  code: number;
  estado: boolean;
  mensaje: string;
  error?: string;
}

export interface WebhookArchivoPdf {
  nombre: string;
  tipo: string;
  base64: string;
}

export interface WebhookModalEvent {
  message: string;
  codes: string[];
  isError: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = 'https://terra-canada-test-back.vamw1k.easypanel.host/api/v1/pagos';
  private pagosSubject = new BehaviorSubject<PagoDisplay[]>([]);
  public pagos$ = this.pagosSubject.asObservable();
  private webhookModalSubject = new Subject<WebhookModalEvent>();
  public webhookModal$ = this.webhookModalSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Cargar todos los pagos
   */
  cargarPagos(usuarioId?: number, estado: string = 'todos', verificacion: string = 'todos'): void {
    console.log('PagoService.cargarPagos() - Iniciando carga de pagos');
    
    this.getAll(usuarioId, estado, verificacion).subscribe({
      next: (response) => {
        console.log('PagoService.cargarPagos() - Respuesta recibida:', response);
        if (response.success && response.data) {
          let pagos: PagoDisplay[] = [];
          
          if (Array.isArray(response.data)) {
            // Mapear datos del backend a estructura PagoDisplay
            pagos = response.data.map((pago: any) => ({
              id: pago.id,
              monto: pago.monto,
              numero_presta: pago.numero_presta,
              estado: pago.estado,
              esta_verificado: pago.esta_verificado,
              enviado_correo: !!pago.enviado_correo,
              fecha_creacion: pago.fecha_creacion,
              cliente: {
                id: pago.Cliente?.id || pago.cliente?.id || 0,
                nombre: pago.Cliente?.nombre || pago.cliente?.nombre || 'N/A'
              },
              proveedor: {
                id: pago.Proveedor?.id || pago.proveedor?.id || 0,
                nombre: pago.Proveedor?.nombre || pago.proveedor?.nombre || 'N/A',
                servicio: pago.Proveedor?.servicio || pago.proveedor?.servicio || undefined
              },
              tarjeta: {
                id: pago.tarjeta?.id || 0,
                tipo: pago.tarjeta?.tipo || 'N/A',
                numero_enmascarado: pago.tarjeta?.numero_enmascarado || '****'
              },
              registrado_por: {
                id: pago.registradoPor?.id || pago.registrado_por?.id || 0,
                nombre_completo: pago.registradoPor?.nombre_completo || pago.registrado_por?.nombre_completo || 'N/A'
              }
            }));
          }
          
          console.log('PagoService.cargarPagos() - Pagos mapeados:', pagos);
          console.log('PagoService.cargarPagos() - Emitiendo datos al BehaviorSubject');
          this.pagosSubject.next(pagos);
        } else {
          console.warn('PagoService.cargarPagos() - Respuesta sin datos:', response);
          this.pagosSubject.next([]);
        }
      },
      error: (error) => {
        console.error('PagoService.cargarPagos() - Error HTTP:', error.status, error.statusText);
        console.error('PagoService.cargarPagos() - Mensaje:', error.error?.error?.message || error.message);
        // No emitir array vacío en caso de error, mantener los datos anteriores
        // Esto evita que la tabla desaparezca cuando hay un error de recarga
        console.warn('PagoService.cargarPagos() - Manteniendo datos anteriores debido al error');
      }
    });
  }

  /**
   * Recargar pagos (útil después de crear/actualizar/eliminar)
   */
  recargarPagos(): void {
    console.log('PagoService.recargarPagos() - Recargando pagos');
    this.cargarPagos();
  }

  /**
   * Obtener todos los pagos
   */
  getAll(usuarioId?: number, estado: string = 'todos', verificacion: string = 'todos'): Observable<ApiResponse<PagoDisplay[]>> {
    let params = new HttpParams();
    if (usuarioId) {
      params = params.set('usuario_id', usuarioId.toString());
    }
    params = params.set('estado', estado);
    params = params.set('verificacion', verificacion);

    return this.http.get<ApiResponse<PagoDisplay[]>>(`${this.apiUrl}`, { params });
  }

  /**
   * Obtener un pago por ID
   */
  getById(id: number): Observable<ApiResponse<PagoDisplay>> {
    return this.http.get<ApiResponse<PagoDisplay>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear un nuevo pago
   */
  create(pago: Pago): Observable<ApiResponse<Pago>> {
    console.log('PagoService.create() - Creando pago:', pago);
    return this.http.post<ApiResponse<Pago>>(`${this.apiUrl}`, pago);
  }

  /**
   * Actualizar pago (estado, verificación, comentarios)
   */
  update(id: number, data: any): Observable<ApiResponse<Pago>> {
    console.log('PagoService.update() - Actualizando pago:', id, data);
    return this.http.put<ApiResponse<Pago>>(`${this.apiUrl}/${id}`, data);
  }

  scanPagoDocumento(
    pdfBase64: string,
    pagoId?: number,
    numeroPresta?: string
  ): Observable<PagoScanResponse> {
    const url = 'https://n8n.salazargroup.cloud/webhook/edit_pago';

    const payload: any = {
      pdf_base64: pdfBase64
    };

    if (pagoId) {
      payload.pagoId = pagoId;
    }

    if (numeroPresta) {
      payload.numero_presta = numeroPresta;
    }

    return this.http.post<PagoScanResponse>(url, payload).pipe(
      tap((response) => {
        console.log('PagoService.scanPagoDocumento - Respuesta webhook edit_pago:', response);
      })
    );
  }

  /**
   * Enviar uno o varios documentos PDF al webhook recibiendo_pdf
   * sin modificar estados ni verificación de pagos.
   */
  enviarDocumentosRecibiendoPdf(
    archivos: WebhookArchivoPdf[]
  ): Observable<PagoScanResponse> {
    const currentUser = this.authService.getCurrentUser();

    const usuario =
      currentUser?.nombre_completo ||
      (currentUser as any)?.username ||
      'Desconocido';
    const id_usuario = currentUser?.id ? Number(currentUser.id) : 0;
    const rolNombre = currentUser?.rol_nombre?.toLowerCase() || '';
    const tipo_usuario = rolNombre === 'administrador' ? 'admin' : rolNombre || 'desconocido';

    const payload: any = {
      usuario,
      id_usuario,
      tipo_usuario,
      ip: '',
      archivos
    };

    const headers = new HttpHeaders({
      authorization:
        'Basic QWRtaW5pc3RyYWRvcjpuOG5jNzc3LTRkNTctYTYwOS02ZWFmMWY5ZTg3ZjZ0ZXJyYWNhbmFkYQ==',
      'content-type': 'application/json'
    });

    const url = 'https://n8n.salazargroup.cloud/webhook/recibiendo_pdf';

    return this.http.post<PagoScanResponse>(url, payload, { headers }).pipe(
      tap((response: any) => {
        console.log(
          'PagoService.enviarDocumentosRecibiendoPdf - Respuesta webhook recibiendo_pdf:',
          response
        );

        const code = typeof response?.code === 'number' ? response.code : undefined;
        const estado = typeof response?.estado === 'boolean' ? response.estado : undefined;
        const mensaje = typeof response?.mensaje === 'string' ? response.mensaje : undefined;
        const facturas = Array.isArray(response?.facturas) ? response.facturas : [];

        let event: WebhookModalEvent | null = null;

        if (code === 200 && estado === true) {
          const codes = facturas
            .map((f: any) => f?.Code ?? f?.code)
            .filter((c: any) => !!c)
            .map((c: any) => String(c));

          if (codes.length > 0) {
            const message = mensaje || 'Codigos Encontrados';
            event = { message, codes, isError: false };
          } else {
            const message =
              mensaje ||
              'Parece ser que no eh encontrado pagos con el archivo enviado';
            event = { message, codes: [], isError: false };
          }
        } else if (code === 400 || estado === false) {
          let message = mensaje || 'Algo salio mal';
          if (response?.error) {
            message += `\n\nDetalle: ${response.error}`;
          }
          event = { message, codes: [], isError: true };
        }

        if (event) {
          this.webhookModalSubject.next(event);
        }
      })
    );
  }

  /**
   * Enviar un único documento PDF al webhook recibiendo_banco_pdf
   * con la misma estructura de respuesta que recibiendo_pdf.
   * Se reutiliza la lógica de emisión del modal de resultado.
   */
  enviarDocumentoBancoPdf(
    archivo: WebhookArchivoPdf
  ): Observable<PagoScanResponse> {
    const currentUser = this.authService.getCurrentUser();

    const usuario =
      currentUser?.nombre_completo ||
      (currentUser as any)?.username ||
      'Desconocido';
    const id_usuario = currentUser?.id ? Number(currentUser.id) : 0;
    const rolNombre = currentUser?.rol_nombre?.toLowerCase() || '';
    const tipo_usuario = rolNombre === 'administrador' ? 'admin' : rolNombre || 'desconocido';

    const payload: any = {
      usuario,
      id_usuario,
      tipo_usuario,
      ip: '',
      archivos: [archivo]
    };

    const headers = new HttpHeaders({
      authorization:
        'Basic Y2FuYWRhOmNhS0whbmEuZGEuMTIuLjM=',
      'content-type': 'application/json'
    });

    const url = 'https://n8n.salazargroup.cloud/webhook/recibiendo_banco_pdf';

    return this.http.post<PagoScanResponse>(url, payload, { headers }).pipe(
      tap((response: any) => {
        console.log(
          'PagoService.enviarDocumentoBancoPdf - Respuesta webhook recibiendo_banco_pdf:',
          response
        );

        const code = typeof response?.code === 'number' ? response.code : undefined;
        const estado = typeof response?.estado === 'boolean' ? response.estado : undefined;
        const mensaje = typeof response?.mensaje === 'string' ? response.mensaje : undefined;
        const facturas = Array.isArray(response?.facturas) ? response.facturas : [];

        let event: WebhookModalEvent | null = null;

        if (code === 200 && estado === true) {
          const codes = facturas
            .map((f: any) => f?.Code ?? f?.code)
            .filter((c: any) => !!c)
            .map((c: any) => String(c));

          if (codes.length > 0) {
            const message = mensaje || 'Codigos Encontrados';
            event = { message, codes, isError: false };
          } else {
            const message =
              mensaje ||
              'Parece ser que no eh encontrado pagos con el archivo enviado';
            event = { message, codes: [], isError: false };
          }
        } else if (code === 400 || estado === false) {
          let message = mensaje || 'Algo salio mal';
          if (response?.error) {
            message += `\n\nDetalle: ${response.error}`;
          }
          event = { message, codes: [], isError: true };
        }

        if (event) {
          this.webhookModalSubject.next(event);
        }
      })
    );
  }

  /**
   * Desactivar un pago (soft delete)
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Eliminar un pago permanentemente
   */
  deletePermanente(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}/permanente`);
  }
}
