import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_MISSING',
        type: 'AUTHENTICATION',
        message: 'Access token is required',
        timestamp: new Date()
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err: any, decoded: any) => {
    if (err) {
      logger.warn('Invalid token attempt:', { token: token.substring(0, 10) + '...', error: err.message });
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          type: 'AUTHENTICATION',
          message: 'Invalid or expired token',
          timestamp: new Date()
        }
      });
    }

    req.user = decoded as User;
    next();
  });
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_USER_MISSING',
          type: 'AUTHENTICATION',
          message: 'User authentication required',
          timestamp: new Date()
        }
      });
    }

    const userRoles = req.user.roles.map(role => role.name);
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      logger.warn('Insufficient permissions:', { 
        userId: req.user.id, 
        userRoles, 
        requiredRoles: roles 
      });
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          type: 'AUTHORIZATION',
          message: 'Insufficient permissions for this resource',
          timestamp: new Date()
        }
      });
    }

    next();
  };
};

export const requirePermission = (resource: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_USER_MISSING',
          type: 'AUTHENTICATION',
          message: 'User authentication required',
          timestamp: new Date()
        }
      });
    }

    const hasPermission = req.user.roles.some(role =>
      role.permissions.some(permission =>
        permission.resource === resource && permission.actions.includes(action)
      )
    );

    if (!hasPermission) {
      logger.warn('Permission denied:', { 
        userId: req.user.id, 
        resource, 
        action 
      });
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_PERMISSION_DENIED',
          type: 'AUTHORIZATION',
          message: `Permission denied for ${action} on ${resource}`,
          timestamp: new Date()
        }
      });
    }

    next();
  };
};