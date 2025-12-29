import { BaseService } from './BaseService';
import Cliente from '../models/Cliente';
import { ServiceResponse, QueryOptions, PaginatedResponse } from '../types';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';

export interface CreateClientePayload {
  nombre: string;
  ubicacion?: string;
  telefono?: string;
  correo?: string;
}

export interface UpdateClientePayload {
  nombre?: string;
  ubicacion?: string;
  telefono?: string;
  correo?: string;
  esta_activo?: boolean;
}

export class ClienteService extends BaseService<Cliente> {
  constructor() {
    super(Cliente);
  }

  /**
   * Crear nuevo cliente usando función PostgreSQL cliente_post
   */
  async create(data: CreateClientePayload): Promise<ServiceResponse<Cliente>> {
    try {
      const result = await sequelize.query(
        'SELECT cliente_post(:nombre, :ubicacion, :telefono, :correo) as result',
        {
          replacements: {
            nombre: data.nombre,
            ubicacion: data.ubicacion || null,
            telefono: data.telefono || null,
            correo: data.correo || null
          },
          type: QueryTypes.SELECT
        }
      );

      if (result && result.length > 0) {
        const response = (result[0] as any).result;
        return {
          success: true,
          data: response.data,
          statusCode: response.status || 201
        };
      }

      return {
        success: false,
        error: 'Error creando cliente',
        statusCode: 500
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creando cliente';
      return {
        success: false,
        error: errorMessage,
        statusCode: 500
      };
    }
  }

  /**
   * Obtener todos los clientes activos usando función PostgreSQL cliente_get_all
   */
  async getAll(options: QueryOptions = {}): Promise<ServiceResponse<PaginatedResponse<Cliente>>> {
    try {
      const result = await sequelize.query(
        'SELECT cliente_get_all() as result',
        {
          type: QueryTypes.SELECT
        }
      );

      if (result && result.length > 0) {
        const response = (result[0] as any).result;
        const clientes = response.data || [];
        const page = options.page || 1;
        const limit = options.limit || 10;
        const total = Array.isArray(clientes) ? clientes.length : 0;

        return {
          success: true,
          data: {
            data: clientes,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          },
          statusCode: 200
        };
      }

      return {
        success: false,
        error: 'Error obteniendo clientes',
        statusCode: 500
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error obteniendo clientes';
      return {
        success: false,
        error: errorMessage,
        statusCode: 500
      };
    }
  }

  /**
   * Obtener cliente por ID usando función PostgreSQL cliente_get
   */
  async getById(id: string | number): Promise<ServiceResponse<Cliente>> {
    try {
      const result = await sequelize.query(
        'SELECT cliente_get(:id) as result',
        {
          replacements: { id: parseInt(id.toString()) },
          type: QueryTypes.SELECT
        }
      );

      if (result && result.length > 0) {
        const response = (result[0] as any).result;
        return {
          success: true,
          data: response.data,
          statusCode: 200
        };
      }

      return {
        success: false,
        error: 'Cliente no encontrado',
        statusCode: 404
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error obteniendo cliente';
      return {
        success: false,
        error: errorMessage,
        statusCode: 404
      };
    }
  }

  /**
   * Actualizar cliente usando función PostgreSQL cliente_put
   */
  async update(id: string | number, data: UpdateClientePayload): Promise<ServiceResponse<Cliente>> {
    try {
      const result = await sequelize.query(
        'SELECT cliente_put(:id, :nombre, :ubicacion, :telefono, :correo) as result',
        {
          replacements: {
            id: parseInt(id.toString()),
            nombre: data.nombre,
            ubicacion: data.ubicacion || null,
            telefono: data.telefono || null,
            correo: data.correo || null
          },
          type: QueryTypes.SELECT
        }
      );

      if (result && result.length > 0) {
        const response = (result[0] as any).result;
        return {
          success: true,
          data: response.data,
          statusCode: 200
        };
      }

      return {
        success: false,
        error: 'Cliente no encontrado',
        statusCode: 404
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error actualizando cliente';
      return {
        success: false,
        error: errorMessage,
        statusCode: 500
      };
    }
  }

  /**
   * Buscar clientes por nombre o correo
   */
  async search(
    termino: string,
    options: QueryOptions = {}
  ): Promise<ServiceResponse<PaginatedResponse<Cliente>>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await Cliente.findAndCountAll({
        where: {
          esta_activo: true,
          [Op.or]: [
            { nombre: { [Op.iLike]: `%${termino}%` } },
            { correo: { [Op.iLike]: `%${termino}%` } }
          ]
        },
        limit,
        offset,
        order: [['nombre', 'ASC']]
      });

      return {
        success: true,
        data: {
          data: rows,
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        },
        statusCode: 200
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error buscando clientes';
      return {
        success: false,
        error: errorMessage,
        statusCode: 500
      };
    }
  }

  /**
   * Desactivar cliente usando función PostgreSQL cliente_delete
   */
  async desactivar(id: string | number): Promise<ServiceResponse<void>> {
    try {
      const result = await sequelize.query(
        'SELECT cliente_delete(:id) as result',
        {
          replacements: { id: parseInt(id.toString()) },
          type: QueryTypes.SELECT
        }
      );

      if (result && result.length > 0) {
        const response = (result[0] as any).result;
        return {
          success: true,
          statusCode: response.status || 200
        };
      }

      return {
        success: false,
        error: 'Cliente no encontrado',
        statusCode: 404
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desactivando cliente';
      return {
        success: false,
        error: errorMessage,
        statusCode: 500
      };
    }
  }
}

export default new ClienteService();
