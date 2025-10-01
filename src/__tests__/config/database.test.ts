import mongoose from 'mongoose';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { 
  connectMongoDB, 
  connectRedis, 
  initializeDatabases, 
  createSchemas,
  pgPool,
  redisClient 
} from '../../config/database';

// Mock the actual connections for testing
jest.mock('mongoose');
jest.mock('pg');
jest.mock('redis');

describe('Database Configuration', () => {
  const mockMongoose = mongoose as jest.Mocked<typeof mongoose>;
  const mockPgPool = pgPool as jest.Mocked<Pool>;
  const mockRedisClient = redisClient as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectMongoDB', () => {
    it('should connect to MongoDB successfully', async () => {
      mockMongoose.connect.mockResolvedValue(mongoose);

      await connectMongoDB();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        expect.stringContaining('mongodb://')
      );
    });

    it('should handle MongoDB connection errors', async () => {
      const mockError = new Error('MongoDB connection failed');
      mockMongoose.connect.mockRejectedValue(mockError);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit called');
      });

      await expect(connectMongoDB()).rejects.toThrow('Process exit called');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should use custom MongoDB URI from environment', async () => {
      const customUri = 'mongodb://custom-host:27017/custom-db';
      process.env.MONGODB_URI = customUri;
      
      mockMongoose.connect.mockResolvedValue(mongoose);

      await connectMongoDB();

      expect(mockMongoose.connect).toHaveBeenCalledWith(customUri);
      
      delete process.env.MONGODB_URI;
    });
  });

  describe('connectRedis', () => {
    it('should connect to Redis successfully', async () => {
      mockRedisClient.connect = jest.fn().mockResolvedValue(undefined);

      await connectRedis();

      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle Redis connection errors', async () => {
      const mockError = new Error('Redis connection failed');
      mockRedisClient.connect = jest.fn().mockRejectedValue(mockError);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit called');
      });

      await expect(connectRedis()).rejects.toThrow('Process exit called');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });

  describe('initializeDatabases', () => {
    it('should initialize all databases successfully', async () => {
      mockMongoose.connect.mockResolvedValue(mongoose);
      mockRedisClient.connect = jest.fn().mockResolvedValue(undefined);
      
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn()
      };
      mockPgPool.connect = jest.fn().mockResolvedValue(mockClient);

      await initializeDatabases();

      expect(mockMongoose.connect).toHaveBeenCalled();
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(mockPgPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW()');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle PostgreSQL connection errors', async () => {
      mockMongoose.connect.mockResolvedValue(mongoose);
      mockRedisClient.connect = jest.fn().mockResolvedValue(undefined);
      
      const mockError = new Error('PostgreSQL connection failed');
      mockPgPool.connect = jest.fn().mockRejectedValue(mockError);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit called');
      });

      await expect(initializeDatabases()).rejects.toThrow('Process exit called');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });

  describe('createSchemas', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn()
      };
      mockPgPool.connect = jest.fn().mockResolvedValue(mockClient);
    });

    it('should create all database schemas successfully', async () => {
      await createSchemas();

      expect(mockPgPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledTimes(11); // 5 tables + 6 indexes
      expect(mockClient.release).toHaveBeenCalled();

      // Verify specific table creation queries
      const queries = mockClient.query.mock.calls.map((call: any) => call[0]);
      
      expect(queries.some((q: string) => q.includes('CREATE TABLE IF NOT EXISTS users'))).toBe(true);
      expect(queries.some((q: string) => q.includes('CREATE TABLE IF NOT EXISTS audit_logs'))).toBe(true);
      expect(queries.some((q: string) => q.includes('CREATE TABLE IF NOT EXISTS governance_rules'))).toBe(true);
      expect(queries.some((q: string) => q.includes('CREATE TABLE IF NOT EXISTS datasets'))).toBe(true);
      expect(queries.some((q: string) => q.includes('CREATE TABLE IF NOT EXISTS predictions'))).toBe(true);
    });

    it('should create proper indexes', async () => {
      await createSchemas();

      const queries = mockClient.query.mock.calls.map((call: any) => call[0]);
      
      expect(queries.some((q: string) => q.includes('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp'))).toBe(true);
      expect(queries.some((q: string) => q.includes('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id'))).toBe(true);
      expect(queries.some((q: string) => q.includes('CREATE INDEX IF NOT EXISTS idx_predictions_model_id'))).toBe(true);
      expect(queries.some((q: string) => q.includes('CREATE INDEX IF NOT EXISTS idx_predictions_timestamp'))).toBe(true);
      expect(queries.some((q: string) => q.includes('CREATE INDEX IF NOT EXISTS idx_datasets_module_id'))).toBe(true);
    });

    it('should handle schema creation errors', async () => {
      const mockError = new Error('Schema creation failed');
      mockClient.query.mockRejectedValue(mockError);

      await expect(createSchemas()).rejects.toThrow('Schema creation failed');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should create users table with correct structure', async () => {
      await createSchemas();

      const usersTableQuery = mockClient.query.mock.calls
        .find((call: any) => call[0].includes('CREATE TABLE IF NOT EXISTS users'))[0];

      expect(usersTableQuery).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(usersTableQuery).toContain('email VARCHAR(255) UNIQUE NOT NULL');
      expect(usersTableQuery).toContain('password_hash VARCHAR(255) NOT NULL');
      expect(usersTableQuery).toContain('roles JSONB DEFAULT \'[]\'');
      expect(usersTableQuery).toContain('preferences JSONB DEFAULT \'{}\'');
      expect(usersTableQuery).toContain('created_at TIMESTAMP DEFAULT NOW()');
      expect(usersTableQuery).toContain('last_login TIMESTAMP');
      expect(usersTableQuery).toContain('updated_at TIMESTAMP DEFAULT NOW()');
    });

    it('should create audit_logs table with correct structure', async () => {
      await createSchemas();

      const auditLogsTableQuery = mockClient.query.mock.calls
        .find((call: any) => call[0].includes('CREATE TABLE IF NOT EXISTS audit_logs'))[0];

      expect(auditLogsTableQuery).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(auditLogsTableQuery).toContain('action VARCHAR(255) NOT NULL');
      expect(auditLogsTableQuery).toContain('user_id UUID REFERENCES users(id)');
      expect(auditLogsTableQuery).toContain('module_id VARCHAR(255)');
      expect(auditLogsTableQuery).toContain('model_id VARCHAR(255)');
      expect(auditLogsTableQuery).toContain('details JSONB');
      expect(auditLogsTableQuery).toContain('ip_address INET');
      expect(auditLogsTableQuery).toContain('user_agent TEXT');
      expect(auditLogsTableQuery).toContain('timestamp TIMESTAMP DEFAULT NOW()');
    });

    it('should create governance_rules table with correct structure', async () => {
      await createSchemas();

      const governanceRulesTableQuery = mockClient.query.mock.calls
        .find((call: any) => call[0].includes('CREATE TABLE IF NOT EXISTS governance_rules'))[0];

      expect(governanceRulesTableQuery).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(governanceRulesTableQuery).toContain('name VARCHAR(255) NOT NULL');
      expect(governanceRulesTableQuery).toContain('type VARCHAR(50) NOT NULL');
      expect(governanceRulesTableQuery).toContain('config JSONB NOT NULL');
      expect(governanceRulesTableQuery).toContain('is_active BOOLEAN DEFAULT true');
      expect(governanceRulesTableQuery).toContain('module_ids JSONB DEFAULT \'[]\'');
    });

    it('should create datasets table with correct structure', async () => {
      await createSchemas();

      const datasetsTableQuery = mockClient.query.mock.calls
        .find((call: any) => call[0].includes('CREATE TABLE IF NOT EXISTS datasets'))[0];

      expect(datasetsTableQuery).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(datasetsTableQuery).toContain('name VARCHAR(255) NOT NULL');
      expect(datasetsTableQuery).toContain('description TEXT');
      expect(datasetsTableQuery).toContain('module_id VARCHAR(255) NOT NULL');
      expect(datasetsTableQuery).toContain('schema JSONB NOT NULL');
      expect(datasetsTableQuery).toContain('governance JSONB NOT NULL');
      expect(datasetsTableQuery).toContain('location VARCHAR(500) NOT NULL');
      expect(datasetsTableQuery).toContain('size BIGINT DEFAULT 0');
      expect(datasetsTableQuery).toContain('watsonx_config JSONB');
    });

    it('should create predictions table with correct structure', async () => {
      await createSchemas();

      const predictionsTableQuery = mockClient.query.mock.calls
        .find((call: any) => call[0].includes('CREATE TABLE IF NOT EXISTS predictions'))[0];

      expect(predictionsTableQuery).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(predictionsTableQuery).toContain('model_id VARCHAR(255) NOT NULL');
      expect(predictionsTableQuery).toContain('input JSONB NOT NULL');
      expect(predictionsTableQuery).toContain('output JSONB NOT NULL');
      expect(predictionsTableQuery).toContain('confidence DECIMAL(5,4)');
      expect(predictionsTableQuery).toContain('explanation JSONB');
      expect(predictionsTableQuery).toContain('governance_checks JSONB DEFAULT \'[]\'');
      expect(predictionsTableQuery).toContain('user_id UUID REFERENCES users(id)');
      expect(predictionsTableQuery).toContain('timestamp TIMESTAMP DEFAULT NOW()');
    });
  });

  describe('Environment Configuration', () => {
    it('should use default values when environment variables are not set', async () => {
      // Clear environment variables
      delete process.env.MONGODB_URI;
      delete process.env.POSTGRES_HOST;
      delete process.env.POSTGRES_PORT;
      delete process.env.POSTGRES_DB;
      delete process.env.POSTGRES_USER;
      delete process.env.POSTGRES_PASSWORD;
      delete process.env.REDIS_URL;

      mockMongoose.connect.mockResolvedValue(mongoose);

      await connectMongoDB();

      expect(mockMongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/watsonx-hub');
    });

    it('should use environment variables when provided', async () => {
      process.env.MONGODB_URI = 'mongodb://test-host:27017/test-db';
      process.env.POSTGRES_HOST = 'test-pg-host';
      process.env.POSTGRES_PORT = '5433';
      process.env.POSTGRES_DB = 'test-db';
      process.env.POSTGRES_USER = 'test-user';
      process.env.POSTGRES_PASSWORD = 'test-password';
      process.env.REDIS_URL = 'redis://test-redis:6379';

      mockMongoose.connect.mockResolvedValue(mongoose);

      await connectMongoDB();

      expect(mockMongoose.connect).toHaveBeenCalledWith('mongodb://test-host:27017/test-db');

      // Cleanup
      delete process.env.MONGODB_URI;
      delete process.env.POSTGRES_HOST;
      delete process.env.POSTGRES_PORT;
      delete process.env.POSTGRES_DB;
      delete process.env.POSTGRES_USER;
      delete process.env.POSTGRES_PASSWORD;
      delete process.env.REDIS_URL;
    });
  });
});