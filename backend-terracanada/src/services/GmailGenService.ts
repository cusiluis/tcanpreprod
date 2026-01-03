import db from '../config/database';
import { QueryTypes } from 'sequelize';
import axios from 'axios';
import { ServiceResponse } from '../types';

interface GmailPaymentRecord {
  id: number;
  cliente: string;
  monto: number;
  codigo: string;
}

export type GmailGroupEstado = 'pendiente' | 'enviado';

interface GmailUltimoEnvio {
  correoElectronico: string;
  asunto: string;
  mensaje: string;
  fechaEnvio: string;
}

export interface GmailEmailGroup {
  id: number;
  proveedorNombre: string;
  correoContacto: string;
  color: 'teal' | 'brown';
  estado: GmailGroupEstado;
  pagos: GmailPaymentRecord[];
  totalPagos: number;
  totalMonto: number;
  /** Fecha de resumen asociada al lote de pagos (YYYY-MM-DD). */
  fechaResumen?: string;
  ultimoEnvio?: GmailUltimoEnvio;
}

interface ResumenFuncionResponse {
  status: number;
  message: string;
  data: any;
}

interface RegistrarEnvioResponse {
  status: number;
  message: string;
  data: any;
}

interface ObtenerDatosCorreoResponse {
  status: number;
  message: string;
  data: {
    info_correo: any;
    info_pagos: any[];
  } | null;
}

/**
 * Servicio de integración para el módulo Gmail-GEN.
 *
 * Funciones SQL utilizadas desde este servicio:
 * - public.resumen_pagos_dia_get(p_usuario_id, p_fecha):
 *   devuelve un JSON con el resumen de pagos por proveedor,
 *   SOLO para pagos:
 *   - en estado 'PAGADO'
 *   - con esta_verificado = TRUE
 *   - esta_activo = TRUE
 *   - que aún no existen en public.detalle_envio_correo
 *
 * - public.obtener_datos_correo_n8n(p_proveedor_id, p_usuario_id, p_fecha):
 *   genera un JSON con info_correo + info_pagos con los mismos filtros,
 *   diseñado para ser consumido directamente por n8n.
 */
export class GmailGenService {
  /**
   * Obtiene el resumen diario de pagos pendientes de envío para Gmail-GEN.
   *
   * Importante:
   * - Usa la función SQL public.resumen_pagos_dia_get.
   * - La función de BD ya filtra por pagos PAGADOS, verificados y no enviados.
   */
  async getResumenPagosDia(
    usuarioId: number,
    fecha?: string
  ): Promise<ServiceResponse<GmailEmailGroup[]>> {
    try {
      const today = new Date();
      const fechaLocal = today.toLocaleDateString('en-CA'); // YYYY-MM-DD en zona horaria local
      const fechaResumen = fecha || fechaLocal;

      const resumenResult = await db.query(
        'SELECT public.resumen_pagos_dia_get(:usuario_id, :fecha) as result',
        {
          replacements: {
            usuario_id: usuarioId,
            fecha: fechaResumen
          },
          type: QueryTypes.SELECT
        }
      );

      const rawResumen = (resumenResult[0] as any).result as any;
      const parsedResumen: any =
        typeof rawResumen === 'string' ? JSON.parse(rawResumen) : rawResumen;

      const resumenJson: ResumenFuncionResponse = {
        status: parsedResumen?.status ?? parsedResumen?.estado ?? 500,
        message: parsedResumen?.message ?? parsedResumen?.mensaje ?? '',
        data: parsedResumen?.data ?? parsedResumen?.datos ?? {}
      };

      if (!parsedResumen || (typeof resumenJson.status === 'number' && resumenJson.status >= 400)) {
        return {
          success: false,
          error:
            resumenJson.message ||
            'Error obteniendo resumen de pagos para Gmail-GEN',
          statusCode:
            typeof resumenJson.status === 'number' ? resumenJson.status : 500
        };
      }

      const data = resumenJson.data || {};

      const groups: GmailEmailGroup[] = [];
      const proveedores = Object.entries(data) as [string, any][];

      proveedores.forEach(([nombreProveedor, detalles], index) => {
        if (!detalles) {
          return;
        }

        const proveedorId = detalles.id_proveedor as number;
        const correoProveedor = detalles.correo as string;
        const fechaResumenLote = (detalles.fecha_resumen || detalles.fecha || fechaResumen) as
          string | undefined;
        const pagosOrigen = (detalles.pagos || []) as any[];
        const resumen = detalles.resumen || {};

        const pagos: GmailPaymentRecord[] = pagosOrigen.map((pago: any) => ({
          id: pago.id_pago,
          cliente: pago.cliente,
          monto: Number(pago.monto),
          codigo: pago.codigo
        }));

        const totalPagos =
          typeof resumen.cantidad_pagos === 'number'
            ? resumen.cantidad_pagos
            : pagos.length;
        const totalMonto =
          typeof resumen.monto_total === 'number'
            ? Number(resumen.monto_total)
            : pagos.reduce((acc, p) => acc + (p.monto || 0), 0);

        groups.push({
          id: proveedorId,
          proveedorNombre: nombreProveedor,
          correoContacto: correoProveedor,
          color: index % 2 === 0 ? 'teal' : 'brown',
          estado: 'pendiente',
          pagos,
          totalPagos,
          totalMonto,
          fechaResumen: fechaResumenLote
        } as GmailEmailGroup);
      });

      return {
        success: true,
        data: groups,
        statusCode: 200
      };
    } catch (error) {
      console.error('GmailGenService.getResumenPagosDia - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo resumen de pagos para Gmail-GEN',
        statusCode: 500
      };
    }
  }

  /**
   * Obtiene TODOS los pagos pendientes de envío para Gmail-GEN,
   * sin filtrar por fecha de creación.
   *
   * Usa la función SQL public.correos_pendientes_general_get(p_usuario_id).
   */
  async getCorreosPendientesGeneral(
    usuarioId: number
  ): Promise<ServiceResponse<GmailEmailGroup[]>> {
    try {
      const resumenResult = await db.query(
        'SELECT public.correos_pendientes_general_get(:usuario_id) as result',
        {
          replacements: {
            usuario_id: usuarioId
          },
          type: QueryTypes.SELECT
        }
      );

      const rawResumen = (resumenResult[0] as any).result as any;
      const parsedResumen: any =
        typeof rawResumen === 'string' ? JSON.parse(rawResumen) : rawResumen;

      const resumenJson: ResumenFuncionResponse = {
        status: parsedResumen?.status ?? parsedResumen?.estado ?? 500,
        message: parsedResumen?.message ?? parsedResumen?.mensaje ?? '',
        data: parsedResumen?.data ?? parsedResumen?.datos ?? {}
      };

      if (
        !parsedResumen ||
        (typeof resumenJson.status === 'number' && resumenJson.status >= 400)
      ) {
        return {
          success: false,
          error:
            resumenJson.message ||
            'Error obteniendo correos pendientes generales para Gmail-GEN',
          statusCode:
            typeof resumenJson.status === 'number' ? resumenJson.status : 500
        };
      }

      const data = resumenJson.data || {};

      const groups: GmailEmailGroup[] = [];
      const proveedores = Object.entries(data) as [string, any][];

      proveedores.forEach(([nombreProveedor, detalles], index) => {
        if (!detalles) {
          return;
        }

        const proveedorId = detalles.id_proveedor as number;
        const correoProveedor = detalles.correo as string;
        const pagosOrigen = (detalles.pagos || []) as any[];
        const resumen = detalles.resumen || {};
        const fechaResumenLote = ((resumen as any).fecha_resumen ||
          (resumen as any).fecha ||
          (detalles as any).fecha_resumen ||
          (detalles as any).fecha) as string | undefined;

        const pagos: GmailPaymentRecord[] = pagosOrigen.map((pago: any) => ({
          id: pago.id_pago,
          cliente: pago.cliente,
          monto: Number(pago.monto),
          codigo: pago.codigo
        }));

        const totalPagos =
          typeof resumen.cantidad_pagos === 'number'
            ? resumen.cantidad_pagos
            : pagos.length;
        const totalMonto =
          typeof resumen.monto_total === 'number'
            ? Number(resumen.monto_total)
            : pagos.reduce((acc, p) => acc + (p.monto || 0), 0);

        groups.push({
          id: proveedorId,
          proveedorNombre: nombreProveedor,
          correoContacto: correoProveedor,
          color: index % 2 === 0 ? 'teal' : 'brown',
          estado: 'pendiente',
          pagos,
          totalPagos,
          totalMonto,
          fechaResumen: fechaResumenLote
        } as GmailEmailGroup);
      });

      return {
        success: true,
        data: groups,
        statusCode: 200
      };
    } catch (error) {
      console.error(
        'GmailGenService.getCorreosPendientesGeneral - Error:',
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo correos pendientes generales para Gmail-GEN',
        statusCode: 500
      };
    }
  }

  async getResumenEnviosFecha(
    usuarioId: number,
    fecha?: string
  ): Promise<ServiceResponse<GmailEmailGroup[]>> {
    try {
      const today = new Date();
      const fechaLocal = today.toLocaleDateString('en-CA');
      const fechaObjetivo = fecha || fechaLocal;

      const resumenResult = await db.query(
        'SELECT public.resumen_envios_fecha_get(:usuario_id, :fecha) as result',
        {
          replacements: {
            usuario_id: usuarioId,
            fecha: fechaObjetivo
          },
          type: QueryTypes.SELECT
        }
      );

      const rawResumen = (resumenResult[0] as any).result as any;
      const parsedResumen: any =
        typeof rawResumen === 'string' ? JSON.parse(rawResumen) : rawResumen;

      const resumenJson: ResumenFuncionResponse = {
        status: parsedResumen?.status ?? parsedResumen?.estado ?? 500,
        message: parsedResumen?.message ?? parsedResumen?.mensaje ?? '',
        data: parsedResumen?.data ?? parsedResumen?.datos ?? {}
      };

      if (!parsedResumen || (typeof resumenJson.status === 'number' && resumenJson.status >= 400)) {
        return {
          success: false,
          error:
            resumenJson.message ||
            'Error obteniendo resumen de envíos para Gmail-GEN',
          statusCode:
            typeof resumenJson.status === 'number' ? resumenJson.status : 500
        };
      }

      const data = resumenJson.data || {};
      const groups: GmailEmailGroup[] = [];
      const proveedores = Object.entries(data) as [string, any][];

      proveedores.forEach(([nombreProveedor, detalles], index) => {
        if (!detalles) {
          return;
        }

        const proveedorId = detalles.id_proveedor as number;
        const correoProveedor = detalles.correo as string;
        const pagosOrigen = (detalles.pagos || []) as any[];
        const resumen = detalles.resumen || {};

        const pagos: GmailPaymentRecord[] = pagosOrigen.map((pago: any) => ({
          id: pago.id_pago,
          cliente: pago.cliente,
          monto: Number(pago.monto),
          codigo: pago.codigo
        }));

        const totalPagos =
          typeof resumen.cantidad_pagos === 'number'
            ? resumen.cantidad_pagos
            : pagos.length;
        const totalMonto =
          typeof resumen.monto_total === 'number'
            ? Number(resumen.monto_total)
            : pagos.reduce((acc, p) => acc + (p.monto || 0), 0);

        groups.push({
          id: proveedorId,
          proveedorNombre: nombreProveedor,
          correoContacto: correoProveedor,
          color: index % 2 === 0 ? 'teal' : 'brown',
          estado: 'enviado',
          pagos,
          totalPagos,
          totalMonto
        } as GmailEmailGroup);
      });

      return {
        success: true,
        data: groups,
        statusCode: 200
      };
    } catch (error) {
      console.error('GmailGenService.getResumenEnviosFecha - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo resumen de envíos para Gmail-GEN',
        statusCode: 500
      };
    }
  }

  async getHistorialEnvios(
    usuarioId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceResponse<any[]>> {
    try {
      const result = await db.query(
        'SELECT public.historial_envios_get(:usuario_id, :limit, :offset) as result',
        {
          replacements: {
            usuario_id: usuarioId,
            limit,
            offset
          },
          type: QueryTypes.SELECT
        }
      );

      const raw = (result[0] as any).result as any;
      const parsed: any =
        typeof raw === 'string' ? JSON.parse(raw) : raw;

      const histJson = {
        status: parsed?.status ?? parsed?.estado ?? 500,
        message: parsed?.message ?? parsed?.mensaje ?? '',
        data: parsed?.data ?? parsed?.datos ?? []
      };

      if (!parsed || (typeof histJson.status === 'number' && histJson.status >= 400)) {
        return {
          success: false,
          error:
            histJson.message ||
            'Error obteniendo historial de envíos para Gmail-GEN',
          statusCode:
            typeof histJson.status === 'number' ? histJson.status : 500
        };
      }

      const items = (histJson.data || []) as any[];

      return {
        success: true,
        data: items,
        statusCode: 200
      };
    } catch (error) {
      console.error('GmailGenService.getHistorialEnvios - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error obteniendo historial de envíos para Gmail-GEN',
        statusCode: 500
      };
    }
  }

  /**
   * Envía el correo de confirmación de pagos a un proveedor.
   *
   * Usa nuevamente public.resumen_pagos_dia_get para obtener los pagos
   * elegibles (PAGADO + esta_verificado = TRUE y no registrados en detalle_envio_correo)
   * y construye el payload info_correo + info_pagos que se envía al webhook n8n.
   */
  async enviarCorreoProveedor(
    usuarioId: number,
    proveedorId: number,
    fecha?: string,
    asunto?: string,
    mensaje?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const today = new Date();
      const fechaLocal = today.toLocaleDateString('en-CA');
      const fechaResumen = fecha || fechaLocal;

      const resumenResult = await db.query(
        'SELECT public.resumen_pagos_dia_get(:usuario_id, :fecha) as result',
        {
          replacements: {
            usuario_id: usuarioId,
            fecha: fechaResumen
          },
          type: QueryTypes.SELECT
        }
      );

      const rawResumen = (resumenResult[0] as any).result as any;
      const parsedResumen: any =
        typeof rawResumen === 'string' ? JSON.parse(rawResumen) : rawResumen;

      const resumenJson: ResumenFuncionResponse = {
        status: parsedResumen?.status ?? parsedResumen?.estado ?? 500,
        message: parsedResumen?.message ?? parsedResumen?.mensaje ?? '',
        data: parsedResumen?.data ?? parsedResumen?.datos ?? {}
      };

      if (
        !parsedResumen ||
        (typeof resumenJson.status === 'number' && resumenJson.status >= 400)
      ) {
        return {
          success: false,
          error:
            resumenJson.message ||
            'Error obteniendo pagos pendientes para este proveedor',
          statusCode:
            typeof resumenJson.status === 'number' ? resumenJson.status : 500
        };
      }

      const data = resumenJson.data || {};

      let detallesProveedor: any | null = null;
      let proveedorNombre = '';

      Object.entries(data as Record<string, any>).forEach(
        ([nombreProveedor, detalles]) => {
          if (detalles && detalles.id_proveedor === proveedorId) {
            detallesProveedor = detalles;
            proveedorNombre = nombreProveedor;
          }
        }
      );

      if (!detallesProveedor) {
        return {
          success: false,
          error:
            'No se encontraron pagos pendientes para este proveedor en la fecha dada',
          statusCode: 404
        };
      }

      const correoProveedor = detallesProveedor.correo as string;
      const pagosOrigen = (detallesProveedor.pagos || []) as any[];
      const resumen = detallesProveedor.resumen || {};

      if (!pagosOrigen.length) {
        return {
          success: false,
          error:
            'No se encontraron pagos pendientes para este proveedor en la fecha dada',
          statusCode: 404
        };
      }

      const infoPagos = pagosOrigen.map((pago: any) => ({
        id: pago.id_pago as number,
        cliente: pago.cliente as string,
        monto: Number(pago.monto),
        codigo: pago.codigo
      }));

      const cantidadPagos =
        typeof resumen.cantidad_pagos === 'number'
          ? resumen.cantidad_pagos
          : infoPagos.length;
      const montoTotal =
        typeof resumen.monto_total === 'number'
          ? Number(resumen.monto_total)
          : infoPagos.reduce((acc, p) => acc + (p.monto || 0), 0);

      const asuntoFinal =
        (asunto && asunto.trim()) ||
        `Confirmación de pagos - ${proveedorNombre}`;

      const mensajeFinal =
        (mensaje && mensaje.trim()) ||
        `Estimado proveedor, le enviamos el resumen de ${cantidadPagos} pago(s) por un total de ${montoTotal.toFixed(
          2
        )} correspondiente a la fecha ${fechaResumen}.`;

      const infoCorreoExtendido = {
        fecha: fechaResumen,
        correo: correoProveedor,
        proveedor: proveedorNombre,
        monto_total: montoTotal,
        cantidad_pagos: cantidadPagos,
        asunto: asuntoFinal,
        mensaje: mensajeFinal
      };

      const webhookPayload = {
        info_correo: infoCorreoExtendido,
        info_pagos: infoPagos.map((p) => ({
          monto: p.monto,
          codigo: p.codigo,
          cliente: p.cliente
        }))
      };

      const webhookUrl =
        'https://n8n.salazargroup.cloud/webhook/enviar_gmail';
      const authHeader =
        'Basic YWRtaW46Y3JpcF9hZG1pbmQ1Ny1hNjA5LTZlYWYxZjllODdmNg==';

      let webhookResponseData: any = null;
      let estadoEnvio = 'ENVIADO';

      try {
        const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
          headers: {
            authorization: authHeader,
            'content-type': 'application/json'
          },
          timeout: 15000
        });

        webhookResponseData = webhookResponse.data;

        if (
          webhookResponseData &&
          webhookResponseData.code &&
          webhookResponseData.estado === false
        ) {
          estadoEnvio = 'ERROR_WEBHOOK';
        }
      } catch (error: any) {
        console.error(
          'GmailGenService.enviarCorreoProveedor - Error webhook n8n/enviar_gmail:',
          error?.response?.data || error.message
        );
        estadoEnvio = 'ERROR_WEBHOOK';
      }

      const idsPagosTarjeta: number[] = [];
      const idsPagosBancario: number[] = [];

      infoPagos.forEach((p) => {
        const codigoStr = String(p.codigo || '').toUpperCase();
        if (codigoStr.startsWith('BANCO-')) {
          idsPagosBancario.push(p.id);
        } else {
          idsPagosTarjeta.push(p.id);
        }
      });

      const idsPagosTarjetaLiteral = `{${idsPagosTarjeta.join(',')}}`;
      const idsPagosBancarioLiteral = `{${idsPagosBancario.join(',')}}`;

      const registrarResult = await db.query(
        'SELECT public.registrar_envio_correo_con_detalles(:proveedor_id, :usuario_envio_id, :fecha_resumen, :cantidad_pagos, :monto_total, :asunto_correo, :cuerpo_correo, :ids_pagos_tarjeta, :ids_pagos_bancario) as result',
        {
          replacements: {
            proveedor_id: proveedorId,
            usuario_envio_id: usuarioId,
            fecha_resumen: fechaResumen,
            cantidad_pagos: cantidadPagos,
            monto_total: montoTotal,
            asunto_correo: asuntoFinal,
            cuerpo_correo: mensajeFinal,
            ids_pagos_tarjeta: idsPagosTarjetaLiteral,
            ids_pagos_bancario: idsPagosBancarioLiteral
          },
          type: QueryTypes.SELECT
        }
      );

      const rawRegistrar = (registrarResult[0] as any).result as any;
      const parsedRegistrar: any =
        typeof rawRegistrar === 'string' ? JSON.parse(rawRegistrar) : rawRegistrar;

      const registrarJson: RegistrarEnvioResponse = {
        status: parsedRegistrar?.status ?? parsedRegistrar?.estado ?? 500,
        message: parsedRegistrar?.message ?? parsedRegistrar?.mensaje ?? '',
        data: parsedRegistrar?.data ?? parsedRegistrar?.datos ?? null
      };

      if (!parsedRegistrar || (typeof registrarJson.status === 'number' && registrarJson.status >= 400)) {
        return {
          success: false,
          error:
            registrarJson.message ||
            'Error registrando el envío de correo en la auditoría',
          statusCode:
            typeof registrarJson.status === 'number' ? registrarJson.status : 500
        };
      }

      return {
        success: true,
        data: {
          envio: registrarJson.data,
          infoCorreo: infoCorreoExtendido,
          infoPagos,
          webhook: webhookResponseData
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('GmailGenService.enviarCorreoProveedor - Error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error enviando correo de Gmail-GEN',
        statusCode: 500
      };
    }
  }
}

export default new GmailGenService();
