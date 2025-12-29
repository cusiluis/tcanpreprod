import db from '../config/database';
import { QueryTypes } from 'sequelize';
import { ServiceResponse } from '../types';

interface AnalisisFuncionResponse<T = any> {
  status: number;
  message: string;
  data: T;
}

export interface AnalisisComparativoMedios {
  total_tarjetas: number;
  total_cuentas_bancarias: number;
}

export interface AnalisisTemporalPagoDia {
  fecha: string;
  total_monto: number;
}

export interface AnalisisDistribucionEmailEstado {
  estado: string;
  cantidad: number;
}

export interface AnalisisTopProveedor {
  proveedor: string;
  numero_pagos: number;
  total_acumulado: number;
  ultimo_pago: string;
}

export interface AnalisisCompleto {
  comparativo_medios: AnalisisComparativoMedios | null;
  temporal_pagos: AnalisisTemporalPagoDia[];
  distribucion_emails: AnalisisDistribucionEmailEstado[];
  top_proveedores: AnalisisTopProveedor[];
}

export class AnalisisService {
  private parseFuncionResult<T = any>(raw: any, defaultData: T): AnalisisFuncionResponse<T> {
    const parsed: any = typeof raw === 'string' ? JSON.parse(raw) : raw;

    return {
      status: parsed?.status ?? parsed?.estado ?? 500,
      message: parsed?.message ?? parsed?.mensaje ?? '',
      data: (parsed?.data ?? parsed?.datos ?? defaultData) as T
    };
  }

  async getComparativoMedios(
    fechaDesde: string,
    fechaHasta: string
  ): Promise<ServiceResponse<AnalisisComparativoMedios>> {
    try {
      const result = await db.query(
        'SELECT public.analisis_comparativo_medios_rango_fechas_get(:fecha_desde, :fecha_hasta) as result',
        {
          replacements: {
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const response = this.parseFuncionResult<AnalisisComparativoMedios | null>(raw, null);

      if (!raw || typeof response.status === 'number' && response.status >= 400 || !response.data) {
        return {
          success: false,
          error: response.message || 'Error obteniendo análisis comparativo de medios de pago',
          statusCode: typeof response.status === 'number' ? response.status : 500
        };
      }

      return {
        success: true,
        data: response.data,
        statusCode: 200
      };
    } catch (error) {
      console.error('AnalisisService.getComparativoMedios - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo análisis comparativo de medios de pago',
        statusCode: 500
      };
    }
  }

  async getTemporalPagos(
    fechaDesde: string,
    fechaHasta: string
  ): Promise<ServiceResponse<AnalisisTemporalPagoDia[]>> {
    try {
      const result = await db.query(
        'SELECT public.analisis_temporal_pagos_rango_fechas_get(:fecha_desde, :fecha_hasta) as result',
        {
          replacements: {
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const response = this.parseFuncionResult<AnalisisTemporalPagoDia[]>(raw, []);

      if (!raw || typeof response.status === 'number' && response.status >= 400) {
        return {
          success: false,
          error: response.message || 'Error obteniendo análisis temporal de pagos',
          statusCode: typeof response.status === 'number' ? response.status : 500
        };
      }

      const data = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data,
        statusCode: 200
      };
    } catch (error) {
      console.error('AnalisisService.getTemporalPagos - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo análisis temporal de pagos',
        statusCode: 500
      };
    }
  }

  async getDistribucionEmails(
    fechaDesde: string,
    fechaHasta: string
  ): Promise<ServiceResponse<AnalisisDistribucionEmailEstado[]>> {
    try {
      const result = await db.query(
        'SELECT public.analisis_distribucion_emails_rango_fechas_get(:fecha_desde, :fecha_hasta) as result',
        {
          replacements: {
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const response = this.parseFuncionResult<AnalisisDistribucionEmailEstado[]>(raw, []);

      if (!raw || typeof response.status === 'number' && response.status >= 400) {
        return {
          success: false,
          error: response.message || 'Error obteniendo distribución de emails automáticos',
          statusCode: typeof response.status === 'number' ? response.status : 500
        };
      }

      const data = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data,
        statusCode: 200
      };
    } catch (error) {
      console.error('AnalisisService.getDistribucionEmails - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo distribución de emails automáticos',
        statusCode: 500
      };
    }
  }

  async getTopProveedores(
    fechaDesde: string,
    fechaHasta: string
  ): Promise<ServiceResponse<AnalisisTopProveedor[]>> {
    try {
      const result = await db.query(
        'SELECT public.analisis_top_proveedores_rango_fechas_get(:fecha_desde, :fecha_hasta) as result',
        {
          replacements: {
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const response = this.parseFuncionResult<AnalisisTopProveedor[]>(raw, []);

      if (!raw || typeof response.status === 'number' && response.status >= 400) {
        return {
          success: false,
          error: response.message || 'Error obteniendo ranking de proveedores por movimientos',
          statusCode: typeof response.status === 'number' ? response.status : 500
        };
      }

      const data = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data,
        statusCode: 200
      };
    } catch (error) {
      console.error('AnalisisService.getTopProveedores - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo ranking de proveedores por movimientos',
        statusCode: 500
      };
    }
  }

  async getAnalisisCompleto(
    fechaDesde: string,
    fechaHasta: string
  ): Promise<ServiceResponse<AnalisisCompleto>> {
    try {
      const result = await db.query(
        'SELECT public.analisis_completo_rango_fechas_get(:fecha_desde, :fecha_hasta) as result',
        {
          replacements: {
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const response = this.parseFuncionResult<AnalisisCompleto | null>(raw, null);

      if (!raw || typeof response.status === 'number' && response.status >= 400 || !response.data) {
        return {
          success: false,
          error: response.message || 'Error obteniendo análisis completo',
          statusCode: typeof response.status === 'number' ? response.status : 500
        };
      }

      const data: AnalisisCompleto = {
        comparativo_medios: response.data.comparativo_medios || null,
        temporal_pagos: Array.isArray(response.data.temporal_pagos)
          ? response.data.temporal_pagos
          : [],
        distribucion_emails: Array.isArray(response.data.distribucion_emails)
          ? response.data.distribucion_emails
          : [],
        top_proveedores: Array.isArray(response.data.top_proveedores)
          ? response.data.top_proveedores
          : []
      };

      return {
        success: true,
        data,
        statusCode: 200
      };
    } catch (error) {
      console.error('AnalisisService.getAnalisisCompleto - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo análisis completo',
        statusCode: 500
      };
    }
  }
}

export default new AnalisisService();
