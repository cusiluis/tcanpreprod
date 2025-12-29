import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar que el usuario tiene uno de los roles requeridos
 * @param roles Array de roles permitidos
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).user?.rol_nombre?.toLowerCase();

    console.log('requireRole - userRole:', userRole);
    console.log('requireRole - roles requeridos:', roles);
    console.log('requireRole - usuario:', (req as any).user);

    if (!userRole) {
      res.status(401).json({
        status: 401,
        message: 'Usuario no autenticado',
      });
      return;
    }

    if (!roles.includes(userRole)) {
      res.status(403).json({
        status: 403,
        message: 'No tienes permisos para acceder a este recurso',
        requiredRoles: roles,
        userRole: userRole,
      });
      return;
    }

    next();
  };
}

export default requireRole;
