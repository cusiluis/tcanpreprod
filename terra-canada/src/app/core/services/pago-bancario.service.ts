import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface PagoBancario {
  id: number;
  cliente_id: number;
  proveedor_id: number;
  correo_proveedor: string;
  cuenta_bancaria_id: number;
  monto: number;
  numero_presta: string;
  comentarios?: string;
  estado: 'A PAGAR' | 'PAGADO';
  esta_verificado: boolean;
  esta_activo: boolean;
  registrado_por_usuario_id: number;
  verificado_por_usuario_id?: number;
  fecha_verificacion?: Date;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  enviado_correo?: boolean;
  cliente?: { id: number; nombre: string };
  proveedor?: { id: number; nombre: string };
  cuenta_bancaria?: { id: number; numero_cuenta: string; nombre_banco: string };
  registrado_por?: { id: number; nombre_completo: string };
  verificado_por?: { id: number; nombre_completo: string };
}

export interface PagoBancarioResponse {
  status: number;
  message: string;
  data: PagoBancario | PagoBancario[] | any;
}

export interface PagoBancarioUpdatePayload {
  nuevoEstado: 'A PAGAR' | 'PAGADO';
  nuevaVerificacion: boolean;
  verificadoPorUsuarioId?: number;
}

export interface PagoBancarioScanResponse {
  code: number;
  estado: boolean;
  mensaje: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PagoBancarioService {
  private apiUrl = 'http://localhost:3000/api/v1/pagos-bancarios';
  private pagoBancarios$ = new BehaviorSubject<PagoBancario[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtener headers con token de autenticación
   * Nota: El interceptor de autenticación se encargará de agregar el token
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtener todos los pagos bancarios
   */
  getAll(
    estado: 'todos' | 'A PAGAR' | 'PAGADO' = 'todos',
    verificacion: 'todos' | 'verificados' | 'no_verificados' = 'todos'
  ): Observable<PagoBancarioResponse> {
    let params = new HttpParams();
    params = params.set('estado', estado);
    params = params.set('verificacion', verificacion);

    return this.http.get<PagoBancarioResponse>(this.apiUrl, { 
      params,
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        if (response.data && Array.isArray(response.data)) {
          this.pagoBancarios$.next(response.data);
        }
      })
    );
  }

  /**
   * Obtener un pago bancario por ID
   */
  getById(id: number): Observable<PagoBancarioResponse> {
    return this.http.get<PagoBancarioResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Crear un nuevo pago bancario
   */
  create(pagoBancario: Partial<PagoBancario>): Observable<PagoBancarioResponse> {
    const token = localStorage.getItem('token');
    console.log('PagoBancarioService.create() - Token:', token ? 'presente' : 'ausente');
    console.log('PagoBancarioService.create() - Datos a enviar:', pagoBancario);
    console.log('PagoBancarioService.create() - URL:', this.apiUrl);
    
    return this.http.post<PagoBancarioResponse>(this.apiUrl, pagoBancario, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('PagoBancarioService.create() - Respuesta exitosa:', response);
        // Recargar lista después de crear
        this.getAll().subscribe();
      })
    );
  }

  /**
   * Actualizar estado y verificación de un pago bancario
   */
  update(id: number, data: PagoBancarioUpdatePayload): Observable<PagoBancarioResponse> {
    return this.http.put<PagoBancarioResponse>(`${this.apiUrl}/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        // Recargar lista después de actualizar
        this.getAll().subscribe();
      })
    );
  }

  /**
   * Eliminar un pago bancario (soft delete)
   */
  delete(id: number): Observable<PagoBancarioResponse> {
    return this.http.delete<PagoBancarioResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        // Recargar lista después de eliminar
        this.getAll().subscribe();
      })
    );
  }

  /**
   * Eliminar permanentemente un pago bancario
   */
  deletePermanente(id: number): Observable<PagoBancarioResponse> {
    return this.http.delete<PagoBancarioResponse>(`${this.apiUrl}/${id}/permanente`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        // Recargar lista después de eliminar
        this.getAll().subscribe();
      })
    );
  }

  /**
   * Obtener resumen de pagos bancarios
   */
  getResumen(): Observable<PagoBancarioResponse> {
    return this.http.get<PagoBancarioResponse>(`${this.apiUrl}/resumen`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener todas las cuentas bancarias
   */
  getCuentasBancarias(): Observable<any> {
    const cuentasUrl = 'http://localhost:3000/api/v1/cuentas-bancarias';
    console.log('PagoBancarioService.getCuentasBancarias() - Obteniendo cuentas desde:', cuentasUrl);
    return this.http.get<any>(cuentasUrl, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('PagoBancarioService.getCuentasBancarias() - Respuesta recibida:', response);
      })
    );
  }

  /**
   * Observable de pagos bancarios
   */
  get pagoBancarios(): Observable<PagoBancario[]> {
    return this.pagoBancarios$.asObservable();
  }

  /**
   * Cargar pagos bancarios
   */
  loadPagoBancarios(
    estado: 'todos' | 'A PAGAR' | 'PAGADO' = 'todos',
    verificacion: 'todos' | 'verificados' | 'no_verificados' = 'todos'
  ): void {
    this.getAll(estado, verificacion).subscribe();
  }

  /**
   * Escanear documento PDF de un pago bancario mediante webhook externo
   */
  scanPagoDocumento(
    pdfBase64: string,
    pagoId: number,
    numeroPresta?: string
  ): Observable<PagoBancarioScanResponse> {
    const url = 'https://n8n.salazargroup.cloud/webhook/edit_pago';

    const payload: any = {
      pagoId,
      pdf_base64: pdfBase64
    };

    if (numeroPresta) {
      payload.numero_presta = numeroPresta;
    }

    return this.http.post<PagoBancarioScanResponse>(url, payload, {
      headers: this.getHeaders()
    });
  }
}
