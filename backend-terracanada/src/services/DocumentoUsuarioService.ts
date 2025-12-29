import db from '../config/database';
import { QueryTypes } from 'sequelize';
import { ServiceResponse } from '../types';

interface DocumentoUsuarioFilters {
  usuarioFiltroId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  terminoBusqueda?: string;
  limit?: number;
  offset?: number;
}

interface FuncionRespuestaJson {
  status: number;
  message: string;
  data: any;
}

function parseFuncionRespuesta(raw: any): FuncionRespuestaJson {
  let parsed: any = raw;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      // Si la función devuelve un string no JSON, interpretarlo como dato exitoso
      return {
        status: 200,
        message: '',
        data: raw
      };
    }
  }
  const successFlag = parsed?.success;
  const statusValue =
    parsed?.status ??
    parsed?.estado ??
    (successFlag === true ? 200 : successFlag === false ? 400 : undefined);
  const messageValue =
    parsed?.message ??
    parsed?.mensaje ??
    parsed?.error?.message ??
    parsed?.error ??
    '';

  return {
    status: typeof statusValue === 'number' ? statusValue : 500,
    message: messageValue,
    data: parsed?.data ?? parsed?.datos ?? parsed?.payload ?? null
  };
}

export class DocumentoUsuarioService {
  async getAllDocumentos(
    usuarioSolicitanteId: number,
    filters: DocumentoUsuarioFilters = {}
  ): Promise<ServiceResponse<any[]>> {
    try {
      const {
        usuarioFiltroId,
        fechaDesde,
        fechaHasta,
        terminoBusqueda,
        limit,
        offset
      } = filters;

      const result = await db.query(
        'SELECT public.documento_usuario_get_all(:p_id_usuario_solicitante, :p_id_usuario_filtro, :p_fecha_desde, :p_fecha_hasta, :p_termino_busqueda, :p_limit, :p_offset) as result',
        {
          replacements: {
            p_id_usuario_solicitante: usuarioSolicitanteId,
            p_id_usuario_filtro: usuarioFiltroId ?? null,
            p_fecha_desde: fechaDesde ?? null,
            p_fecha_hasta: fechaHasta ?? null,
            p_termino_busqueda: terminoBusqueda ?? null,
            p_limit: typeof limit === 'number' ? limit : 100,
            p_offset: typeof offset === 'number' ? offset : 0
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const func = parseFuncionRespuesta(raw);

      if (!raw || (typeof func.status === 'number' && func.status >= 400)) {
        return {
          success: false,
          error: func.message || 'Error obteniendo documentos de usuario',
          statusCode: typeof func.status === 'number' ? func.status : 500
        };
      }

      const items = (func.data || []) as any[];

      return {
        success: true,
        data: items,
        statusCode: 200
      };
    } catch (error) {
      console.error('DocumentoUsuarioService.getAllDocumentos - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo documentos de usuario',
        statusCode: 500
      };
    }
  }

  async getDocumentoPorId(
    documentoId: number,
    usuarioSolicitanteId: number
  ): Promise<ServiceResponse<any>> {
    try {
      const result = await db.query(
        'SELECT public.documento_usuario_get(:p_id_documento, :p_id_usuario_solicitante) as result',
        {
          replacements: {
            p_id_documento: documentoId,
            p_id_usuario_solicitante: usuarioSolicitanteId
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const func = parseFuncionRespuesta(raw);

      if (!raw || (typeof func.status === 'number' && func.status >= 400)) {
        console.error(
          'DocumentoUsuarioService.getDocumentoPorId - Función documento_usuario_get devolvió error',
          {
            documentoId,
            usuarioSolicitanteId,
            raw,
            func
          }
        );
        return {
          success: false,
          error: func.message || 'Error obteniendo documento de usuario',
          statusCode: typeof func.status === 'number' ? func.status : 500
        };
      }

      return {
        success: true,
        data: func.data,
        statusCode: 200
      };
    } catch (error) {
      console.error('DocumentoUsuarioService.getDocumentoPorId - Error:', error);
      const message =
        error instanceof Error ? error.message : 'Error obteniendo documento de usuario';
      const lower = message.toLowerCase();
      const isNotFound =
        lower.includes('no encontrado') || lower.includes('no tienes permisos');

      return {
        success: false,
        error: message,
        statusCode: isNotFound ? 404 : 500
      };
    }
  }

  async crearDocumento(
    usuarioId: number,
    payload: {
      id_pago: number;
      base64: string;
      nombre_documento: string;
      tipo_documento: string;
      usuario_cargo: string;
    }
  ): Promise<ServiceResponse<any>> {
    try {
      const result = await db.query(
        'SELECT public.documento_usuario_post(:p_id_usuario, :p_id_pago, :p_base64, :p_nombre_documento, :p_tipo_documento, :p_usuario_cargo) as result',
        {
          replacements: {
            p_id_usuario: usuarioId,
            p_id_pago: payload.id_pago,
            p_base64: payload.base64,
            p_nombre_documento: payload.nombre_documento,
            p_tipo_documento: payload.tipo_documento,
            p_usuario_cargo: payload.usuario_cargo
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const func = parseFuncionRespuesta(raw);

      if (!raw || (typeof func.status === 'number' && func.status >= 400)) {
        return {
          success: false,
          error: func.message || 'Error creando documento de usuario',
          statusCode: typeof func.status === 'number' ? func.status : 500
        };
      }

      return {
        success: true,
        data: func.data,
        statusCode: typeof func.status === 'number' ? func.status : 201
      };
    } catch (error) {
      console.error('DocumentoUsuarioService.crearDocumento - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Error creando documento de usuario',
        statusCode: 500
      };
    }
  }

  async actualizarDocumento(
    documentoId: number,
    usuarioSolicitanteId: number,
    payload: {
      nombre_documento: string;
      tipo_documento: string;
    }
  ): Promise<ServiceResponse<any>> {
    try {
      const result = await db.query(
        'SELECT public.documento_usuario_put(:p_id_documento, :p_id_usuario_solicitante, :p_nombre_documento, :p_tipo_documento) as result',
        {
          replacements: {
            p_id_documento: documentoId,
            p_id_usuario_solicitante: usuarioSolicitanteId,
            p_nombre_documento: payload.nombre_documento,
            p_tipo_documento: payload.tipo_documento
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const func = parseFuncionRespuesta(raw);

      if (!raw || (typeof func.status === 'number' && func.status >= 400)) {
        return {
          success: false,
          error: func.message || 'Error actualizando documento de usuario',
          statusCode: typeof func.status === 'number' ? func.status : 500
        };
      }

      return {
        success: true,
        data: func.data,
        statusCode: typeof func.status === 'number' ? func.status : 200
      };
    } catch (error) {
      console.error('DocumentoUsuarioService.actualizarDocumento - Error:', error);
      const message =
        error instanceof Error ? error.message : 'Error actualizando documento de usuario';
      const lower = message.toLowerCase();
      const isNotFound = lower.includes('no encontrado');

      return {
        success: false,
        error: message,
        statusCode: isNotFound ? 404 : 500
      };
    }
  }

  async eliminarDocumento(
    documentoId: number,
    usuarioEliminaId: number
  ): Promise<ServiceResponse<any>> {
    try {
      const result = await db.query(
        'SELECT public.documento_usuario_delete(:p_id_documento, :p_id_usuario_que_elimina) as result',
        {
          replacements: {
            p_id_documento: documentoId,
            p_id_usuario_que_elimina: usuarioEliminaId
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const func = parseFuncionRespuesta(raw);

      if (!raw || (typeof func.status === 'number' && func.status >= 400)) {
        return {
          success: false,
          error: func.message || 'Error eliminando documento de usuario',
          statusCode: typeof func.status === 'number' ? func.status : 500
        };
      }

      return {
        success: true,
        data: func.data,
        statusCode: typeof func.status === 'number' ? func.status : 200
      };
    } catch (error) {
      console.error('DocumentoUsuarioService.eliminarDocumento - Error:', error);
      const message =
        error instanceof Error ? error.message : 'Error eliminando documento de usuario';
      const lower = message.toLowerCase();
      const isNotFound = lower.includes('no encontrado') || lower.includes('no tienes permisos');

      return {
        success: false,
        error: message,
        statusCode: isNotFound ? 404 : 500
      };
    }
  }
}

export default new DocumentoUsuarioService();
