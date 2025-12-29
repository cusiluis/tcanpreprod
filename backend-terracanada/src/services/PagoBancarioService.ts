import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import PagoBancario from '../models/PagoBancario';
import CuentaBancaria from '../models/CuentaBancaria';
import Cliente from '../models/Cliente';
import Proveedor from '../models/Proveedor';
import Usuario from '../models/Usuario';
import { TipoMoneda } from '../models/TipoMoneda';

export class PagoBancarioService {
  /**
   * Crear un nuevo pago bancario
   * Llama a la función PostgreSQL pago_bancario_post
   */
  static async create(
    usuarioId: number,
    clienteId: number,
    proveedorId: number,
    correoProveedor: string,
    cuentaBancariaId: number,
    monto: number,
    numeroPresta: string,
    comentarios?: string
  ): Promise<any> {
    try {
      console.log('📊 PagoBancarioService.create() - Parámetros:');
      console.log(`  usuarioId: ${usuarioId}`);
      console.log(`  clienteId: ${clienteId}`);
      console.log(`  proveedorId: ${proveedorId}`);
      console.log(`  correoProveedor: ${correoProveedor}`);
      console.log(`  cuentaBancariaId: ${cuentaBancariaId}`);
      console.log(`  monto: ${monto}`);
      console.log(`  numeroPresta: ${numeroPresta}`);
      console.log(`  comentarios: ${comentarios}`);

      const result = await sequelize.query(
        `SELECT pago_bancario_post(?, ?, ?, ?, ?, ?, ?, ?) as result`,
        {
          replacements: [
            usuarioId,
            clienteId,
            proveedorId,
            correoProveedor,
            cuentaBancariaId,
            monto,
            numeroPresta,
            comentarios || null,
          ],
          type: QueryTypes.SELECT,
        }
      );

      console.log('📊 PagoBancarioService.create() - Resultado:', result);
      return (result as any)[0]?.result || null;
    } catch (error) {
      console.error('❌ PagoBancarioService.create() - Error:', error);
      throw new Error(`Error creando pago bancario: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener un pago bancario por ID
   * Llama a la función PostgreSQL pago_bancario_get
   */
  static async getById(id: number): Promise<any> {
    try {
      const result = await sequelize.query(
        `SELECT pago_bancario_get(?) as result`,
        {
          replacements: [id],
          type: QueryTypes.SELECT,
        }
      );

      return (result as any)[0]?.result || null;
    } catch (error) {
      throw new Error(`Error obteniendo pago bancario: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener todos los pagos bancarios con filtros
   * Llama a la función PostgreSQL pago_bancario_get_all
   */
  static async getAll(
    usuarioId?: number,
    estado: 'todos' | 'A PAGAR' | 'PAGADO' = 'todos',
    verificacion: 'todos' | 'verificados' | 'no_verificados' = 'todos'
  ): Promise<any> {
    try {
      console.log('PagoBancarioService.getAll() - Parámetros:', { usuarioId, estado, verificacion });
      
      const result = await sequelize.query(
        `SELECT pago_bancario_get_all(?, ?, ?) as result`,
        {
          replacements: [usuarioId || null, estado, verificacion],
          type: QueryTypes.SELECT,
        }
      );

      console.log('PagoBancarioService.getAll() - Resultado:', result);
      
      const data = (result as any)[0]?.result;
      console.log('PagoBancarioService.getAll() - Data extraída:', data);
      
      if (!data) {
        console.warn('PagoBancarioService.getAll() - Sin datos, retornando array vacío');
        return {
          success: true,
          data: [],
          statusCode: 200
        };
      }

      return {
        success: true,
        data: Array.isArray(data) ? data : (data?.data || []),
        statusCode: 200
      };
    } catch (error) {
      console.error('PagoBancarioService.getAll() - Error:', error);
      return {
        success: false,
        error: `Error obteniendo pagos bancarios: ${(error as Error).message}`,
        statusCode: 500
      };
    }
  }

  /**
   * Actualizar estado y verificación de un pago bancario
   * Llama a la función PostgreSQL pago_bancario_put
   */
  static async update(
    usuarioId: number,
    pagoId: number,
    nuevoEstado: 'A PAGAR' | 'PAGADO',
    nuevaVerificacion: boolean,
    verificadoPorUsuarioId?: number
  ): Promise<any> {
    try {
      const result = await sequelize.query(
        `SELECT pago_bancario_put(?, ?, ?::estado_pago, ?, ?) as result`,
        {
          replacements: [
            usuarioId,
            pagoId,
            nuevoEstado,
            nuevaVerificacion,
            verificadoPorUsuarioId || null,
          ],
          type: QueryTypes.SELECT,
        }
      );

      return (result as any)[0]?.result || null;
    } catch (error) {
      throw new Error(`Error actualizando pago bancario: ${(error as Error).message}`);
    }
  }

  /**
   * Soft delete de un pago bancario
   * Llama a la función PostgreSQL pago_bancario_delete
   */
  static async delete(pagoId: number, usuarioId: number): Promise<any> {
    try {
      const result = await sequelize.query(
        `SELECT pago_bancario_delete(?, ?) as result`,
        {
          replacements: [pagoId, usuarioId],
          type: QueryTypes.SELECT,
        }
      );

      return (result as any)[0]?.result || null;
    } catch (error) {
      throw new Error(`Error eliminando pago bancario: ${(error as Error).message}`);
    }
  }

  /**
   * Hard delete permanente de un pago bancario con reembolso
   * Llama a la función PostgreSQL pago_bancario_delete_permanente
   */
  static async deletePermanente(pagoId: number, usuarioId: number): Promise<any> {
    try {
      const result = await sequelize.query(
        `SELECT pago_bancario_delete_permanente(?, ?) as result`,
        {
          replacements: [pagoId, usuarioId],
          type: QueryTypes.SELECT,
        }
      );

      return (result as any)[0]?.result || null;
    } catch (error) {
      throw new Error(
        `Error eliminando permanentemente pago bancario: ${(error as Error).message}`
      );
    }
  }

  /**
   * Obtener resumen de pagos bancarios por estado
   */
  static async getResumen(usuarioId?: number): Promise<any> {
    try {
      const query = `
        SELECT 
          estado,
          COUNT(*) as total,
          SUM(monto) as monto_total,
          COUNT(CASE WHEN esta_verificado = true THEN 1 END) as verificados
        FROM pagos_bancarios
        WHERE esta_activo = true
          AND (? IS NULL OR registrado_por_usuario_id = ?)
        GROUP BY estado
      `;

      const result = await sequelize.query(query, {
        replacements: [usuarioId || null, usuarioId || null],
        type: QueryTypes.SELECT,
      });

      return result;
    } catch (error) {
      throw new Error(`Error obteniendo resumen de pagos bancarios: ${(error as Error).message}`);
    }
  }
}

export default PagoBancarioService;
