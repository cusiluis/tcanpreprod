import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario';
import Role from '../models/Role';
import RolPermiso from '../models/RolPermiso';
import Permiso from '../models/Permiso';
import { ServiceResponse } from '../types';

export interface LoginPayload {
  nombre_usuario: string;
  contrasena: string;
}

export interface AuthResponse {
  token: string;
  usuario: {
    id: number;
    nombre_usuario: string;
    correo: string;
    nombre_completo: string;
    rol_id: number;
    rol_nombre: string;
    permisos: string[];
  };
}

export class AuthService {
  /**
   * Autenticar usuario y generar JWT
   */
  async login(payload: LoginPayload): Promise<ServiceResponse<AuthResponse>> {
    try {
      // Buscar usuario
      const usuario = await Usuario.findOne({
        where: { nombre_usuario: payload.nombre_usuario },
        include: [
          {
            model: Role,
            attributes: ['id', 'nombre']
          }
        ]
      });

      if (!usuario) {
        return {
          success: false,
          error: 'Usuario no encontrado',
          statusCode: 401
        };
      }

      // Verificar contraseña
      const passwordValid = await bcrypt.compare(
        payload.contrasena,
        usuario.contrasena_hash
      );

      if (!passwordValid) {
        return {
          success: false,
          error: 'Contraseña incorrecta',
          statusCode: 401
        };
      }

      // Verificar si usuario está activo
      if (!usuario.esta_activo) {
        return {
          success: false,
          error: 'Usuario inactivo',
          statusCode: 403
        };
      }

      // Obtener permisos del rol
      const permisos = await this.getPermisosPorRol(usuario.rol_id);

      // Generar JWT
      const token = jwt.sign(
        {
          id: usuario.id,
          nombre_usuario: usuario.nombre_usuario,
          correo: usuario.correo,
          nombre_completo: usuario.nombre_completo,
          rol_id: usuario.rol_id,
          rol_nombre: (usuario as any).Role?.nombre || 'Usuario',
          permisos: permisos
        },
        process.env.JWT_SECRET || 'secret_key',
        {
          expiresIn: process.env.JWT_EXPIRATION || '24h'
        } as any
      );

      return {
        success: true,
        data: {
          token,
          usuario: {
            id: usuario.id,
            nombre_usuario: usuario.nombre_usuario,
            correo: usuario.correo,
            nombre_completo: usuario.nombre_completo,
            rol_id: usuario.rol_id,
            rol_nombre: (usuario as any).Role?.nombre || 'Usuario',
            permisos: permisos
          }
        },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en autenticación',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener permisos de un rol
   */
  async getPermisosPorRol(rolId: number): Promise<string[]> {
    try {
      const rolPermisos = await RolPermiso.findAll({
        where: { rol_id: rolId },
        include: [
          {
            model: Permiso,
            attributes: ['nombre']
          }
        ]
      });

      return rolPermisos.map((rp: any) => rp.Permiso.nombre);
    } catch (error) {
      console.error('Error obteniendo permisos:', error);
      return [];
    }
  }

  /**
   * Verificar y decodificar JWT
   */
  verifyToken(token: string): ServiceResponse<any> {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret_key'
      );

      return {
        success: true,
        data: decoded,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: 'Token inválido o expirado',
        statusCode: 401
      };
    }
  }

  /**
   * Hashear contraseña
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Obtener usuario actual por token
   */
  async getCurrentUser(token: string): Promise<ServiceResponse<any>> {
    const verification = this.verifyToken(token);

    if (!verification.success) {
      return verification;
    }

    try {
      const usuario = await Usuario.findByPk(verification.data.id, {
        include: [
          {
            model: Role,
            attributes: ['id', 'nombre']
          }
        ]
      });

      if (!usuario) {
        return {
          success: false,
          error: 'Usuario no encontrado',
          statusCode: 404
        };
      }

      const permisos = await this.getPermisosPorRol(usuario.rol_id);

      return {
        success: true,
        data: {
          id: usuario.id,
          nombre_usuario: usuario.nombre_usuario,
          correo: usuario.correo,
          nombre_completo: usuario.nombre_completo,
          rol_id: usuario.rol_id,
          rol_nombre: (usuario as any).Role?.nombre || 'Usuario',
          permisos: permisos
        },
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
}

export default new AuthService();
