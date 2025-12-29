import { Response } from 'express';
import dashboardService from '../services/DashboardService';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/authMiddleware';

export class DashboardController {
  async getKpis(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await dashboardService.getKpis();

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message:
            result.error || 'Error obteniendo KPIs para módulo Dashboard'
        };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Error obteniendo KPIs para módulo Dashboard'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getRegistrosPagos(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;
      const { limit, offset } = req.query;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const parsedLimit = limit ? Number(limit) : 20;
      const parsedOffset = offset ? Number(offset) : 0;

      const result = await dashboardService.getRegistrosPagos(
        Number.isNaN(parsedLimit) ? 20 : parsedLimit,
        Number.isNaN(parsedOffset) ? 0 : parsedOffset
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message:
            result.error || 'Error obteniendo registros de pagos para módulo Dashboard'
        };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Error obteniendo registros de pagos para módulo Dashboard'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new DashboardController();
