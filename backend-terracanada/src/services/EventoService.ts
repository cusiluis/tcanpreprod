import { BaseService } from './BaseService';
import Evento, { TipoEvento, AccionEvento } from '../models/Evento';
import Usuario from '../models/Usuario';
import { ServiceResponse, QueryOptions, PaginatedResponse } from '../types';
import { Op } from 'sequelize';

export interface CreateEventoPayload {
  usuario_id?: number;
  tipo_evento: TipoEvento;
  accion?: AccionEvento;
  tipo_entidad?: string;
  entidad_id?: number;
  descripcion: string;
  direccion_ip?: string;
  agente_usuario?: string;
}

export class EventoService extends BaseService<Evento> {
  constructor() {
    super(Evento);
  }

  /**
   * Registrar nuevo evento
   */
  async registrarEvento(data: CreateEventoPayload): Promise<ServiceResponse<Evento>> {
    try {
      const evento = await Evento.create(data as any);

      return {
        success: true,
        data: evento,
        statusCode: 201
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error registrando evento',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener eventos con filtrado por rol
   * - Admin: ve todos los eventos
   * - Equipo: ve solo eventos de usuarios tipo Equipo
   */
  async getAll(
    usuarioId?: number | QueryOptions,
    rolNombre?: string,
    options?: QueryOptions
  ): Promise<ServiceResponse<PaginatedResponse<any>>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const offset = (page - 1) * limit;

      let where: any = {};

      // Si es Equipo, solo ver eventos de usuarios Equipo
      if (rolNombre === 'Equipo') {
        // Obtener IDs de usuarios con rol Equipo
        const usuariosEquipo = await Usuario.findAll({
          where: { rol_id: 2 },
          attributes: ['id']
        });
        const usuarioIds = usuariosEquipo.map(u => u.id);
        where.usuario_id = { [Op.in]: usuarioIds };
      }

      const { count, rows } = await Evento.findAndCountAll({
        where,
        include: [
          {
            model: Usuario,
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
        error: error instanceof Error ? error.message : 'Error obteniendo eventos',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener evento por ID
   */
  async getById(id: string | number): Promise<ServiceResponse<any>> {
    try {
      const evento = await Evento.findByPk(id, {
        include: [
          {
            model: Usuario,
            attributes: ['id', 'nombre_usuario', 'nombre_completo']
          }
        ]
      });

      if (!evento) {
        return {
          success: false,
          error: 'Evento no encontrado',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: evento,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo evento',
        statusCode: 500
      };
    }
  }

  /**
   * Filtrar eventos por tipo, acción, fecha y usuario
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

      let where: any = {};

      // Si es Equipo, solo ver eventos de usuarios Equipo
      if (rolNombre === 'Equipo') {
        const usuariosEquipo = await Usuario.findAll({
          where: { rol_id: 2 },
          attributes: ['id']
        });
        const usuarioIds = usuariosEquipo.map(u => u.id);
        where.usuario_id = { [Op.in]: usuarioIds };
      }

      // Filtrar por tipo de evento
      if (filtros.tipo_evento) {
        where.tipo_evento = filtros.tipo_evento;
      }

      // Filtrar por acción
      if (filtros.accion) {
        where.accion = filtros.accion;
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
        where.usuario_id = filtros.usuario_id;
      }

      // Filtrar por tipo de entidad
      if (filtros.tipo_entidad) {
        where.tipo_entidad = filtros.tipo_entidad;
      }

      const { count, rows } = await Evento.findAndCountAll({
        where,
        include: [
          {
            model: Usuario,
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
        error: error instanceof Error ? error.message : 'Error filtrando eventos',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener eventos por tipo
   */
  async getByTipo(
    tipoEvento: TipoEvento,
    options: QueryOptions = {}
  ): Promise<ServiceResponse<PaginatedResponse<any>>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await Evento.findAndCountAll({
        where: { tipo_evento: tipoEvento },
        include: [
          {
            model: Usuario,
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
        error: error instanceof Error ? error.message : 'Error obteniendo eventos',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener eventos por usuario
   */
  async getByUsuario(
    usuarioId: number,
    options: QueryOptions = {}
  ): Promise<ServiceResponse<PaginatedResponse<any>>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await Evento.findAndCountAll({
        where: { usuario_id: usuarioId },
        include: [
          {
            model: Usuario,
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
        error: error instanceof Error ? error.message : 'Error obteniendo eventos',
        statusCode: 500
      };
    }
  }

  /**
   * Obtener resumen de eventos
   */
  async getResumen(
    usuarioId: number,
    rolNombre: string
  ): Promise<ServiceResponse<any>> {
    try {
      let where: any = {};

      if (rolNombre === 'Equipo') {
        const usuariosEquipo = await Usuario.findAll({
          where: { rol_id: 2 },
          attributes: ['id']
        });
        const usuarioIds = usuariosEquipo.map(u => u.id);
        where.usuario_id = { [Op.in]: usuarioIds };
      }

      const totalEventos = await Evento.count({ where });
      const eventosAccion = await Evento.count({
        where: { ...where, tipo_evento: TipoEvento.ACCION }
      });
      const eventosNavegacion = await Evento.count({
        where: { ...where, tipo_evento: TipoEvento.NAVEGACION }
      });

      return {
        success: true,
        data: {
          totalEventos,
          eventosAccion,
          eventosNavegacion,
          porcentajeAccion: totalEventos > 0 ? (eventosAccion / totalEventos * 100).toFixed(2) : 0,
          porcentajeNavegacion: totalEventos > 0 ? (eventosNavegacion / totalEventos * 100).toFixed(2) : 0
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
}

export default new EventoService();
