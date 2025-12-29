import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  AnalisisCompleto,
  EMPTY_ANALISIS_COMPLETO
} from '../../shared/models/analisis.model';

@Injectable({
  providedIn: 'root'
})
export class AnalisisService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/analisis';

  constructor(private http: HttpClient) {}

  getAnalisisCompleto(
    fechaDesde?: string,
    fechaHasta?: string
  ): Observable<AnalisisCompleto> {
    let params = new HttpParams();
    if (fechaDesde) {
      params = params.set('fechaDesde', fechaDesde);
    }
    if (fechaHasta) {
      params = params.set('fechaHasta', fechaHasta);
    }

    return this.http
      .get<{ success: boolean; data?: AnalisisCompleto }>(
        `${this.apiUrl}/completo`,
        { params }
      )
      .pipe(
        map((resp) => {
          if (!resp || !resp.success || !resp.data) {
            return EMPTY_ANALISIS_COMPLETO;
          }
          const data = resp.data;
          return {
            comparativo_medios: data.comparativo_medios,
            temporal_pagos: Array.isArray(data.temporal_pagos)
              ? data.temporal_pagos
              : [],
            distribucion_emails: Array.isArray(data.distribucion_emails)
              ? data.distribucion_emails
              : [],
            top_proveedores: Array.isArray(data.top_proveedores)
              ? data.top_proveedores
              : []
          } satisfies AnalisisCompleto;
        })
      );
  }
}
