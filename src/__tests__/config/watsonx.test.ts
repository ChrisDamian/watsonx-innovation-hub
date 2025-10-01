import { WatsonxService } from '../../config/watsonx';
import { WatsonxModelConfig, WatsonxDataConfig } from '../../types';

describe('WatsonxService', () => {
  let watsonxService: WatsonxService;

  beforeEach(() => {
    watsonxService = new WatsonxService();
  });

  describe('listFoundationModels', () => {
    it('should list foundation models successfully', async () => {
      const result = await watsonxService.listFoundationModels();
      
      expect(result).toBeDefined();
      expect(result.resources).toBeDefined();
    });

    it('should handle errors when listing foundation models', async () => {
      // Mock error
      const mockError = new Error('API Error');
      jest.spyOn(watsonxService as any, 'watsonxAI').mockImplementation(() => ({
        listFoundationModelSpecs: jest.fn().mockRejectedValue(mockError)
      }));

      await expect(watsonxService.listFoundationModels()).rejects.toThrow('API Error');
    });
  });

  describe('deployModel', () => {
    it('should deploy model successfully', async () => {
      const modelConfig: WatsonxModelConfig = {
        projectId: 'test-project',
        modelId: 'test-model',
        parameters: { temperature: 0.7 }
      };

      const deploymentId = await watsonxService.deployModel(modelConfig);
      
      expect(deploymentId).toBe('test-deployment-id');
    });

    it('should handle deployment errors', async () => {
      const modelConfig: WatsonxModelConfig = {
        projectId: 'test-project',
        modelId: 'invalid-model',
        parameters: {}
      };

      const mockError = new Error('Deployment failed');
      jest.spyOn(watsonxService as any, 'watsonxAI').mockImplementation(() => ({
        deploymentsCreate: jest.fn().mockRejectedValue(mockError)
      }));

      await expect(watsonxService.deployModel(modelConfig)).rejects.toThrow('Deployment failed');
    });
  });

  describe('generatePrediction', () => {
    it('should generate prediction successfully', async () => {
      const input = { text: 'test input' };
      const deploymentId = 'test-deployment';

      const result = await watsonxService.generatePrediction(deploymentId, input);
      
      expect(result).toBeDefined();
      expect(result.predictions).toBeDefined();
      expect(result.predictions[0].probability).toBe(0.85);
    });

    it('should handle prediction errors', async () => {
      const input = { text: 'test input' };
      const deploymentId = 'invalid-deployment';

      const mockError = new Error('Prediction failed');
      jest.spyOn(watsonxService as any, 'watsonxAI').mockImplementation(() => ({
        deploymentsComputePredictions: jest.fn().mockRejectedValue(mockError)
      }));

      await expect(watsonxService.generatePrediction(deploymentId, input)).rejects.toThrow('Prediction failed');
    });
  });

  describe('generateText', () => {
    it('should generate text successfully', async () => {
      const prompt = 'Test prompt';
      const modelId = 'test-model';

      const result = await watsonxService.generateText(prompt, modelId);
      
      expect(result).toBe('Test generated text');
    });

    it('should use custom parameters', async () => {
      const prompt = 'Test prompt';
      const modelId = 'test-model';
      const parameters = { maxTokens: 200, temperature: 0.5 };

      const result = await watsonxService.generateText(prompt, modelId, parameters);
      
      expect(result).toBe('Test generated text');
    });
  });

  describe('createTrainingJob', () => {
    it('should create training job successfully', async () => {
      const datasetId = 'test-dataset';
      const modelType = 'classification';
      const parameters = { epochs: 5 };

      const trainingId = await watsonxService.createTrainingJob(datasetId, modelType, parameters);
      
      expect(trainingId).toBe('test-training-id');
    });
  });

  describe('getTrainingStatus', () => {
    it('should get training status successfully', async () => {
      const trainingId = 'test-training-id';

      const result = await watsonxService.getTrainingStatus(trainingId);
      
      expect(result).toBeDefined();
      expect(result.entity.status.state).toBe('completed');
    });
  });

  describe('createDataAsset', () => {
    it('should create data asset successfully', async () => {
      const config: WatsonxDataConfig = {
        projectId: 'test-project',
        assetId: 'test-asset',
        dataFormat: 'csv'
      };
      const data = { test: 'data' };

      const assetId = await watsonxService.createDataAsset(config, data);
      
      expect(assetId).toBe('test-asset-id');
    });
  });

  describe('detectBias', () => {
    it('should detect bias successfully', async () => {
      const modelId = 'test-model';
      const testData = { test: 'data' };
      const protectedAttributes = ['gender', 'age'];

      const result = await watsonxService.detectBias(modelId, testData, protectedAttributes);
      
      expect(result).toBeDefined();
      expect(result.biasDetected).toBe(false);
      expect(result.metrics).toBeDefined();
    });
  });

  describe('generateExplanation', () => {
    it('should generate explanation successfully', async () => {
      const modelId = 'test-model';
      const input = { test: 'input' };

      const result = await watsonxService.generateExplanation(modelId, input);
      
      expect(result).toBeDefined();
      expect(result.method).toBe('lime');
      expect(result.features).toBeDefined();
      expect(result.textExplanation).toBeDefined();
    });

    it('should use custom explanation method', async () => {
      const modelId = 'test-model';
      const input = { test: 'input' };
      const method = 'shap';

      const result = await watsonxService.generateExplanation(modelId, input, method);
      
      expect(result.method).toBe('shap');
    });
  });

  describe('healthCheck', () => {
    it('should return true for healthy service', async () => {
      const result = await watsonxService.healthCheck();
      
      expect(result).toBe(true);
    });

    it('should return false for unhealthy service', async () => {
      const mockError = new Error('Service unavailable');
      jest.spyOn(watsonxService, 'listFoundationModels').mockRejectedValue(mockError);

      const result = await watsonxService.healthCheck();
      
      expect(result).toBe(false);
    });
  });

  describe('getMimeType', () => {
    it('should return correct mime types', () => {
      const getMimeType = (watsonxService as any).getMimeType.bind(watsonxService);
      
      expect(getMimeType('csv')).toBe('text/csv');
      expect(getMimeType('json')).toBe('application/json');
      expect(getMimeType('parquet')).toBe('application/octet-stream');
      expect(getMimeType('unknown')).toBe('application/octet-stream');
    });
  });
});