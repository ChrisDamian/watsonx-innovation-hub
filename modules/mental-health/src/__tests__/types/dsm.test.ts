import {
  DSMDiagnosis,
  DSMVersion,
  DSMCategory,
  DSMSeverity,
  PatientAssessment,
  RiskLevel,
  DSMAssessmentRequest,
  DSMAssessmentResponse,
  CulturalFormulation,
  TreatmentType,
  Priority,
  Urgency
} from '../../types/dsm';

describe('DSM Types', () => {
  describe('DSMDiagnosis', () => {
    it('should create a valid DSM diagnosis', () => {
      const diagnosis: DSMDiagnosis = {
        id: 'dsm-001',
        code: 'F32.1',
        category: DSMCategory.DEPRESSIVE,
        name: 'Major Depressive Disorder, Moderate',
        description: 'A mood disorder characterized by persistent sadness',
        criteria: [
          {
            id: 'criteria-1',
            criterion: 'A',
            description: 'Depressed mood most of the day',
            required: true,
            timeframe: '2 weeks',
            exclusions: ['substance use'],
            culturalVariations: [
              {
                culture: 'East African',
                variation: 'May present as somatic complaints',
                prevalence: 0.15,
                notes: 'Cultural expression varies'
              }
            ]
          }
        ],
        severity: DSMSeverity.MODERATE,
        specifiers: [
          {
            type: 'severity',
            value: 'moderate',
            description: 'Moderate functional impairment'
          }
        ],
        culturalConsiderations: [
          {
            culture: 'Swahili-speaking',
            region: 'East Africa',
            language: 'sw',
            considerations: ['Somatic presentation common', 'Family involvement important'],
            prevalenceNotes: 'Lower reported prevalence due to stigma',
            expressionVariations: ['Physical complaints', 'Sleep disturbances'],
            stigmaFactors: ['Mental health stigma', 'Cultural shame']
          }
        ],
        version: DSMVersion.DSM_5_TR
      };

      expect(diagnosis.id).toBe('dsm-001');
      expect(diagnosis.code).toBe('F32.1');
      expect(diagnosis.category).toBe(DSMCategory.DEPRESSIVE);
      expect(diagnosis.severity).toBe(DSMSeverity.MODERATE);
      expect(diagnosis.version).toBe(DSMVersion.DSM_5_TR);
      expect(diagnosis.criteria).toHaveLength(1);
      expect(diagnosis.culturalConsiderations).toHaveLength(1);
    });

    it('should validate DSM category enum values', () => {
      const categories = Object.values(DSMCategory);
      
      expect(categories).toContain(DSMCategory.NEURODEVELOPMENTAL);
      expect(categories).toContain(DSMCategory.SCHIZOPHRENIA_SPECTRUM);
      expect(categories).toContain(DSMCategory.BIPOLAR);
      expect(categories).toContain(DSMCategory.DEPRESSIVE);
      expect(categories).toContain(DSMCategory.ANXIETY);
      expect(categories).toContain(DSMCategory.OCD_RELATED);
      expect(categories).toContain(DSMCategory.TRAUMA_STRESSOR);
    });

    it('should validate DSM version enum values', () => {
      const versions = Object.values(DSMVersion);
      
      expect(versions).toContain(DSMVersion.DSM_5);
      expect(versions).toContain(DSMVersion.DSM_5_TR);
      expect(versions).toContain(DSMVersion.ICD_11);
    });

    it('should validate DSM severity enum values', () => {
      const severities = Object.values(DSMSeverity);
      
      expect(severities).toContain(DSMSeverity.MILD);
      expect(severities).toContain(DSMSeverity.MODERATE);
      expect(severities).toContain(DSMSeverity.SEVERE);
      expect(severities).toContain(DSMSeverity.UNSPECIFIED);
    });
  });

  describe('PatientAssessment', () => {
    it('should create a valid patient assessment', () => {
      const assessment: PatientAssessment = {
        id: 'assessment-001',
        patientId: 'patient-123',
        assessmentDate: new Date('2024-01-15'),
        clinicianId: 'clinician-456',
        language: 'en',
        symptoms: [
          {
            id: 'symptom-1',
            description: 'Persistent sadness',
            severity: 'moderate',
            duration: '3 weeks',
            frequency: 'often',
            onset: new Date('2024-01-01'),
            triggers: ['work stress', 'relationship issues'],
            culturalExpression: 'Expressed as "heart heaviness"',
            language: 'en'
          }
        ],
        functionalImpairment: {
          social: 'moderate',
          occupational: 'severe',
          academic: 'none',
          interpersonal: 'mild',
          selfCare: 'mild',
          overall: 'moderate',
          description: 'Significant impact on work performance'
        },
        riskAssessment: {
          suicideRisk: RiskLevel.MODERATE,
          selfHarmRisk: RiskLevel.LOW,
          violenceRisk: RiskLevel.LOW,
          substanceUseRisk: RiskLevel.LOW,
          overallRisk: RiskLevel.MODERATE,
          riskFactors: ['social isolation', 'work stress'],
          protectiveFactors: ['family support', 'religious beliefs'],
          immediateInterventionRequired: false,
          riskMitigationPlan: ['regular check-ins', 'family involvement']
        },
        dsmDiagnoses: [],
        recommendations: [],
        followUpRequired: true,
        confidenceScore: 0.85,
        culturalContext: {
          primaryCulture: 'East African',
          religiousBackground: 'Christian',
          socioeconomicStatus: 'middle class',
          educationLevel: 'university',
          languageProficiency: [
            {
              language: 'en',
              proficiency: 'advanced',
              preferredForMentalHealth: true
            },
            {
              language: 'sw',
              proficiency: 'native',
              preferredForMentalHealth: false
            }
          ],
          familyStructure: 'nuclear family',
          communitySupport: 'moderate',
          culturalStressors: ['acculturation stress', 'family expectations'],
          culturalStrengths: ['strong family bonds', 'community support']
        }
      };

      expect(assessment.id).toBe('assessment-001');
      expect(assessment.patientId).toBe('patient-123');
      expect(assessment.language).toBe('en');
      expect(assessment.symptoms).toHaveLength(1);
      expect(assessment.riskAssessment.overallRisk).toBe(RiskLevel.MODERATE);
      expect(assessment.confidenceScore).toBe(0.85);
      expect(assessment.culturalContext?.primaryCulture).toBe('East African');
    });

    it('should validate risk level enum values', () => {
      const riskLevels = Object.values(RiskLevel);
      
      expect(riskLevels).toContain(RiskLevel.LOW);
      expect(riskLevels).toContain(RiskLevel.MODERATE);
      expect(riskLevels).toContain(RiskLevel.HIGH);
      expect(riskLevels).toContain(RiskLevel.IMMINENT);
    });
  });

  describe('DSMAssessmentRequest', () => {
    it('should create a valid assessment request', () => {
      const request: DSMAssessmentRequest = {
        patientId: 'patient-123',
        symptoms: 'Feeling sad and hopeless for the past 3 weeks',
        language: 'en',
        culturalBackground: 'East African',
        demographicInfo: {
          age: 28,
          gender: 'F',
          ethnicity: 'African',
          education: 'Bachelor\'s degree',
          occupation: 'Teacher',
          maritalStatus: 'Single',
          location: 'Nairobi, Kenya'
        },
        previousDiagnoses: ['anxiety disorder'],
        currentMedications: ['sertraline 50mg'],
        generateExplanation: true,
        includeRiskAssessment: true,
        includeTreatmentRecommendations: true
      };

      expect(request.patientId).toBe('patient-123');
      expect(request.language).toBe('en');
      expect(request.culturalBackground).toBe('East African');
      expect(request.demographicInfo?.age).toBe(28);
      expect(request.generateExplanation).toBe(true);
      expect(request.includeRiskAssessment).toBe(true);
      expect(request.includeTreatmentRecommendations).toBe(true);
    });

    it('should support different languages', () => {
      const englishRequest: DSMAssessmentRequest = {
        symptoms: 'Feeling depressed',
        language: 'en'
      };

      const swahiliRequest: DSMAssessmentRequest = {
        symptoms: 'Nahisi huzuni',
        language: 'sw'
      };

      const frenchRequest: DSMAssessmentRequest = {
        symptoms: 'Je me sens déprimé',
        language: 'fr'
      };

      expect(englishRequest.language).toBe('en');
      expect(swahiliRequest.language).toBe('sw');
      expect(frenchRequest.language).toBe('fr');
    });
  });

  describe('DSMAssessmentResponse', () => {
    it('should create a valid assessment response', () => {
      const response: DSMAssessmentResponse = {
        assessmentId: 'assessment-001',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        diagnoses: [
          {
            diagnosis: {
              id: 'dsm-001',
              code: 'F32.1',
              category: DSMCategory.DEPRESSIVE,
              name: 'Major Depressive Disorder, Moderate',
              description: 'Moderate depression',
              criteria: [],
              severity: DSMSeverity.MODERATE,
              version: DSMVersion.DSM_5_TR
            },
            confidence: 0.89,
            criteriaMatched: [
              {
                criteriaId: 'criteria-1',
                matched: true,
                confidence: 0.92,
                evidence: ['persistent sadness', 'loss of interest'],
                culturalContext: 'Expressed through somatic complaints'
              }
            ],
            severity: DSMSeverity.MODERATE,
            specifiers: [],
            explanation: {
              reasoning: 'Patient meets criteria for major depressive disorder',
              keySymptoms: ['persistent sadness', 'anhedonia', 'fatigue'],
              excludedDiagnoses: ['bipolar disorder', 'adjustment disorder'],
              uncertainties: ['duration of symptoms unclear'],
              recommendedAssessments: ['PHQ-9', 'clinical interview'],
              culturalConsiderations: ['Consider cultural expression of distress']
            }
          }
        ],
        confidence: 0.87,
        followUpRecommended: true,
        urgencyLevel: Urgency.ROUTINE,
        governanceResults: [
          {
            ruleId: 'bias-rule-1',
            ruleName: 'Gender Bias Detection',
            status: 'passed',
            details: 'No significant bias detected',
            timestamp: new Date(),
            impact: 'low'
          }
        ]
      };

      expect(response.assessmentId).toBe('assessment-001');
      expect(response.diagnoses).toHaveLength(1);
      expect(response.diagnoses[0].confidence).toBe(0.89);
      expect(response.confidence).toBe(0.87);
      expect(response.urgencyLevel).toBe(Urgency.ROUTINE);
      expect(response.governanceResults).toHaveLength(1);
    });

    it('should validate urgency enum values', () => {
      const urgencyLevels = Object.values(Urgency);
      
      expect(urgencyLevels).toContain(Urgency.ROUTINE);
      expect(urgencyLevels).toContain(Urgency.EXPEDITED);
      expect(urgencyLevels).toContain(Urgency.URGENT);
      expect(urgencyLevels).toContain(Urgency.EMERGENT);
    });
  });

  describe('CulturalFormulation', () => {
    it('should create a valid cultural formulation', () => {
      const culturalFormulation: CulturalFormulation = {
        culturalIdentity: 'East African, Kikuyu ethnic group, Christian',
        culturalConceptualizationOfDistress: 'Distress viewed as spiritual or physical rather than mental',
        psychosocialStressors: ['migration stress', 'economic hardship', 'family expectations'],
        culturalFeaturesOfVulnerability: ['stigma around mental health', 'language barriers'],
        culturalFeaturesOfResilience: ['strong family support', 'religious faith', 'community networks'],
        culturalAssessment: 'Patient\'s symptoms should be understood within cultural context of East African expression of distress'
      };

      expect(culturalFormulation.culturalIdentity).toContain('East African');
      expect(culturalFormulation.psychosocialStressors).toHaveLength(3);
      expect(culturalFormulation.culturalFeaturesOfResilience).toContain('strong family support');
    });
  });

  describe('TreatmentRecommendation', () => {
    it('should create valid treatment recommendations', () => {
      const psychotherapyRecommendation = {
        type: TreatmentType.PSYCHOTHERAPY,
        intervention: 'Cognitive Behavioral Therapy',
        priority: Priority.HIGH,
        urgency: Urgency.EXPEDITED,
        culturalAdaptations: ['Include family in treatment', 'Use culturally relevant examples'],
        languageConsiderations: ['Provide therapy in Swahili if preferred'],
        expectedOutcome: 'Reduction in depressive symptoms',
        duration: '12-16 sessions',
        frequency: 'Weekly'
      };

      const medicationRecommendation = {
        type: TreatmentType.MEDICATION,
        intervention: 'SSRI antidepressant',
        priority: Priority.MEDIUM,
        urgency: Urgency.ROUTINE,
        expectedOutcome: 'Symptom stabilization',
        duration: '6-12 months',
        frequency: 'Daily'
      };

      expect(psychotherapyRecommendation.type).toBe(TreatmentType.PSYCHOTHERAPY);
      expect(psychotherapyRecommendation.priority).toBe(Priority.HIGH);
      expect(psychotherapyRecommendation.culturalAdaptations).toHaveLength(2);

      expect(medicationRecommendation.type).toBe(TreatmentType.MEDICATION);
      expect(medicationRecommendation.urgency).toBe(Urgency.ROUTINE);
    });

    it('should validate treatment type enum values', () => {
      const treatmentTypes = Object.values(TreatmentType);
      
      expect(treatmentTypes).toContain(TreatmentType.PSYCHOTHERAPY);
      expect(treatmentTypes).toContain(TreatmentType.MEDICATION);
      expect(treatmentTypes).toContain(TreatmentType.PSYCHOSOCIAL);
      expect(treatmentTypes).toContain(TreatmentType.CRISIS_INTERVENTION);
      expect(treatmentTypes).toContain(TreatmentType.REFERRAL);
      expect(treatmentTypes).toContain(TreatmentType.MONITORING);
      expect(treatmentTypes).toContain(TreatmentType.EDUCATION);
    });

    it('should validate priority enum values', () => {
      const priorities = Object.values(Priority);
      
      expect(priorities).toContain(Priority.LOW);
      expect(priorities).toContain(Priority.MEDIUM);
      expect(priorities).toContain(Priority.HIGH);
      expect(priorities).toContain(Priority.URGENT);
    });
  });

  describe('Type Validation', () => {
    it('should enforce required fields', () => {
      // This test demonstrates TypeScript compile-time checking
      // In a real scenario, these would cause compilation errors
      
      const validDiagnosis: DSMDiagnosis = {
        id: 'test',
        code: 'F32.1',
        category: DSMCategory.DEPRESSIVE,
        name: 'Test Diagnosis',
        description: 'Test description',
        criteria: [],
        severity: DSMSeverity.MILD,
        version: DSMVersion.DSM_5_TR
      };

      expect(validDiagnosis.id).toBeDefined();
      expect(validDiagnosis.code).toBeDefined();
      expect(validDiagnosis.category).toBeDefined();
    });

    it('should support optional fields', () => {
      const minimalAssessmentRequest: DSMAssessmentRequest = {
        symptoms: 'Test symptoms',
        language: 'en'
      };

      const fullAssessmentRequest: DSMAssessmentRequest = {
        patientId: 'patient-123',
        symptoms: 'Test symptoms',
        language: 'en',
        culturalBackground: 'Test culture',
        demographicInfo: {
          age: 30,
          gender: 'F'
        },
        previousDiagnoses: ['test'],
        currentMedications: ['test'],
        generateExplanation: true,
        includeRiskAssessment: true,
        includeTreatmentRecommendations: true
      };

      expect(minimalAssessmentRequest.symptoms).toBeDefined();
      expect(minimalAssessmentRequest.patientId).toBeUndefined();
      
      expect(fullAssessmentRequest.symptoms).toBeDefined();
      expect(fullAssessmentRequest.patientId).toBeDefined();
    });
  });

  describe('Cultural Context Types', () => {
    it('should support comprehensive cultural context', () => {
      const culturalContext = {
        primaryCulture: 'Kikuyu',
        secondaryCultures: ['Kenyan', 'East African'],
        religiousBackground: 'Christian - Presbyterian',
        socioeconomicStatus: 'middle class',
        educationLevel: 'university graduate',
        languageProficiency: [
          {
            language: 'sw',
            proficiency: 'native' as const,
            preferredForMentalHealth: true
          },
          {
            language: 'en',
            proficiency: 'advanced' as const,
            preferredForMentalHealth: false
          }
        ],
        migrationHistory: {
          countryOfOrigin: 'Kenya',
          migrationDate: new Date('2020-01-01'),
          migrationReason: 'education',
          acculturationLevel: 'moderate' as const,
          acculturationStress: ['language barriers', 'cultural differences']
        },
        familyStructure: 'extended family',
        communitySupport: 'strong' as const,
        culturalStressors: ['discrimination', 'cultural identity conflicts'],
        culturalStrengths: ['community networks', 'cultural pride']
      };

      expect(culturalContext.primaryCulture).toBe('Kikuyu');
      expect(culturalContext.languageProficiency).toHaveLength(2);
      expect(culturalContext.migrationHistory?.acculturationLevel).toBe('moderate');
      expect(culturalContext.communitySupport).toBe('strong');
    });
  });
});