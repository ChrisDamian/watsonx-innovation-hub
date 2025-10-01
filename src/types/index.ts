// Core Platform Types
export interface User {
  id: string;
  email: string;
  roles: Role[];
  preferences: UserPreferences;
  createdAt: Date;
  lastLogin: Date;
}

export interface Role {
  name: string;
  permissions: Permission[];
  modules: string[];
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface UserPreferences {
  language: 'en' | 'sw' | 'fr';
  theme: 'light' | 'dark';
  timezone: string;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

// AI Models and Predictions
export interface AIModel {
  id: string;
  name: string;
  version: string;
  moduleId: string;
  type: 'classification' | 'regression' | 'nlp' | 'computer_vision';
  status: 'training' | 'deployed' | 'deprecated';
  metrics: ModelMetrics;
  governance: ModelGovernance;
  watsonxConfig: WatsonxModelConfig;
}

export interface WatsonxModelConfig {
  projectId: string;
  modelId: string;
  deploymentId?: string;
  foundationModel?: string;
  parameters: Record<string, any>;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  biasScore: number;
  explainabilityScore: number;
}

export interface ModelGovernance {
  biasRules: BiasRule[];
  explainabilityRequired: boolean;
  complianceChecks: ComplianceCheck[];
  auditLevel: 'basic' | 'enhanced' | 'full';
}

export interface Prediction {
  id: string;
  modelId: string;
  input: any;
  output: any;
  confidence: number;
  explanation: Explanation;
  timestamp: Date;
  userId?: string;
  governanceChecks: GovernanceResult[];
}

export interface Explanation {
  method: 'lime' | 'shap' | 'counterfactual';
  features: FeatureImportance[];
  textExplanation: string;
  confidence: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  direction: 'positive' | 'negative';
}

// Governance and Compliance
export interface GovernanceRule {
  id: string;
  name: string;
  type: 'bias_detection' | 'explainability' | 'compliance' | 'audit';
  config: any;
  isActive: boolean;
  moduleIds: string[];
}

export interface BiasRule {
  protectedAttribute: string;
  threshold: number;
  metric: 'demographic_parity' | 'equalized_odds' | 'calibration';
}

export interface ComplianceCheck {
  regulation: 'GDPR' | 'HIPAA' | 'KCAA' | 'PCI_DSS';
  requirements: string[];
  status: 'compliant' | 'non_compliant' | 'pending';
}

export interface GovernanceResult {
  ruleId: string;
  status: 'passed' | 'failed' | 'warning';
  details: string;
  timestamp: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  moduleId: string;
  modelId?: string;
  details: any;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

// Dataset Management
export interface Dataset {
  id: string;
  name: string;
  description: string;
  moduleId: string;
  schema: DataSchema;
  governance: DataGovernance;
  location: string;
  size: number;
  lastUpdated: Date;
  watsonxConfig: WatsonxDataConfig;
}

export interface WatsonxDataConfig {
  projectId: string;
  assetId: string;
  catalogId?: string;
  connectionId?: string;
  dataFormat: 'csv' | 'json' | 'parquet' | 'avro';
}

export interface DataSchema {
  fields: DataField[];
  primaryKey?: string;
  indexes: string[];
}

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  required: boolean;
  description?: string;
  constraints?: FieldConstraints;
}

export interface FieldConstraints {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
}

export interface DataGovernance {
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  retention: RetentionPolicy;
  access: AccessPolicy;
  compliance: ComplianceRequirement[];
  encryption: EncryptionConfig;
}

export interface RetentionPolicy {
  duration: number;
  unit: 'days' | 'months' | 'years';
  action: 'delete' | 'archive' | 'anonymize';
}

export interface AccessPolicy {
  allowedRoles: string[];
  allowedRegions: string[];
  requiresApproval: boolean;
  maxAccessDuration?: number;
}

export interface ComplianceRequirement {
  regulation: string;
  requirements: string[];
  validUntil?: Date;
}

export interface EncryptionConfig {
  atRest: boolean;
  inTransit: boolean;
  keyManagement: 'platform' | 'customer' | 'hybrid';
}

// Industry-Specific Types
export interface IndustryModule {
  id: string;
  name: string;
  version: string;
  endpoints: ModuleEndpoint[];
  models: AIModel[];
  datasets: Dataset[];
  governance: GovernanceConfig;
  ui: UIConfig;
}

export interface ModuleEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: string;
  auth: AuthConfig;
  rateLimit: RateLimitConfig;
  governance: GovernanceRule[];
}

export interface AuthConfig {
  required: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

export interface GovernanceConfig {
  biasDetection: boolean;
  explainabilityRequired: boolean;
  auditLevel: 'basic' | 'enhanced' | 'full';
  complianceChecks: string[];
}

export interface UIConfig {
  theme: string;
  language: string[];
  accessibility: AccessibilityConfig;
  svgAssets: SVGAsset[];
}

export interface AccessibilityConfig {
  screenReader: boolean;
  highContrast: boolean;
  keyboardNavigation: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface SVGAsset {
  id: string;
  name: string;
  category: string;
  path: string;
  culturalContext: 'african' | 'european' | 'universal';
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  requestId: string;
  module?: string;
}

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  MODEL_ERROR = 'MODEL_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  GOVERNANCE_VIOLATION = 'GOVERNANCE_VIOLATION',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: Date;
  processingTime: number;
  version: string;
}

// Watsonx Integration Types
export interface WatsonxConnection {
  apiKey: string;
  url: string;
  projectId: string;
  region: 'us-south' | 'eu-gb' | 'eu-de' | 'jp-tok';
}

export interface WatsonxTrainingJob {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  modelType: string;
  datasetId: string;
  parameters: TrainingParameters;
  metrics?: TrainingMetrics;
  createdAt: Date;
  completedAt?: Date;
}

export interface TrainingParameters {
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
  validationSplit?: number;
  earlyStoppingPatience?: number;
  [key: string]: any;
}

export interface TrainingMetrics {
  loss: number[];
  accuracy: number[];
  validationLoss: number[];
  validationAccuracy: number[];
  finalMetrics: ModelMetrics;
}