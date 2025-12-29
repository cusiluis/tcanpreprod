import { Router } from 'express';
import dashboardController from '../controllers/DashboardController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();

router.get(
  '/kpis',
  authMiddleware,
  requirePermission('dashboard.leer'),
  (req, res) => dashboardController.getKpis(req, res)
);

router.get(
  '/registros-pagos',
  authMiddleware,
  requirePermission('dashboard.leer'),
  (req, res) => dashboardController.getRegistrosPagos(req, res)
);

export default router;
