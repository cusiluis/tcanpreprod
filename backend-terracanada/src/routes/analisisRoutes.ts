import { Router } from 'express';
import analisisController from '../controllers/AnalisisController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();

router.get(
  '/comparativo-medios',
  authMiddleware,
  requirePermission('analisis.leer'),
  (req, res) => analisisController.getComparativoMedios(req, res)
);

router.get(
  '/temporal-pagos',
  authMiddleware,
  requirePermission('analisis.leer'),
  (req, res) => analisisController.getTemporalPagos(req, res)
);

router.get(
  '/distribucion-emails',
  authMiddleware,
  requirePermission('analisis.leer'),
  (req, res) => analisisController.getDistribucionEmails(req, res)
);

router.get(
  '/top-proveedores',
  authMiddleware,
  requirePermission('analisis.leer'),
  (req, res) => analisisController.getTopProveedores(req, res)
);

router.get(
  '/completo',
  authMiddleware,
  requirePermission('analisis.leer'),
  (req, res) => analisisController.getAnalisisCompleto(req, res)
);

export default router;
