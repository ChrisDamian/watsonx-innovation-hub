import request from 'supertest';
import express from 'express';
import { Server } from 'http';
import { initializeDatabases, createSchemas } from '../../config/database';
import { watsonxService } from '../../config/watsonx';
import {
  DSMAssessmentRequest,
  DSMAssessmentResponse,
  DSMCategory,
  RiskLevel,
  Urgency
} from '../../../modules/mental-health/src/types/dsm';

// Mock external services
jest.mock('../../config/watsonx');
const mockWatsonxService = watsonxService as jest.Mocked<typeof watsonxService>;

describe('Mental Health Module E2E Workflow', () => {
  let app: express.Application;
  let server: Server;
  let authToken: string;
  let patientId: string;
  let assessmentId: string;

  beforeAll(async () => {
    // Initialize test app with mental health module
    app = express();
    app.use(express.json());
    
    // Add routes (would include mental health routes)
    // app.use('/api/mental-health', mentalHealthRoutes);
    
    // Initialize databases
    await initializeDatabases();
    await createSchemas();
    
    // Start server
    server = app.listen(0);
    
    // Mock Watsonx service responses for mental health
    mockWatsonxService.generatePrediction.mockImplementation((deploymentId, input) => {
      if (deploymentId.includes('dsm-classifier')) {
        return Promise.resolve({
          predictions: [{
            probability: 0.89,
            values: ['F32.1', 'Major Depressive Disorder, Moderate', DSMCategory.DEPRESSIVE]
          }]
        });
      }
      if (deploymentId.includes('risk-assessment')) {
        return Promise.resolve({
          predictions: [{
            probability: 0.65,
            values: [RiskLevel.MODERATE, 'moderate_suicide_risk']
          }]
        });
      }
      return Promise.resolve({
        predictions: [{ probability: 0.8, values: ['default'] }]
      });
    });

    mockWatsonxService.generateExplanation.mockResolvedValue({
      method: 'lime',
      features: [
        { feature: 'persistent_sadness', importance: 0.8, direction: 'positive' },
        { feature: 'anhedonia', importance: 0.7, direction: 'positive' },
        { feature: 'sleep_disturbance', importance: 0.6, direction: 'positive' }
      ],
      textExplanation: 'The assessment indicates major depressive disorder based on persistent sadness, loss of interest, and sleep disturbances.',
      confidence: 0.89
    });

    mockWatsonxService.generateText.mockResolvedValue(
      'Based on the cultural context, it is important to consider family involvement in treatment and potential somatic presentations of distress.'
    );
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Mental Health Assessment Workflow', () => {
    it('should complete full patient assessment workflow', async () => {
      // Step 1: Authenticate clinician
      const clinicianAuth = {
        email: 'clinician@hospital.com',
        password: 'SecurePassword123!',
        role: 'clinician'
      };

      const authResponse = await request(app)
        .post('/api/auth/login')
        .send(clinicianAuth)
        .expect(200);

      authToken = authResponse.body.data.token;
      expect(authToken).toBeDefined();

      // Step 2: Create patient record
      const patientData = {
        firstName: 'Amina',
        lastName: 'Mwangi',
        age: 28,
        gender: 'F',
        culturalBackground: 'Kikuyu',
        primaryLanguage: 'sw',
        secondaryLanguages: ['en'],
        contactInfo: {
          phone: '+254700123456',
          email: 'amina.mwangi@email.com'
        },
        emergencyContact: {
          name: 'John Mwangi',
          relationship: 'spouse',
          phone: '+254700654321'
        }
      };

      const patientResponse = await request(app)
        .post('/api/mental-health/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(patientData)
        .expect(201);

      patientId = patientResponse.body.data.id;
      expect(patientId).toBeDefined();
      expect(patientResponse.body.data.culturalBackground).toBe('Kikuyu');

      // Step 3: Conduct DSM assessment
      const assessmentRequest: DSMAssessmentRequest = {
        patientId,
        symptoms: 'Nahisi huzuni na kukata tamaa kwa wiki tatu zilizopita. Sina hamu ya kufanya mambo ninayoyapenda. Nalala vibaya na nahisi uchovu mwingi.',
        language: 'sw',
        culturalBackground: 'Kikuyu',
        demographicInfo: {
          age: 28,
          gender: 'F',
          ethnicity: 'Kikuyu',
          education: 'Secondary',
          occupation: 'Teacher',
          maritalStatus: 'Married'
        },
        previousDiagnoses: [],
        currentMedications: [],
        generateExplanation: true,
        includeRiskAssessment: true,
        includeTreatmentRecommendations: true
      };

      const assessmentResponse = await request(app)
        .post('/api/mental-health/assess')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentRequest)
        .expect(200);

      const assessment: DSMAssessmentResponse = assessmentResponse.body.data;
      assessmentId = assessment.assessmentId;

      // Verify assessment results
      expect(assessment.assessmentId).toBeDefined();
      expect(assessment.diagnoses).toHaveLength(1);
      expect(assessment.diagnoses[0].diagnosis.code).toBe('F32.1');
      expect(assessment.diagnoses[0].diagnosis.category).toBe(DSMCategory.DEPRESSIVE);
      expect(assessment.diagnoses[0].confidence).toBeGreaterThan(0.8);
      expect(assessment.riskAssessment).toBeDefined();
      expect(assessment.riskAssessment?.overallRisk).toBe(RiskLevel.MODERATE);
      expect(assessment.treatmentRecommendations).toBeDefined();
      expect(assessment.culturalFormulation).toBeDefined();
      expect(assessment.urgencyLevel).toBe(Urgency.EXPEDITED);

      // Step 4: Review cultural formulation
      expect(assessment.culturalFormulation?.culturalIdentity).toContain('Kikuyu');
      expect(assessment.culturalFormulation?.culturalConceptualizationOfDistress)
        .toContain('somatic');
      expect(assessment.culturalFormulation?.culturalFeaturesOfResilience)
        .toContain('family support');

      // Step 5: Verify treatment recommendations are culturally adapted
      const psychotherapyRec = assessment.treatmentRecommendations?.find(
        r => r.type === 'psychotherapy'
      );
      expect(psychotherapyRec?.culturalAdaptations).toContain('Include family in treatment');
      expect(psychotherapyRec?.languageConsiderations).toContain('Swahili');

      // Step 6: Create treatment plan
      const treatmentPlan = {
        patientId,
        assessmentId,
        primaryDiagnosis: assessment.diagnoses[0].diagnosis.code,
        treatmentGoals: [
          'Reduce depressive symptoms',
          'Improve sleep quality',
          'Enhance family relationships'
        ],
        interventions: assessment.treatmentRecommendations?.map(rec => ({
          type: rec.type,
          intervention: rec.intervention,
          frequency: rec.frequency,
          duration: rec.duration,
          culturalAdaptations: rec.culturalAdaptations
        })),
        followUpSchedule: {
          initialFollowUp: '1 week',
          regularFollowUps: '2 weeks',
          emergencyContact: true
        }
      };

      const treatmentResponse = await request(app)
        .post('/api/mental-health/treatment-plans')
        .set('Authorization', `Bearer ${authToken}`)
        .send(treatmentPlan)
        .expect(201);

      expect(treatmentResponse.body.data.id).toBeDefined();
      expect(treatmentResponse.body.data.status).toBe('active');

      // Step 7: Schedule follow-up appointment
      const followUpData = {
        patientId,
        treatmentPlanId: treatmentResponse.body.data.id,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        type: 'follow_up',
        priority: 'high',
        notes: 'Monitor depressive symptoms and medication compliance'
      };

      const appointmentResponse = await request(app)
        .post('/api/mental-health/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(followUpData)
        .expect(201);

      expect(appointmentResponse.body.data.id).toBeDefined();
      expect(appointmentResponse.body.data.status).toBe('scheduled');
    });

    it('should handle crisis intervention workflow', async () => {
      // High-risk assessment scenario
      const crisisAssessmentRequest: DSMAssessmentRequest = {
        symptoms: 'I have been thinking about ending my life. I have a specific plan and feel hopeless about the future.',
        language: 'en',
        demographicInfo: {
          age: 35,
          gender: 'M'
        },
        generateExplanation: true,
        includeRiskAssessment: true,
        includeTreatmentRecommendations: true
      };

      // Mock high-risk response
      mockWatsonxService.generatePrediction.mockImplementation((deploymentId) => {
        if (deploymentId.includes('risk-assessment')) {
          return Promise.resolve({
            predictions: [{
              probability: 0.95,
              values: [RiskLevel.IMMINENT, 'immediate_intervention_required']
            }]
          });
        }
        return Promise.resolve({
          predictions: [{
            probability: 0.92,
            values: ['F32.2', 'Major Depressive Disorder, Severe']
          }]
        });
      });

      const crisisResponse = await request(app)
        .post('/api/mental-health/assess')
        .set('Authorization', `Bearer ${authToken}`)
        .send(crisisAssessmentRequest)
        .expect(200);

      const crisisAssessment: DSMAssessmentResponse = crisisResponse.body.data;

      // Verify crisis detection
      expect(crisisAssessment.riskAssessment?.suicideRisk).toBe(RiskLevel.IMMINENT);
      expect(crisisAssessment.urgencyLevel).toBe(Urgency.EMERGENT);
      expect(crisisAssessment.followUpRecommended).toBe(true);

      // Verify crisis intervention recommendations
      const crisisIntervention = crisisAssessment.treatmentRecommendations?.find(
        r => r.type === 'crisis_intervention'
      );
      expect(crisisIntervention).toBeDefined();
      expect(crisisIntervention?.urgency).toBe(Urgency.EMERGENT);

      // Trigger automatic crisis protocol
      const crisisProtocolResponse = await request(app)
        .post('/api/mental-health/crisis-protocol')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: crisisAssessment.assessmentId,
          riskLevel: RiskLevel.IMMINENT,
          immediateActions: [
            'Contact emergency services',
            'Notify attending physician',
            'Implement safety plan'
          ]
        })
        .expect(200);

      expect(crisisProtocolResponse.body.data.status).toBe('activated');
      expect(crisisProtocolResponse.body.data.emergencyContacts).toBeDefined();
    });

    it('should support multilingual assessment workflow', async () => {
      // French language assessment
      const frenchAssessmentRequest: DSMAssessmentRequest = {
        symptoms: 'Je me sens très triste et anxieux depuis plusieurs semaines. J\'ai perdu l\'appétit et j\'ai du mal à dormir.',
        language: 'fr',
        culturalBackground: 'Francophone African',
        demographicInfo: {
          age: 32,
          gender: 'F',
          ethnicity: 'Senegalese'
        },
        generateExplanation: true,
        includeRiskAssessment: true,
        includeTreatmentRecommendations: true
      };

      const frenchResponse = await request(app)
        .post('/api/mental-health/assess')
        .set('Authorization', `Bearer ${authToken}`)
        .send(frenchAssessmentRequest)
        .expect(200);

      const frenchAssessment: DSMAssessmentResponse = frenchResponse.body.data;

      // Verify multilingual support
      expect(frenchAssessment.diagnoses).toHaveLength(1);
      expect(frenchAssessment.culturalFormulation?.culturalIdentity)
        .toContain('Francophone African');

      // Verify treatment recommendations include language considerations
      const recommendations = frenchAssessment.treatmentRecommendations;
      expect(recommendations?.some(r => 
        r.languageConsiderations?.includes('French')
      )).toBe(true);
    });

    it('should handle assessment history and progress tracking', async () => {
      // Get patient assessment history
      const historyResponse = await request(app)
        .get(`/api/mental-health/patients/${patientId}/assessments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(historyResponse.body.data.assessments).toBeInstanceOf(Array);
      expect(historyResponse.body.data.assessments.length).toBeGreaterThan(0);

      // Get specific assessment details
      const assessmentDetailResponse = await request(app)
        .get(`/api/mental-health/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(assessmentDetailResponse.body.data.id).toBe(assessmentId);
      expect(assessmentDetailResponse.body.data.diagnoses).toBeDefined();

      // Create progress note
      const progressNote = {
        patientId,
        assessmentId,
        clinicianId: 'clinician-123',
        sessionType: 'individual_therapy',
        sessionDate: new Date(),
        progressNotes: 'Patient shows improvement in mood. Sleep quality has increased. Family involvement has been positive.',
        riskAssessment: {
          currentRisk: RiskLevel.LOW,
          changes: 'Risk decreased from moderate to low',
          interventions: 'Continued therapy and family support'
        },
        nextSteps: [
          'Continue weekly therapy sessions',
          'Monitor medication compliance',
          'Schedule family session'
        ]
      };

      const progressResponse = await request(app)
        .post('/api/mental-health/progress-notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressNote)
        .expect(201);

      expect(progressResponse.body.data.id).toBeDefined();
      expect(progressResponse.body.data.riskAssessment.currentRisk).toBe(RiskLevel.LOW);
    });

    it('should generate comprehensive clinical reports', async () => {
      // Generate clinical summary report
      const reportRequest = {
        patientId,
        reportType: 'clinical_summary',
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date()
        },
        includeAssessments: true,
        includeTreatmentPlan: true,
        includeProgressNotes: true,
        includeCulturalFormulation: true
      };

      const reportResponse = await request(app)
        .post('/api/mental-health/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportRequest)
        .expect(200);

      const report = reportResponse.body.data;

      expect(report.patientId).toBe(patientId);
      expect(report.reportType).toBe('clinical_summary');
      expect(report.assessments).toBeDefined();
      expect(report.treatmentPlan).toBeDefined();
      expect(report.culturalFormulation).toBeDefined();
      expect(report.riskAssessmentHistory).toBeDefined();
      expect(report.treatmentProgress).toBeDefined();

      // Verify HIPAA compliance in report
      expect(report.complianceInfo).toBeDefined();
      expect(report.complianceInfo.hipaaCompliant).toBe(true);
      expect(report.complianceInfo.accessLog).toBeDefined();
    });
  });

  describe('Governance and Compliance Workflow', () => {
    it('should enforce governance rules throughout workflow', async () => {
      // Create bias detection rule
      const biasRule = {
        name: 'Gender Bias Detection - Mental Health',
        type: 'bias_detection',
        config: {
          protectedAttribute: 'gender',
          threshold: 0.85,
          blockOnFailure: false,
          alertOnViolation: true
        },
        moduleIds: ['mental-health']
      };

      await request(app)
        .post('/api/governance/rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(biasRule)
        .expect(201);

      // Perform assessment that should trigger governance checks
      const assessmentRequest: DSMAssessmentRequest = {
        symptoms: 'Anxiety and depression symptoms',
        language: 'en',
        demographicInfo: {
          age: 25,
          gender: 'F'
        },
        generateExplanation: true
      };

      const assessmentResponse = await request(app)
        .post('/api/mental-health/assess')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentRequest)
        .expect(200);

      // Verify governance results are included
      expect(assessmentResponse.body.data.governanceResults).toBeDefined();
      expect(assessmentResponse.body.data.governanceResults.length).toBeGreaterThan(0);

      // Check audit logs
      const auditResponse = await request(app)
        .get('/api/governance/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ module: 'mental-health', limit: 10 })
        .expect(200);

      expect(auditResponse.body.data.logs.length).toBeGreaterThan(0);
      expect(auditResponse.body.data.logs[0].action).toContain('mental-health');
    });

    it('should maintain HIPAA compliance throughout workflow', async () => {
      // Verify all patient data access is logged
      const patientAccessResponse = await request(app)
        .get(`/api/mental-health/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check that access was logged
      const auditResponse = await request(app)
        .get('/api/governance/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          action: 'patient_access',
          patientId: patientId,
          limit: 1
        })
        .expect(200);

      expect(auditResponse.body.data.logs.length).toBeGreaterThan(0);
      expect(auditResponse.body.data.logs[0].details.patientId).toBe(patientId);

      // Verify data encryption
      expect(patientAccessResponse.body.data.encryptionStatus).toBe('encrypted');
      expect(patientAccessResponse.body.data.complianceFlags.hipaa).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid symptom descriptions', async () => {
      const invalidRequest: DSMAssessmentRequest = {
        symptoms: '', // Empty symptoms
        language: 'en'
      };

      const response = await request(app)
        .post('/api/mental-health/assess')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle Watsonx service failures gracefully', async () => {
      // Mock service failure
      mockWatsonxService.generatePrediction.mockRejectedValue(
        new Error('Watsonx service temporarily unavailable')
      );

      const assessmentRequest: DSMAssessmentRequest = {
        symptoms: 'Test symptoms',
        language: 'en'
      };

      const response = await request(app)
        .post('/api/mental-health/assess')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentRequest)
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(response.body.error.message).toContain('temporarily unavailable');
    });

    it('should handle unsupported languages', async () => {
      const unsupportedLanguageRequest: DSMAssessmentRequest = {
        symptoms: 'Test symptoms',
        language: 'zh' as any // Unsupported language
      };

      const response = await request(app)
        .post('/api/mental-health/assess')
        .set('Authorization', `Bearer ${authToken}`)
        .send(unsupportedLanguageRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNSUPPORTED_LANGUAGE');
    });
  });
});