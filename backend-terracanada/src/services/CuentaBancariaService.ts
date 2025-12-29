import CuentaBancaria from '../models/CuentaBancaria';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

export class CuentaBancariaService {
  /**
   * Crear una nueva cuenta bancaria
   */
  static async create(
    numero_cuenta: string,
    nombre_banco: string,
    titular_cuenta: string,
    saldo: number,
    limite: number,
    tipo_moneda_id: number
  ): Promise<any> {
    try {
      console.log('CuentaBancariaService.create() - Creando cuenta bancaria');
      
      const cuenta = await CuentaBancaria.create({
        numero_cuenta,
        nombre_banco,
        titular_cuenta,
        saldo,
        limite,
        tipo_moneda_id,
        esta_activo: true
      });

      return cuenta;
    } catch (error) {
      throw new Error(`Error creando cuenta bancaria: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener todas las cuentas bancarias activas
   */
  static async getAll(): Promise<any> {
    try {
      console.log('CuentaBancariaService.getAll() - Obteniendo todas las cuentas');
      
      // Usar query SQL directa para evitar problemas con relaciones de Sequelize
      const cuentas = await sequelize.query(`
        SELECT 
          cb.id,
          cb.numero_cuenta,
          cb.nombre_banco,
          cb.titular_cuenta,
          cb.saldo,
          cb.limite,
          cb.tipo_moneda_id,
          tm.nombre as tipo_moneda_nombre,
          tm.id as tipo_moneda_id_rel
        FROM cuentas_bancarias cb
        LEFT JOIN tipos_moneda tm ON cb.tipo_moneda_id = tm.id
        ORDER BY cb.fecha_creacion DESC
      `, { type: QueryTypes.SELECT });

      console.log('CuentaBancariaService.getAll() - Cuentas obtenidas:', (cuentas as any[]).length);
      
      // Mapear resultado a formato esperado
      const resultado = (cuentas as any[]).map(c => ({
        id: c.id,
        numero_cuenta: c.numero_cuenta,
        nombre_banco: c.nombre_banco,
        titular_cuenta: c.titular_cuenta,
        saldo: c.saldo,
        limite: c.limite,
        tipo_moneda_id: c.tipo_moneda_id,
        tipo_moneda: {
          id: c.tipo_moneda_id_rel,
          nombre: c.tipo_moneda_nombre
        }
      }));
      
      return resultado;
    } catch (error) {
      console.error('CuentaBancariaService.getAll() - Error:', error);
      throw new Error(`Error obteniendo cuentas bancarias: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener una cuenta bancaria por ID
   */
  static async getById(id: number): Promise<any> {
    try {
      console.log('CuentaBancariaService.getById() - ID:', id);
      
      const cuenta = await CuentaBancaria.findByPk(id);

      return cuenta;
    } catch (error) {
      throw new Error(`Error obteniendo cuenta bancaria: ${(error as Error).message}`);
    }
  }

  /**
   * Actualizar una cuenta bancaria
   */
  static async update(
    id: number,
    numero_cuenta?: string,
    nombre_banco?: string,
    titular_cuenta?: string,
    saldo?: number,
    limite?: number,
    tipo_moneda_id?: number
  ): Promise<any> {
    try {
      console.log('CuentaBancariaService.update() - ID:', id);
      
      const cuenta = await CuentaBancaria.findByPk(id);
      
      if (!cuenta) {
        return null;
      }

      const updateData: any = {};
      if (numero_cuenta !== undefined) updateData.numero_cuenta = numero_cuenta;
      if (nombre_banco !== undefined) updateData.nombre_banco = nombre_banco;
      if (titular_cuenta !== undefined) updateData.titular_cuenta = titular_cuenta;
      if (saldo !== undefined) updateData.saldo = saldo;
      if (limite !== undefined) updateData.limite = limite;
      if (tipo_moneda_id !== undefined) updateData.tipo_moneda_id = tipo_moneda_id;

      await cuenta.update(updateData);

      return cuenta;
    } catch (error) {
      throw new Error(`Error actualizando cuenta bancaria: ${(error as Error).message}`);
    }
  }

  /**
   * Desactivar una cuenta bancaria (soft delete)
   */
  static async delete(id: number): Promise<any> {
    try {
      console.log('CuentaBancariaService.delete() - ID:', id);
      
      const cuenta = await CuentaBancaria.findByPk(id);
      
      if (!cuenta) {
        return null;
      }

      await cuenta.update({ esta_activo: false });

      return cuenta;
    } catch (error) {
      throw new Error(`Error desactivando cuenta bancaria: ${(error as Error).message}`);
    }
  }
}

export default CuentaBancariaService;
