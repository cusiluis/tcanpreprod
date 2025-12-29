import { Response } from 'express';
import analisisService from '../services/AnalisisService';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/authMiddleware';

function getDefaultMonthRange(): { fechaDesde: string; fechaHasta: string } {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const fechaDesde = start.toLocaleDateString('en-CA');
  const fechaHasta = end.toLocaleDateString('en-CA');

  return { fechaDesde, fechaHasta };
}

function resolveFechaRango(query: any): { fechaDesde: string; fechaHasta: string } {
  const { fechaDesde, fechaHasta } = query || {};
  const defaults = getDefaultMonthRange();

  const resolvedDesde =
    typeof fechaDesde === 'string' && fechaDesde.trim().length > 0
      ? fechaDesde
      : defaults.fechaDesde;
  const resolvedHasta =
    typeof fechaHasta === 'string' && fechaHasta.trim().length > 0
      ? fechaHasta
      : defaults.fechaHasta;

  return { fechaDesde: resolvedDesde, fechaHasta: resolvedHasta };
}

export class AnalisisController {
  async getComparativoMedios(req: AuthRequest, res: Response): Promise<void> {
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

      const { fechaDesde, fechaHasta } = resolveFechaRango(req.query);

      const result = await analisisService.getComparativoMedios(
        fechaDesde,
        fechaHasta
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message:
            result.error || 'Error obteniendo análisis comparativo de medios de pago'
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
              : 'Error obteniendo análisis comparativo de medios de pago'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getTemporalPagos(req: AuthRequest, res: Response): Promise<void> {
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

      const { fechaDesde, fechaHasta } = resolveFechaRango(req.query);

      const result = await analisisService.getTemporalPagos(
        fechaDesde,
        fechaHasta
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message:
            result.error || 'Error obteniendo análisis temporal de pagos registrados'
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
              : 'Error obteniendo análisis temporal de pagos registrados'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getDistribucionEmails(req: AuthRequest, res: Response): Promise<void> {
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

      const { fechaDesde, fechaHasta } = resolveFechaRango(req.query);

      const result = await analisisService.getDistribucionEmails(
        fechaDesde,
        fechaHasta
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message:
            result.error || 'Error obteniendo distribución de emails automáticos'
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
              : 'Error obteniendo distribución de emails automáticos'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getTopProveedores(req: AuthRequest, res: Response): Promise<void> {
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

      const { fechaDesde, fechaHasta } = resolveFechaRango(req.query);

      const result = await analisisService.getTopProveedores(
        fechaDesde,
        fechaHasta
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message:
            result.error || 'Error obteniendo ranking de proveedores con más movimientos'
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
              : 'Error obteniendo ranking de proveedores con más movimientos'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getAnalisisCompleto(req: AuthRequest, res: Response): Promise<void> {
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

      const { fechaDesde, fechaHasta } = resolveFechaRango(req.query);

      const result = await analisisService.getAnalisisCompleto(
        fechaDesde,
        fechaHasta
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message:
            result.error || 'Error obteniendo análisis completo para módulo de análisis'
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
              : 'Error obteniendo análisis completo para módulo de análisis'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new AnalisisController();
