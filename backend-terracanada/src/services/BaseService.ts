import { Model, ModelStatic } from 'sequelize';
import { ServiceResponse, QueryOptions, PaginatedResponse } from '../types';

/**
 * Servicio base con operaciones CRUD comunes
 * Implementa principios SOLID: Single Responsibility, Open/Closed
 */
export abstract class BaseService<T extends Model> {
  protected model: ModelStatic<T>;

  constructor(model: ModelStatic<T>) {
    this.model = model;
  }

  /**
   * Obtener todos los registros con paginación
   */
  async getAll(options: QueryOptions = {}): Promise<ServiceResponse<PaginatedResponse<T>>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await this.model.findAndCountAll({
        limit,
        offset,
        order: [[options.sort || 'id', options.order || 'ASC']]
      } as any);

      return {
        success: true,
        data: {
          data: rows as T[],
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error fetching records',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener un registro por ID
   */
  async getById(id: string | number): Promise<ServiceResponse<T>> {
    try {
      const record = await this.model.findByPk(id);

      if (!record) {
        return {
          success: false,
          error: 'Record not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: record as T,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error fetching record',
        statusCode: 500
      };
    }
  }

  /**
   * Crear un nuevo registro
   */
  async create(data: any): Promise<ServiceResponse<T>> {
    try {
      const record = await this.model.create(data);

      return {
        success: true,
        data: record as T,
        statusCode: 201
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error creating record',
        statusCode: 400
      };
    }
  }

  /**
   * Actualizar un registro
   */
  async update(id: string | number, data: any): Promise<ServiceResponse<T>> {
    try {
      const record = await this.model.findByPk(id);

      if (!record) {
        return {
          success: false,
          error: 'Record not found',
          statusCode: 404
        };
      }

      await record.update(data);

      return {
        success: true,
        data: record as T,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error updating record',
        statusCode: 400
      };
    }
  }

  /**
   * Eliminar un registro
   */
  async delete(id: string | number): Promise<ServiceResponse<void>> {
    try {
      const record = await this.model.findByPk(id);

      if (!record) {
        return {
          success: false,
          error: 'Record not found',
          statusCode: 404
        };
      }

      await record.destroy();

      return {
        success: true,
        statusCode: 204
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error deleting record',
        statusCode: 400
      };
    }
  }

  /**
   * Buscar registros con filtros
   */
  async search(filters: any, options: QueryOptions = {}): Promise<ServiceResponse<PaginatedResponse<T>>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await this.model.findAndCountAll({
        where: filters,
        limit,
        offset,
        order: [[options.sort || 'id', options.order || 'ASC']]
      } as any);

      return {
        success: true,
        data: {
          data: rows as T[],
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error searching records',
        statusCode: 500
      };
    }
  }
}
