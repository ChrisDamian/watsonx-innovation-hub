import { Request, Response, NextFunction } from 'express';
import { GovernanceMiddleware, GovernanceRequest } from '../../middleware/governance';
import { pgPool } from '../../config/database';
import { ErrorType } from '../../types';

// Mock the database pool
jest.mock('../../config/database', () => ({
  pgPool: {
    connect: jest.fn()
  }
}));

describe('Governance Middleware', () => {
  let mockRequest: Partial<GovernanceRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockClient: any;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent')
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    
    (pgPool.connect as jest.Mock).mockResolvedValue(mockClient);
    
    jest.clearAllMocks();
  });

  describe('checkBias', () => {
    it('should pass when no modelId is provided', async () => {
      mockRequest.body = {};

      await GovernanceMiddleware.checkBias(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should pass bias check when no rules are found', async () => {
      mockRequest.body = { modelId: 'test-model' };
      mockRequest.params = { moduleId: 'test-module' };
      
      mockClient.query.mockResolvedValue({ rows: [] });

      await GovernanceMiddleware.checkBias(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM governance_rules'),
        [JSON.stringify(['test-module'])]
      );
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should pass bias check when rules pass', async () => {
      mockRequest.body = { 
        modelId: 'test-model',
        input: { age: 30, gender: 'M' },
        output: { prediction: 'approved' }
      };
      mockRequest.params = { moduleId: 'test-module' };
      
      const mockRule = {
        id: 'rule-1',
        config: {
          protectedAttribute: 'gender',
          threshold: 0.8,
          blockOnFailure: false
        }
      };
      
      mockClient.query.mockResolvedValue({ rows: [mockRule] });

      // Mock the bias check to pass
      jest.spyOn(GovernanceMiddleware as any, 'performBiasCheck')
        .mockResolvedValue({ passed: true, details: 'Bias check passed' });

      await GovernanceMiddleware.checkBias(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.governanceResults).toHaveLength(1);
      expect(mockRequest.governanceResults![0].status).toBe('passed');
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block request when bias check fails and blockOnFailure is true', async () => {
      mockRequest.body = { 
        modelId: 'test-model',
        input: { age: 30, gender: 'M' },
        output: { prediction: 'approved' }
      };
      mockRequest.params = { moduleId: 'test-module' };
      
      const mockRule = {
        id: 'rule-1',
        config: {
          protectedAttribute: 'gender',
          threshold: 0.8,
          blockOnFailure: true
        }
      };
      
      mockClient.query.mockResolvedValue({ rows: [mockRule] });

      // Mock the bias check to fail
      jest.spyOn(GovernanceMiddleware as any, 'performBiasCheck')
        .mockResolvedValue({ passed: false, details: 'Bias detected' });

      await GovernanceMiddleware.checkBias(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'GOVERNANCE_BIAS_VIOLATION',
          type: ErrorType.GOVERNANCE_VIOLATION,
          message: 'Request blocked due to bias detection failure',
          details: 'Bias detected',
          timestamp: expect.any(Date)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.body = { modelId: 'test-model' };
      mockRequest.params = { moduleId: 'test-module' };
      
      const dbError = new Error('Database connection failed');
      mockClient.query.mockRejectedValue(dbError);

      await GovernanceMiddleware.checkBias(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe('checkCompliance', () => {
    it('should pass compliance check when no rules are found', async () => {
      mockRequest.params = { moduleId: 'test-module' };
      mockRequest.body = { 
        dataClassification: 'internal',
        userLocation: 'US'
      };
      
      mockClient.query.mockResolvedValue({ rows: [] });

      await GovernanceMiddleware.checkCompliance(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should pass compliance check when rules pass', async () => {
      mockRequest.params = { moduleId: 'test-module' };
      mockRequest.body = { 
        dataClassification: 'internal',
        userLocation: 'US'
      };
      
      const mockRule = {
        id: 'rule-1',
        config: {
          regulation: 'GDPR',
          allowedRegions: ['US', 'EU'],
          allowedClassifications: ['internal', 'public'],
          blockOnFailure: false
        }
      };
      
      mockClient.query.mockResolvedValue({ rows: [mockRule] });

      // Mock the compliance check to pass
      jest.spyOn(GovernanceMiddleware as any, 'performComplianceCheck')
        .mockResolvedValue({ passed: true, details: 'Compliance check passed' });

      await GovernanceMiddleware.checkCompliance(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.governanceResults).toHaveLength(1);
      expect(mockRequest.governanceResults![0].status).toBe('passed');
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block request when compliance check fails and blockOnFailure is true', async () => {
      mockRequest.params = { moduleId: 'test-module' };
      mockRequest.body = { 
        dataClassification: 'restricted',
        userLocation: 'CN'
      };
      
      const mockRule = {
        id: 'rule-1',
        config: {
          regulation: 'GDPR',
          allowedRegions: ['US', 'EU'],
          allowedClassifications: ['internal', 'public'],
          blockOnFailure: true
        }
      };
      
      mockClient.query.mockResolvedValue({ rows: [mockRule] });

      // Mock the compliance check to fail
      jest.spyOn(GovernanceMiddleware as any, 'performComplianceCheck')
        .mockResolvedValue({ passed: false, details: 'Region not allowed' });

      await GovernanceMiddleware.checkCompliance(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'GOVERNANCE_COMPLIANCE_VIOLATION',
          type: ErrorType.GOVERNANCE_VIOLATION,
          message: 'Request blocked due to compliance violation',
          details: 'Region not allowed',
          timestamp: expect.any(Date)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireExplanation', () => {
    it('should pass when no modelId is provided', async () => {
      mockRequest.body = {};

      await GovernanceMiddleware.requireExplanation(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should pass when explanation is not required', async () => {
      mockRequest.body = { modelId: 'test-model' };
      mockRequest.params = { moduleId: 'test-module' };
      
      const mockRule = {
        id: 'rule-1',
        config: { required: false }
      };
      
      mockClient.query.mockResolvedValue({ rows: [mockRule] });

      await GovernanceMiddleware.requireExplanation(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should pass when explanation is required and provided', async () => {
      mockRequest.body = { 
        modelId: 'test-model',
        generateExplanation: true
      };
      mockRequest.params = { moduleId: 'test-module' };
      
      const mockRule = {
        id: 'rule-1',
        config: { required: true }
      };
      
      mockClient.query.mockResolvedValue({ rows: [mockRule] });

      await GovernanceMiddleware.requireExplanation(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block when explanation is required but not provided', async () => {
      mockRequest.body = { 
        modelId: 'test-model',
        generateExplanation: false
      };
      mockRequest.params = { moduleId: 'test-module' };
      
      const mockRule = {
        id: 'rule-1',
        config: { required: true }
      };
      
      mockClient.query.mockResolvedValue({ rows: [mockRule] });

      await GovernanceMiddleware.requireExplanation(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'GOVERNANCE_EXPLANATION_REQUIRED',
          type: ErrorType.GOVERNANCE_VIOLATION,
          message: 'Explanation is required for this model prediction',
          timestamp: expect.any(Date)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('auditLog', () => {
    it('should wrap response.send and log audit trail', async () => {
      const originalSend = mockResponse.send;
      const responseData = { success: true, data: 'test' };

      // Mock the logAuditTrail method
      jest.spyOn(GovernanceMiddleware as any, 'logAuditTrail')
        .mockResolvedValue(undefined);

      await GovernanceMiddleware.auditLog(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();

      // Simulate calling the wrapped send method
      mockResponse.send!(responseData);

      expect(originalSend).toHaveBeenCalledWith(responseData);
    });

    it('should handle audit logging errors gracefully', async () => {
      const auditError = new Error('Audit logging failed');
      
      await GovernanceMiddleware.auditLog(
        mockRequest as GovernanceRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(auditError);
    });
  });

  describe('performBiasCheck', () => {
    it('should return passed when no protected attribute in input', async () => {
      const result = await (GovernanceMiddleware as any).performBiasCheck(
        'test-model',
        { age: 30 },
        { prediction: 'approved' },
        { protectedAttribute: 'gender', threshold: 0.8 }
      );

      expect(result.passed).toBe(true);
      expect(result.details).toContain('No protected attribute found');
    });

    it('should perform bias calculation when protected attribute exists', async () => {
      // Mock Math.random to return a predictable value
      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      const result = await (GovernanceMiddleware as any).performBiasCheck(
        'test-model',
        { gender: 'M', age: 30 },
        { prediction: 'approved' },
        { protectedAttribute: 'gender', threshold: 0.8 }
      );

      expect(result.passed).toBe(true);
      expect(result.details).toContain('Bias score: 0.900');
      expect(result.details).toContain('threshold: 0.8');
      expect(result.details).toContain('attribute: gender');

      (Math.random as jest.Mock).mockRestore();
    });

    it('should fail when bias score is below threshold', async () => {
      // Mock Math.random to return a low value
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = await (GovernanceMiddleware as any).performBiasCheck(
        'test-model',
        { gender: 'F', age: 25 },
        { prediction: 'rejected' },
        { protectedAttribute: 'gender', threshold: 0.8 }
      );

      expect(result.passed).toBe(false);
      expect(result.details).toContain('Bias score: 0.500');

      (Math.random as jest.Mock).mockRestore();
    });
  });

  describe('performComplianceCheck', () => {
    it('should pass when no regional restrictions', async () => {
      const result = await (GovernanceMiddleware as any).performComplianceCheck(
        'internal',
        'US',
        { regulation: 'GDPR', allowedRegions: [], allowedClassifications: [] }
      );

      expect(result.passed).toBe(true);
      expect(result.details).toContain('Compliance check passed for GDPR');
    });

    it('should fail when user location is not allowed', async () => {
      const result = await (GovernanceMiddleware as any).performComplianceCheck(
        'internal',
        'CN',
        { regulation: 'GDPR', allowedRegions: ['US', 'EU'], allowedClassifications: [] }
      );

      expect(result.passed).toBe(false);
      expect(result.details).toContain('User location CN not allowed for GDPR');
    });

    it('should fail when data classification is not allowed', async () => {
      const result = await (GovernanceMiddleware as any).performComplianceCheck(
        'restricted',
        'US',
        { regulation: 'GDPR', allowedRegions: [], allowedClassifications: ['public', 'internal'] }
      );

      expect(result.passed).toBe(false);
      expect(result.details).toContain('Data classification restricted not allowed for GDPR');
    });

    it('should pass when both region and classification are allowed', async () => {
      const result = await (GovernanceMiddleware as any).performComplianceCheck(
        'internal',
        'US',
        { 
          regulation: 'GDPR', 
          allowedRegions: ['US', 'EU'], 
          allowedClassifications: ['public', 'internal'] 
        }
      );

      expect(result.passed).toBe(true);
      expect(result.details).toContain('Compliance check passed for GDPR');
    });
  });

  describe('logAuditTrail', () => {
    it('should log audit trail successfully', async () => {
      const mockUser = { id: 'user-123' };
      mockRequest.user = mockUser;
      mockRequest.params = { moduleId: 'test-module' };
      mockRequest.body = { modelId: 'test-model', data: 'test' };
      mockRequest.query = { param: 'value' };
      mockRequest.governanceResults = [{ ruleId: 'rule-1', status: 'passed' }];

      const responseData = { success: true };
      mockResponse.statusCode = 200;

      mockClient.query.mockResolvedValue({ rows: [] });

      await (GovernanceMiddleware as any).logAuditTrail(
        mockRequest,
        mockResponse,
        responseData
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining([
          expect.stringContaining('GET'),
          'user-123',
          'test-module',
          'test-model',
          expect.any(String), // JSON stringified details
          '127.0.0.1',
          'test-user-agent'
        ])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle audit logging errors gracefully', async () => {
      const auditError = new Error('Database error');
      mockClient.query.mockRejectedValue(auditError);

      // Should not throw error
      await expect(
        (GovernanceMiddleware as any).logAuditTrail(
          mockRequest,
          mockResponse,
          { success: true }
        )
      ).resolves.toBeUndefined();

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should log without user when user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { moduleId: 'test-module' };
      mockRequest.body = { data: 'test' };

      mockClient.query.mockResolvedValue({ rows: [] });

      await (GovernanceMiddleware as any).logAuditTrail(
        mockRequest,
        mockResponse,
        { success: true }
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining([
          expect.any(String),
          null, // user_id should be null
          'test-module',
          null, // model_id should be null
          expect.any(String),
          '127.0.0.1',
          'test-user-agent'
        ])
      );
    });
  });
});