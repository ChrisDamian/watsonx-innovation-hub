import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole, requirePermission, AuthRequest } from '../../middleware/auth';
import { User, Role, Permission } from '../../types';

// Mock jwt
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        roles: [],
        preferences: {
          language: 'en',
          theme: 'light',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: false,
            sms: false
          }
        },
        createdAt: new Date(),
        lastLogin: new Date()
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockJwt.verify.mockImplementation((token, secret, callback: any) => {
        callback(null, mockUser);
      });

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        'valid-token',
        expect.any(String),
        expect.any(Function)
      );
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          type: 'AUTHENTICATION',
          message: 'Access token is required',
          timestamp: expect.any(Date)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat'
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockJwt.verify.mockImplementation((token, secret, callback: any) => {
        callback(new Error('Invalid token'), null);
      });

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          type: 'AUTHENTICATION',
          message: 'Invalid or expired token',
          timestamp: expect.any(Date)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token'
      };

      const tokenError = new Error('jwt expired');
      tokenError.name = 'TokenExpiredError';
      
      mockJwt.verify.mockImplementation((token, secret, callback: any) => {
        callback(tokenError, null);
      });

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    const createMockUser = (roleNames: string[]): User => ({
      id: 'user-123',
      email: 'test@example.com',
      roles: roleNames.map(name => ({
        name,
        permissions: [],
        modules: []
      })),
      preferences: {
        language: 'en',
        theme: 'light',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: false,
          sms: false
        }
      },
      createdAt: new Date(),
      lastLogin: new Date()
    });

    it('should allow access with required role', () => {
      const middleware = requireRole(['admin']);
      mockRequest.user = createMockUser(['admin', 'user']);

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access with any of multiple required roles', () => {
      const middleware = requireRole(['admin', 'moderator']);
      mockRequest.user = createMockUser(['moderator']);

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access without required role', () => {
      const middleware = requireRole(['admin']);
      mockRequest.user = createMockUser(['user']);

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          type: 'AUTHORIZATION',
          message: 'Insufficient permissions for this resource',
          timestamp: expect.any(Date)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access without user', () => {
      const middleware = requireRole(['admin']);

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_USER_MISSING',
          type: 'AUTHENTICATION',
          message: 'User authentication required',
          timestamp: expect.any(Date)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    const createMockUserWithPermissions = (permissions: Permission[]): User => ({
      id: 'user-123',
      email: 'test@example.com',
      roles: [{
        name: 'test-role',
        permissions,
        modules: []
      }],
      preferences: {
        language: 'en',
        theme: 'light',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: false,
          sms: false
        }
      },
      createdAt: new Date(),
      lastLogin: new Date()
    });

    it('should allow access with required permission', () => {
      const middleware = requirePermission('users', 'read');
      const permissions: Permission[] = [{
        resource: 'users',
        actions: ['read', 'write']
      }];
      mockRequest.user = createMockUserWithPermissions(permissions);

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access without required permission', () => {
      const middleware = requirePermission('users', 'delete');
      const permissions: Permission[] = [{
        resource: 'users',
        actions: ['read', 'write']
      }];
      mockRequest.user = createMockUserWithPermissions(permissions);

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_PERMISSION_DENIED',
          type: 'AUTHORIZATION',
          message: 'Permission denied for delete on users',
          timestamp: expect.any(Date)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for wrong resource', () => {
      const middleware = requirePermission('posts', 'read');
      const permissions: Permission[] = [{
        resource: 'users',
        actions: ['read', 'write']
      }];
      mockRequest.user = createMockUserWithPermissions(permissions);

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access with multiple roles and permissions', () => {
      const middleware = requirePermission('models', 'execute');
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        roles: [
          {
            name: 'data-scientist',
            permissions: [{
              resource: 'datasets',
              actions: ['read', 'write']
            }],
            modules: []
          },
          {
            name: 'ml-engineer',
            permissions: [{
              resource: 'models',
              actions: ['read', 'execute', 'deploy']
            }],
            modules: []
          }
        ],
        preferences: {
          language: 'en',
          theme: 'light',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: false,
            sms: false
          }
        },
        createdAt: new Date(),
        lastLogin: new Date()
      };
      mockRequest.user = user;

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access without user', () => {
      const middleware = requirePermission('users', 'read');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_USER_MISSING',
          type: 'AUTHENTICATION',
          message: 'User authentication required',
          timestamp: expect.any(Date)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('JWT Secret Configuration', () => {
    it('should use environment JWT secret', () => {
      process.env.JWT_SECRET = 'test-secret';
      
      mockRequest.headers = {
        authorization: 'Bearer test-token'
      };

      mockJwt.verify.mockImplementation((token, secret, callback: any) => {
        expect(secret).toBe('test-secret');
        callback(null, { id: 'user-123' });
      });

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        'test-token',
        'test-secret',
        expect.any(Function)
      );
    });

    it('should use fallback secret when environment variable is not set', () => {
      delete process.env.JWT_SECRET;
      
      mockRequest.headers = {
        authorization: 'Bearer test-token'
      };

      mockJwt.verify.mockImplementation((token, secret, callback: any) => {
        expect(secret).toBe('fallback-secret');
        callback(null, { id: 'user-123' });
      });

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        'test-token',
        'fallback-secret',
        expect.any(Function)
      );
    });
  });
});