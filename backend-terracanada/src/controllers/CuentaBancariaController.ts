import { Request, Response } from 'express';
import CuentaBancariaService from '../services/CuentaBancariaService';

export class CuentaBancariaController {
  /**
   * POST /api/v1/cuentas-bancarias
   * Crear una nueva cuenta bancaria
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      console.log('CuentaBancariaController.create() - Datos recibidos:', req.body);
      
      const {
        numero_cuenta,
        nombre_banco,
        titular_cuenta,
        saldo,
        limite,
        tipo_moneda_id,
      } = req.body;

      const result = await CuentaBancariaService.create(
        numero_cuenta,
        nombre_banco,
        titular_cuenta,
        saldo,
        limite,
        tipo_moneda_id
      );

      res.status(201).json({
        success: true,
        message: 'Cuenta bancaria creada exitosamente',
        data: result
      });
    } catch (error) {
      console.error('CuentaBancariaController.create() - Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando cuenta bancaria',
        error: (error as Error).message
      });
    }
  }

  /**
   * GET /api/v1/cuentas-bancarias
   * Obtener todas las cuentas bancarias
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      console.log('CuentaBancariaController.getAll() - Obteniendo todas las cuentas');
      
      const result = await CuentaBancariaService.getAll();

      res.status(200).json({
        success: true,
        message: 'Cuentas bancarias obtenidas exitosamente',
        data: result
      });
    } catch (error) {
      console.error('CuentaBancariaController.getAll() - Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo cuentas bancarias',
        error: (error as Error).message
      });
    }
  }

  /**
   * GET /api/v1/cuentas-bancarias/:id
   * Obtener una cuenta bancaria por ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.log('CuentaBancariaController.getById() - ID:', id);
      
      const result = await CuentaBancariaService.getById(Number(id));

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Cuenta bancaria no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Cuenta bancaria obtenida exitosamente',
        data: result
      });
    } catch (error) {
      console.error('CuentaBancariaController.getById() - Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo cuenta bancaria',
        error: (error as Error).message
      });
    }
  }

  /**
   * PUT /api/v1/cuentas-bancarias/:id
   * Actualizar una cuenta bancaria
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.log('CuentaBancariaController.update() - ID:', id, 'Datos:', req.body);
      
      const {
        numero_cuenta,
        nombre_banco,
        titular_cuenta,
        saldo,
        limite,
        tipo_moneda_id,
      } = req.body;

      const result = await CuentaBancariaService.update(
        Number(id),
        numero_cuenta,
        nombre_banco,
        titular_cuenta,
        saldo,
        limite,
        tipo_moneda_id
      );

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Cuenta bancaria no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Cuenta bancaria actualizada exitosamente',
        data: result
      });
    } catch (error) {
      console.error('CuentaBancariaController.update() - Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando cuenta bancaria',
        error: (error as Error).message
      });
    }
  }

  /**
   * DELETE /api/v1/cuentas-bancarias/:id
   * Desactivar una cuenta bancaria (soft delete)
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.log('CuentaBancariaController.delete() - ID:', id);
      
      const result = await CuentaBancariaService.delete(Number(id));

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Cuenta bancaria no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Cuenta bancaria desactivada exitosamente',
        data: result
      });
    } catch (error) {
      console.error('CuentaBancariaController.delete() - Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error desactivando cuenta bancaria',
        error: (error as Error).message
      });
    }
  }
}

export default CuentaBancariaController;
