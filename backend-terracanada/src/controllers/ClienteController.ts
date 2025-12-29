import { Request, Response } from 'express';
import clienteService from '../services/ClienteService';
import { ApiResponse } from '../types';

export class ClienteController {
  /**
   * Crear nuevo cliente
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;

      const result = await clienteService.create(payload);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error creando cliente' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error creando cliente' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener todos los clientes
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = req.query;

      const result = await clienteService.getAll({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      });

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error obteniendo clientes' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error obteniendo clientes' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener cliente por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await clienteService.getById(id);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Cliente no encontrado' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error obteniendo cliente' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Actualizar cliente
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payload = req.body;

      const result = await clienteService.update(id, payload);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error actualizando cliente' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error actualizando cliente' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Eliminar cliente (soft delete)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await clienteService.desactivar(id);

      const response: ApiResponse = {
        success: result.success,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error eliminando cliente' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error eliminando cliente' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Buscar clientes
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { termino, page, limit } = req.query;

      if (!termino) {
        res.status(400).json({
          success: false,
          error: { message: 'Término de búsqueda requerido' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await clienteService.search(termino as string, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      });

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error buscando clientes' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Error buscando clientes' },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new ClienteController();
