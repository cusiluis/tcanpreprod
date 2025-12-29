import { Router } from 'express';
import tarjetaController from '../controllers/TarjetaController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();

/**
 * Rutas para gestión de tarjetas
 * Todas las rutas requieren autenticación
 */

/**
 * POST /api/v1/tarjetas
 * Crear una nueva tarjeta
 * Permisos requeridos: tarjetas.crear
 */
router.post(
  '/',
  authMiddleware,
  requirePermission('tarjetas.crear'),
  (req, res) => tarjetaController.create(req, res)
);

/**
 * GET /api/v1/tarjetas
 * Obtener todas las tarjetas activas
 * Permisos requeridos: tarjetas.leer
 */
router.get(
  '/',
  authMiddleware,
  requirePermission('tarjetas.leer'),
  (req, res) => tarjetaController.getAll(req, res)
);

/**
 * GET /api/v1/tarjetas/:id
 * Obtener una tarjeta por ID
 * Permisos requeridos: tarjetas.leer
 */
router.get(
  '/:id',
  authMiddleware,
  requirePermission('tarjetas.leer'),
  (req, res) => tarjetaController.getById(req, res)
);

/**
 * PUT /api/v1/tarjetas/:id
 * Actualizar una tarjeta
 * Permisos requeridos: tarjetas.editar
 */
router.put(
  '/:id',
  authMiddleware,
  requirePermission('tarjetas.editar'),
  (req, res) => tarjetaController.update(req, res)
);

/**
 * DELETE /api/v1/tarjetas/:id
 * Desactivar una tarjeta (eliminación lógica)
 * Permisos requeridos: tarjetas.eliminar
 */
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('tarjetas.eliminar'),
  (req, res) => tarjetaController.delete(req, res)
);

/**
 * POST /api/v1/tarjetas/:id/cargo
 * Realizar cargo a una tarjeta (aumentar saldo)
 * Permisos requeridos: tarjetas.editar
 */
router.post(
  '/:id/cargo',
  authMiddleware,
  requirePermission('tarjetas.editar'),
  (req, res) => tarjetaController.realizarCargo(req, res)
);

/**
 * POST /api/v1/tarjetas/:id/pago
 * Realizar pago a una tarjeta (disminuir saldo)
 * Permisos requeridos: tarjetas.editar
 */
router.post(
  '/:id/pago',
  authMiddleware,
  requirePermission('tarjetas.editar'),
  (req, res) => tarjetaController.realizarPago(req, res)
);

/**
 * PATCH /api/v1/tarjetas/:id/estado
 * Cambiar estado de una tarjeta (activar/desactivar)
 * Permisos requeridos: tarjetas.editar
 */
router.patch(
  '/:id/estado',
  authMiddleware,
  requirePermission('tarjetas.editar'),
  (req, res) => tarjetaController.cambiarEstado(req, res)
);

/**
 * DELETE /api/v1/tarjetas/:id/permanente
 * Eliminar una tarjeta permanentemente (solo admin)
 * Permisos requeridos: tarjetas.eliminar_permanente
 */
router.delete(
  '/:id/permanente',
  authMiddleware,
  requirePermission('tarjetas.eliminar_permanente'),
  (req, res) => tarjetaController.deletePermanente(req, res)
);

export default router;
