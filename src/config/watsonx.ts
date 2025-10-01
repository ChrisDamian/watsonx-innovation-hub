import { WatsonXAI } from '@ibm-cloud/watsonx-ai';
import { logger } from '../utils/logger';
import { WatsonxConnection, WatsonxModelConfig, WatsonxDataConfig } from '../types';

export class WatsonxService {
  private watsonxAI: WatsonXAI;
  private connection: WatsonxConnection;

  constructor() {
    this.connection = {
      apiKey: process.env.WATSONX_API_KEY || '',
      url: process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
      projectId: process.env.WATSONX_PROJECT_ID || '',
      region: (process.env.WATSONX_REGION as any) || 'us-south'
    };

    this.watsonxAI = new WatsonXAI({
      version: '2023-05-29',
      serviceUrl: this.connection.url,
      authenticator: {
        apikey: this.connection.apiKey
      }
    });
  }

  // Foundation Models Management
  async listFoundationModels(): Promise<any> {
    try {
      const response = await this.watsonxAI.listFoundationModelSpecs({
        limit: 100
      });
      return response.result;
    } catch (error) {
      logger.error('Error listing foundation models:', error);
      throw error;
    }
  }

  // Model Deployment
  async deployModel(config: WatsonxModelConfig): Promise<string> {
    try {
      const deploymentParams = {
        name: `${config.modelId}-deployment`,
        online: {
          parameters: config.parameters
        },
        asset: {
          id: config.modelId
        },
        projectId: config.projectId
      };

      const response = await this.watsonxAI.deploymentsCreate(deploymentParams);
      logger.info(`Model deployed successfully: ${response.result.metadata.id}`);
      return response.result.metadata.id;
    } catch (error) {
      logger.error('Error deploying model:', error);
      throw error;
    }
  }

  // Model Inference
  async generatePrediction(deploymentId: string, input: any, parameters?: any): Promise<any> {
    try {
      const inferenceParams = {
        deploymentId,
        mlInstanceId: this.connection.projectId,
        input: {
          input_data: [{
            fields: Object.keys(input),
            values: [Object.values(input)]
          }]
        },
        parameters: parameters || {}
      };

      const response = await this.watsonxAI.deploymentsComputePredictions(inferenceParams);
      return response.result;
    } catch (error) {
      logger.error('Error generating prediction:', error);
      throw error;
    }
  }

  // Text Generation (for NLP models)
  async generateText(prompt: string, modelId: string, parameters?: any): Promise<string> {
    try {
      const textParams = {
        input: prompt,
        modelId: modelId,
        projectId: this.connection.projectId,
        parameters: {
          max_new_tokens: parameters?.maxTokens || 100,
          temperature: parameters?.temperature || 0.7,
          top_p: parameters?.topP || 1,
          top_k: parameters?.topK || 50,
          ...parameters
        }
      };

      const response = await this.watsonxAI.generateText(textParams);
      return response.result.results[0].generated_text;
    } catch (error) {
      logger.error('Error generating text:', error);
      throw error;
    }
  }

  // Training Jobs
  async createTrainingJob(datasetId: string, modelType: string, parameters: any): Promise<string> {
    try {
      const trainingParams = {
        name: `training-${Date.now()}`,
        resultsReference: {
          type: 'connection_asset',
          connection: {
            id: process.env.WATSONX_CONNECTION_ID
          },
          location: {
            path: `/training-results/${Date.now()}`
          }
        },
        experiment: {
          name: `experiment-${modelType}`,
          description: `Training experiment for ${modelType}`
        },
        pipeline: {
          id: modelType,
          parameters: parameters
        },
        trainingDataReferences: [{
          type: 'connection_asset',
          connection: {
            id: process.env.WATSONX_CONNECTION_ID
          },
          location: {
            path: `/datasets/${datasetId}`
          }
        }],
        projectId: this.connection.projectId
      };

      const response = await this.watsonxAI.trainingsCreate(trainingParams);
      logger.info(`Training job created: ${response.result.metadata.id}`);
      return response.result.metadata.id;
    } catch (error) {
      logger.error('Error creating training job:', error);
      throw error;
    }
  }

  // Monitor Training Job
  async getTrainingStatus(trainingId: string): Promise<any> {
    try {
      const response = await this.watsonxAI.trainingsGet({
        trainingId,
        projectId: this.connection.projectId
      });
      return response.result;
    } catch (error) {
      logger.error('Error getting training status:', error);
      throw error;
    }
  }

  // Data Asset Management
  async createDataAsset(config: WatsonxDataConfig, data: any): Promise<string> {
    try {
      const assetParams = {
        metadata: {
          name: `dataset-${Date.now()}`,
          description: 'Dataset for AI model training',
          asset_type: 'data_asset',
          origin_country: 'us',
          tags: ['ai', 'training', 'watsonx']
        },
        entity: {
          data_asset: {
            mime_type: this.getMimeType(config.dataFormat),
            dataset: true
          }
        },
        projectId: config.projectId
      };

      const response = await this.watsonxAI.assetsCreate(assetParams);
      logger.info(`Data asset created: ${response.result.metadata.asset_id}`);
      return response.result.metadata.asset_id;
    } catch (error) {
      logger.error('Error creating data asset:', error);
      throw error;
    }
  }

  // Governance and Bias Detection
  async detectBias(modelId: string, testData: any, protectedAttributes: string[]): Promise<any> {
    try {
      const biasParams = {
        modelId,
        testData,
        protectedAttributes,
        favorableOutcome: 1,
        unfavorableOutcome: 0,
        projectId: this.connection.projectId
      };

      // Note: This is a placeholder for bias detection API
      // Actual implementation depends on Watsonx governance features
      logger.info('Bias detection initiated for model:', modelId);
      return {
        biasDetected: false,
        metrics: {
          demographicParity: 0.95,
          equalizedOdds: 0.92,
          calibration: 0.88
        }
      };
    } catch (error) {
      logger.error('Error detecting bias:', error);
      throw error;
    }
  }

  // Model Explainability
  async generateExplanation(modelId: string, input: any, method: string = 'lime'): Promise<any> {
    try {
      const explanationParams = {
        modelId,
        input,
        method,
        projectId: this.connection.projectId
      };

      // Note: This is a placeholder for explainability API
      // Actual implementation depends on Watsonx governance features
      logger.info('Generating explanation for model:', modelId);
      return {
        method,
        features: [
          { feature: 'feature1', importance: 0.3, direction: 'positive' },
          { feature: 'feature2', importance: 0.2, direction: 'negative' }
        ],
        textExplanation: 'This prediction is based on...',
        confidence: 0.85
      };
    } catch (error) {
      logger.error('Error generating explanation:', error);
      throw error;
    }
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'csv': 'text/csv',
      'json': 'application/json',
      'parquet': 'application/octet-stream',
      'avro': 'application/avro'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      await this.listFoundationModels();
      return true;
    } catch (error) {
      logger.error('Watsonx health check failed:', error);
      return false;
    }
  }
}

export const watsonxService = new WatsonxService();