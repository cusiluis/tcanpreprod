import { Request, Response } from 'express';
import { TarjetaService } from '../services/TarjetaService';
import { ApiResponse } from '../types';

export class TarjetaController {
  /**
   * Crear nueva tarjeta
   * POST /api/v1/tarjetas
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nombre_titular, numero_tarjeta, limite, tipo_tarjeta_id } = req.body;

      if (!nombre_titular || !numero_tarjeta || !limite || !tipo_tarjeta_id) {
        res.status(400).json({
          success: false,
          error: { message: 'nombre_titular, numero_tarjeta, limite y tipo_tarjeta_id son requeridos' }
        });
        return;
      }

      const result = await TarjetaService.create({
        nombre_titular,
        numero_tarjeta,
        limite,
        tipo_tarjeta_id
      });

      res.status(result.status || 201).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error creando tarjeta' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener todas las tarjetas activas
   * GET /api/v1/tarjetas
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await TarjetaService.getAll();

      res.status(result.status || 200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error obteniendo tarjetas' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener tarjeta por ID
   * GET /api/v1/tarjetas/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: { message: 'id es requerido' }
        });
        return;
      }

      const result = await TarjetaService.getById(parseInt(id));

      res.status(result.status || 200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error obteniendo tarjeta' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Actualizar tarjeta
   * PUT /api/v1/tarjetas/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombre_titular, limite } = req.body;

      if (!id || !nombre_titular || !limite) {
        res.status(400).json({
          success: false,
          error: { message: 'id, nombre_titular y limite son requeridos' }
        });
        return;
      }

      const result = await TarjetaService.update(parseInt(id), {
        nombre_titular,
        limite
      });

      res.status(result.status || 200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error actualizando tarjeta' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Desactivar tarjeta
   * DELETE /api/v1/tarjetas/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: { message: 'id es requerido' }
        });
        return;
      }

      const result = await TarjetaService.delete(parseInt(id));

      res.status(result.status || 200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error desactivando tarjeta' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Realizar cargo a tarjeta (aumentar saldo)
   * POST /api/v1/tarjetas/:id/cargo
   */
  async realizarCargo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { monto } = req.body;

      if (!id || !monto) {
        res.status(400).json({
          success: false,
          error: { message: 'id y monto son requeridos' }
        });
        return;
      }

      const result = await TarjetaService.realizarCargo(parseInt(id), { monto });

      res.status(result.status || 200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error realizando cargo' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Realizar pago a tarjeta (disminuir saldo)
   * POST /api/v1/tarjetas/:id/pago
   */
  async realizarPago(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { monto } = req.body;

      if (!id || !monto) {
        res.status(400).json({
          success: false,
          error: { message: 'id y monto son requeridos' }
        });
        return;
      }

      const result = await TarjetaService.realizarPago(parseInt(id), { monto });

      res.status(result.status || 200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error realizando pago' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Cambiar estado de una tarjeta
   * PATCH /api/v1/tarjetas/:id/estado
   */
  async cambiarEstado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { estado_tarjeta_id } = req.body;

      if (!id || !estado_tarjeta_id) {
        res.status(400).json({
          success: false,
          error: { message: 'ID de tarjeta y estado_tarjeta_id son requeridos' }
        });
        return;
      }

      const result = await TarjetaService.cambiarEstado(parseInt(id), estado_tarjeta_id);

      res.status(result.status || 200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error cambiando estado' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Eliminar tarjeta permanentemente (solo admin)
   * DELETE /api/v1/tarjetas/:id/permanente
   */
  async deletePermanente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).user?.id;

      if (!id) {
        res.status(400).json({
          success: false,
          error: { message: 'id es requerido' }
        });
        return;
      }

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' }
        });
        return;
      }

      const result = await TarjetaService.deletePermanente(parseInt(id), usuarioId);

      res.status(result.status || 200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error eliminando tarjeta permanentemente' },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new TarjetaController();
