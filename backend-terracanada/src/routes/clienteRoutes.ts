import { Router } from 'express';
import clienteController from '../controllers/ClienteController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/v1/clientes:
 *   post:
 *     summary: Crear nuevo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               ubicacion:
 *                 type: string
 *               telefono:
 *                 type: string
 *               correo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente
 */
router.post(
  '/',
  authMiddleware,
  requirePermission('clientes.crear'),
  (req, res) => clienteController.create(req, res)
);

/**
 * @swagger
 * /api/v1/clientes:
 *   get:
 *     summary: Listar todos los clientes
 *     tags: [Clientes]
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
 *         description: Lista de clientes
 */
router.get(
  '/',
  authMiddleware,
  requirePermission('clientes.leer'),
  (req, res) => clienteController.getAll(req, res)
);

/**
 * @swagger
 * /api/v1/clientes/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     tags: [Clientes]
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
 *         description: Datos del cliente
 *       404:
 *         description: Cliente no encontrado
 */
router.get(
  '/:id',
  authMiddleware,
  requirePermission('clientes.leer'),
  (req, res) => clienteController.getById(req, res)
);

/**
 * @swagger
 * /api/v1/clientes/{id}:
 *   put:
 *     summary: Actualizar cliente
 *     tags: [Clientes]
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
 *               nombre:
 *                 type: string
 *               ubicacion:
 *                 type: string
 *               telefono:
 *                 type: string
 *               correo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado
 */
router.put(
  '/:id',
  authMiddleware,
  requirePermission('clientes.editar'),
  (req, res) => clienteController.update(req, res)
);

/**
 * @swagger
 * /api/v1/clientes/{id}:
 *   delete:
 *     summary: Eliminar cliente
 *     tags: [Clientes]
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
 *         description: Cliente eliminado
 */
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('clientes.editar'),
  (req, res) => clienteController.delete(req, res)
);

/**
 * @swagger
 * /api/v1/clientes/buscar:
 *   get:
 *     summary: Buscar clientes por nombre o correo
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: termino
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Resultados de búsqueda
 */
router.get(
  '/buscar',
  authMiddleware,
  requirePermission('clientes.leer'),
  (req, res) => clienteController.search(req, res)
);

export default router;
