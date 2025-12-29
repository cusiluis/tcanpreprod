import { Router } from 'express';
import pagoController from '../controllers/PagoController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/v1/pagos:
 *   post:
 *     summary: Crear nuevo pago
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente_id:
 *                 type: integer
 *               proveedor_id:
 *                 type: integer
 *               correo_proveedor:
 *                 type: string
 *               tarjeta_id:
 *                 type: integer
 *               monto:
 *                 type: number
 *               numero_presta:
 *                 type: string
 *               comentarios:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pago creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post(
  '/',
  authMiddleware,
  requirePermission('pagos.crear'),
  (req, res) => pagoController.create(req, res)
);

/**
 * @swagger
 * /api/v1/pagos:
 *   get:
 *     summary: Listar pagos (Admin ve todos, Equipo ve solo suyos)
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de pagos
 */
router.get(
  '/',
  authMiddleware,
  requirePermission('pagos.leer'),
  (req, res) => pagoController.getAll(req, res)
);

/**
 * @swagger
 * /api/v1/pagos/{id}:
 *   get:
 *     summary: Obtener pago por ID
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del pago
 *       404:
 *         description: Pago no encontrado
 */
router.get(
  '/:id',
  authMiddleware,
  requirePermission('pagos.leer'),
  (req, res) => pagoController.getById(req, res)
);

/**
 * @swagger
 * /api/v1/pagos/{id}:
 *   put:
 *     summary: Actualizar pago (estado, verificación, comentarios)
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: ['A PAGAR', 'PAGADO']
 *               esta_verificado:
 *                 type: boolean
 *               comentarios:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago actualizado
 *       404:
 *         description: Pago no encontrado
 */
router.put(
  '/:id',
  authMiddleware,
  requirePermission('pagos.editar'),
  (req, res) => pagoController.update(req, res)
);

/**
 * @swagger
 * /api/v1/pagos/{id}/verificar:
 *   put:
 *     summary: Verificar pago (cambiar a PAGADO y marcar como verificado)
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pago verificado
 *       404:
 *         description: Pago no encontrado
 */
router.put(
  '/:id/verificar',
  authMiddleware,
  requirePermission('pagos.verificar'),
  (req, res) => pagoController.verificarPago(req, res)
);

/**
 * @swagger
 * /api/v1/pagos/{id}:
 *   delete:
 *     summary: Eliminar pago (soft delete)
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pago eliminado
 *       404:
 *         description: Pago no encontrado
 */
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('pagos.eliminar'),
  (req, res) => pagoController.delete(req, res)
);

/**
 * @swagger
 * /api/v1/pagos/filtrar:
 *   get:
 *     summary: Filtrar pagos por estado, fecha, usuario, cliente, proveedor
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: ['A PAGAR', 'PAGADO']
 *       - in: query
 *         name: fecha_desde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fecha_hasta
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: proveedor_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resultados filtrados
 */
router.get(
  '/filtrar',
  authMiddleware,
  requirePermission('pagos.leer'),
  (req, res) => pagoController.filtrar(req, res)
);

/**
 * @swagger
 * /api/v1/pagos/{id}/permanente:
 *   delete:
 *     summary: Eliminar pago permanentemente y revertir cargo en tarjeta
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pago eliminado permanentemente
 *       404:
 *         description: Pago no encontrado
 */
router.delete(
  '/:id/permanente',
  authMiddleware,
  requirePermission('pagos.eliminar'),
  (req, res) => pagoController.deletePermanente(req, res)
);

/**
 * @swagger
 * /api/v1/pagos/resumen:
 *   get:
 *     summary: Obtener resumen de pagos (totales, pendientes, pagados, montos)
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de pagos
 */
router.get(
  '/resumen',
  authMiddleware,
  requirePermission('pagos.leer'),
  (req, res) => pagoController.getResumen(req, res)
);

export default router;
