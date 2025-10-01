import { DSMService } from '../../services/dsmService';
import { watsonxService } from '../../../../src/config/watsonx';
import {
  DSMAssessmentRequest,
  DSMAssessmentResponse,
  DSMCategory,
  DSMSeverity,
  RiskLevel,
  Urgency,
  DSMVersion
} from '../../types/dsm';

// Mock the watsonx service
jest.mock('../../../../src/config/watsonx');
const mockWatsonxService = watsonxService as jest.Mocked<typeof watsonxService>;

describe('DSMService', () => {
  let dsmService: DSMService;

  beforeEach(() => {
    dsmService = new DSMService();
    jest.clearAllMocks();
  });

  describe('assessSymptoms', () => {
    const mockAssessmentRequest: DSMAssessmentRequest = {
      patientId: 'patient-123',
      symptoms: 'Feeling sad and hopeless for the past 3 weeks, loss of interest in activities, fatigue, sleep disturbances',
      language: 'en',
      culturalBackground: 'East African',
      demographicInfo: {
        age: 28,
        gender: 'F',
        ethnicity: 'African'
      },
      generateExplanation: true,
      includeRiskAssessment: true,
      includeTreatmentRecommendations: true
    };

    it('should perform DSM assessment successfully', async () => {
      // Mock Watsonx responses
      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{
          probability: 0.89,
          values: ['F32.1', 'Major Depressive Disorder, Moderate']
        }]
      });

      mockWatsonxService.generateExplanation.mockResolvedValue({
        method: 'lime',
        features: [
          { feature: 'persistent_sadness', importance: 0.8, direction: 'positive' },
          { feature: 'anhedonia', importance: 0.7, direction: 'positive' },
          { feature: 'fatigue', importance: 0.6, direction: 'positive' }
        ],
        textExplanation: 'The assessment indicates major depressive disorder based on persistent sadness, loss of interest, and fatigue.',
        confidence: 0.89
      });

      const result = await dsmService.assessSymptoms(mockAssessmentRequest);

      expect(result).toBeDefined();
      expect(result.assessmentId).toBeDefined();
      expect(result.diagnoses).toHaveLength(1);
      expect(result.diagnoses[0].diagnosis.code).toBe('F32.1');
      expect(result.diagnoses[0].diagnosis.category).toBe(DSMCategory.DEPRESSIVE);
      expect(result.diagnoses[0].confidence).toBe(0.89);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.urgencyLevel).toBeDefined();

      expect(mockWatsonxService.generatePrediction).toHaveBeenCalledWith(
        expect.any(String), // deployment ID
        expect.objectContaining({
          symptoms: mockAssessmentRequest.symptoms,
          language: mockAssessmentRequest.language,
          culturalBackground: mockAssessmentRequest.culturalBackground
        }),
        expect.any(Object)
      );
    });

    it('should include risk assessment when requested', async () => {
      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{
          probability: 0.75,
          values: ['F32.0', 'Major Depressive Disorder, Mild']
        }]
      });

      // Mock risk assessment prediction
      mockWatsonxService.generatePrediction.mockResolvedValueOnce({
        predictions: [{
          probability: 0.65,
          values: ['moderate_risk']
        }]
      });

      const result = await dsmService.assessSymptoms(mockAssessmentRequest);

      expect(result.riskAssessment).toBeDefined();
      expect(result.riskAssessment?.overallRisk).toBe(RiskLevel.MODERATE);
      expect(result.riskAssessment?.suicideRisk).toBeDefined();
      expect(result.riskAssessment?.riskFactors).toBeDefined();
      expect(result.riskAssessment?.protectiveFactors).toBeDefined();
    });

    it('should include treatment recommendations when requested', async () => {
      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{
          probability: 0.85,
          values: ['F32.1', 'Major Depressive Disorder, Moderate']
        }]
      });

      const result = await dsmService.assessSymptoms(mockAssessmentRequest);

      expect(result.treatmentRecommendations).toBeDefined();
      expect(result.treatmentRecommendations).toHaveLength(3);
      expect(result.treatmentRecommendations![0].type).toBe('psychotherapy');
      expect(result.treatmentRecommendations![1].type).toBe('medication');
      expect(result.treatmentRecommendations![2].type).toBe('psychosocial');
    });

    it('should handle cultural formulation for non-English languages', async () => {
      const swahiliRequest: DSMAssessmentRequest = {
        ...mockAssessmentRequest,
        symptoms: 'Nahisi huzuni na kukata tamaa kwa wiki tatu zilizopita',
        language: 'sw',
        culturalBackground: 'Kikuyu'
      };

      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{
          probability: 0.82,
          values: ['F32.1', 'Major Depressive Disorder, Moderate']
        }]
      });

      const result = await dsmService.assessSymptoms(swahiliRequest);

      expect(result.culturalFormulation).toBeDefined();
      expect(result.culturalFormulation?.culturalIdentity).toContain('Kikuyu');
      expect(result.culturalFormulation?.culturalConceptualizationOfDistress).toBeDefined();
      expect(result.culturalFormulation?.culturalFeaturesOfResilience).toContain('strong family support');
    });

    it('should determine appropriate urgency level', async () => {
      // Test high-risk scenario
      const highRiskRequest: DSMAssessmentRequest = {
        ...mockAssessmentRequest,
        symptoms: 'Severe depression with suicidal thoughts and plans'
      };

      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{
          probability: 0.95,
          values: ['F32.2', 'Major Depressive Disorder, Severe']
        }]
      });

      const result = await dsmService.assessSymptoms(highRiskRequest);

      expect(result.urgencyLevel).toBe(Urgency.URGENT);
      expect(result.followUpRecommended).toBe(true);
    });

    it('should handle assessment errors gracefully', async () => {
      const assessmentError = new Error('Watsonx service unavailable');
      mockWatsonxService.generatePrediction.mockRejectedValue(assessmentError);

      await expect(dsmService.assessSymptoms(mockAssessmentRequest))
        .rejects.toThrow('DSM assessment failed');
    });

    it('should validate input parameters', async () => {
      const invalidRequest: DSMAssessmentRequest = {
        symptoms: '', // Empty symptoms
        language: 'en'
      };

      await expect(dsmService.assessSymptoms(invalidRequest))
        .rejects.toThrow('Symptoms description is required');
    });

    it('should support different DSM versions', async () => {
      const dsm5Request: DSMAssessmentRequest = {
        ...mockAssessmentRequest,
        // Add DSM version specification if supported
      };

      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{
          probability: 0.87,
          values: ['296.22', 'Major Depressive Disorder, Single Episode, Moderate'] // DSM-5 code
        }]
      });

      const result = await dsmService.assessSymptoms(dsm5Request);

      expect(result.diagnoses[0].diagnosis.version).toBe(DSMVersion.DSM_5_TR);
    });
  });

  describe('classifySymptoms', () => {
    it('should classify symptoms into DSM categories', async () => {
      const symptoms = 'Persistent worry, restlessness, difficulty concentrating';

      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{
          probability: 0.91,
          values: [DSMCategory.ANXIETY, 'Generalized Anxiety Disorder']
        }]
      });

      const result = await dsmService.classifySymptoms(symptoms, 'en');

      expect(result.category).toBe(DSMCategory.ANXIETY);
      expect(result.confidence).toBe(0.91);
      expect(result.subcategories).toContain('Generalized Anxiety Disorder');
    });

    it('should handle multilingual symptom classification', async () => {
      const frenchSymptoms = 'Anxiété persistante, agitation, difficultés de concentration';

      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{
          probability: 0.88,
          values: [DSMCategory.ANXIETY, 'Trouble anxieux généralisé']
        }]
      });

      const result = await dsmService.classifySymptoms(frenchSymptoms, 'fr');

      expect(result.category).toBe(DSMCategory.ANXIETY);
      expect(result.confidence).toBe(0.88);
      expect(result.language).toBe('fr');
    });
  });

  describe('assessRisk', () => {
    it('should assess suicide risk accurately', async () => {
      const highRiskSymptoms = 'Feeling hopeless, thoughts of death, specific suicide plan';

      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{
          probability: 0.85,
          values: ['high_risk', 'immediate_intervention_required']
        }]
      });

      const result = await dsmService.assessRisk(highRiskSymptoms, {
        age: 25,
        gender: 'M',
        previousAttempts: true,
        socialSupport: 'limited'
      });

      expect(result.suicideRisk).toBe(RiskLevel.HIGH);
      expect(result.immediateInterventionRequired).toBe(true);
      expect(result.riskFactors).toContain('previous suicide attempts');
      expect(result.riskMitigationPlan).toBeDefined();
    });

    it('should identify protective factors', async () => {
      const moderateRiskSymptoms = 'Feeling sad but has strong family support';

      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{
          probability: 0.45,
          values: ['moderate_risk']
        }]
      });

      const result = await dsmService.assessRisk(moderateRiskSymptoms, {
        age: 30,
        gender: 'F',
        familySupport: 'strong',
        religiousBeliefs: 'strong'
      });

      expect(result.suicideRisk).toBe(RiskLevel.MODERATE);
      expect(result.protectiveFactors).toContain('strong family support');
      expect(result.protectiveFactors).toContain('religious beliefs');
      expect(result.immediateInterventionRequired).toBe(false);
    });
  });

  describe('generateTreatmentRecommendations', () => {
    it('should generate culturally appropriate treatment recommendations', async () => {
      const diagnosis = {
        code: 'F32.1',
        category: DSMCategory.DEPRESSIVE,
        severity: DSMSeverity.MODERATE
      };

      const culturalContext = {
        primaryCulture: 'East African',
        language: 'sw',
        religiousBackground: 'Christian',
        familyInvolvement: 'high'
      };

      const recommendations = await dsmService.generateTreatmentRecommendations(
        diagnosis,
        culturalContext
      );

      expect(recommendations).toHaveLength(4);
      expect(recommendations[0].culturalAdaptations).toContain('Include family in treatment planning');
      expect(recommendations[0].languageConsiderations).toContain('Provide materials in Swahili');
      expect(recommendations.some(r => r.intervention.includes('faith-based'))).toBe(true);
    });

    it('should prioritize recommendations based on severity', async () => {
      const severeDiagnosis = {
        code: 'F32.2',
        category: DSMCategory.DEPRESSIVE,
        severity: DSMSeverity.SEVERE
      };

      const recommendations = await dsmService.generateTreatmentRecommendations(
        severeDiagnosis,
        { primaryCulture: 'Western' }
      );

      const urgentRecommendations = recommendations.filter(r => r.urgency === Urgency.URGENT);
      expect(urgentRecommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].priority).toBe('high');
    });
  });

  describe('validateCriteria', () => {
    it('should validate DSM criteria against symptoms', async () => {
      const symptoms = [
        'Depressed mood most of the day',
        'Markedly diminished interest in activities',
        'Significant weight loss',
        'Insomnia',
        'Fatigue'
      ];

      const dsmCriteria = [
        { id: 'A1', description: 'Depressed mood', required: true },
        { id: 'A2', description: 'Diminished interest', required: true },
        { id: 'A3', description: 'Weight changes', required: false },
        { id: 'A4', description: 'Sleep disturbance', required: false },
        { id: 'A5', description: 'Fatigue', required: false }
      ];

      const validation = await dsmService.validateCriteria(symptoms, dsmCriteria);

      expect(validation.totalCriteriaMet).toBe(5);
      expect(validation.requiredCriteriaMet).toBe(2);
      expect(validation.criteriaMatches).toHaveLength(5);
      expect(validation.criteriaMatches.every(m => m.matched)).toBe(true);
      expect(validation.overallMatch).toBe(true);
    });

    it('should handle partial criteria matches', async () => {
      const symptoms = ['Feeling sad sometimes'];

      const dsmCriteria = [
        { id: 'A1', description: 'Depressed mood most of the day', required: true },
        { id: 'A2', description: 'Diminished interest', required: true }
      ];

      const validation = await dsmService.validateCriteria(symptoms, dsmCriteria);

      expect(validation.totalCriteriaMet).toBe(1);
      expect(validation.requiredCriteriaMet).toBe(1);
      expect(validation.overallMatch).toBe(false);
      expect(validation.missingRequiredCriteria).toHaveLength(1);
    });
  });

  describe('Cultural Adaptation', () => {
    it('should adapt assessment for East African cultural context', async () => {
      const culturalRequest: DSMAssessmentRequest = {
        symptoms: 'Maumivu ya mwili, huzuni, na kutojali mambo',
        language: 'sw',
        culturalBackground: 'Kikuyu',
        demographicInfo: {
          age: 35,
          gender: 'F',
          ethnicity: 'Kikuyu'
        }
      };

      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{
          probability: 0.83,
          values: ['F32.1', 'Major Depressive Disorder, Moderate']
        }]
      });

      const result = await dsmService.assessSymptoms(culturalRequest);

      expect(result.culturalFormulation).toBeDefined();
      expect(result.culturalFormulation?.culturalConceptualizationOfDistress)
        .toContain('somatic presentation');
      expect(result.diagnoses[0].explanation.culturalConsiderations)
        .toContain('Cultural expression through physical symptoms');
    });

    it('should provide culturally sensitive explanations', async () => {
      const explanation = await dsmService.generateCulturalExplanation(
        'Depression diagnosis',
        'Maasai',
        'sw'
      );

      expect(explanation).toContain('utamaduni');
      expect(explanation).toContain('jamii');
      expect(explanation.length).toBeGreaterThan(100);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network timeout');
      mockWatsonxService.generatePrediction.mockRejectedValue(networkError);

      await expect(dsmService.assessSymptoms(mockAssessmentRequest))
        .rejects.toThrow('DSM assessment failed');
    });

    it('should validate language support', async () => {
      const unsupportedLanguageRequest: DSMAssessmentRequest = {
        symptoms: 'Test symptoms',
        language: 'zh' as any // Unsupported language
      };

      await expect(dsmService.assessSymptoms(unsupportedLanguageRequest))
        .rejects.toThrow('Language not supported');
    });

    it('should handle empty or invalid symptoms', async () => {
      const emptyRequest: DSMAssessmentRequest = {
        symptoms: '',
        language: 'en'
      };

      await expect(dsmService.assessSymptoms(emptyRequest))
        .rejects.toThrow('Symptoms description is required');
    });

    it('should validate demographic information', async () => {
      const invalidDemographics: DSMAssessmentRequest = {
        symptoms: 'Test symptoms',
        language: 'en',
        demographicInfo: {
          age: -5, // Invalid age
          gender: 'X'
        }
      };

      await expect(dsmService.assessSymptoms(invalidDemographics))
        .rejects.toThrow('Invalid demographic information');
    });
  });

  describe('Performance and Caching', () => {
    it('should cache frequently used DSM criteria', async () => {
      const symptoms = 'Depression symptoms';
      
      // First call
      await dsmService.classifySymptoms(symptoms, 'en');
      
      // Second call should use cache
      await dsmService.classifySymptoms(symptoms, 'en');

      // Watsonx should only be called once due to caching
      expect(mockWatsonxService.generatePrediction).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent assessments', async () => {
      const requests = Array(5).fill(null).map((_, i) => ({
        ...mockAssessmentRequest,
        patientId: `patient-${i}`
      }));

      mockWatsonxService.generatePrediction.mockResolvedValue({
        predictions: [{ probability: 0.8, values: ['F32.1'] }]
      });

      const results = await Promise.all(
        requests.map(req => dsmService.assessSymptoms(req))
      );

      expect(results).toHaveLength(5);
      expect(results.every(r => r.assessmentId)).toBe(true);
    });
  });
});