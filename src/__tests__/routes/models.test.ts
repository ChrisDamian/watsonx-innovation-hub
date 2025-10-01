import request from 'supertest';
import express from 'express';
import modelsRouter from '../../routes/models';
import { authenticateToken, requirePermission } from '../../middleware/auth';
import { GovernanceMiddleware } from '../../middleware/governance';
import { watsonxService } from '../../config/watsonx';

// Mock dependencies
jest.mock('../../middleware/auth');
jest.mock('../../middleware/governance');
jest.mock('../../config/watsonx');

const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;
const mockRequirePermission = requirePermission as jest.MockedFunction<typeof requirePermission>;
const mockWatsonxService = watsonxService as jest.Mocked<typeof watsonxService>;

describe('Models Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/models', modelsRouter);

    // Mock middleware to pass through
    mockAuthenticateToken.mockImplementation((req, res, next) => {
      (req as any).user = { id: 'user-123', roles: [] };
      next();
    });

    mockRequirePermission.mockImplementation(() => (req, res, next) => next());

    // Mock governance middleware
    GovernanceMiddleware.checkBias = jest.fn((req, res, next) => next());
    GovernanceMiddleware.requireExplanation = jest.fn((req, res, next) => next());
    GovernanceMiddleware.auditLog = jest.fn((req, res, next) => next());

    jest.clearAllMocks();
  });

  describe('GET /:moduleId', () => {
    it('should return models for a module', async () => {
      const response = await request(app)
        .get('/api/models/fintech')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('version');
      expect(response.body.data[0]).toHaveProperty('moduleId', 'fintech');
      expect(response.body.metadata).toHaveProperty('requestId');
      expect(response.body.metadata).toHaveProperty('timestamp');
    });

    it('should require authentication', async () => {
      mockAuthenticateToken.mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      await request(app)
        .get('/api/models/fintech')
        .expect(401);

      expect(mockAuthenticateToken).toHaveBeenCalled();
    });

    it('should require read permission', async () => {
      mockRequirePermission.mockImplementation(() => (req, res, next) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      await request(app)
        .get('/api/models/fintech')
        .expect(403);

      expect(mockRequirePermission).toHaveBeenCalledWith('models', 'read');
    });
  });

  describe('POST /:moduleId/deploy', () => {
    const deploymentPayload = {
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

    it('should deploy a model successfully', async () => {
      mockWatsonxService.deployModel.mockResolvedValue('deployment-123');

      const response = await request(app)
        .post('/api/models/fintech/deploy')
        .send(deploymentPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', 'Test Model');
      expect(response.body.data).toHaveProperty('status', 'deployed');
      expect(response.body.data.watsonxConfig).toHaveProperty('deploymentId', 'deployment-123');

      expect(mockWatsonxService.deployModel).toHaveBeenCalledWith(deploymentPayload.modelConfig);
    });

    it('should handle deployment errors', async () => {
      const deploymentError = new Error('Deployment failed');
      mockWatsonxService.deployModel.mockRejectedValue(deploymentError);

      const response = await request(app)
        .post('/api/models/fintech/deploy')
        .send(deploymentPayload)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'MODEL_DEPLOYMENT_ERROR');
      expect(response.body.error).toHaveProperty('type', 'MODEL_ERROR');
      expect(response.body.error).toHaveProperty('message', 'Failed to deploy model');
    });

    it('should require create permission', async () => {
      mockRequirePermission.mockImplementation(() => (req, res, next) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      await request(app)
        .post('/api/models/fintech/deploy')
        .send(deploymentPayload)
        .expect(403);

      expect(mockRequirePermission).toHaveBeenCalledWith('models', 'create');
    });

    it('should apply audit logging', async () => {
      mockWatsonxService.deployModel.mockResolvedValue('deployment-123');

      await request(app)
        .post('/api/models/fintech/deploy')
        .send(deploymentPayload)
        .expect(200);

      expect(GovernanceMiddleware.auditLog).toHaveBeenCalled();
    });
  });

  describe('POST /:moduleId/:modelId/predict', () => {
    const predictionPayload = {
      input: { text: 'test input', age: 30 },
      parameters: { temperature: 0.5 },
      generateExplanation: true
    };

    it('should generate prediction successfully', async () => {
      const mockPredictionResult = {
        predictions: [{ probability: 0.85, values: ['positive'] }]
      };
      const mockExplanation = {
        method: 'lime',
        features: [{ feature: 'text', importance: 0.8, direction: 'positive' }],
        textExplanation: 'Test explanation',
        confidence: 0.85
      };

      mockWatsonxService.generatePrediction.mockResolvedValue(mockPredictionResult);
      mockWatsonxService.generateExplanation.mockResolvedValue(mockExplanation);

      const response = await request(app)
        .post('/api/models/fintech/model-123/predict')
        .send(predictionPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('modelId', 'model-123');
      expect(response.body.data).toHaveProperty('input', predictionPayload.input);
      expect(response.body.data).toHaveProperty('output', mockPredictionResult.predictions[0]);
      expect(response.body.data).toHaveProperty('confidence', 0.5);
      expect(response.body.data).toHaveProperty('explanation', mockExplanation);

      expect(mockWatsonxService.generatePrediction).toHaveBeenCalledWith(
        'deployment-1',
        predictionPayload.input,
        predictionPayload.parameters
      );
      expect(mockWatsonxService.generateExplanation).toHaveBeenCalledWith(
        'model-123',
        predictionPayload.input
      );
    });

    it('should generate prediction without explanation', async () => {
      const mockPredictionResult = {
        predictions: [{ probability: 0.75, values: ['negative'] }]
      };

      mockWatsonxService.generatePrediction.mockResolvedValue(mockPredictionResult);

      const payloadWithoutExplanation = {
        ...predictionPayload,
        generateExplanation: false
      };

      const response = await request(app)
        .post('/api/models/fintech/model-123/predict')
        .send(payloadWithoutExplanation)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('explanation', null);
      expect(mockWatsonxService.generateExplanation).not.toHaveBeenCalled();
    });

    it('should handle prediction errors', async () => {
      const predictionError = new Error('Prediction failed');
      mockWatsonxService.generatePrediction.mockRejectedValue(predictionError);

      const response = await request(app)
        .post('/api/models/fintech/model-123/predict')
        .send(predictionPayload)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'PREDICTION_ERROR');
      expect(response.body.error).toHaveProperty('type', 'MODEL_ERROR');
    });

    it('should apply governance checks', async () => {
      const mockPredictionResult = {
        predictions: [{ probability: 0.85, values: ['positive'] }]
      };
      mockWatsonxService.generatePrediction.mockResolvedValue(mockPredictionResult);

      await request(app)
        .post('/api/models/fintech/model-123/predict')
        .send(predictionPayload)
        .expect(200);

      expect(GovernanceMiddleware.checkBias).toHaveBeenCalled();
      expect(GovernanceMiddleware.requireExplanation).toHaveBeenCalled();
      expect(GovernanceMiddleware.auditLog).toHaveBeenCalled();
    });

    it('should require execute permission', async () => {
      mockRequirePermission.mockImplementation(() => (req, res, next) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      await request(app)
        .post('/api/models/fintech/model-123/predict')
        .send(predictionPayload)
        .expect(403);

      expect(mockRequirePermission).toHaveBeenCalledWith('models', 'execute');
    });
  });

  describe('POST /:moduleId/train', () => {
    const trainingPayload = {
      datasetId: 'dataset-123',
      modelType: 'classification',
      parameters: {
        epochs: 5,
        batchSize: 32,
        learningRate: 0.001
      }
    };

    it('should start training job successfully', async () => {
      mockWatsonxService.createTrainingJob.mockResolvedValue('training-123');

      const response = await request(app)
        .post('/api/models/fintech/train')
        .send(trainingPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 'training-123');
      expect(response.body.data).toHaveProperty('status', 'queued');
      expect(response.body.data).toHaveProperty('modelType', 'classification');
      expect(response.body.data).toHaveProperty('datasetId', 'dataset-123');
      expect(response.body.data).toHaveProperty('parameters', trainingPayload.parameters);

      expect(mockWatsonxService.createTrainingJob).toHaveBeenCalledWith(
        'dataset-123',
        'classification',
        trainingPayload.parameters
      );
    });

    it('should handle training job creation errors', async () => {
      const trainingError = new Error('Training job creation failed');
      mockWatsonxService.createTrainingJob.mockRejectedValue(trainingError);

      const response = await request(app)
        .post('/api/models/fintech/train')
        .send(trainingPayload)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'TRAINING_START_ERROR');
      expect(response.body.error).toHaveProperty('type', 'MODEL_ERROR');
    });

    it('should require create permission', async () => {
      mockRequirePermission.mockImplementation(() => (req, res, next) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      await request(app)
        .post('/api/models/fintech/train')
        .send(trainingPayload)
        .expect(403);

      expect(mockRequirePermission).toHaveBeenCalledWith('models', 'create');
    });
  });

  describe('GET /:moduleId/training/:trainingId', () => {
    it('should get training status successfully', async () => {
      const mockTrainingStatus = {
        entity: {
          status: { state: 'completed' },
          results: { accuracy: 0.92 }
        }
      };

      mockWatsonxService.getTrainingStatus.mockResolvedValue(mockTrainingStatus);

      const response = await request(app)
        .get('/api/models/fintech/training/training-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTrainingStatus);

      expect(mockWatsonxService.getTrainingStatus).toHaveBeenCalledWith('training-123');
    });

    it('should handle training status errors', async () => {
      const statusError = new Error('Training status fetch failed');
      mockWatsonxService.getTrainingStatus.mockRejectedValue(statusError);

      const response = await request(app)
        .get('/api/models/fintech/training/training-123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'TRAINING_STATUS_ERROR');
    });

    it('should require read permission', async () => {
      mockRequirePermission.mockImplementation(() => (req, res, next) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      await request(app)
        .get('/api/models/fintech/training/training-123')
        .expect(403);

      expect(mockRequirePermission).toHaveBeenCalledWith('models', 'read');
    });
  });

  describe('POST /:moduleId/:modelId/generate-text', () => {
    const textGenerationPayload = {
      prompt: 'Generate a summary of the financial report',
      parameters: {
        maxTokens: 150,
        temperature: 0.7,
        topP: 0.9
      }
    };

    it('should generate text successfully', async () => {
      const mockGeneratedText = 'This is a generated financial summary...';
      mockWatsonxService.generateText.mockResolvedValue(mockGeneratedText);

      const response = await request(app)
        .post('/api/models/fintech/model-123/generate-text')
        .send(textGenerationPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('prompt', textGenerationPayload.prompt);
      expect(response.body.data).toHaveProperty('generatedText', mockGeneratedText);
      expect(response.body.data).toHaveProperty('parameters', textGenerationPayload.parameters);
      expect(response.body.data).toHaveProperty('timestamp');

      expect(mockWatsonxService.generateText).toHaveBeenCalledWith(
        textGenerationPayload.prompt,
        'model-123',
        textGenerationPayload.parameters
      );
    });

    it('should handle text generation errors', async () => {
      const textError = new Error('Text generation failed');
      mockWatsonxService.generateText.mockRejectedValue(textError);

      const response = await request(app)
        .post('/api/models/fintech/model-123/generate-text')
        .send(textGenerationPayload)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'TEXT_GENERATION_ERROR');
      expect(response.body.error).toHaveProperty('type', 'MODEL_ERROR');
    });

    it('should apply compliance checks', async () => {
      const mockGeneratedText = 'Generated text';
      mockWatsonxService.generateText.mockResolvedValue(mockGeneratedText);

      await request(app)
        .post('/api/models/fintech/model-123/generate-text')
        .send(textGenerationPayload)
        .expect(200);

      expect(GovernanceMiddleware.checkCompliance).toHaveBeenCalled();
      expect(GovernanceMiddleware.auditLog).toHaveBeenCalled();
    });

    it('should require execute permission', async () => {
      mockRequirePermission.mockImplementation(() => (req, res, next) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      await request(app)
        .post('/api/models/fintech/model-123/generate-text')
        .send(textGenerationPayload)
        .expect(403);

      expect(mockRequirePermission).toHaveBeenCalledWith('models', 'execute');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/models/fintech/deploy')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('type', 'MODEL_ERROR');
    });

    it('should handle invalid module ID', async () => {
      const response = await request(app)
        .get('/api/models/invalid-module')
        .expect(200);

      // Should still return successfully but with empty or default data
      expect(response.body.success).toBe(true);
    });

    it('should include request metadata in responses', async () => {
      const response = await request(app)
        .get('/api/models/fintech')
        .set('x-request-id', 'test-request-123')
        .expect(200);

      expect(response.body.metadata).toHaveProperty('requestId', 'test-request-123');
      expect(response.body.metadata).toHaveProperty('timestamp');
      expect(response.body.metadata).toHaveProperty('processingTime');
      expect(response.body.metadata).toHaveProperty('version', '1.0.0');
    });
  });

  describe('Governance Integration', () => {
    it('should include governance results in prediction response', async () => {
      const mockPredictionResult = {
        predictions: [{ probability: 0.85, values: ['positive'] }]
      };
      mockWatsonxService.generatePrediction.mockResolvedValue(mockPredictionResult);

      // Mock governance results
      GovernanceMiddleware.checkBias = jest.fn((req, res, next) => {
        (req as any).governanceResults = [
          { ruleId: 'bias-rule-1', status: 'passed', details: 'No bias detected' }
        ];
        next();
      });

      const response = await request(app)
        .post('/api/models/fintech/model-123/predict')
        .send({
          input: { text: 'test' },
          generateExplanation: false
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('governanceChecks');
      expect(response.body.data.governanceChecks).toHaveLength(1);
      expect(response.body.data.governanceChecks[0]).toHaveProperty('ruleId', 'bias-rule-1');
      expect(response.body.data.governanceChecks[0]).toHaveProperty('status', 'passed');
    });
  });
});