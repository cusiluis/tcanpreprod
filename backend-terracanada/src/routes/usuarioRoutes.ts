import { Router } from 'express';
import usuarioController from '../controllers/UsuarioController';
import { authMiddleware, requirePermission, requireRole } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/v1/usuarios:
 *   post:
 *     summary: Crear nuevo usuario (Solo Administrador)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_usuario:
 *                 type: string
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *               nombre_completo:
 *                 type: string
 *               rol_id:
 *                 type: integer
 *               telefono:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       403:
 *         description: Permisos insuficientes
 */
router.post(
  '/',
  authMiddleware,
  requirePermission('usuarios.crear'),
  (req, res) => usuarioController.create(req, res)
);

/**
 * @swagger
 * /api/v1/usuarios:
 *   get:
 *     summary: Listar todos los usuarios (Solo Administrador)
 *     tags: [Usuarios]
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
 *         description: Lista de usuarios
 *       403:
 *         description: Permisos insuficientes
 */
router.get(
  '/',
  authMiddleware,
  requirePermission('usuarios.leer'),
  (req, res) => usuarioController.getAll(req, res)
);

/**
 * @swagger
 * /api/v1/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID (Solo Administrador)
 *     tags: [Usuarios]
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
 *         description: Datos del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
  '/:id',
  authMiddleware,
  requirePermission('usuarios.leer'),
  (req, res) => usuarioController.getById(req, res)
);

/**
 * @swagger
 * /api/v1/usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario (Solo Administrador)
 *     tags: [Usuarios]
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
 *               nombre_completo:
 *                 type: string
 *               telefono:
 *                 type: string
 *               esta_activo:
 *                 type: boolean
 *               rol_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  '/:id',
  authMiddleware,
  requirePermission('usuarios.editar'),
  (req, res) => usuarioController.update(req, res)
);

/**
 * @swagger
 * /api/v1/usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario (Solo Administrador)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Usuario eliminado
 *       404:
 *         description: Usuario no encontrado
 */
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('usuarios.eliminar'),
  (req, res) => usuarioController.delete(req, res)
);

/**
 * @swagger
 * /api/v1/usuarios/{id}/cambiar-contrasena:
 *   put:
 *     summary: Cambiar contraseña del usuario actual
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contrasena_actual:
 *                 type: string
 *               contrasena_nueva:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña cambiada
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.put(
  '/:id/cambiar-contrasena',
  authMiddleware,
  (req, res) => usuarioController.cambiarContrasena(req, res)
);

/**
 * @swagger
 * /api/v1/usuarios/{id}/desactivar:
 *   put:
 *     summary: Desactivar usuario (Solo Administrador)
 *     tags: [Usuarios]
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
 *         description: Usuario desactivado
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  '/:id/desactivar',
  authMiddleware,
  requirePermission('usuarios.editar'),
  (req, res) => usuarioController.desactivar(req, res)
);

/**
 * @swagger
 * /api/v1/usuarios/{id}/activar:
 *   put:
 *     summary: Activar usuario (Solo Administrador)
 *     tags: [Usuarios]
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
 *         description: Usuario activado
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  '/:id/activar',
  authMiddleware,
  requirePermission('usuarios.editar'),
  (req, res) => usuarioController.activar(req, res)
);

/**
 * @swagger
 * /api/v1/usuarios/buscar:
 *   get:
 *     summary: Buscar usuarios (Solo Administrador)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nombre_usuario
 *         schema:
 *           type: string
 *       - in: query
 *         name: correo
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
  requirePermission('usuarios.leer'),
  (req, res) => usuarioController.search(req, res)
);

export default router;
