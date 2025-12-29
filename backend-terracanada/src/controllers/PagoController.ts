import { Request, Response } from 'express';
import pagoService from '../services/PagoService';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/authMiddleware';

export class PagoController {
  /**
   * Crear nuevo pago
   */
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await pagoService.create(payload, usuarioId);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error creando pago' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error creando pago' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener todos los pagos
   */
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page, limit } = req.query;
      const usuarioId = req.user?.id;
      const rolNombre = req.user?.rol_nombre;

      console.log('PagoController.getAll() - Usuario:', { usuarioId, rolNombre, user: req.user });

      if (!usuarioId || !rolNombre) {
        console.warn('PagoController.getAll() - Usuario no autenticado');
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await pagoService.getAll(usuarioId, rolNombre, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      });

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error obteniendo pagos' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error obteniendo pagos' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener pago por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pagoService.getById(id);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Pago no encontrado' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error obteniendo pago' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Actualizar pago
   */
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payload = req.body;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await pagoService.update(id, payload, usuarioId);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error actualizando pago' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error actualizando pago' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Verificar pago
   */
  async verificarPago(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await pagoService.verificarPago(id, usuarioId);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error verificando pago' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error verificando pago' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Filtrar pagos
   */
  async filtrar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { estado, fecha_desde, fecha_hasta, usuario_id, cliente_id, proveedor_id, page, limit } = req.query;
      const usuarioId = req.user?.id;
      const rolNombre = req.user?.rol_nombre;

      if (!usuarioId || !rolNombre) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const filtros = {
        estado,
        fecha_desde,
        fecha_hasta,
        usuario_id: usuario_id ? parseInt(usuario_id as string) : undefined,
        cliente_id: cliente_id ? parseInt(cliente_id as string) : undefined,
        proveedor_id: proveedor_id ? parseInt(proveedor_id as string) : undefined
      };

      const result = await pagoService.filtrar(usuarioId, rolNombre, filtros, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      });

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error filtrando pagos' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error filtrando pagos' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Eliminar pago (soft delete)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pagoService.delete(id);

      const response: ApiResponse = {
        success: result.success,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error eliminando pago' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error eliminando pago' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Eliminar pago permanentemente
   */
  async deletePermanente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pagoService.deletePermanente(id);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error eliminando pago' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error eliminando pago' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener resumen de pagos
   */
  async getResumen(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;
      const rolNombre = req.user?.rol_nombre;

      if (!usuarioId || !rolNombre) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await pagoService.getResumen(usuarioId, rolNombre);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error obteniendo resumen' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error obteniendo resumen' },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new PagoController();
