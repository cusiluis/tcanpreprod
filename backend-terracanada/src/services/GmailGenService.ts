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

/**
 * Servicio de integración para el módulo Gmail-GEN.
 * 
 * Corrección: Se eliminó la dependencia estricta de funciones SQL que filtraban por 'esta_verificado'.
 * Ahora se realizan consultas directas para obtener pagos en estado 'PAGADO' y 'ACTIVO'
 * independientemente de su verificación, permitiendo enviar correos de pagos pendientes de verificación.
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
          estado: 'pendiente', // Si aparece aquí, es porque está pendiente de enviar
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

      // Nota: La función registrar_envio_correo_con_detalles debería insertar en detalle_envio_correo,
      // lo que hará que estos pagos dejen de aparecer en "pendientes" en la próxima consulta.
      
      if (!parsedRegistrar || parsedRegistrar.status >= 400) {
        return {
          success: false,
          error: parsedRegistrar?.message || 'Error registrando el envío de correo',
          statusCode: parsedRegistrar?.status || 500
        };
      }

      return {
        success: true,
        data: {
          envio: parsedRegistrar.data,
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
        error: error instanceof Error ? error.message : 'Error enviando correo de Gmail-GEN',
        statusCode: 500
      };
    }
  }

  // El resto de métodos (getCorreosPendientesGeneral, etc.) podrían requerir ajustes similares
  // si se desea el mismo comportamiento. He dejado los métodos originales abajo
  // para no romper otras funcionalidades, pero te recomiendo aplicar la misma lógica
  // si necesitas listar todos los pendientes general.

  async getCorreosPendientesGeneral(
    usuarioId: number
  ): Promise<ServiceResponse<GmailEmailGroup[]>> {
    try {
      // NOTA: Si aquí también quieres ver los no verificados, deberías cambiar la lógica
      // similar a como hicimos en getResumenPagosDia. Por ahora dejo la original.
      const resumenResult = await db.query(
        'SELECT public.correos_pendientes_general_get(:usuario_id) as result',
        {
          replacements: { usuario_id: usuarioId },
          type: QueryTypes.SELECT
        }
      );

      const rawResumen = (resumenResult[0] as any).result as any;
      const parsedResumen: any =
        typeof rawResumen === 'string' ? JSON.parse(rawResumen) : rawResumen;

      const resumenJson: any = {
        status: parsedResumen?.status ?? parsedResumen?.estado ?? 500,
        message: parsedResumen?.message ?? parsedResumen?.mensaje ?? '',
        data: parsedResumen?.data ?? parsedResumen?.datos ?? {}
      };

      if (!parsedResumen || resumenJson.status >= 400) {
        return { success: false, error: resumenJson.message, statusCode: resumenJson.status };
      }

      const data = resumenJson.data || {};
      const groups: GmailEmailGroup[] = [];
      const proveedores = Object.entries(data) as [string, any][];

      proveedores.forEach(([nombreProveedor, detalles], index) => {
        if (!detalles) return;
        const pagosOrigen = (detalles.pagos || []) as any[];
        const pagos: GmailPaymentRecord[] = pagosOrigen.map((pago: any) => ({
          id: pago.id_pago,
          cliente: pago.cliente,
          monto: Number(pago.monto),
          codigo: pago.codigo
        }));
        
        groups.push({
          id: detalles.id_proveedor,
          proveedorNombre: nombreProveedor,
          correoContacto: detalles.correo,
          color: index % 2 === 0 ? 'teal' : 'brown',
          estado: 'pendiente',
          pagos,
          totalPagos: pagos.length,
          totalMonto: pagos.reduce((acc, p) => acc + (p.monto || 0), 0)
        } as GmailEmailGroup);
      });

      return { success: true, data: groups, statusCode: 200 };
    } catch (error) {
      console.error('GmailGenService.getCorreosPendientesGeneral - Error:', error);
      return { success: false, error: 'Error general', statusCode: 500 };
    }
  }

  async getResumenEnviosFecha(
    usuarioId: number,
    fecha?: string
  ): Promise<ServiceResponse<GmailEmailGroup[]>> {
    // Manteniendo lógica original para historial de enviados
    try {
      const today = new Date();
      const fechaLocal = today.toLocaleDateString('en-CA');
      const fechaObjetivo = fecha || fechaLocal;

      const resumenResult = await db.query(
        'SELECT public.resumen_envios_fecha_get(:usuario_id, :fecha) as result',
        {
          replacements: { usuario_id: usuarioId, fecha: fechaObjetivo },
          type: QueryTypes.SELECT
        }
      );

      const rawResumen = (resumenResult[0] as any).result as any;
      const parsedResumen: any = typeof rawResumen === 'string' ? JSON.parse(rawResumen) : rawResumen;

      const resumenJson: any = {
        status: parsedResumen?.status ?? parsedResumen?.estado ?? 500,
        message: parsedResumen?.message ?? parsedResumen?.mensaje ?? '',
        data: parsedResumen?.data ?? parsedResumen?.datos ?? {}
      };

      if (!parsedResumen || resumenJson.status >= 400) {
        return { success: false, error: resumenJson.message, statusCode: resumenJson.status };
      }

      const data = resumenJson.data || {};
      const groups: GmailEmailGroup[] = [];
      const proveedores = Object.entries(data) as [string, any][];

      proveedores.forEach(([nombreProveedor, detalles], index) => {
        if (!detalles) return;
        const pagosOrigen = (detalles.pagos || []) as any[];
        const pagos: GmailPaymentRecord[] = pagosOrigen.map((pago: any) => ({
          id: pago.id_pago,
          cliente: pago.cliente,
          monto: Number(pago.monto),
          codigo: pago.codigo
        }));

        groups.push({
          id: detalles.id_proveedor,
          proveedorNombre: nombreProveedor,
          correoContacto: detalles.correo,
          color: index % 2 === 0 ? 'teal' : 'brown',
          estado: 'enviado',
          pagos,
          totalPagos: pagos.length,
          totalMonto: pagos.reduce((acc, p) => acc + (p.monto || 0), 0)
        } as GmailEmailGroup);
      });

      return { success: true, data: groups, statusCode: 200 };
    } catch (error) {
      console.error('GmailGenService.getResumenEnviosFecha - Error:', error);
      return { success: false, error: 'Error obteniendo resumen de envíos', statusCode: 500 };
    }
  }
}

export default new GmailGenService();
