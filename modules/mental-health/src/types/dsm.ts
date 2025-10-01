// DSM-5-TR Type Definitions for Mental Health Module

export interface DSMDiagnosis {
  id: string;
  code: string;
  category: DSMCategory;
  subcategory?: string;
  name: string;
  description: string;
  criteria: DSMCriteria[];
  severity: DSMSeverity;
  specifiers?: DSMSpecifier[];
  culturalConsiderations?: CulturalConsideration[];
  version: DSMVersion;
}

export enum DSMVersion {
  DSM_5 = "DSM-5",
  DSM_5_TR = "DSM-5-TR",
  ICD_11 = "ICD-11"
}

export enum DSMCategory {
  NEURODEVELOPMENTAL = "neurodevelopmental_disorders",
  SCHIZOPHRENIA_SPECTRUM = "schizophrenia_spectrum_psychotic_disorders",
  BIPOLAR = "bipolar_related_disorders",
  DEPRESSIVE = "depressive_disorders",
  ANXIETY = "anxiety_disorders",
  OCD_RELATED = "obsessive_compulsive_related_disorders",
  TRAUMA_STRESSOR = "trauma_stressor_related_disorders",
  DISSOCIATIVE = "dissociative_disorders",
  SOMATIC_SYMPTOM = "somatic_symptom_related_disorders",
  FEEDING_EATING = "feeding_eating_disorders",
  ELIMINATION = "elimination_disorders",
  SLEEP_WAKE = "sleep_wake_disorders",
  SEXUAL_DYSFUNCTIONS = "sexual_dysfunctions",
  GENDER_DYSPHORIA = "gender_dysphoria",
  DISRUPTIVE_IMPULSE = "disruptive_impulse_control_conduct_disorders",
  SUBSTANCE_RELATED = "substance_related_addictive_disorders",
  NEUROCOGNITIVE = "neurocognitive_disorders",
  PERSONALITY = "personality_disorders",
  PARAPHILIC = "paraphilic_disorders",
  OTHER_MENTAL = "other_mental_disorders"
}

export interface DSMCriteria {
  id: string;
  criterion: string;
  description: string;
  required: boolean;
  timeframe?: string;
  exclusions?: string[];
  culturalVariations?: CulturalVariation[];
}

export enum DSMSeverity {
  MILD = "mild",
  MODERATE = "moderate",
  SEVERE = "severe",
  UNSPECIFIED = "unspecified"
}

export interface DSMSpecifier {
  type: SpecifierType;
  value: string;
  description: string;
}

export enum SpecifierType {
  COURSE = "course",
  SEVERITY = "severity",
  FEATURES = "features",
  CONTEXT = "context",
  TEMPORAL = "temporal"
}

export interface CulturalConsideration {
  culture: string;
  region: string;
  language: string;
  considerations: string[];
  prevalenceNotes?: string;
  expressionVariations?: string[];
  stigmaFactors?: string[];
}

export interface CulturalVariation {
  culture: string;
  variation: string;
  prevalence?: number;
  notes?: string;
}

// Patient Assessment Types
export interface PatientAssessment {
  id: string;
  patientId: string;
  assessmentDate: Date;
  clinicianId?: string;
  language: 'en' | 'sw' | 'fr';
  symptoms: Symptom[];
  functionalImpairment: FunctionalImpairment;
  riskAssessment: RiskAssessment;
  dsmDiagnoses: DSMDiagnosisResult[];
  recommendations: TreatmentRecommendation[];
  followUpRequired: boolean;
  confidenceScore: number;
  culturalContext?: CulturalContext;
}

export interface Symptom {
  id: string;
  description: string;
  severity: SymptomSeverity;
  duration: string;
  frequency: SymptomFrequency;
  onset: Date;
  triggers?: string[];
  culturalExpression?: string;
  language: string;
}

export enum SymptomSeverity {
  MINIMAL = "minimal",
  MILD = "mild",
  MODERATE = "moderate",
  SEVERE = "severe",
  EXTREME = "extreme"
}

export enum SymptomFrequency {
  RARELY = "rarely",
  SOMETIMES = "sometimes",
  OFTEN = "often",
  VERY_OFTEN = "very_often",
  ALWAYS = "always"
}

export interface FunctionalImpairment {
  social: ImpairmentLevel;
  occupational: ImpairmentLevel;
  academic: ImpairmentLevel;
  interpersonal: ImpairmentLevel;
  selfCare: ImpairmentLevel;
  overall: ImpairmentLevel;
  description?: string;
}

export enum ImpairmentLevel {
  NONE = "none",
  MILD = "mild",
  MODERATE = "moderate",
  SEVERE = "severe",
  EXTREME = "extreme"
}

export interface RiskAssessment {
  suicideRisk: RiskLevel;
  selfHarmRisk: RiskLevel;
  violenceRisk: RiskLevel;
  substanceUseRisk: RiskLevel;
  overallRisk: RiskLevel;
  riskFactors: string[];
  protectiveFactors: string[];
  immediateInterventionRequired: boolean;
  riskMitigationPlan?: string[];
}

export enum RiskLevel {
  LOW = "low",
  MODERATE = "moderate",
  HIGH = "high",
  IMMINENT = "imminent"
}

export interface DSMDiagnosisResult {
  diagnosis: DSMDiagnosis;
  confidence: number;
  criteriaMatched: CriteriaMatch[];
  severity: DSMSeverity;
  specifiers: DSMSpecifier[];
  differentialDiagnoses?: DSMDiagnosis[];
  culturalFormulation?: CulturalFormulation;
  explanation: DiagnosisExplanation;
}

export interface CriteriaMatch {
  criteriaId: string;
  matched: boolean;
  confidence: number;
  evidence: string[];
  culturalContext?: string;
}

export interface CulturalFormulation {
  culturalIdentity: string;
  culturalConceptualizationOfDistress: string;
  psychosocialStressors: string[];
  culturalFeaturesOfVulnerability: string[];
  culturalFeaturesOfResilience: string[];
  culturalAssessment: string;
}

export interface DiagnosisExplanation {
  reasoning: string;
  keySymptoms: string[];
  excludedDiagnoses: string[];
  uncertainties: string[];
  recommendedAssessments: string[];
  culturalConsiderations: string[];
}

export interface TreatmentRecommendation {
  type: TreatmentType;
  intervention: string;
  priority: Priority;
  urgency: Urgency;
  culturalAdaptations?: string[];
  languageConsiderations?: string[];
  expectedOutcome?: string;
  duration?: string;
  frequency?: string;
}

export enum TreatmentType {
  PSYCHOTHERAPY = "psychotherapy",
  MEDICATION = "medication",
  PSYCHOSOCIAL = "psychosocial",
  CRISIS_INTERVENTION = "crisis_intervention",
  REFERRAL = "referral",
  MONITORING = "monitoring",
  EDUCATION = "education"
}

export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

export enum Urgency {
  ROUTINE = "routine",
  EXPEDITED = "expedited",
  URGENT = "urgent",
  EMERGENT = "emergent"
}

export interface CulturalContext {
  primaryCulture: string;
  secondaryCultures?: string[];
  religiousBackground?: string;
  socioeconomicStatus: string;
  educationLevel: string;
  languageProficiency: LanguageProficiency[];
  migrationHistory?: MigrationHistory;
  familyStructure: string;
  communitySupport: SupportLevel;
  culturalStressors: string[];
  culturalStrengths: string[];
}

export interface LanguageProficiency {
  language: string;
  proficiency: ProficiencyLevel;
  preferredForMentalHealth: boolean;
}

export enum ProficiencyLevel {
  BASIC = "basic",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
  NATIVE = "native"
}

export interface MigrationHistory {
  countryOfOrigin: string;
  migrationDate?: Date;
  migrationReason: string;
  acculturationLevel: AcculturationLevel;
  acculturationStress?: string[];
}

export enum AcculturationLevel {
  LOW = "low",
  MODERATE = "moderate",
  HIGH = "high",
  BICULTURAL = "bicultural"
}

export enum SupportLevel {
  NONE = "none",
  LIMITED = "limited",
  MODERATE = "moderate",
  STRONG = "strong",
  EXTENSIVE = "extensive"
}

// AI Model Types
export interface DSMClassificationModel {
  id: string;
  name: string;
  version: string;
  dsmVersion: DSMVersion;
  languages: string[];
  accuracy: ModelAccuracy;
  biasMetrics: BiasMetrics;
  culturalValidation: CulturalValidation[];
  lastUpdated: Date;
  trainingData: TrainingDataInfo;
}

export interface ModelAccuracy {
  overall: number;
  byCategory: Record<DSMCategory, number>;
  byLanguage: Record<string, number>;
  byCulture: Record<string, number>;
  sensitivity: number;
  specificity: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface BiasMetrics {
  demographicParity: number;
  equalizedOdds: number;
  calibration: number;
  individualFairness: number;
  groupFairness: Record<string, number>;
  intersectionalFairness: Record<string, number>;
}

export interface CulturalValidation {
  culture: string;
  validationDate: Date;
  sampleSize: number;
  accuracy: number;
  culturalSensitivity: number;
  clinicalRelevance: number;
  communityAcceptance: number;
  recommendations: string[];
}

export interface TrainingDataInfo {
  totalSamples: number;
  languageDistribution: Record<string, number>;
  cultureDistribution: Record<string, number>;
  categoryDistribution: Record<DSMCategory, number>;
  dataQuality: DataQuality;
  ethicalReview: EthicalReview;
}

export interface DataQuality {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  representativeness: number;
  clinicalValidation: boolean;
}

export interface EthicalReview {
  approved: boolean;
  reviewDate: Date;
  reviewBoard: string;
  ethicalConcerns: string[];
  mitigationStrategies: string[];
  ongoingMonitoring: boolean;
}

// API Response Types
export interface DSMAssessmentRequest {
  patientId?: string;
  symptoms: string;
  language: 'en' | 'sw' | 'fr';
  culturalBackground?: string;
  demographicInfo?: DemographicInfo;
  previousDiagnoses?: string[];
  currentMedications?: string[];
  generateExplanation?: boolean;
  includeRiskAssessment?: boolean;
  includeTreatmentRecommendations?: boolean;
}

export interface DemographicInfo {
  age: number;
  gender: string;
  ethnicity?: string;
  education?: string;
  occupation?: string;
  maritalStatus?: string;
  location?: string;
}

export interface DSMAssessmentResponse {
  assessmentId: string;
  timestamp: Date;
  diagnoses: DSMDiagnosisResult[];
  riskAssessment?: RiskAssessment;
  functionalImpairment?: FunctionalImpairment;
  treatmentRecommendations?: TreatmentRecommendation[];
  culturalFormulation?: CulturalFormulation;
  confidence: number;
  explanation?: string;
  followUpRecommended: boolean;
  urgencyLevel: Urgency;
  governanceResults: GovernanceResult[];
}

export interface GovernanceResult {
  ruleId: string;
  ruleName: string;
  status: 'passed' | 'failed' | 'warning';
  details: string;
  timestamp: Date;
  impact: 'low' | 'medium' | 'high';
}

// Training and Validation Types
export interface DSMTrainingConfig {
  version: DSMVersion;
  languages: string[];
  culturalAdaptations: boolean;
  biasDetection: boolean;
  explainabilityRequired: boolean;
  clinicalValidation: boolean;
  ethicalReview: boolean;
  modelArchitecture: ModelArchitecture;
  hyperparameters: Hyperparameters;
  dataAugmentation: DataAugmentation;
  evaluationMetrics: EvaluationMetric[];
}

export interface ModelArchitecture {
  baseModel: string;
  layers: LayerConfig[];
  ensembleMethod?: EnsembleMethod;
  transferLearning: boolean;
  multilingualSupport: boolean;
  culturalEmbeddings: boolean;
}

export interface LayerConfig {
  type: string;
  parameters: Record<string, any>;
}

export enum EnsembleMethod {
  VOTING = "voting",
  STACKING = "stacking",
  BAGGING = "bagging",
  BOOSTING = "boosting"
}

export interface Hyperparameters {
  learningRate: number;
  batchSize: number;
  epochs: number;
  dropout: number;
  regularization: number;
  optimizerType: string;
  lossFunction: string;
  validationSplit: number;
  earlyStoppingPatience: number;
}

export interface DataAugmentation {
  enabled: boolean;
  techniques: AugmentationTechnique[];
  augmentationRatio: number;
  preserveClinicalMeaning: boolean;
}

export enum AugmentationTechnique {
  SYNONYM_REPLACEMENT = "synonym_replacement",
  BACK_TRANSLATION = "back_translation",
  PARAPHRASING = "paraphrasing",
  NOISE_INJECTION = "noise_injection",
  CULTURAL_ADAPTATION = "cultural_adaptation"
}

export enum EvaluationMetric {
  ACCURACY = "accuracy",
  PRECISION = "precision",
  RECALL = "recall",
  F1_SCORE = "f1_score",
  AUC_ROC = "auc_roc",
  CLINICAL_ACCURACY = "clinical_accuracy",
  CULTURAL_SENSITIVITY = "cultural_sensitivity",
  BIAS_METRICS = "bias_metrics",
  EXPLAINABILITY_SCORE = "explainability_score"
}