import { BaseService } from './BaseService';
import Pago, { EstadoPago } from '../models/Pago';
import Cliente from '../models/Cliente';
import Proveedor from '../models/Proveedor';
import Tarjeta from '../models/Tarjeta';
import Usuario from '../models/Usuario';
import { ServiceResponse, QueryOptions, PaginatedResponse } from '../types';
import { Op } from 'sequelize';
import axios from 'axios';

export interface CreatePagoPayload {
  cliente_id: number;
  proveedor_id: number;
  correo_proveedor: string;
  tarjeta_id: number;
  monto: number;
  numero_presta: string;
  comentarios?: string;
}

export interface UpdatePagoPayload {
  estado?: EstadoPago;
  esta_verificado?: boolean;
  comentarios?: string;
}

export class PagoService extends BaseService<Pago> {
  constructor() {
    super(Pago);
  }

  /**
   * Crear nuevo pago usando función PostgreSQL
   */
  async create(
    data: CreatePagoPayload | any,
    usuarioId?: number
  ): Promise<ServiceResponse<Pago>> {
    try {
      if (!usuarioId) {
        return {
          success: false,
          error: 'Usuario no autenticado',
          statusCode: 401
        };
      }

      // Llamar función PostgreSQL pago_post
      const db = require('../config/database').default;
      const { QueryTypes } = require('sequelize');

      const result = await db.query(
        `SELECT * FROM pago_post(
          :cliente_id,
          :proveedor_id,
          :correo_proveedor,
          :tarjeta_id,
          :monto,
          :numero_presta,
          :registrado_por_usuario_id,
          :comentarios
        )`,
        {
          replacements: {
            cliente_id: data.cliente_id,
            proveedor_id: data.proveedor_id,
            correo_proveedor: data.correo_proveedor || null,
            tarjeta_id: data.tarjeta_id,
            monto: data.monto,
            numero_presta: data.numero_presta,
            registrado_por_usuario_id: usuarioId,
            comentarios: data.comentarios || null
          },
          type: QueryTypes.SELECT
        }
      );

      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║  CREANDO PAGO - FUNCIÓN PostgreSQL pago_post()            ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('Parámetros enviados:', {
        cliente_id: data.cliente_id,
        proveedor_id: data.proveedor_id,
        tarjeta_id: data.tarjeta_id,
        monto: data.monto,
        numero_presta: data.numero_presta,
        registrado_por_usuario_id: usuarioId
      });
      console.log('Resultado raw de la función:', result);

      if (result && result.length > 0) {
        // La función retorna un objeto con clave 'pago_post'
        let response = (result[0] as any).pago_post;
        
        // Si es string, parsear JSON
        if (typeof response === 'string') {
          response = JSON.parse(response);
        }
        
        console.log('Response de pago_post():', JSON.stringify(response, null, 2));
        
        // Verificar si la función retornó un error
        if (response.status && response.status >= 400) {
          console.log('❌ Error retornado por pago_post():', response.error || response.message);
          
          return {
            success: false,
            error: response.error || response.message || 'Error creando pago',
            statusCode: response.status
          };
        }
        
        // Éxito: Cargar el pago con todas sus relaciones
        const pagoId = response.data?.pago?.id;
        if (pagoId) {
          const pagoCompleto = await Pago.findByPk(pagoId, {
            include: [
              {
                model: Cliente,
                attributes: ['id', 'nombre', 'ubicacion', 'telefono', 'correo']
              },
              {
                model: Proveedor,
                attributes: ['id', 'nombre', 'servicio', 'telefono', 'correo']
              },
              {
                model: Tarjeta,
                as: 'tarjeta',
                attributes: ['id', 'nombre_titular', 'numero_tarjeta', 'saldo', 'limite']
              },
              {
                model: Usuario,
                as: 'registradoPor',
                attributes: ['id', 'nombre_usuario', 'nombre_completo']
              },
              {
                model: Usuario,
                as: 'verificadoPor',
                attributes: ['id', 'nombre_usuario', 'nombre_completo']
              }
            ]
          });

          console.log('✅ Pago creado exitosamente. ID:', pagoId);
          console.log('Saldo anterior:', response.data?.detalle_tarjeta?.saldo_anterior);
          console.log('Saldo nuevo:', response.data?.detalle_tarjeta?.nuevo_saldo);
          console.log('Monto cargado:', response.data?.detalle_tarjeta?.monto_cargado);

          // Enviar datos al webhook de n8n si la creación fue exitosa
          if (response.status === 201 || response.status === 200) {
            this.enviarWebhookN8n(pagoCompleto, usuarioId).catch(error => {
              console.error('Error enviando webhook a n8n:', error.message);
            });
          }

          return {
            success: true,
            data: pagoCompleto || undefined,
            statusCode: response.status || 201
          };
        }
        
        return {
          success: true,
          data: response.data,
          statusCode: response.status || 201
        };
      }

      return {
        success: false,
        error: 'Error creando pago - Sin respuesta de la función',
        statusCode: 500
      };
    } catch (error) {
      console.error('PagoService.create() - Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error creando pago';
      return {
        success: false,
        error: errorMessage,
        statusCode: 500
      };
    }
  }

  /**
   * Crear nuevo pago (método antiguo - mantener para compatibilidad)
   */
  async createOld(
    data: CreatePagoPayload | any,
    usuarioId?: number
  ): Promise<ServiceResponse<Pago>> {
    try {
      // Validar que el número de presta sea único
      const pagoExistente = await Pago.findOne({
        where: { numero_presta: data.numero_presta }
      });

      if (pagoExistente) {
        return {
          success: false,
          error: 'El número de Presta ya existe',
          statusCode: 400
        };
      }

      // Validar que el cliente exista
      const cliente = await Cliente.findByPk(data.cliente_id);
      if (!cliente) {
        return {
          success: false,
          error: 'Cliente no encontrado',
          statusCode: 404
        };
      }

      // Validar que el proveedor exista
      const proveedor = await Proveedor.findByPk(data.proveedor_id);
      if (!proveedor) {
        return {
          success: false,
          error: 'Proveedor no encontrado',
          statusCode: 404
        };
      }

      // Validar que la tarjeta exista
      const tarjeta = await Tarjeta.findByPk(data.tarjeta_id);
      if (!tarjeta) {
        return {
          success: false,
          error: 'Tarjeta no encontrada',
          statusCode: 404
        };
      }

      // Validar que el monto no exceda el saldo disponible
      if (data.monto > tarjeta.saldo) {
        return {
          success: false,
          error: 'Saldo insuficiente en la tarjeta',
          statusCode: 400
        };
      }

      // Crear pago
      const pago = await Pago.create({
        cliente_id: data.cliente_id,
        proveedor_id: data.proveedor_id,
        correo_proveedor: data.correo_proveedor,
        tarjeta_id: data.tarjeta_id,
        monto: data.monto,
        numero_presta: data.numero_presta,
        comentarios: data.comentarios,
        estado: EstadoPago.A_PAGAR,
        esta_verificado: false,
        registrado_por_usuario_id: usuarioId
      });

      return {
        success: true,
        data: pago,
        statusCode: 201
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error creando pago',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener todos los pagos usando función PostgreSQL
   * - Admin: ve todos los pagos
   * - Equipo: ve solo sus propios pagos
   */
  async getAll(
    usuarioId?: number | QueryOptions,
    rolNombre?: string,
    options?: QueryOptions
  ): Promise<ServiceResponse<PaginatedResponse<any>>> {
    try {
      // Llamar función PostgreSQL pago_get_all
      const db = require('../config/database').default;
      const { QueryTypes } = require('sequelize');

      console.log('PagoService.getAll() - Parámetros:', { usuarioId, rolNombre, options });

      // Determinar parámetros de filtrado
      const usuarioIdParam = rolNombre === 'Equipo' ? usuarioId : null;
      const estado = 'todos';
      const verificacion = 'todos';
      
      console.log('PagoService.getAll() - Parámetros procesados:', { usuarioIdParam, estado, verificacion });

      const result = await db.query(
        `SELECT * FROM pago_get_all(:usuario_id, :estado, :verificacion)`,
        {
          replacements: {
            usuario_id: usuarioIdParam,
            estado: estado,
            verificacion: verificacion
          },
          type: QueryTypes.SELECT
        }
      );

      console.log('PagoService.getAll() - Resultado:', result);

      if (result && result.length > 0) {
        // La función retorna un objeto con clave 'pago_get_all'
        const response = (result[0] as any).pago_get_all;
        console.log('PagoService.getAll() - Response:', response);
        let pagos: any[] = [];

        if (Array.isArray(response.data)) {
          pagos = response.data;
        }

        return {
          success: true,
          data: pagos as any,
          statusCode: response.status || 200
        };
      }

      return {
        success: true,
        data: [] as any,
        statusCode: 200
      };
    } catch (error) {
      console.error('PagoService.getAll() - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo pagos',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener todos los pagos (método antiguo - mantener para compatibilidad)
   */
  async getAllOld(
    usuarioId?: number | QueryOptions,
    rolNombre?: string,
    options?: QueryOptions
  ): Promise<ServiceResponse<PaginatedResponse<any>>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const offset = (page - 1) * limit;

      let filtros: any = { esta_activo: true };

      // Si es Equipo, solo ver sus propios pagos
      if (rolNombre === 'Equipo') {
        filtros.registrado_por_usuario_id = usuarioId;
      }

      const { count, rows } = await Pago.findAndCountAll({
        where: filtros,
        include: [
          {
            model: Cliente,
            attributes: ['id', 'nombre']
          },
          {
            model: Proveedor,
            attributes: ['id', 'nombre', 'servicio']
          },
          {
            model: Tarjeta,
            as: 'tarjeta',
            attributes: ['id', 'tipo_tarjeta_id', 'saldo_actual']
          },
          {
            model: Usuario,
            as: 'registradoPor',
            attributes: ['id', 'nombre_usuario', 'nombre_completo']
          }
        ],
        limit,
        offset,
        order: [['fecha_creacion', 'DESC']]
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
        error: error instanceof Error ? error.message : 'Error obteniendo pagos',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener pago por ID
   */
  async getById(id: string | number): Promise<ServiceResponse<any>> {
    try {
      const db = require('../config/database').default;
      const { QueryTypes } = require('sequelize');

      const result = await db.query(
        `SELECT * FROM pago_get(:id)`,
        {
          replacements: { id },
          type: QueryTypes.SELECT
        }
      );

      if (result && result.length > 0) {
        let response = (result[0] as any).pago_get;
        if (typeof response === 'string') {
          response = JSON.parse(response);
        }

        if (response && (response.status === 200 || response.status === 201)) {
          return {
            success: true,
            data: response.data,
            statusCode: response.status || 200
          };
        }

        return {
          success: false,
          error: response?.message || 'Pago no encontrado',
          statusCode: response?.status || 404
        };
      }

      return {
        success: false,
        error: 'Pago no encontrado',
        statusCode: 404
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo pago',
        statusCode: 500
      };
    }
  }

  /**
   * Actualizar pago usando función PostgreSQL pago_put
   */
  async update(
    id: string | number,
    data: UpdatePagoPayload | any,
    usuarioId?: number
  ): Promise<ServiceResponse<any>> {
    try {
      const db = require('../config/database').default;
      const { QueryTypes } = require('sequelize');

      console.log('PagoService.update() - Parámetros:', { id, data, usuarioId });

      // Usar valores por defecto si no se proporcionan
      const nuevoEstado = data.estado || 'A PAGAR';
      const nuevaVerificacion = data.esta_verificado !== undefined ? data.esta_verificado : false;
      const verificadoPorUsuarioId = nuevaVerificacion ? usuarioId : null;

      const result = await db.query(
        `SELECT * FROM pago_put(:id, :nuevo_estado, :nueva_verificacion, :verificado_por_usuario_id)`,
        {
          replacements: {
            id: id,
            nuevo_estado: nuevoEstado,
            nueva_verificacion: nuevaVerificacion,
            verificado_por_usuario_id: verificadoPorUsuarioId
          },
          type: QueryTypes.SELECT
        }
      );

      console.log('PagoService.update() - Resultado de pago_put():', result);

      if (result && result.length > 0) {
        const response = (result[0] as any).pago_put;
        console.log('PagoService.update() - Response:', response);

        if (response.status !== 200) {
          return {
            success: false,
            error: response.message || 'Error actualizando pago',
            statusCode: response.status
          };
        }

        // Recargar el pago con todas sus relaciones
        const pagoActualizado = await Pago.findByPk(id, {
          include: [
            {
              model: Cliente,
              attributes: ['id', 'nombre']
            },
            {
              model: Proveedor,
              attributes: ['id', 'nombre', 'servicio']
            },
            {
              model: Tarjeta,
              as: 'tarjeta',
              attributes: ['id', 'nombre_titular', 'numero_tarjeta', 'saldo']
            },
            {
              model: Usuario,
              as: 'registradoPor',
              attributes: ['id', 'nombre_usuario', 'nombre_completo']
            },
            {
              model: Usuario,
              as: 'verificadoPor',
              attributes: ['id', 'nombre_usuario', 'nombre_completo']
            }
          ]
        });

        return {
          success: true,
          data: pagoActualizado,
          statusCode: 200
        };
      }

      return {
        success: false,
        error: 'Error actualizando pago',
        statusCode: 500
      };
    } catch (error) {
      console.error('PagoService.update() - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error actualizando pago',
        statusCode: 500
      };
    }
  }

  /**
   * Verificar pago (cambiar estado a PAGADO y marcar como verificado)
   */
  async verificarPago(
    id: string | number,
    usuarioId: number
  ): Promise<ServiceResponse<any>> {
    try {
      const pago = await Pago.findByPk(id);

      if (!pago) {
        return {
          success: false,
          error: 'Pago no encontrado',
          statusCode: 404
        };
      }

      // Actualizar estado y verificación
      pago.estado = EstadoPago.PAGADO;
      pago.esta_verificado = true;
      pago.verificado_por_usuario_id = usuarioId;
      pago.fecha_verificacion = new Date();

      await pago.save();

      // Actualizar saldo de tarjeta
      const tarjeta = await Tarjeta.findByPk(pago.tarjeta_id);
      if (tarjeta) {
        tarjeta.saldo = parseFloat(
          (tarjeta.saldo - pago.monto).toFixed(2)
        );
        await tarjeta.save();
      }

      // Recargar pago con relaciones
      const pagoActualizado = await Pago.findByPk(id, {
        include: [
          {
            model: Cliente,
            attributes: ['id', 'nombre']
          },
          {
            model: Proveedor,
            attributes: ['id', 'nombre', 'servicio']
          },
          {
            model: Tarjeta,
            attributes: ['id', 'tipo_tarjeta_id', 'saldo_actual']
          },
          {
            model: Usuario,
            as: 'registradoPor',
            attributes: ['id', 'nombre_usuario', 'nombre_completo']
          },
          {
            model: Usuario,
            as: 'verificadoPor',
            attributes: ['id', 'nombre_usuario', 'nombre_completo']
          }
        ]
      });

      return {
        success: true,
        data: pagoActualizado,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error verificando pago',
        statusCode: 500
      };
    }
  }

  /**
   * Filtrar pagos por estado, fecha y usuario
   */
  async filtrar(
    usuarioId: number,
    rolNombre: string,
    filtros: any,
    options: QueryOptions = {}
  ): Promise<ServiceResponse<PaginatedResponse<any>>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;

      let where: any = { esta_activo: true };

      // Si es Equipo, solo ver sus propios pagos
      if (rolNombre === 'Equipo') {
        where.registrado_por_usuario_id = usuarioId;
      }

      // Filtrar por estado
      if (filtros.estado) {
        where.estado = filtros.estado;
      }

      // Filtrar por fecha
      if (filtros.fecha_desde || filtros.fecha_hasta) {
        where.fecha_creacion = {};
        if (filtros.fecha_desde) {
          where.fecha_creacion[Op.gte] = new Date(filtros.fecha_desde);
        }
        if (filtros.fecha_hasta) {
          where.fecha_creacion[Op.lte] = new Date(filtros.fecha_hasta);
        }
      }

      // Filtrar por usuario (solo admin)
      if (filtros.usuario_id && rolNombre === 'Administrador') {
        where.registrado_por_usuario_id = filtros.usuario_id;
      }

      // Filtrar por cliente
      if (filtros.cliente_id) {
        where.cliente_id = filtros.cliente_id;
      }

      // Filtrar por proveedor
      if (filtros.proveedor_id) {
        where.proveedor_id = filtros.proveedor_id;
      }

      const { count, rows } = await Pago.findAndCountAll({
        where,
        include: [
          {
            model: Cliente,
            attributes: ['id', 'nombre']
          },
          {
            model: Proveedor,
            attributes: ['id', 'nombre', 'servicio']
          },
          {
            model: Tarjeta,
            attributes: ['id', 'tipo_tarjeta_id']
          },
          {
            model: Usuario,
            as: 'registradoPor',
            attributes: ['id', 'nombre_usuario', 'nombre_completo']
          }
        ],
        limit,
        offset,
        order: [['fecha_creacion', 'DESC']]
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
        error: error instanceof Error ? error.message : 'Error filtrando pagos',
        statusCode: 500
      };
    }
  }

  /**
   * Eliminar pago (soft delete) usando función PostgreSQL pago_delete
   */
  async delete(id: string | number): Promise<ServiceResponse<void>> {
    try {
      const db = require('../config/database').default;
      const { QueryTypes } = require('sequelize');

      console.log('PagoService.delete() - Eliminando pago:', id);

      const result = await db.query(
        `SELECT * FROM pago_delete(:id)`,
        {
          replacements: { id: id },
          type: QueryTypes.SELECT
        }
      );

      console.log('PagoService.delete() - Resultado de pago_delete():', result);

      if (result && result.length > 0) {
        const response = (result[0] as any).pago_delete;
        console.log('PagoService.delete() - Response:', response);

        if (response.status !== 200) {
          return {
            success: false,
            error: response.message || 'Error eliminando pago',
            statusCode: response.status
          };
        }

        return {
          success: true,
          statusCode: 200
        };
      }

      return {
        success: false,
        error: 'Error eliminando pago',
        statusCode: 500
      };
    } catch (error) {
      console.error('PagoService.delete() - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error eliminando pago',
        statusCode: 500
      };
    }
  }

  /**
   * Eliminar pago permanentemente usando función PostgreSQL pago_delete_permanente
   */
  async deletePermanente(id: string | number): Promise<ServiceResponse<any>> {
    try {
      const db = require('../config/database').default;
      const { QueryTypes } = require('sequelize');

      console.log('PagoService.deletePermanente() - Eliminando pago permanentemente:', id);

      const result = await db.query(
        `SELECT * FROM pago_delete_permanente(:id)`,
        {
          replacements: { id: id },
          type: QueryTypes.SELECT
        }
      );

      console.log('PagoService.deletePermanente() - Resultado:', result);

      if (result && result.length > 0) {
        const response = (result[0] as any).pago_delete_permanente;
        console.log('PagoService.deletePermanente() - Response:', response);

        if (response.status !== 200) {
          return {
            success: false,
            error: response.message || 'Error eliminando pago',
            statusCode: response.status
          };
        }

        return {
          success: true,
          data: response.data,
          statusCode: 200
        };
      }

      return {
        success: false,
        error: 'Error eliminando pago',
        statusCode: 500
      };
    } catch (error) {
      console.error('PagoService.deletePermanente() - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error eliminando pago',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener resumen de pagos por estado
   */
  async getResumen(
    usuarioId: number,
    rolNombre: string
  ): Promise<ServiceResponse<any>> {
    try {
      let where: any = { esta_activo: true };

      if (rolNombre === 'Equipo') {
        where.registrado_por_usuario_id = usuarioId;
      }

      const totalPagos = await Pago.count({ where });
      const pagosPendientes = await Pago.count({
        where: { ...where, estado: EstadoPago.A_PAGAR }
      });
      const pagosPagados = await Pago.count({
        where: { ...where, estado: EstadoPago.PAGADO }
      });

      // Calcular montos
      const montoPendiente = await Pago.sum('monto', {
        where: { ...where, estado: EstadoPago.A_PAGAR }
      });
      const montoPagado = await Pago.sum('monto', {
        where: { ...where, estado: EstadoPago.PAGADO }
      });

      return {
        success: true,
        data: {
          totalPagos,
          pagosPendientes,
          pagosPagados,
          montoPendiente: montoPendiente || 0,
          montoPagado: montoPagado || 0,
          montoTotal: (montoPendiente || 0) + (montoPagado || 0)
        },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo resumen',
        statusCode: 500
      };
    }
  }

  /**
   * Enviar datos del pago al webhook de n8n
   */
  private async enviarWebhookN8n(pagoData: any, usuarioId: number): Promise<void> {
    try {
      const webhookUrl = 'https://n8n.salazargroup.cloud/webhook/microsoft_excel';
      const authHeader = 'Basic YWRtaW46ZXg6MmMxMmVsMmdvMmdvMTIz';

      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║  PREPARANDO DATOS DEL PAGO PARA WEBHOOK                   ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('Datos del pago recibidos:', JSON.stringify(pagoData, null, 2));

      // Extraer datos de las relaciones de forma segura
      const cliente = pagoData.Cliente || pagoData.cliente || {};
      const proveedor = pagoData.Proveedor || pagoData.proveedor || {};
      const tarjeta = pagoData.tarjeta || pagoData.Tarjeta || {};
      const registradoPor = pagoData.registradoPor || pagoData.registrado_por || {};

      console.log('\nDatos extraídos:');
      console.log('Cliente:', cliente);
      console.log('Proveedor:', proveedor);
      console.log('Tarjeta:', tarjeta);
      console.log('Registrado por:', registradoPor);

      // Preparar datos completos del pago para enviar al webhook
      const datosParaWebhook = {
        Datos: [
          {
            id_usuario: usuarioId,
            id_pago: pagoData.id,
            cliente_id: pagoData.cliente_id,
            cliente_nombre: cliente.nombre || '',
            cliente_ubicacion: cliente.ubicacion || '',
            cliente_telefono: cliente.telefono || '',
            cliente_correo: cliente.correo || '',
            proveedor_id: pagoData.proveedor_id,
            proveedor_nombre: proveedor.nombre || '',
            proveedor_servicio: proveedor.servicio || '',
            proveedor_telefono: proveedor.telefono || '',
            proveedor_correo: proveedor.correo || '',
            tarjeta_id: pagoData.tarjeta_id,
            tarjeta_nombre: tarjeta.nombre || '',
            tarjeta_saldo: tarjeta.saldo || 0,
            monto: pagoData.monto,
            numero_presta: pagoData.numero_presta,
            correo_proveedor: pagoData.correo_proveedor || '',
            estado: pagoData.estado,
            esta_verificado: pagoData.esta_verificado ? 'Sí' : 'No',
            fecha_creacion: pagoData.fecha_creacion,
            comentarios: pagoData.comentarios || '',
            registrado_por: registradoPor.nombre_completo || '',
            registrado_por_usuario: registradoPor.nombre_usuario || ''
          }
        ]
      };

      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║  ENVIANDO DATOS AL WEBHOOK N8N - MICROSOFT EXCEL          ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('URL:', webhookUrl);
      console.log('Datos a enviar:', JSON.stringify(datosParaWebhook, null, 2));

      // Enviar POST al webhook
      const response = await axios.post(webhookUrl, datosParaWebhook, {
        headers: {
          'authorization': authHeader,
          'content-type': 'application/json'
        },
        timeout: 10000 // Timeout de 10 segundos
      });

      // Registrar respuesta en consola
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║  RESPUESTA DEL WEBHOOK N8N                                 ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('Status HTTP:', response.status);
      console.log('Respuesta:', JSON.stringify(response.data, null, 2));

      // Validar respuesta esperada
      if (response.data && response.data.code) {
        const { code, estado, mensaje } = response.data;
        
        if (code === 200 && estado === true) {
          console.log('✅ Registro exitoso en Google Sheet');
        } else if (code === 400 && estado === false) {
          console.log('⚠️ Error al insertar en Google Sheet:', mensaje);
        } else if (code === 500 && estado === false) {
          console.log('❌ Error interno del servidor:', mensaje);
        } else {
          console.log('⚠️ Respuesta inesperada:', { code, estado, mensaje });
        }
      } else {
        console.log('⚠️ Respuesta sin estructura esperada');
      }

      console.log('════════════════════════════════════════════════════════════\n');
    } catch (error) {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║  ERROR AL ENVIAR WEBHOOK N8N                               ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      
      if (axios.isAxiosError(error)) {
        console.error('Status:', error.response?.status);
        console.error('Datos de error:', error.response?.data);
        console.error('Mensaje:', error.message);
      } else {
        console.error('Error:', error instanceof Error ? error.message : error);
      }
      
      console.log('════════════════════════════════════════════════════════════\n');
      // No lanzar error, solo registrar en logs
    }
  }
}

export default new PagoService();
