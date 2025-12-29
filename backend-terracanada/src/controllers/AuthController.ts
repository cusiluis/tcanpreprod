import { Request, Response } from 'express';
import authService, { LoginPayload } from '../services/AuthService';
import authServiceMock from '../services/AuthServiceMock';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/authMiddleware';
import sequelize from '../config/database';

export class AuthController {
  /**
   * Login - Autenticar usuario
   * Usa mock mode si la BD no está disponible
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { nombre_usuario, contrasena } = req.body;

      if (!nombre_usuario || !contrasena) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Usuario y contraseña son requeridos'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const payload: LoginPayload = {
        nombre_usuario,
        contrasena
      };

      // Verificar si la BD está conectada
      let result;
      try {
        await sequelize.authenticate();
        // BD conectada, usar servicio real
        result = await authService.login(payload);
        console.log('✅ Usando AuthService (BD conectada)');
      } catch (dbError) {
        // BD no disponible, usar mock
        result = await authServiceMock.login(payload);
        console.log('⚠️  Usando AuthServiceMock (BD no disponible)');
      }

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error en autenticación' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error en autenticación'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get Current User - Obtener usuario actual
   */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Token no proporcionado'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Verificar si la BD está conectada
      let result;
      try {
        await sequelize.authenticate();
        result = await authService.getCurrentUser(token);
      } catch (dbError) {
        result = await authServiceMock.getCurrentUser(token);
      }

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error obteniendo usuario' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error obteniendo usuario'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Logout - Cerrar sesión
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      // En este caso, el logout es manejado por el frontend
      // El backend solo retorna un mensaje de confirmación
      res.status(200).json({
        success: true,
        data: {
          message: 'Sesión cerrada exitosamente'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error cerrando sesión'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Verify Token - Verificar validez del token
   */
  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Token no proporcionado'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Verificar si la BD está conectada
      let result;
      try {
        await sequelize.authenticate();
        result = authService.verifyToken(token);
      } catch (dbError) {
        result = authServiceMock.verifyToken(token);
      }

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Token inválido' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error verificando token'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new AuthController();
