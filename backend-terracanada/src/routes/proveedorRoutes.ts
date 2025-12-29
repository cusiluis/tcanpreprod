import { Router } from 'express';
import proveedorController from '../controllers/ProveedorController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();

router.post(
  '/',
  authMiddleware,
  requirePermission('proveedores.crear'),
  (req, res) => proveedorController.create(req, res)
);

router.get(
  '/',
  authMiddleware,
  requirePermission('proveedores.leer'),
  (req, res) => proveedorController.getAll(req, res)
);

router.get(
  '/:id',
  authMiddleware,
  requirePermission('proveedores.leer'),
  (req, res) => proveedorController.getById(req, res)
);

router.put(
  '/:id',
  authMiddleware,
  requirePermission('proveedores.editar'),
  (req, res) => proveedorController.update(req, res)
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermission('proveedores.editar'),
  (req, res) => proveedorController.delete(req, res)
);

router.get(
  '/buscar',
  authMiddleware,
  requirePermission('proveedores.leer'),
  (req, res) => proveedorController.search(req, res)
);

router.get(
  '/servicio',
  authMiddleware,
  requirePermission('proveedores.leer'),
  (req, res) => proveedorController.getByServicio(req, res)
);

// Endpoint de prueba sin autenticación (SOLO PARA DESARROLLO)
router.get(
  '/test/all',
  (req, res) => proveedorController.getAll(req, res)
);

export default router;
