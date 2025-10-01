import express from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { GovernanceMiddleware } from '../middleware/governance';
import { watsonxService } from '../config/watsonx';
import { logger } from '../utils/logger';
import { AIModel, Prediction, WatsonxTrainingJob } from '../types';

const router = express.Router();

// Get all models for a module
router.get('/:moduleId', 
  authenticateToken,
  requirePermission('models', 'read'),
  async (req, res) => {
    try {
      const { moduleId } = req.params;
      
      // In production, this would query your model registry
      const models: AIModel[] = [
        {
          id: 'model-1',
          name: 'Credit Risk Classifier',
          version: '1.0.0',
          moduleId,
          type: 'classification',
          status: 'deployed',
          metrics: {
            accuracy: 0.92,
            precision: 0.89,
            recall: 0.94,
            f1Score: 0.91,
            biasScore: 0.85,
            explainabilityScore: 0.88
          },
          governance: {
            biasRules: [{
              protectedAttribute: 'gender',
              threshold: 0.8,
              metric: 'demographic_parity'
            }],
            explainabilityRequired: true,
            complianceChecks: [{
              regulation: 'GDPR',
              requirements: ['data_minimization', 'consent'],
              status: 'compliant'
            }],
            auditLevel: 'enhanced'
          },
          watsonxConfig: {
            projectId: process.env.WATSONX_PROJECT_ID || '',
            modelId: 'credit-risk-v1',
            deploymentId: 'deployment-1',
            parameters: {
              max_tokens: 100,
              temperature: 0.3
            }
          }
        }
      ];

      res.json({
        success: true,
        data: models,
        metadata: {
          requestId: req.headers['x-request-id'] || 'unknown',
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Error fetching models:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MODEL_FETCH_ERROR',
          type: 'MODEL_ERROR',
          message: 'Failed to fetch models',
          timestamp: new Date()
        }
      });
    }
  }
);

// Deploy a new model
router.post('/:moduleId/deploy',
  authenticateToken,
  requirePermission('models', 'create'),
  GovernanceMiddleware.auditLog,
  async (req, res) => {
    try {
      const { moduleId } = req.params;
      const { modelConfig, governanceConfig } = req.body;

      // Deploy model to Watsonx
      const deploymentId = await watsonxService.deployModel(modelConfig);

      // Save model configuration to database
      const model: AIModel = {
        id: `model-${Date.now()}`,
        name: modelConfig.name,
        version: modelConfig.version || '1.0.0',
        moduleId,
        type: modelConfig.type,
        status: 'deployed',
        metrics: {
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          biasScore: 0,
          explainabilityScore: 0
        },
        governance: governanceConfig,
        watsonxConfig: {
          ...modelConfig,
          deploymentId
        }
      };

      logger.info('Model deployed successfully:', { modelId: model.id, deploymentId });

      res.json({
        success: true,
        data: model,
        metadata: {
          requestId: req.headers['x-request-id'] || 'unknown',
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Error deploying model:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MODEL_DEPLOYMENT_ERROR',
          type: 'MODEL_ERROR',
          message: 'Failed to deploy model',
          details: error,
          timestamp: new Date()
        }
      });
    }
  }
);

// Generate prediction
router.post('/:moduleId/:modelId/predict',
  authenticateToken,
  requirePermission('models', 'execute'),
  GovernanceMiddleware.checkBias,
  GovernanceMiddleware.requireExplanation,
  GovernanceMiddleware.auditLog,
  async (req, res) => {
    try {
      const { moduleId, modelId } = req.params;
      const { input, parameters, generateExplanation } = req.body;

      // Get model configuration (in production, fetch from database)
      const deploymentId = 'deployment-1'; // This would be fetched from model config

      // Generate prediction using Watsonx
      const predictionResult = await watsonxService.generatePrediction(
        deploymentId,
        input,
        parameters
      );

      // Generate explanation if required
      let explanation = null;
      if (generateExplanation) {
        explanation = await watsonxService.generateExplanation(modelId, input);
      }

      const prediction: Prediction = {
        id: `pred-${Date.now()}`,
        modelId,
        input,
        output: predictionResult.predictions[0],
        confidence: predictionResult.predictions[0].probability || 0.5,
        explanation,
        timestamp: new Date(),
        userId: (req as any).user?.id,
        governanceChecks: (req as any).governanceResults || []
      };

      logger.info('Prediction generated:', { 
        modelId, 
        predictionId: prediction.id,
        confidence: prediction.confidence 
      });

      res.json({
        success: true,
        data: prediction,
        metadata: {
          requestId: req.headers['x-request-id'] || 'unknown',
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Error generating prediction:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PREDICTION_ERROR',
          type: 'MODEL_ERROR',
          message: 'Failed to generate prediction',
          details: error,
          timestamp: new Date()
        }
      });
    }
  }
);

// Start training job
router.post('/:moduleId/train',
  authenticateToken,
  requirePermission('models', 'create'),
  GovernanceMiddleware.auditLog,
  async (req, res) => {
    try {
      const { moduleId } = req.params;
      const { datasetId, modelType, parameters } = req.body;

      // Create training job in Watsonx
      const trainingJobId = await watsonxService.createTrainingJob(
        datasetId,
        modelType,
        parameters
      );

      const trainingJob: WatsonxTrainingJob = {
        id: trainingJobId,
        name: `${modelType}-training-${Date.now()}`,
        status: 'queued',
        modelType,
        datasetId,
        parameters,
        createdAt: new Date()
      };

      logger.info('Training job started:', { trainingJobId, moduleId, modelType });

      res.json({
        success: true,
        data: trainingJob,
        metadata: {
          requestId: req.headers['x-request-id'] || 'unknown',
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Error starting training job:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRAINING_START_ERROR',
          type: 'MODEL_ERROR',
          message: 'Failed to start training job',
          details: error,
          timestamp: new Date()
        }
      });
    }
  }
);

// Get training job status
router.get('/:moduleId/training/:trainingId',
  authenticateToken,
  requirePermission('models', 'read'),
  async (req, res) => {
    try {
      const { trainingId } = req.params;

      const trainingStatus = await watsonxService.getTrainingStatus(trainingId);

      res.json({
        success: true,
        data: trainingStatus,
        metadata: {
          requestId: req.headers['x-request-id'] || 'unknown',
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Error fetching training status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRAINING_STATUS_ERROR',
          type: 'MODEL_ERROR',
          message: 'Failed to fetch training status',
          details: error,
          timestamp: new Date()
        }
      });
    }
  }
);

// Generate text (for NLP models)
router.post('/:moduleId/:modelId/generate-text',
  authenticateToken,
  requirePermission('models', 'execute'),
  GovernanceMiddleware.checkCompliance,
  GovernanceMiddleware.auditLog,
  async (req, res) => {
    try {
      const { modelId } = req.params;
      const { prompt, parameters } = req.body;

      const generatedText = await watsonxService.generateText(
        prompt,
        modelId,
        parameters
      );

      res.json({
        success: true,
        data: {
          prompt,
          generatedText,
          parameters,
          timestamp: new Date()
        },
        metadata: {
          requestId: req.headers['x-request-id'] || 'unknown',
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Error generating text:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TEXT_GENERATION_ERROR',
          type: 'MODEL_ERROR',
          message: 'Failed to generate text',
          details: error,
          timestamp: new Date()
        }
      });
    }
  }
);

export default router;