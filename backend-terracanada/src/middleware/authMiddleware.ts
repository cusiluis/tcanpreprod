import { Request, Response, NextFunction } from 'express';
import authService from '../services/AuthService';

export interface AuthRequest extends Request {
  user?: any;
}

/**
 * Middleware de autenticación JWT
 * Verifica que el token sea válido y carga el usuario en req.user
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    console.log('🔐 authMiddleware - INICIANDO VALIDACIÓN DE TOKEN');
    const authHeader = req.headers.authorization;
    console.log('🔐 authMiddleware - Authorization header:', authHeader ? 'PRESENTE' : 'AUSENTE');
    console.log('🔐 authMiddleware - Valor del header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('🔐 authMiddleware - ❌ No token provided o formato inválido');
      res.status(401).json({
        success: false,
        error: {
          message: 'No token provided',
          code: 'NO_TOKEN'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const token = authHeader.substring(7);
    console.log('🔐 authMiddleware - Token extraído:', token.substring(0, 30) + '...');
    console.log('🔐 authMiddleware - JWT_SECRET en uso:', process.env.JWT_SECRET ? 'CONFIGURADO' : 'NO CONFIGURADO (usando default)');
    
    const verification = authService.verifyToken(token);
    console.log('🔐 authMiddleware - Verificación exitosa:', verification.success);
    console.log('🔐 authMiddleware - Datos del usuario:', verification.data);

    if (!verification.success) {
      console.error('🔐 authMiddleware - ❌ Token inválido:', verification.error);
      res.status(401).json({
        success: false,
        error: {
          message: verification.error || 'Invalid token',
          code: 'INVALID_TOKEN'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    req.user = verification.data;
    console.log('🔐 authMiddleware - ✅ Usuario asignado a req.user:', req.user);
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Authentication error',
        code: 'AUTH_ERROR'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware de autorización por permiso
 * Verifica que el usuario tenga el permiso requerido
 */
export const requirePermission = (permiso: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const roleName = req.user.rol_nombre?.toLowerCase?.() || '';
    if (roleName === 'admin' || roleName === 'administrador') {
      next();
      return;
    }

    if (!req.user.permisos || !req.user.permisos.includes(permiso)) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

/**
 * Middleware de autorización por rol
 * Verifica que el usuario tenga el rol requerido
 */
export const requireRole = (rol: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.user.rol_nombre !== rol) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient role',
          code: 'INSUFFICIENT_ROLE'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

/**
 * Middleware de autorización por múltiples roles
 * Verifica que el usuario tenga uno de los roles requeridos
 */
export const requireRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    console.log('🔐 requireRoles - Validando roles');
    console.log('🔐 requireRoles - Roles requeridos:', roles);
    console.log('🔐 requireRoles - Rol del usuario:', req.user?.rol_nombre);
    
    if (!req.user) {
      console.error('🔐 requireRoles - ❌ Usuario no autenticado');
      res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Convertir a minúsculas para comparación
    const userRole = req.user.rol_nombre?.toLowerCase();
    const rolesLowercase = roles.map(r => r.toLowerCase());
    
    console.log('🔐 requireRoles - Rol del usuario (minúsculas):', userRole);
    console.log('🔐 requireRoles - Roles requeridos (minúsculas):', rolesLowercase);

    if (!rolesLowercase.includes(userRole)) {
      console.error('🔐 requireRoles - ❌ Rol insuficiente:', userRole, 'no está en', rolesLowercase);
      res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient role',
          code: 'INSUFFICIENT_ROLE'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log('🔐 requireRoles - ✅ Rol válido, permitiendo acceso');
    next();
  };
};
