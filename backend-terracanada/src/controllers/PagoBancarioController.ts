import { Request, Response } from 'express';
import PagoBancarioService from '../services/PagoBancarioService';

export class PagoBancarioController {
  /**
   * POST /api/v1/pagos-bancarios
   * Crear un nuevo pago bancario
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      console.log('PagoBancarioController.create() - req.user:', (req as any).user);
      console.log('PagoBancarioController.create() - req.headers.authorization:', req.headers.authorization ? 'presente' : 'ausente');
      
      const {
        clienteId,
        proveedorId,
        correoProveedor,
        cuentaBancariaId,
        monto,
        numeroPresta,
        comentarios,
      } = req.body;

      const usuarioId = (req as any).user?.id;
      console.log('PagoBancarioController.create() - usuarioId:', usuarioId);

      if (!usuarioId) {
        console.error('PagoBancarioController.create() - ERROR: usuarioId no encontrado');
        res.status(401).json({ status: 401, message: 'Usuario no autenticado' });
        return;
      }

      const result = await PagoBancarioService.create(
        usuarioId,
        clienteId,
        proveedorId,
        correoProveedor,
        cuentaBancariaId,
        monto,
        numeroPresta,
        comentarios
      );

      res.status(result?.status || 201).json(result);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error creando pago bancario',
        error: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/v1/pagos-bancarios/:id
   * Obtener un pago bancario por ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await PagoBancarioService.getById(parseInt(id));

      if (!result) {
        res.status(404).json({ status: 404, message: 'Pago bancario no encontrado' });
        return;
      }

      res.status(result?.status || 200).json(result);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error obteniendo pago bancario',
        error: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/v1/pagos-bancarios
   * Obtener todos los pagos bancarios con filtros
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId, estado = 'todos', verificacion = 'todos' } = req.query;

      const result = await PagoBancarioService.getAll(
        usuarioId ? parseInt(usuarioId as string) : undefined,
        (estado as 'todos' | 'A PAGAR' | 'PAGADO') || 'todos',
        (verificacion as 'todos' | 'verificados' | 'no_verificados') || 'todos'
      );

      res.status(result?.statusCode || 200).json(result);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error obteniendo pagos bancarios',
        error: (error as Error).message,
      });
    }
  }

  /**
   * PUT /api/v1/pagos-bancarios/:id
   * Actualizar estado y verificación de un pago bancario
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nuevoEstado, nuevaVerificacion, verificadoPorUsuarioId } = req.body;

      const usuarioId = (req as any).user?.id;

      if (!usuarioId) {
        res.status(401).json({ status: 401, message: 'Usuario no autenticado' });
        return;
      }

      const result = await PagoBancarioService.update(
        usuarioId,
        parseInt(id),
        nuevoEstado,
        nuevaVerificacion,
        verificadoPorUsuarioId
      );

      res.status(result?.status || 200).json(result);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error actualizando pago bancario',
        error: (error as Error).message,
      });
    }
  }

  /**
   * DELETE /api/v1/pagos-bancarios/:id
   * Soft delete de un pago bancario
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const usuarioId = (req as any).user?.id;

      if (!usuarioId) {
        res.status(401).json({ status: 401, message: 'Usuario no autenticado' });
        return;
      }

      const result = await PagoBancarioService.delete(parseInt(id), usuarioId);

      res.status(result?.status || 200).json(result);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error eliminando pago bancario',
        error: (error as Error).message,
      });
    }
  }

  /**
   * DELETE /api/v1/pagos-bancarios/:id/permanente
   * Hard delete permanente de un pago bancario con reembolso
   */
  static async deletePermanente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const usuarioId = (req as any).user?.id;

      if (!usuarioId) {
        res.status(401).json({ status: 401, message: 'Usuario no autenticado' });
        return;
      }

      const result = await PagoBancarioService.deletePermanente(parseInt(id), usuarioId);

      res.status(result?.status || 200).json(result);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error eliminando permanentemente pago bancario',
        error: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/v1/pagos-bancarios/resumen
   * Obtener resumen de pagos bancarios por estado
   */
  static async getResumen(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId } = req.query;

      const result = await PagoBancarioService.getResumen(
        usuarioId ? parseInt(usuarioId as string) : undefined
      );

      res.status(200).json({
        status: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error obteniendo resumen de pagos bancarios',
        error: (error as Error).message,
      });
    }
  }
}

export default PagoBancarioController;
