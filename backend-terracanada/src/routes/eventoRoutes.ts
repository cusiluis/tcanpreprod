import { Router } from 'express';
import eventoController from '../controllers/EventoController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/v1/eventos:
 *   get:
 *     summary: Listar eventos (Admin ve todos, Equipo ve solo de usuarios Equipo)
 *     tags: [Eventos]
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
 *         description: Lista de eventos
 *   post:
 *     summary: Registrar un nuevo evento de auditoria
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_evento:
 *                 type: string
 *                 enum: ['ACCION', 'NAVEGACION']
 *               accion:
 *                 type: string
 *               tipo_entidad:
 *                 type: string
 *               entidad_id:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Evento creado
 */
router.get(
  '/',
  authMiddleware,
  requirePermission('eventos.leer'),
  (req, res) => eventoController.getAll(req, res)
);

router.post(
  '/',
  authMiddleware,
  requirePermission('eventos.leer'),
  (req, res) => eventoController.create(req, res)
);

/**
 * @swagger
 * /api/v1/eventos/{id}:
 *   get:
 *     summary: Obtener evento por ID
 *     tags: [Eventos]
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
 *         description: Datos del evento
 *       404:
 *         description: Evento no encontrado
 */
router.get(
  '/:id',
  authMiddleware,
  requirePermission('eventos.leer'),
  (req, res) => eventoController.getById(req, res)
);

/**
 * @swagger
 * /api/v1/eventos/filtrar:
 *   get:
 *     summary: Filtrar eventos por tipo, acción, fecha, usuario, entidad
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo_evento
 *         schema:
 *           type: string
 *           enum: ['ACCION', 'NAVEGACION']
 *       - in: query
 *         name: accion
 *         schema:
 *           type: string
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
 *         name: tipo_entidad
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
 *         description: Resultados filtrados
 */
router.get(
  '/filtrar',
  authMiddleware,
  requirePermission('eventos.filtrar'),
  (req, res) => eventoController.filtrar(req, res)
);

/**
 * @swagger
 * /api/v1/eventos/tipo:
 *   get:
 *     summary: Obtener eventos por tipo
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['ACCION', 'NAVEGACION']
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
 *         description: Eventos por tipo
 */
router.get(
  '/tipo',
  authMiddleware,
  requirePermission('eventos.leer'),
  (req, res) => eventoController.getByTipo(req, res)
);

/**
 * @swagger
 * /api/v1/eventos/usuario:
 *   get:
 *     summary: Obtener eventos por usuario
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: usuario_id
 *         required: true
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
 *         description: Eventos del usuario
 */
router.get(
  '/usuario',
  authMiddleware,
  requirePermission('eventos.leer'),
  (req, res) => eventoController.getByUsuario(req, res)
);

/**
 * @swagger
 * /api/v1/eventos/resumen:
 *   get:
 *     summary: Obtener resumen de eventos
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de eventos
 */
router.get(
  '/resumen',
  authMiddleware,
  requirePermission('eventos.leer'),
  (req, res) => eventoController.getResumen(req, res)
);

export default router;
