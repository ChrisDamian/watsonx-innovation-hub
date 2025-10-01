import request from 'supertest';
import express from 'express';
import { Server } from 'http';
import { initializeDatabases, createSchemas } from '../../config/database';
import { watsonxService } from '../../config/watsonx';

// Import routes
import authRoutes from '../../routes/auth';
import modelsRoutes from '../../routes/models';
import governanceRoutes from '../../routes/governance';

// Mock external services
jest.mock('../../config/watsonx');
const mockWatsonxService = watsonxService as jest.Mocked<typeof watsonxService>;

describe('API Integration Tests', () => {
  let app: express.Application;
  let server: Server;
  let authToken: string;

  beforeAll(async () => {
    // Initialize test app
    app = express();
    app.use(express.json());
    
    // Add routes
    app.use('/api/auth', authRoutes);
    app.use('/api/models', modelsRoutes);
    app.use('/api/governance', governanceRoutes);
    
    // Initialize databases
    await initializeDatabases();
    await createSchemas();
    
    // Start server
    server = app.listen(0);
    
    // Mock Watsonx service
    mockWatsonxService.healthCheck.mockResolvedValue(true);
    mockWatsonxService.deployModel.mockResolvedValue('test-deployment-id');
    mockWatsonxService.generatePrediction.mockResolvedValue({
      predictions: [{ probability: 0.85, values: ['positive'] }]
    });
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      
      authToken = response.body.data.token;
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      
      authToken = response.body.data.token;
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'AUTH_INVALID_CREDENTIALS');
    });

    it('should validate JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'AUTH_TOKEN_INVALID');
    });
  });

  describe('Models API Flow', () => {
    it('should get models for a module', async () => {
      const response = await request(app)
        .get('/api/models/fintech')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.metadata).toHaveProperty('requestId');
    });

    it('should deploy a model', async () => {
      const deploymentData = {
        modelConfig: {
          projectId: 'test-project',
          modelId: 'test-model',
          name: 'Test Model',
          version: '1.0.0',
          type: 'classification',
          parameters: { temperature: 0.7 }
        },
        governanceConfig: {
          biasRules: [],
          explainabilityRequired: true,
          complianceChecks: [],
          auditLevel: 'basic'
        }
      };

      const response = await request(app)
        .post('/api/models/fintech/deploy')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deploymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status', 'deployed');
      expect(mockWatsonxService.deployModel).toHaveBeenCalled();
    });

    it('should generate prediction', async () => {
      const predictionData = {
        input: { text: 'test input', amount: 1000 },
        parameters: { temperature: 0.5 },
        generateExplanation: true
      };

      const response = await request(app)
        .post('/api/models/fintech/model-123/predict')
        .set('Authorization', `Bearer ${authToken}`)
        .send(predictionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('modelId', 'model-123');
      expect(response.body.data).toHaveProperty('confidence');
      expect(mockWatsonxService.generatePrediction).toHaveBeenCalled();
    });

    it('should start training job', async () => {
      const trainingData = {
        datasetId: 'dataset-123',
        modelType: 'classification',
        parameters: {
          epochs: 5,
          batchSize: 32,
          learningRate: 0.001
        }
      };

      mockWatsonxService.createTrainingJob.mockResolvedValue('training-123');

      const response = await request(app)
        .post('/api/models/fintech/train')
        .set('Authorization', `Bearer ${authToken}`)
        .send(trainingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 'training-123');
      expect(response.body.data).toHaveProperty('status', 'queued');
      expect(mockWatsonxService.createTrainingJob).toHaveBeenCalled();
    });
  });

  describe('Governance Integration', () => {
    it('should apply governance checks to predictions', async () => {
      const predictionData = {
        input: { text: 'test input', gender: 'F', age: 25 },
        parameters: { temperature: 0.5 },
        generateExplanation: true
      };

      const response = await request(app)
        .post('/api/models/fintech/model-123/predict')
        .set('Authorization', `Bearer ${authToken}`)
        .send(predictionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('governanceChecks');
      expect(Array.isArray(response.body.data.governanceChecks)).toBe(true);
    });

    it('should create governance rules', async () => {
      const ruleData = {
        name: 'Gender Bias Detection',
        type: 'bias_detection',
        config: {
          protectedAttribute: 'gender',
          threshold: 0.8,
          blockOnFailure: false
        },
        moduleIds: ['fintech']
      };

      const response = await request(app)
        .post('/api/governance/rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ruleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', 'Gender Bias Detection');
    });

    it('should get audit logs', async () => {
      const response = await request(app)
        .get('/api/governance/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('logs');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/models/fintech/deploy')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('type', 'VALIDATION');
    });

    it('should handle Watsonx service errors', async () => {
      const deploymentError = new Error('Watsonx service unavailable');
      mockWatsonxService.deployModel.mockRejectedValue(deploymentError);

      const deploymentData = {
        modelConfig: {
          projectId: 'test-project',
          modelId: 'test-model',
          name: 'Test Model',
          version: '1.0.0',
          type: 'classification',
          parameters: {}
        },
        governanceConfig: {
          biasRules: [],
          explainabilityRequired: false,
          complianceChecks: [],
          auditLevel: 'basic'
        }
      };

      const response = await request(app)
        .post('/api/models/fintech/deploy')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deploymentData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'MODEL_DEPLOYMENT_ERROR');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API endpoints', async () => {
      // Make multiple rapid requests
      const requests = Array(20).fill(null).map(() =>
        request(app)
          .get('/api/models/fintech')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.allSettled(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        (result) => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/models/fintech')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/models/fintech')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data.services).toHaveProperty('watsonx', 'healthy');
    });

    it('should return unhealthy status when services are down', async () => {
      mockWatsonxService.healthCheck.mockResolvedValue(false);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.services).toHaveProperty('watsonx', 'unhealthy');
    });
  });

  describe('Data Persistence', () => {
    it('should persist user data across requests', async () => {
      // Create user
      const userData = {
        email: 'persist@example.com',
        password: 'SecurePassword123!',
        firstName: 'Persist',
        lastName: 'Test'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login with same user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.data.user.email).toBe(userData.email);
    });

    it('should persist governance rules', async () => {
      const ruleData = {
        name: 'Persistent Rule',
        type: 'bias_detection',
        config: {
          protectedAttribute: 'age',
          threshold: 0.85
        },
        moduleIds: ['fintech']
      };

      // Create rule
      const createResponse = await request(app)
        .post('/api/governance/rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ruleData)
        .expect(201);

      const ruleId = createResponse.body.data.id;

      // Retrieve rule
      const getResponse = await request(app)
        .get(`/api/governance/rules/${ruleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.name).toBe('Persistent Rule');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent model deployments', async () => {
      const deploymentData = {
        modelConfig: {
          projectId: 'test-project',
          modelId: 'concurrent-model',
          name: 'Concurrent Model',
          version: '1.0.0',
          type: 'classification',
          parameters: {}
        },
        governanceConfig: {
          biasRules: [],
          explainabilityRequired: false,
          complianceChecks: [],
          auditLevel: 'basic'
        }
      };

      const requests = Array(3).fill(null).map((_, i) =>
        request(app)
          .post('/api/models/fintech/deploy')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...deploymentData,
            modelConfig: {
              ...deploymentData.modelConfig,
              modelId: `concurrent-model-${i}`
            }
          })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle concurrent predictions', async () => {
      const predictionData = {
        input: { text: 'concurrent test' },
        parameters: { temperature: 0.5 }
      };

      const requests = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/models/fintech/model-123/predict')
          .set('Authorization', `Bearer ${authToken}`)
          .send(predictionData)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      });
    });
  });
});