import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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

// Usuarios mock para desarrollo
const MOCK_USERS = [
  {
    id: 1,
    nombre_usuario: 'admin',
    correo: 'admin@terracanada.com',
    nombre_completo: 'Administrador',
    rol_id: 1,
    rol_nombre: 'Administrador',
    contrasena: 'admin123', // En desarrollo, sin hash
    esta_activo: true,
    permisos: [
      'dashboard.leer',
      'analisis.leer',
      'crear_usuario',
      'editar_usuario',
      'eliminar_usuario',
      'ver_usuarios',
      'crear_pago',
      'editar_pago',
      'eliminar_pago',
      'ver_pagos',
      'crear_cliente',
      'editar_cliente',
      'eliminar_cliente',
      'ver_clientes',
      'crear_proveedor',
      'editar_proveedor',
      'eliminar_proveedor',
      'ver_proveedores',
      'crear_tarjeta',
      'editar_tarjeta',
      'eliminar_tarjeta',
      'ver_tarjetas',
      'gestionar_saldo_tarjeta'
    ]
  },
  {
    id: 2,
    nombre_usuario: 'equipo',
    correo: 'equipo@terracanada.com',
    nombre_completo: 'Usuario Equipo',
    rol_id: 2,
    rol_nombre: 'Equipo',
    contrasena: 'equipo123',
    esta_activo: true,
    permisos: [
      'dashboard.leer',
      'ver_usuarios',
      'ver_pagos',
      'crear_pago',
      'ver_clientes',
      'ver_proveedores',
      'ver_tarjetas',
      'gestionar_saldo_tarjeta'
    ]
  }
];

export class AuthServiceMock {
  /**
   * Autenticar usuario en modo mock
   */
  async login(payload: LoginPayload): Promise<ServiceResponse<AuthResponse>> {
    try {
      // Buscar usuario mock
      const usuario = MOCK_USERS.find(u => u.nombre_usuario === payload.nombre_usuario);

      if (!usuario) {
        return {
          success: false,
          error: 'Usuario no encontrado',
          statusCode: 401
        };
      }

      // Verificar contraseña (en modo mock, comparación directa)
      if (usuario.contrasena !== payload.contrasena) {
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

      // Generar JWT
      const token = jwt.sign(
        {
          id: usuario.id,
          nombre_usuario: usuario.nombre_usuario,
          correo: usuario.correo,
          nombre_completo: usuario.nombre_completo,
          rol_id: usuario.rol_id,
          rol_nombre: usuario.rol_nombre,
          permisos: usuario.permisos
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
            rol_nombre: usuario.rol_nombre,
            permisos: usuario.permisos
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
   * Obtener usuario actual por token
   */
  async getCurrentUser(token: string): Promise<ServiceResponse<any>> {
    const verification = this.verifyToken(token);

    if (!verification.success) {
      return verification;
    }

    try {
      const usuarioData = verification.data;
      
      return {
        success: true,
        data: {
          id: usuarioData.id,
          nombre_usuario: usuarioData.nombre_usuario,
          correo: usuarioData.correo,
          nombre_completo: usuarioData.nombre_completo,
          rol_id: usuarioData.rol_id,
          rol_nombre: usuarioData.rol_nombre,
          permisos: usuarioData.permisos
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

export default new AuthServiceMock();
