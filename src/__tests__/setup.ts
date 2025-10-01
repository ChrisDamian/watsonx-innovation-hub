import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { Pool } from 'pg';

// Global test setup
let mongoServer: MongoMemoryServer;
let redisClient: any;
let pgPool: Pool;

beforeAll(async () => {
  // Setup MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Setup Redis Mock
  const redis = require('redis-mock');
  redisClient = redis.createClient();

  // Setup PostgreSQL Test Pool
  pgPool = new Pool({
    host: process.env.TEST_POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.TEST_POSTGRES_PORT || '5432'),
    database: process.env.TEST_POSTGRES_DB || 'watsonx_hub_test',
    user: process.env.TEST_POSTGRES_USER || 'postgres',
    password: process.env.TEST_POSTGRES_PASSWORD || 'password',
    max: 5
  });

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.WATSONX_API_KEY = 'test-watsonx-api-key';
  process.env.WATSONX_PROJECT_ID = 'test-project-id';
});

afterAll(async () => {
  // Cleanup MongoDB
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();

  // Cleanup Redis
  if (redisClient) {
    redisClient.quit();
  }

  // Cleanup PostgreSQL
  if (pgPool) {
    await pgPool.end();
  }
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }

  // Clear Redis cache
  if (redisClient && redisClient.flushall) {
    redisClient.flushall();
  }
});

// Mock external services
jest.mock('@ibm-cloud/watsonx-ai', () => ({
  WatsonXAI: jest.fn().mockImplementation(() => ({
    listFoundationModelSpecs: jest.fn().mockResolvedValue({
      result: { resources: [] }
    }),
    deploymentsCreate: jest.fn().mockResolvedValue({
      result: { metadata: { id: 'test-deployment-id' } }
    }),
    deploymentsComputePredictions: jest.fn().mockResolvedValue({
      result: { predictions: [{ probability: 0.85, values: ['positive'] }] }
    }),
    generateText: jest.fn().mockResolvedValue({
      result: { results: [{ generated_text: 'Test generated text' }] }
    }),
    trainingsCreate: jest.fn().mockResolvedValue({
      result: { metadata: { id: 'test-training-id' } }
    }),
    trainingsGet: jest.fn().mockResolvedValue({
      result: { entity: { status: { state: 'completed' } } }
    }),
    assetsCreate: jest.fn().mockResolvedValue({
      result: { metadata: { asset_id: 'test-asset-id' } }
    })
  }))
}));

// Export test utilities
export { mongoServer, redisClient, pgPool };