import { Response, Request } from 'express';
import documentoUsuarioService from '../services/DocumentoUsuarioService';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/authMiddleware';

export class DocumentoUsuarioController {
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const {
        fecha_desde,
        fecha_hasta,
        search,
        termino_busqueda,
        usuario_id,
        limit,
        offset
      } = req.query;

      const terminoBusqueda = (search || termino_busqueda) as string | undefined;

      const result = await documentoUsuarioService.getAllDocumentos(Number(usuarioId), {
        usuarioFiltroId: usuario_id ? Number(usuario_id) : undefined,
        fechaDesde: fecha_desde ? String(fecha_desde) : undefined,
        fechaHasta: fecha_hasta ? String(fecha_hasta) : undefined,
        terminoBusqueda: terminoBusqueda ? String(terminoBusqueda) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      });

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message: result.error || 'Error obteniendo documentos de usuario'
        };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Error obteniendo documentos de usuario'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;
      const { id } = req.params;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const documentoId = Number(id);

      const result = await documentoUsuarioService.getDocumentoPorId(
        documentoId,
        Number(usuarioId)
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message: result.error || 'Error obteniendo documento de usuario'
        };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Error obteniendo documento de usuario'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const {
        id_pago,
        base64,
        nombre_documento,
        tipo_documento,
        usuario_cargo
      } = req.body || {};

      if (!id_pago || !base64 || !nombre_documento || !tipo_documento) {
        res.status(400).json({
          success: false,
          error: { message: 'id_pago, base64, nombre_documento y tipo_documento son requeridos' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await documentoUsuarioService.crearDocumento(Number(usuarioId), {
        id_pago: Number(id_pago),
        base64: String(base64),
        nombre_documento: String(nombre_documento),
        tipo_documento: String(tipo_documento),
        usuario_cargo: usuario_cargo ? String(usuario_cargo) : String(req.user?.nombre_completo || req.user?.nombre_usuario || '')
      });

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message: result.error || 'Error creando documento de usuario'
        };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Error creando documento de usuario'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;
      const { id } = req.params;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { nombre_documento, tipo_documento } = req.body || {};

      if (!nombre_documento || !tipo_documento) {
        res.status(400).json({
          success: false,
          error: { message: 'nombre_documento y tipo_documento son requeridos' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const documentoId = Number(id);

      const result = await documentoUsuarioService.actualizarDocumento(
        documentoId,
        Number(usuarioId),
        {
          nombre_documento: String(nombre_documento),
          tipo_documento: String(tipo_documento)
        }
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message: result.error || 'Error actualizando documento de usuario'
        };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Error actualizando documento de usuario'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;
      const { id } = req.params;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: { message: 'Usuario no autenticado' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const documentoId = Number(id);

      const result = await documentoUsuarioService.eliminarDocumento(
        documentoId,
        Number(usuarioId)
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        timestamp: new Date().toISOString()
      };

      if (!result.success) {
        response.error = {
          message: result.error || 'Error eliminando documento de usuario'
        };
      }

      res.status(result.statusCode).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Error eliminando documento de usuario'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new DocumentoUsuarioController();
