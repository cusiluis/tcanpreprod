import { Router } from 'express';
import PagoBancarioController from '../controllers/PagoBancarioController';
import { authMiddleware, requireRoles } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/v1/pagos-bancarios:
 *   post:
 *     summary: Crear un nuevo pago bancario
 *     description: Registra un nuevo pago bancario. Solo administradores pueden crear pagos.
 *     tags:
 *       - Pagos Bancarios
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clienteId
 *               - proveedorId
 *               - correoProveedor
 *               - cuentaBancariaId
 *               - monto
 *               - numeroPresta
 *             properties:
 *               clienteId:
 *                 type: integer
 *               proveedorId:
 *                 type: integer
 *               correoProveedor:
 *                 type: string
 *               cuentaBancariaId:
 *                 type: integer
 *               monto:
 *                 type: number
 *               numeroPresta:
 *                 type: string
 *               comentarios:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pago bancario creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.post('/', authMiddleware, requireRoles(['administrador']), PagoBancarioController.create);

/**
 * @swagger
 * /api/v1/pagos-bancarios:
 *   get:
 *     summary: Obtener todos los pagos bancarios
 *     description: Obtiene una lista de pagos bancarios con filtros opcionales
 *     tags:
 *       - Pagos Bancarios
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: usuarioId
 *         schema:
 *           type: integer
 *         description: Filtrar por usuario que registró el pago
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [todos, A PAGAR, PAGADO]
 *         description: Filtrar por estado del pago
 *       - in: query
 *         name: verificacion
 *         schema:
 *           type: string
 *           enum: [todos, verificados, no_verificados]
 *         description: Filtrar por verificación
 *     responses:
 *       200:
 *         description: Lista de pagos bancarios
 *       401:
 *         description: No autenticado
 */
router.get('/', authMiddleware, PagoBancarioController.getAll);

/**
 * @swagger
 * /api/v1/pagos-bancarios/resumen:
 *   get:
 *     summary: Obtener resumen de pagos bancarios
 *     description: Obtiene un resumen de pagos bancarios agrupados por estado
 *     tags:
 *       - Pagos Bancarios
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: usuarioId
 *         schema:
 *           type: integer
 *         description: Filtrar por usuario
 *     responses:
 *       200:
 *         description: Resumen de pagos bancarios
 *       401:
 *         description: No autenticado
 */
router.get('/resumen', authMiddleware, PagoBancarioController.getResumen);

/**
 * @swagger
 * /api/v1/pagos-bancarios/{id}:
 *   get:
 *     summary: Obtener un pago bancario por ID
 *     description: Obtiene los detalles de un pago bancario específico
 *     tags:
 *       - Pagos Bancarios
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pago bancario
 *     responses:
 *       200:
 *         description: Detalles del pago bancario
 *       404:
 *         description: Pago bancario no encontrado
 *       401:
 *         description: No autenticado
 */
router.get('/:id', authMiddleware, PagoBancarioController.getById);

/**
 * @swagger
 * /api/v1/pagos-bancarios/{id}:
 *   put:
 *     summary: Actualizar estado y verificación de un pago bancario
 *     description: Actualiza el estado y verificación de un pago bancario
 *     tags:
 *       - Pagos Bancarios
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pago bancario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nuevoEstado
 *               - nuevaVerificacion
 *             properties:
 *               nuevoEstado:
 *                 type: string
 *                 enum: [A PAGAR, PAGADO]
 *               nuevaVerificacion:
 *                 type: boolean
 *               verificadoPorUsuarioId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Pago bancario actualizado exitosamente
 *       404:
 *         description: Pago bancario no encontrado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.put('/:id', authMiddleware, requireRoles(['administrador']), PagoBancarioController.update);

/**
 * @swagger
 * /api/v1/pagos-bancarios/{id}:
 *   delete:
 *     summary: Eliminar un pago bancario (soft delete)
 *     description: Desactiva un pago bancario sin eliminarlo permanentemente
 *     tags:
 *       - Pagos Bancarios
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pago bancario
 *     responses:
 *       200:
 *         description: Pago bancario eliminado exitosamente
 *       404:
 *         description: Pago bancario no encontrado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.delete('/:id', authMiddleware, requireRoles(['administrador']), PagoBancarioController.delete);

/**
 * @swagger
 * /api/v1/pagos-bancarios/{id}/permanente:
 *   delete:
 *     summary: Eliminar permanentemente un pago bancario
 *     description: Elimina permanentemente un pago bancario y reembolsa el dinero a la cuenta
 *     tags:
 *       - Pagos Bancarios
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pago bancario
 *     responses:
 *       200:
 *         description: Pago bancario eliminado permanentemente
 *       404:
 *         description: Pago bancario no encontrado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.delete(
  '/:id/permanente',
  authMiddleware,
  requireRoles(['administrador']),
  PagoBancarioController.deletePermanente
);

export default router;
