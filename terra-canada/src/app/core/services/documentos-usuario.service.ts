import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ApiResponse } from './pago.service';

export interface DocumentoUsuarioResumen {
  id_documento: number;
  nombre_documento: string;
  tipo_documento: string;
  fecha_subida: string;
  usuario_cargo: string;
  proveedor: string | null;
  codigo_reserva: string | null;
  origen_pago: string | null;
  id_pago: number | null;
}

export interface DocumentoUsuarioDetalle extends DocumentoUsuarioResumen {
  id_usuario: number;
  base64: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentosUsuarioService {
  private apiUrl = 'https://terra-canada-test-back.vamw1k.easypanel.host/api/v1/documentos-usuario';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los documentos visibles para el usuario autenticado,
   * opcionalmente filtrando por fecha única (fecha_desde = fecha_hasta)
   * y término de búsqueda.
   */
  getDocumentos(options?: {
    fecha?: string;
    terminoBusqueda?: string;
    limit?: number;
    offset?: number;
    usuarioIdFiltro?: number;
  }): Observable<ApiResponse<DocumentoUsuarioResumen[]>> {
    let params = new HttpParams();

    if (options?.fecha) {
      params = params
        .set('fecha_desde', options.fecha)
        .set('fecha_hasta', options.fecha);
    }

    if (options?.terminoBusqueda) {
      params = params.set('termino_busqueda', options.terminoBusqueda);
    }

    if (typeof options?.limit === 'number') {
      params = params.set('limit', String(options.limit));
    }

    if (typeof options?.offset === 'number') {
      params = params.set('offset', String(options.offset));
    }

    if (typeof options?.usuarioIdFiltro === 'number') {
      params = params.set('usuario_id', String(options.usuarioIdFiltro));
    }

    return this.http.get<ApiResponse<DocumentoUsuarioResumen[]>>(this.apiUrl, {
      params
    });
  }

  /**
   * Obtener el detalle de un documento (incluye base64 para Ver/Descargar).
   */
  getDocumento(id: number): Observable<ApiResponse<DocumentoUsuarioDetalle>> {
    return this.http.get<ApiResponse<DocumentoUsuarioDetalle>>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Eliminar un documento (solo Admin con permiso eliminar_documento_usuario).
   */
  deleteDocumento(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
