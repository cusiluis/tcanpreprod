import { Router } from 'express';
import CuentaBancariaController from '../controllers/CuentaBancariaController';
import { authMiddleware, requireRoles } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/v1/cuentas-bancarias:
 *   post:
 *     summary: Crear una nueva cuenta bancaria
 *     description: Registra una nueva cuenta bancaria. Solo administradores pueden crear cuentas.
 *     tags:
 *       - Cuentas Bancarias
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero_cuenta
 *               - nombre_banco
 *               - titular_cuenta
 *               - saldo
 *               - tipo_moneda_id
 *             properties:
 *               numero_cuenta:
 *                 type: string
 *               nombre_banco:
 *                 type: string
 *               titular_cuenta:
 *                 type: string
 *               saldo:
 *                 type: number
 *               limite:
 *                 type: number
 *               tipo_moneda_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Cuenta bancaria creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.post('/', authMiddleware, requireRoles(['administrador']), CuentaBancariaController.create);

/**
 * @swagger
 * /api/v1/cuentas-bancarias:
 *   get:
 *     summary: Obtener todas las cuentas bancarias
 *     description: Obtiene una lista de todas las cuentas bancarias activas
 *     tags:
 *       - Cuentas Bancarias
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cuentas bancarias
 *       401:
 *         description: No autenticado
 */
router.get('/', authMiddleware, CuentaBancariaController.getAll);

/**
 * @swagger
 * /api/v1/cuentas-bancarias/{id}:
 *   get:
 *     summary: Obtener una cuenta bancaria por ID
 *     description: Obtiene los detalles de una cuenta bancaria específica
 *     tags:
 *       - Cuentas Bancarias
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta bancaria
 *     responses:
 *       200:
 *         description: Detalles de la cuenta bancaria
 *       404:
 *         description: Cuenta bancaria no encontrada
 *       401:
 *         description: No autenticado
 */
router.get('/:id', authMiddleware, CuentaBancariaController.getById);

/**
 * @swagger
 * /api/v1/cuentas-bancarias/{id}:
 *   put:
 *     summary: Actualizar una cuenta bancaria
 *     description: Actualiza los datos de una cuenta bancaria
 *     tags:
 *       - Cuentas Bancarias
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta bancaria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero_cuenta:
 *                 type: string
 *               nombre_banco:
 *                 type: string
 *               titular_cuenta:
 *                 type: string
 *               saldo:
 *                 type: number
 *               limite:
 *                 type: number
 *               tipo_moneda_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cuenta bancaria actualizada exitosamente
 *       404:
 *         description: Cuenta bancaria no encontrada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.put('/:id', authMiddleware, requireRoles(['administrador']), CuentaBancariaController.update);

/**
 * @swagger
 * /api/v1/cuentas-bancarias/{id}:
 *   delete:
 *     summary: Desactivar una cuenta bancaria
 *     description: Desactiva una cuenta bancaria sin eliminarla permanentemente
 *     tags:
 *       - Cuentas Bancarias
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta bancaria
 *     responses:
 *       200:
 *         description: Cuenta bancaria desactivada exitosamente
 *       404:
 *         description: Cuenta bancaria no encontrada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.delete('/:id', authMiddleware, requireRoles(['administrador']), CuentaBancariaController.delete);

export default router;
