import { Router } from 'express';
import documentoUsuarioController from '../controllers/DocumentoUsuarioController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();

router.get(
  '/',
  authMiddleware,
  requirePermission('ver_documentos_usuario'),
  (req, res) => documentoUsuarioController.getAll(req, res)
);

router.get(
  '/:id',
  authMiddleware,
  requirePermission('ver_documentos_usuario'),
  (req, res) => documentoUsuarioController.getById(req, res)
);

router.post(
  '/',
  authMiddleware,
  requirePermission('crear_documento_usuario'),
  (req, res) => documentoUsuarioController.create(req, res)
);

router.put(
  '/:id',
  authMiddleware,
  requirePermission('editar_documento_usuario'),
  (req, res) => documentoUsuarioController.update(req, res)
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermission('eliminar_documento_usuario'),
  (req, res) => documentoUsuarioController.delete(req, res)
);

export default router;
