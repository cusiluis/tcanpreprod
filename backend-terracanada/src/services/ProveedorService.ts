import { ServiceResponse, QueryOptions, PaginatedResponse } from '../types';
import db from '../config/database';
import { QueryTypes } from 'sequelize';

export interface CreateProveedorPayload {
  nombre: string;
  servicio: string;
  telefono?: string;
  telefono2?: string;
  correo?: string;
  correo2?: string;
  descripcion?: string;
}

export interface UpdateProveedorPayload {
  nombre?: string;
  servicio?: string;
  telefono?: string;
  telefono2?: string;
  correo?: string;
  correo2?: string;
  descripcion?: string;
  esta_activo?: boolean;
}

export interface Proveedor {
  id: number;
  nombre: string;
  servicio: string;
  telefono?: string;
  telefono2?: string;
  correo?: string;
  correo2?: string;
  descripcion?: string;
  esta_activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export class ProveedorService {
  /**
   * Crear nuevo proveedor usando función PostgreSQL
   */
  async create(data: CreateProveedorPayload): Promise<ServiceResponse<Proveedor>> {
    try {
      const result = await db.query(
        `SELECT * FROM proveedor_post(
          :nombre,
          :servicio,
          :telefono,
          :telefono2,
          :correo,
          :correo2,
          :descripcion
        )`,
        {
          replacements: {
            nombre: data.nombre,
            servicio: data.servicio,
            telefono: data.telefono || null,
            telefono2: data.telefono2 || null,
            correo: data.correo || null,
            correo2: data.correo2 || null,
            descripcion: data.descripcion || null
          },
          type: QueryTypes.SELECT
        }
      );

      console.log('ProveedorService.create() - Resultado:', result);

      if (result && result.length > 0) {
        // La función retorna un objeto con clave 'proveedor_post'
        let response = (result[0] as any).proveedor_post;
        
        // Si response es un string JSON, parsearlo
        if (typeof response === 'string') {
          response = JSON.parse(response);
        }
        
        console.log('ProveedorService.create() - Response:', response);
        return {
          success: true,
          data: response.data,
          statusCode: response.status || 201
        };
      }

      return {
        success: false,
        error: 'Error creando proveedor',
        statusCode: 500
      };
    } catch (error) {
      console.error('ProveedorService.create() - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error creando proveedor',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener todos los proveedores activos usando función PostgreSQL
   */
  async getAll(options: QueryOptions = {}): Promise<ServiceResponse<Proveedor[]>> {
    try {
      const result = await db.query(
        `SELECT * FROM proveedor_get_all()`,
        { type: QueryTypes.SELECT }
      );

      console.log('ProveedorService.getAll() - Resultado raw:', result);

      if (result && result.length > 0) {
        // La función retorna un objeto con clave 'proveedor_get_all'
        let response = (result[0] as any).proveedor_get_all;
        
        console.log('ProveedorService.getAll() - Response antes de parsear:', response);
        console.log('ProveedorService.getAll() - Type:', typeof response);
        
        // Si response es un string JSON, parsearlo
        if (typeof response === 'string') {
          console.log('ProveedorService.getAll() - Parseando JSON string');
          response = JSON.parse(response);
        }
        
        console.log('ProveedorService.getAll() - Response después de parsear:', response);
        let proveedores: Proveedor[] = [];

        // La función retorna { status, message, data: [...] }
        if (response && response.data && Array.isArray(response.data)) {
          console.log('ProveedorService.getAll() - Extrayendo data array, length:', response.data.length);
          proveedores = response.data;
        } else {
          console.warn('ProveedorService.getAll() - response.data no es un array:', response.data);
        }

        console.log('ProveedorService.getAll() - Proveedores finales:', proveedores.length);
        return {
          success: true,
          data: proveedores,
          statusCode: response.status || 200
        };
      }

      console.log('ProveedorService.getAll() - Result está vacío');
      return {
        success: true,
        data: [],
        statusCode: 200
      };
    } catch (error) {
      console.error('ProveedorService.getAll() - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo proveedores',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener proveedor por ID usando función PostgreSQL
   */
  async getById(id: string | number): Promise<ServiceResponse<Proveedor>> {
    try {
      const result = await db.query(
        `SELECT * FROM proveedor_get(:id)`,
        {
          replacements: { id: parseInt(id as string) },
          type: QueryTypes.SELECT
        }
      );

      console.log('ProveedorService.getById() - Resultado:', result);

      if (result && result.length > 0) {
        // La función retorna un objeto con clave 'proveedor_get'
        let response = (result[0] as any).proveedor_get;
        
        // Si response es un string JSON, parsearlo
        if (typeof response === 'string') {
          response = JSON.parse(response);
        }
        
        console.log('ProveedorService.getById() - Response:', response);
        return {
          success: true,
          data: response.data,
          statusCode: response.status || 200
        };
      }

      return {
        success: false,
        error: 'Proveedor no encontrado',
        statusCode: 404
      };
    } catch (error) {
      console.error('ProveedorService.getById() - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo proveedor',
        statusCode: 500
      };
    }
  }

  /**
   * Actualizar proveedor usando función PostgreSQL
   */
  async update(id: string | number, data: UpdateProveedorPayload): Promise<ServiceResponse<Proveedor>> {
    try {
      const result = await db.query(
        `SELECT * FROM proveedor_put(
          :id,
          :nombre,
          :servicio,
          :telefono,
          :telefono2,
          :correo,
          :correo2,
          :descripcion
        )`,
        {
          replacements: {
            id: parseInt(id as string),
            nombre: data.nombre,
            servicio: data.servicio,
            telefono: data.telefono || null,
            telefono2: data.telefono2 || null,
            correo: data.correo || null,
            correo2: data.correo2 || null,
            descripcion: data.descripcion || null
          },
          type: QueryTypes.SELECT
        }
      );

      console.log('ProveedorService.update() - Resultado:', result);

      if (result && result.length > 0) {
        // La función retorna un objeto con clave 'proveedor_put'
        let response = (result[0] as any).proveedor_put;
        
        // Si response es un string JSON, parsearlo
        if (typeof response === 'string') {
          response = JSON.parse(response);
        }
        
        console.log('ProveedorService.update() - Response:', response);
        return {
          success: true,
          data: response.data,
          statusCode: response.status || 200
        };
      }

      return {
        success: false,
        error: 'Proveedor no encontrado',
        statusCode: 404
      };
    } catch (error) {
      console.error('ProveedorService.update() - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error actualizando proveedor',
        statusCode: 500
      };
    }
  }

  /**
   * Desactivar proveedor usando función PostgreSQL
   */
  async desactivar(id: string | number): Promise<ServiceResponse<void>> {
    try {
      const result = await db.query(
        `SELECT * FROM proveedor_delete(:id)`,
        {
          replacements: { id: parseInt(id as string) },
          type: QueryTypes.SELECT
        }
      );

      console.log('ProveedorService.desactivar() - Resultado:', result);

      if (result && result.length > 0) {
        // La función retorna un objeto con clave 'proveedor_delete'
        let response = (result[0] as any).proveedor_delete;
        
        // Si response es un string JSON, parsearlo
        if (typeof response === 'string') {
          response = JSON.parse(response);
        }
        
        console.log('ProveedorService.desactivar() - Response:', response);
        return {
          success: true,
          statusCode: response.status || 200
        };
      }

      return {
        success: false,
        error: 'Proveedor no encontrado',
        statusCode: 404
      };
    } catch (error) {
      console.error('ProveedorService.desactivar() - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desactivando proveedor',
        statusCode: 500
      };
    }
  }

  /**
   * Buscar proveedores por nombre o servicio
   */
  async search(
    termino: string,
    options: QueryOptions = {}
  ): Promise<ServiceResponse<Proveedor[]>> {
    try {
      const result = await db.query(
        `SELECT * FROM proveedores WHERE esta_activo = TRUE AND (nombre ILIKE :termino OR servicio ILIKE :termino OR correo ILIKE :termino) ORDER BY fecha_creacion DESC`,
        {
          replacements: { termino: `%${termino}%` },
          type: QueryTypes.SELECT
        }
      );

      return {
        success: true,
        data: result as Proveedor[],
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error buscando proveedores',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener proveedores por servicio
   */
  async getByServicio(
    servicio: string,
    options: QueryOptions = {}
  ): Promise<ServiceResponse<Proveedor[]>> {
    try {
      const result = await db.query(
        `SELECT * FROM proveedores WHERE esta_activo = TRUE AND servicio ILIKE :servicio ORDER BY fecha_creacion DESC`,
        {
          replacements: { servicio: `%${servicio}%` },
          type: QueryTypes.SELECT
        }
      );

      return {
        success: true,
        data: result as Proveedor[],
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo proveedores',
        statusCode: 500
      };
    }
  }
}

export default new ProveedorService();
