import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import { ServiceResponse } from '../types';

/**
 * Interface para Tarjeta
 * Estructura de datos de una tarjeta bancaria
 */
export interface Tarjeta {
  id: number;
  nombre_titular: string;
  numero_tarjeta: string;
  limite: number;
  saldo: number;
  disponible: number;
  tipo: {
    id: number;
    nombre: string;
  };
  estado: {
    id: number;
    nombre: string;
  };
  fecha_creacion: string;
}

/**
 * Interface para crear una tarjeta
 */
export interface CreateTarjetaPayload {
  nombre_titular: string;
  numero_tarjeta: string;
  limite: number;
  tipo_tarjeta_id: number;
}

/**
 * Interface para actualizar una tarjeta
 */
export interface UpdateTarjetaPayload {
  nombre_titular: string;
  limite: number;
}

/**
 * Interface para realizar cargo
 */
export interface CargoPayload {
  monto: number;
}

/**
 * Interface para realizar pago
 */
export interface PagoPayload {
  monto: number;
}

/**
 * TarjetaService
 * Servicio para gestionar operaciones CRUD de tarjetas
 * Utiliza funciones PostgreSQL para la lógica de negocio
 */
export class TarjetaService {
  /**
   * Crear una nueva tarjeta
   * @param payload - Datos de la tarjeta a crear
   * @returns Tarjeta creada
   */
  static async create(payload: CreateTarjetaPayload): Promise<any> {
    try {
      const result = await sequelize.query(
        'SELECT tarjeta_post(:nombre_titular, :numero_tarjeta, :limite, :tipo_tarjeta_id) as result',
        {
          replacements: {
            nombre_titular: payload.nombre_titular,
            numero_tarjeta: payload.numero_tarjeta,
            limite: payload.limite,
            tipo_tarjeta_id: payload.tipo_tarjeta_id
          },
          type: QueryTypes.SELECT
        }
      );

      const response = (result[0] as any).result;
      
      if (response.status !== 201) {
        throw new Error(response.message);
      }

      return response;
    } catch (error: any) {
      console.error('Error en TarjetaService.create:', error.message);
      throw error;
    }
  }

  /**
   * Obtener una tarjeta por ID
   * @param id - ID de la tarjeta
   * @returns Tarjeta encontrada
   */
  static async getById(id: number): Promise<any> {
    try {
      const result = await sequelize.query(
        'SELECT tarjeta_get(:id) as result',
        {
          replacements: { id },
          type: QueryTypes.SELECT
        }
      );

      const response = (result[0] as any).result;
      
      if (response.status !== 200) {
        throw new Error(response.message);
      }

      return response;
    } catch (error: any) {
      console.error('Error en TarjetaService.getById:', error.message);
      throw error;
    }
  }

  /**
   * Obtener todas las tarjetas activas
   * @returns Lista de tarjetas
   */
  static async getAll(): Promise<any> {
    try {
      const result = await sequelize.query(
        'SELECT tarjeta_get_all() as result',
        {
          type: QueryTypes.SELECT
        }
      );

      const response = (result[0] as any).result;
      
      if (response.status !== 200) {
        throw new Error(response.message);
      }

      return response;
    } catch (error: any) {
      console.error('Error en TarjetaService.getAll:', error.message);
      throw error;
    }
  }

  /**
   * Actualizar una tarjeta
   * @param id - ID de la tarjeta
   * @param payload - Datos a actualizar
   * @returns Tarjeta actualizada
   */
  static async update(id: number, payload: UpdateTarjetaPayload): Promise<any> {
    try {
      const result = await sequelize.query(
        'SELECT tarjeta_put(:id, :nombre_titular, :limite) as result',
        {
          replacements: {
            id,
            nombre_titular: payload.nombre_titular,
            limite: payload.limite
          },
          type: QueryTypes.SELECT
        }
      );

      const response = (result[0] as any).result;
      
      if (response.status !== 200) {
        throw new Error(response.message);
      }

      return response;
    } catch (error: any) {
      console.error('Error en TarjetaService.update:', error.message);
      throw error;
    }
  }

  /**
   * Desactivar una tarjeta (eliminación lógica)
   * @param id - ID de la tarjeta
   * @returns Confirmación de desactivación
   */
  static async delete(id: number): Promise<any> {
    try {
      const result = await sequelize.query(
        'SELECT tarjeta_delete(:id) as result',
        {
          replacements: { id },
          type: QueryTypes.SELECT
        }
      );

      const response = (result[0] as any).result;
      
      if (response.status !== 200) {
        throw new Error(response.message);
      }

      return response;
    } catch (error: any) {
      console.error('Error en TarjetaService.delete:', error.message);
      throw error;
    }
  }

  /**
   * Realizar cargo a una tarjeta (aumentar saldo)
   * @param id - ID de la tarjeta
   * @param payload - Datos del cargo
   * @returns Nuevo saldo y disponible
   */
  static async realizarCargo(id: number, payload: CargoPayload): Promise<any> {
    try {
      const result = await sequelize.query(
        'SELECT tarjeta_realizar_cargo(:id, :monto) as result',
        {
          replacements: { id, monto: payload.monto },
          type: QueryTypes.SELECT
        }
      );

      const response = (result[0] as any).result;
      
      if (response.status !== 200) {
        throw new Error(response.message);
      }

      return response;
    } catch (error: any) {
      console.error('Error en TarjetaService.realizarCargo:', error.message);
      throw error;
    }
  }

  /**
   * Realizar pago a una tarjeta (disminuir saldo)
   * @param id - ID de la tarjeta
   * @param payload - Datos del pago
   * @returns Nuevo saldo y disponible
   */
  static async realizarPago(id: number, payload: PagoPayload): Promise<any> {
    try {
      const result = await sequelize.query(
        'SELECT tarjeta_realizar_pago(:id, :monto) as result',
        {
          replacements: { id, monto: payload.monto },
          type: QueryTypes.SELECT
        }
      );

      const response = (result[0] as any).result;
      
      if (response.status !== 200) {
        throw new Error(response.message);
      }

      return response;
    } catch (error: any) {
      console.error('Error en TarjetaService.realizarPago:', error.message);
      throw error;
    }
  }

  /**
   * Cambiar estado de una tarjeta (activar/desactivar)
   * @param id - ID de la tarjeta
   * @param estadoTarjetaId - ID del nuevo estado de tarjeta
   * @returns Tarjeta actualizada
   */
  static async cambiarEstado(id: number, estadoTarjetaId: number): Promise<any> {
    try {
      const result = await sequelize.query(
        'SELECT tarjeta_cambiar_estado(:id, :estado_tarjeta_id) as result',
        {
          replacements: { id, estado_tarjeta_id: estadoTarjetaId },
          type: QueryTypes.SELECT
        }
      );

      const response = (result[0] as any).result;
      
      if (response.status !== 200) {
        throw new Error(response.message);
      }

      return response;
    } catch (error: any) {
      console.error('Error en TarjetaService.cambiarEstado:', error.message);
      throw error;
    }
  }

  /**
   * Eliminar una tarjeta permanentemente (solo admin)
   * @param id - ID de la tarjeta
   * @param usuarioId - ID del usuario que realiza la acción
   * @returns Confirmación de eliminación
   */
  static async deletePermanente(id: number, usuarioId: number): Promise<any> {
    try {
      const result = await sequelize.query(
        'SELECT tarjeta_delete_permanente(:id, :usuario_id) as result',
        {
          replacements: { id, usuario_id: usuarioId },
          type: QueryTypes.SELECT
        }
      );

      const response = (result[0] as any).result;
      
      if (response.status !== 200) {
        throw new Error(response.message);
      }

      return response;
    } catch (error: any) {
      console.error('Error en TarjetaService.deletePermanente:', error.message);
      throw error;
    }
  }
}
