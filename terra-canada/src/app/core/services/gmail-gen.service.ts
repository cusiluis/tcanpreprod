import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ApiResponse } from './pago.service';

export interface GmailPaymentRecord {
  id: number;
  cliente: string;
  monto: number;
  codigo: string;
}

export type GmailGroupEstado = 'pendiente' | 'enviado';

export interface GmailUltimoEnvio {
  correoElectronico: string;
  asunto: string;
  mensaje: string;
  fechaEnvio: string;
}

export interface GmailEmailGroup {
  id: number;
  proveedorNombre: string;
  correoContacto: string;
  color: 'teal' | 'brown';
  estado: GmailGroupEstado;
  pagos: GmailPaymentRecord[];
  totalPagos: number;
  totalMonto: number;
  fechaResumen?: string;
  ultimoEnvio?: GmailUltimoEnvio;
}

export interface GmailEnvioHistorialPagoMedio {
  titular?: string;
  numero?: string;
  tipo_tarjeta?: string;
  cuenta?: string;
  moneda?: string;
}

export interface GmailEnvioHistorialPago {
  id_pago: number;
  cliente: string;
  monto: number;
  codigo: string;
  fecha_creacion?: string;
  tipo_pago?: string;
  medio_pago?: GmailEnvioHistorialPagoMedio;
}

export interface GmailEnvioHistorial {
  id_envio: number;
  proveedor: {
    id: number;
    nombre: string;
    correo?: string;
  };
  fecha_resumen: string;
  cantidad_pagos: number;
  monto_total: number;
  asunto: string;
  cuerpo_correo?: string;
  fecha_envio: string;
  estado: string;
  pagos?: GmailEnvioHistorialPago[];
}

@Injectable({
  providedIn: 'root'
})
export class GmailGenService {
  private apiUrl = 'https://terra-canada-test-back.vamw1k.easypanel.host/api/v1/gmail-gen';

  constructor(private http: HttpClient) {}

  getResumenPagosDia(fecha?: string): Observable<ApiResponse<GmailEmailGroup[]>> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }

    return this.http.get<ApiResponse<GmailEmailGroup[]>>(
      `${this.apiUrl}/resumen`,
      { params }
    );
  }

  getCorreosPendientesGeneral(): Observable<ApiResponse<GmailEmailGroup[]>> {
    return this.http.get<ApiResponse<GmailEmailGroup[]>>(
      `${this.apiUrl}/pendientes-general`
    );
  }

  getResumenEnviosFecha(fecha?: string): Observable<ApiResponse<GmailEmailGroup[]>> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }

    return this.http.get<ApiResponse<GmailEmailGroup[]>>(
      `${this.apiUrl}/enviados-resumen`,
      { params }
    );
  }

  enviarCorreoProveedor(input: {
    proveedorId: number;
    fecha?: string;
    asunto?: string;
    mensaje?: string;
  }): Observable<ApiResponse<any>> {
    const body: any = {
      proveedor_id: input.proveedorId
    };

    if (input.fecha) {
      body.fecha = input.fecha;
      body.fecha_resumen = input.fecha;
    }

    if (input.asunto) {
      body.asunto = input.asunto;
    }

    if (input.mensaje) {
      body.mensaje = input.mensaje;
    }

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/enviar`, body);
  }

  getHistorialEnvios(
    limit: number = 50,
    offset: number = 0
  ): Observable<ApiResponse<GmailEnvioHistorial[]>> {
    let params = new HttpParams()
      .set('limit', String(limit))
      .set('offset', String(offset));

    return this.http.get<ApiResponse<GmailEnvioHistorial[]>>(
      `${this.apiUrl}/historial`,
      { params }
    );
  }
}
