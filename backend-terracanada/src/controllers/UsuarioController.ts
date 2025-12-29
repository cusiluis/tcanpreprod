import { Request, Response } from 'express';
import usuarioService, { CreateUsuarioPayload, UpdateUsuarioPayload } from '../services/UsuarioService';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/authMiddleware';

export class UsuarioController {
  /**
   * Crear nuevo usuario
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const payload: CreateUsuarioPayload = req.body;

      const result = await usuarioService.create(payload);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error creando usuario' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error creando usuario'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener todos los usuarios
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = req.query;

      const result = await usuarioService.getAll({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      });

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error obteniendo usuarios' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error obteniendo usuarios'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await usuarioService.getById(id);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Usuario no encontrado' };
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
   * Actualizar usuario
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payload: UpdateUsuarioPayload = req.body;

      const result = await usuarioService.update(id, payload);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error actualizando usuario' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error actualizando usuario'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Eliminar usuario
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await usuarioService.delete(id);

      const response: ApiResponse = {
        success: result.success,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error eliminando usuario' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error eliminando usuario'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Cambiar contraseña
   */
  async cambiarContrasena(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { contrasena_actual, contrasena_nueva } = req.body;
      const usuarioIdSolicita = req.user?.id;
      const { id: idParam } = req.params;

      if (!usuarioIdSolicita) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Usuario no autenticado'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const usuarioIdACambiar = idParam ? parseInt(idParam, 10) : usuarioIdSolicita;

      const result = await usuarioService.cambiarContrasena(
        usuarioIdACambiar,
        usuarioIdSolicita,
        contrasena_actual,
        contrasena_nueva
      );

      const response: ApiResponse = {
        success: result.success,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error cambiando contraseña' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error cambiando contraseña'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Desactivar usuario
   */
  async desactivar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await usuarioService.desactivar(parseInt(id));

      const response: ApiResponse = {
        success: result.success,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error desactivando usuario' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desactivando usuario'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Activar usuario
   */
  async activar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await usuarioService.activar(parseInt(id));

      const response: ApiResponse = {
        success: result.success,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error activando usuario' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error activando usuario'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Buscar usuarios
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { nombre_usuario, correo, page, limit } = req.query;
      const filtros: any = {};

      if (nombre_usuario) {
        filtros.nombre_usuario = { [require('sequelize').Op.iLike]: `%${nombre_usuario}%` };
      }

      if (correo) {
        filtros.correo = { [require('sequelize').Op.iLike]: `%${correo}%` };
      }

      const result = await usuarioService.search(filtros, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      });

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = { message: result.error || 'Error buscando usuarios' };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error buscando usuarios'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new UsuarioController();
