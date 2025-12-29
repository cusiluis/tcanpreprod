import { BaseService } from './BaseService';
import Usuario from '../models/Usuario';
import Role from '../models/Role';
import authService from './AuthService';
import { ServiceResponse, QueryOptions, PaginatedResponse } from '../types';

export interface CreateUsuarioPayload {
  nombre_usuario: string;
  correo: string;
  contrasena: string;
  nombre_completo: string;
  rol_id: number;
  telefono?: string;
}

export interface UpdateUsuarioPayload {
  nombre_completo?: string;
  telefono?: string;
  esta_activo?: boolean;
  rol_id?: number;
}

export class UsuarioService extends BaseService<Usuario> {
  constructor() {
    super(Usuario);
  }

  /**
   * Crear nuevo usuario con contraseña hasheada
   */
  async create(data: CreateUsuarioPayload): Promise<ServiceResponse<Usuario>> {
    try {
      // Validar que el usuario no exista
      const usuarioExistente = await Usuario.findOne({
        where: {
          nombre_usuario: data.nombre_usuario
        }
      });

      if (usuarioExistente) {
        return {
          success: false,
          error: 'El nombre de usuario ya existe',
          statusCode: 400
        };
      }

      // Validar que el correo no exista
      const correoExistente = await Usuario.findOne({
        where: {
          correo: data.correo
        }
      });

      if (correoExistente) {
        return {
          success: false,
          error: 'El correo ya está registrado',
          statusCode: 400
        };
      }

      // Hashear contraseña
      const contrasena_hash = await authService.hashPassword(data.contrasena);

      // Crear usuario
      const usuario = await Usuario.create({
        nombre_usuario: data.nombre_usuario,
        correo: data.correo,
        contrasena_hash,
        nombre_completo: data.nombre_completo,
        rol_id: data.rol_id,
        telefono: data.telefono
      });

      return {
        success: true,
        data: usuario,
        statusCode: 201
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error creando usuario',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener todos los usuarios con sus roles
   */
  async getAll(options: QueryOptions = {}): Promise<ServiceResponse<PaginatedResponse<any>>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await Usuario.findAndCountAll({
        include: [
          {
            model: Role,
            attributes: ['id', 'nombre']
          }
        ],
        limit,
        offset,
        order: [['fecha_creacion', 'DESC']],
        attributes: {
          exclude: ['contrasena_hash']
        }
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo usuarios',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getById(id: string | number): Promise<ServiceResponse<any>> {
    try {
      const usuario = await Usuario.findByPk(id, {
        include: [
          {
            model: Role,
            attributes: ['id', 'nombre']
          }
        ],
        attributes: {
          exclude: ['contrasena_hash']
        }
      });

      if (!usuario) {
        return {
          success: false,
          error: 'Usuario no encontrado',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: usuario,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo usuario',
        statusCode: 500
      };
    }
  }

  /**
   * Actualizar usuario
   */
  async update(id: string | number, data: UpdateUsuarioPayload): Promise<ServiceResponse<any>> {
    try {
      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return {
          success: false,
          error: 'Usuario no encontrado',
          statusCode: 404
        };
      }

      await usuario.update(data);

      // Recargar con relaciones
      const usuarioActualizado = await Usuario.findByPk(id, {
        include: [
          {
            model: Role,
            attributes: ['id', 'nombre']
          }
        ],
        attributes: {
          exclude: ['contrasena_hash']
        }
      });

      return {
        success: true,
        data: usuarioActualizado,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error actualizando usuario',
        statusCode: 500
      };
    }
  }

  /**
   * Cambiar contraseña de usuario
   */
  async cambiarContrasena(
    usuarioIdACambiar: number,
    usuarioIdSolicita: number,
    contrasenaActual: string,
    contrasenaNueva: string
  ): Promise<ServiceResponse<void>> {
    try {
      const db = require('../config/database').default;
      const { QueryTypes } = require('sequelize');

      const result = await db.query(
        `SELECT * FROM usuario_cambiar_contrasena(
          :p_id_usuario_a_cambiar,
          :p_id_usuario_que_solicita,
          :p_contrasena_actual,
          :p_nueva_contrasena
        )`,
        {
          replacements: {
            p_id_usuario_a_cambiar: usuarioIdACambiar,
            p_id_usuario_que_solicita: usuarioIdSolicita,
            p_contrasena_actual: contrasenaActual,
            p_nueva_contrasena: contrasenaNueva
          },
          type: QueryTypes.SELECT
        }
      );

      if (!result || result.length === 0) {
        return {
          success: false,
          error: 'Error cambiando contraseña',
          statusCode: 500
        };
      }

      let response = (result[0] as any).usuario_cambiar_contrasena;

      if (typeof response === 'string') {
        try {
          response = JSON.parse(response);
        } catch (parseError) {
          console.error('UsuarioService.cambiarContrasena - Error parseando respuesta:', parseError);
        }
      }

      const status = response?.status ?? 500;
      const message = response?.message as string | undefined;

      if (status >= 400) {
        return {
          success: false,
          error: message || 'Error cambiando contraseña',
          statusCode: status
        };
      }

      return {
        success: true,
        statusCode: status
      };
    } catch (error) {
      console.error('UsuarioService.cambiarContrasena - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cambiando contraseña',
        statusCode: 500
      };
    }
  }

  /**
   * Desactivar usuario
   */
  async desactivar(usuarioId: number): Promise<ServiceResponse<void>> {
    try {
      const usuario = await Usuario.findByPk(usuarioId);

      if (!usuario) {
        return {
          success: false,
          error: 'Usuario no encontrado',
          statusCode: 404
        };
      }

      await usuario.update({ esta_activo: false });

      return {
        success: true,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desactivando usuario',
        statusCode: 500
      };
    }
  }

  /**
   * Activar usuario
   */
  async activar(usuarioId: number): Promise<ServiceResponse<void>> {
    try {
      const usuario = await Usuario.findByPk(usuarioId);

      if (!usuario) {
        return {
          success: false,
          error: 'Usuario no encontrado',
          statusCode: 404
        };
      }

      await usuario.update({ esta_activo: true });

      return {
        success: true,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error activando usuario',
        statusCode: 500
      };
    }
  }

  /**
   * Buscar usuarios por nombre o correo
   */
  async search(filtros: any, options: QueryOptions = {}): Promise<ServiceResponse<PaginatedResponse<any>>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await Usuario.findAndCountAll({
        where: filtros,
        include: [
          {
            model: Role,
            attributes: ['id', 'nombre']
          }
        ],
        limit,
        offset,
        order: [['fecha_creacion', 'DESC']],
        attributes: {
          exclude: ['contrasena_hash']
        }
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error buscando usuarios',
        statusCode: 500
      };
    }
  }
}

export default new UsuarioService();
