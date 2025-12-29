import db from '../config/database';
import { QueryTypes } from 'sequelize';
import { ServiceResponse } from '../types';

interface DashboardFuncionResponse<T = any> {
  status: number;
  message: string;
  data: T;
}

export class DashboardService {
  async getKpis(): Promise<ServiceResponse<any>> {
    try {
      const result = await db.query(
        'SELECT public.dashboard_kpis_get() as result',
        {
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const parsed: any =
        typeof raw === 'string' ? JSON.parse(raw) : raw;

      const response: DashboardFuncionResponse = {
        status: parsed?.status ?? parsed?.estado ?? 500,
        message: parsed?.message ?? parsed?.mensaje ?? '',
        data: parsed?.data ?? parsed?.datos ?? null
      };

      if (!parsed || response.status >= 400) {
        return {
          success: false,
          error: response.message || 'Error obteniendo KPIs de dashboard',
          statusCode:
            typeof response.status === 'number' ? response.status : 500
        };
      }

      return {
        success: true,
        data: response.data,
        statusCode: 200
      };
    } catch (error) {
      console.error('DashboardService.getKpis - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo KPIs de dashboard',
        statusCode: 500
      };
    }
  }

  async getRegistrosPagos(
    limit: number = 20,
    offset: number = 0
  ): Promise<ServiceResponse<any[]>> {
    try {
      const result = await db.query(
        'SELECT public.dashboard_registros_pagos_get(:limit, :offset) as result',
        {
          replacements: {
            limit,
            offset
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const parsed: any =
        typeof raw === 'string' ? JSON.parse(raw) : raw;

      const response: DashboardFuncionResponse<any[]> = {
        status: parsed?.status ?? parsed?.estado ?? 500,
        message: parsed?.message ?? parsed?.mensaje ?? '',
        data: parsed?.data ?? parsed?.datos ?? []
      };

      if (!parsed || response.status >= 400) {
        return {
          success: false,
          error:
            response.message || 'Error obteniendo registros de pagos para dashboard',
          statusCode:
            typeof response.status === 'number' ? response.status : 500
        };
      }

      const data = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data,
        statusCode: 200
      };
    } catch (error) {
      console.error('DashboardService.getRegistrosPagos - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo registros de pagos para dashboard',
        statusCode: 500
      };
    }
  }
}

export default new DashboardService();
