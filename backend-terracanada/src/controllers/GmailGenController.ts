import { Response } from 'express';
import gmailGenService from '../services/GmailGenService';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/authMiddleware';

export class GmailGenController {
  async getResumenPagosDia(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;
      const { fecha } = req.query;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await gmailGenService.getResumenPagosDia(
        usuarioId,
        fecha ? String(fecha) : undefined
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message:
            result.error ||
            'Error obteniendo resumen de pagos para módulo Gmail-GEN'
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
              : 'Error obteniendo resumen de pagos para módulo Gmail-GEN'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getCorreosPendientesGeneral(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
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

      const result = await gmailGenService.getCorreosPendientesGeneral(
        Number(usuarioId)
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message:
            result.error ||
            'Error obteniendo correos pendientes generales para módulo Gmail-GEN'
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
              : 'Error obteniendo correos pendientes generales para módulo Gmail-GEN'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getResumenEnviosFecha(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;
      const { fecha } = req.query;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await gmailGenService.getResumenEnviosFecha(
        Number(usuarioId),
        fecha ? String(fecha) : undefined
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message:
            result.error ||
            'Error obteniendo resumen de correos enviados para módulo Gmail-GEN'
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
              : 'Error obteniendo resumen de correos enviados para módulo Gmail-GEN'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getHistorialEnvios(req: AuthRequest, res: Response): Promise<void> {
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

      const parsedLimit = limit ? Number(limit) : 50;
      const parsedOffset = offset ? Number(offset) : 0;

      const result = await gmailGenService.getHistorialEnvios(
        Number(usuarioId),
        Number.isNaN(parsedLimit) ? 50 : parsedLimit,
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
            result.error ||
            'Error obteniendo historial de envíos para módulo Gmail-GEN'
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
              : 'Error obteniendo historial de envíos para módulo Gmail-GEN'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async enviarCorreoProveedor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;
      const { proveedor_id, fecha, asunto, mensaje } = req.body || {};

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (!proveedor_id) {
        res.status(400).json({
          success: false,
          error: { message: 'proveedor_id es requerido' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await gmailGenService.enviarCorreoProveedor(
        Number(usuarioId),
        Number(proveedor_id),
        fecha ? String(fecha) : undefined,
        asunto ? String(asunto) : undefined,
        mensaje ? String(mensaje) : undefined
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message:
            result.error || 'Error enviando correo de confirmación a proveedor'
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
              : 'Error enviando correo de confirmación a proveedor'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new GmailGenController();
