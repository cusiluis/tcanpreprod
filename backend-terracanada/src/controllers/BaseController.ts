import { Request, Response } from 'express';
import { BaseService } from '../services/BaseService';
import { ApiResponse } from '../types';

/**
 * Controlador base con operaciones CRUD comunes
 * Implementa principios SOLID: Single Responsibility, Dependency Inversion
 */
export abstract class BaseController<T> {
  protected service: BaseService<any>;

  constructor(service: BaseService<any>) {
    this.service = service;
  }

  /**
   * Obtener todos los registros
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, sort, order, search } = req.query;

      const result = await this.service.getAll({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        sort: sort as string,
        order: (order as 'ASC' | 'DESC') || 'ASC',
        search: search as string
      });

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error fetching records' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error'
        },
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Obtener un registro por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.service.getById(id);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Record not found' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error'
        },
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Crear un nuevo registro
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.create(req.body);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error creating record' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error'
        },
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Actualizar un registro
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.service.update(id, req.body);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error updating record' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error'
        },
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Eliminar un registro
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.service.delete(id);

      const response: ApiResponse = {
        success: result.success,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error deleting record' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error'
        },
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
}
