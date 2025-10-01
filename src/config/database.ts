import mongoose from 'mongoose';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

// MongoDB Connection
export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/watsonx-hub';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// PostgreSQL Connection
export const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'watsonx_hub',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis Connection
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (error) {
    logger.error('Redis connection error:', error);
    process.exit(1);
  }
};

// Database initialization
export const initializeDatabases = async (): Promise<void> => {
  await connectMongoDB();
  await connectRedis();
  
  // Test PostgreSQL connection
  try {
    const client = await pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Connected to PostgreSQL');
  } catch (error) {
    logger.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
};

// Create database schemas
export const createSchemas = async (): Promise<void> => {
  const client = await pgPool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        roles JSONB DEFAULT '[]',
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Audit logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(255) NOT NULL,
        user_id UUID REFERENCES users(id),
        module_id VARCHAR(255),
        model_id VARCHAR(255),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    // Governance rules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS governance_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        config JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        module_ids JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Datasets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS datasets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        module_id VARCHAR(255) NOT NULL,
        schema JSONB NOT NULL,
        governance JSONB NOT NULL,
        location VARCHAR(500) NOT NULL,
        size BIGINT DEFAULT 0,
        watsonx_config JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Predictions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_id VARCHAR(255) NOT NULL,
        input JSONB NOT NULL,
        output JSONB NOT NULL,
        confidence DECIMAL(5,4),
        explanation JSONB,
        governance_checks JSONB DEFAULT '[]',
        user_id UUID REFERENCES users(id),
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_predictions_model_id ON predictions(model_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_datasets_module_id ON datasets(module_id)');

    logger.info('Database schemas created successfully');
  } catch (error) {
    logger.error('Error creating database schemas:', error);
    throw error;
  } finally {
    client.release();
  }
};