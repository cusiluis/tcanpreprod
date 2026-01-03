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

/**
 * Servicio de integración para el módulo Gmail-GEN.
 * 
 * CORRECCIONES APLICADAS:
 * - getResumenPagosDia y enviarCorreoProveedor ahora ignoran el filtro 'esta_verificado'.
 * - Se restauraron todos los métodos (getHistorialEnvios, etc.) para evitar errores de compilación.
 */
export class GmailGenService {

  /**
   * Helper privado para ejecutar la consulta directa de pagos pendientes.
   * Esto evita usar la función SQL que bloqueaba los no verificados.
   */
  private async obtenerPagosDirectos(usuarioId: number, fecha: string, proveedorId?: number) {
    let query = `
      SELECT 
        p.id_pago,
        p.cliente,
        p.monto,
        p.codigo,
        pr.id as "id_proveedor",
        pr.nombre as "nombre_proveedor",
        pr.correo
      FROM pagos p
      JOIN proveedores pr ON p.proveedor_id = pr.id
      WHERE p.usuario_id = :usuario_id
        AND p.estado = 'PAGADO'
        AND p.esta_activo = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM detalle_envio_correo dec 
          WHERE dec.pago_id = p.id_pago
        )
        AND DATE(p.fecha_pago) = :fecha
    `;

    const replacements: any = {
      usuario_id: usuarioId,
      fecha: fecha
    };

    // Si se solicita un proveedor específico, filtramos aquí también
    if (proveedorId) {
      query += ` AND pr.id = :proveedor_id`;
      replacements.proveedor_id = proveedorId;
    }

    query += ` ORDER BY pr.nombre ASC`;

    return await db.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });
  }

  /**
   * Obtiene el resumen diario de pagos pendientes de envío.
   * CORRECCIÓN: Incluye pagos PAGADOS aunque no estén verificados.
   */
  async getResumenPagosDia(
    usuarioId: number,
    fecha?: string
  ): Promise<ServiceResponse<GmailEmailGroup[]>> {
    try {
      const today = new Date();
      const fechaLocal = today.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const fechaResumen = fecha || fechaLocal;

      // Ejecutamos la consulta directa en lugar de la función SQL
      const rows = await this.obtenerPagosDirectos(usuarioId, fechaResumen);

      // Agrupamos los resultados manualmente en TypeScript
      const mapGroups = new Map<string, any>();

      (rows as any[]).forEach((row: any) => {
        const key = row.nombre_proveedor;
        
        if (!mapGroups.has(key)) {
          mapGroups.set(key, {
            id_proveedor: row.id_proveedor,
            correo: row.correo,
            pagos: [],
            resumen: { monto_total: 0, cantidad_pagos: 0 }
          });
        }

        const group = mapGroups.get(key);
        const monto = Number(row.monto);
        
        group.pagos.push({
          id: row.id_pago,
          cliente: row.cliente,
          monto: monto,
          codigo: row.codigo
        });

        group.resumen.monto_total += monto;
        group.resumen.cantidad_pagos += 1;
      });

      const groups: GmailEmailGroup[] = [];
      let index = 0;

      mapGroups.forEach((detalles, nombreProveedor) => {
        groups.push({
          id: detalles.id_proveedor,
          proveedorNombre: nombreProveedor,
          correoContacto: detalles.correo,
          color: index % 2 === 0 ? 'teal' : 'brown',
          estado: 'pendiente',
          pagos: detalles.pagos,
          totalPagos: detalles.resumen.cantidad_pagos,
          totalMonto: detalles.resumen.monto_total
        });
        index++;
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
        error: 'Error obteniendo resumen de pagos (Direct Query)',
        statusCode: 500
      };
    }
  }

  /**
   * Obtiene TODOS los pagos pendientes de envío para Gmail-GEN,
   * sin filtrar por fecha de creación.
   * Mantiene lógica original pero es un punto a vigilar para la corrección de no verificados.
   */
  async getCorreosPendientesGeneral(
    usuarioId: number
  ): Promise<ServiceResponse<GmailEmailGroup[]>> {
    try {
      // NOTA: Esta función usa la lógica original. Si necesitas ver NO VERIFICADOS aquí también,
      // deberíamos cambiarla por una query directa como en getResumenPagosDia.
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
          totalMonto
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
   * CORRECCIÓN: Usa la consulta directa para obtener pagos aunque no estén verificados.
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

      // 1. Obtener pagos directamente de la BD (sin filtro de verificación)
      const rows = await this.obtenerPagosDirectos(usuarioId, fechaResumen, proveedorId);
      
      // 2. Procesar los resultados
      if (!rows || (rows as any[]).length === 0) {
        return {
          success: false,
          error: 'No se encontraron pagos pendientes para este proveedor (Pagado + Activo).',
          statusCode: 404
        };
      }

      // Como filtramos por proveedorId, todos los filas pertenecen al mismo proveedor
      const firstRow = (rows as any[])[0];
      const proveedorNombre = firstRow.nombre_proveedor;
      const correoProveedor = firstRow.correo;

      const pagos: GmailPaymentRecord[] = (rows as any[]).map((r) => ({
        id: r.id_pago,
        cliente: r.cliente,
        monto: Number(r.monto),
        codigo: r.codigo
      }));

      const cantidadPagos = pagos.length;
      const montoTotal = pagos.reduce((acc, p) => acc + (p.monto || 0), 0);

      // 3. Construir Payload
      const asuntoFinal = (asunto && asunto.trim()) || `Confirmación de pagos - ${proveedorNombre}`;
      const mensajeFinal = (mensaje && mensaje.trim()) || 
        `Estimado proveedor, le enviamos el resumen de ${cantidadPagos} pago(s) por un total de ${montoTotal.toFixed(2)} correspondiente a la fecha ${fechaResumen}.`;

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
        info_pagos: pagos.map((p) => ({
          monto: p.monto,
          codigo: p.codigo,
          cliente: p.cliente
        }))
      };

      // 4. Enviar a n8n
      const webhookUrl = 'https://n8n.salazargroup.cloud/webhook/enviar_gmail';
      const authHeader = 'Basic YWRtaW46Y3JpcF9hZG1pbmQ1Ny1hNjA5LTZlYWYxZjllODdmNg==';

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
        if (webhookResponseData?.code && webhookResponseData.estado === false) {
          estadoEnvio = 'ERROR_WEBHOOK';
        }
      } catch (error: any) {
        console.error('GmailGenService.enviarCorreoProveedor - Error webhook:', error?.message);
        estadoEnvio = 'ERROR_WEBHOOK';
      }

      // 5. Registrar en BD (Auditoría)
      const idsPagosTarjeta: number[] = [];
      const idsPagosBancario: number[] = [];

      pagos.forEach((p) => {
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
      const parsedRegistrar: any = typeof rawRegistrar === 'string' ? JSON.parse(rawRegistrar) : rawRegistrar;
      
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
          infoPagos: pagos,
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
