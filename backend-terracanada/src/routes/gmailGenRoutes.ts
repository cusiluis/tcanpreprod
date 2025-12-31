import { Router } from 'express';
import gmailGenController from '../controllers/GmailGenController';
import { authMiddleware, requirePermission } from '../middleware/authMiddleware';

const router = Router();

router.get(
  '/resumen',
  authMiddleware,
  requirePermission('ver_resumen_pagos'),
  (req, res) => gmailGenController.getResumenPagosDia(req, res)
);

router.get(
  '/pendientes-general',
  authMiddleware,
  requirePermission('ver_resumen_pagos'),
  (req, res) => gmailGenController.getCorreosPendientesGeneral(req, res)
);

router.get(
  '/enviados-resumen',
  authMiddleware,
  requirePermission('ver_resumen_pagos'),
  (req, res) => gmailGenController.getResumenEnviosFecha(req, res)
);

router.get(
  '/historial',
  authMiddleware,
  requirePermission('ver_resumen_pagos'),
  (req, res) => gmailGenController.getHistorialEnvios(req, res)
);

router.post(
  '/enviar',
  authMiddleware,
  requirePermission('crear_envio_resumen'),
  (req, res) => gmailGenController.enviarCorreoProveedor(req, res)
);

export default router;
