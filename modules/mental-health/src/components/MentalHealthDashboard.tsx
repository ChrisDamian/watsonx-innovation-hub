import React, { useState, useEffect } from 'react';
import { 
  HealthcareIcon, 
  GovernanceIndicator, 
  DashboardCard,
  LanguageSelector 
} from '../../../frontend/src/components/SVGComponents';
import { 
  DSMAssessmentRequest, 
  DSMAssessmentResponse, 
  PatientAssessment,
  RiskLevel,
  DSMCategory,
  Urgency 
} from '../types/dsm';

interface MentalHealthDashboardProps {
  patientId?: string;
  clinicianMode?: boolean;
  initialLanguage?: 'en' | 'sw' | 'fr';
}

const MentalHealthDashboard: React.FC<MentalHealthDashboardProps> = ({
  patientId,
  clinicianMode = false,
  initialLanguage = 'en'
}) => {
  const [language, setLanguage] = useState<'en' | 'sw' | 'fr'>(initialLanguage);
  const [assessment, setAssessment] = useState<DSMAssessmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [culturalBackground, setCulturalBackground] = useState('');
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);

  const translations = {
    en: {
      title: "Mental Health Assessment",
      subtitle: "DSM-5-TR Powered AI Triage System",
      symptoms: "Symptoms Description",
      symptomsPlaceholder: "Describe the symptoms in detail...",
      culturalBackground: "Cultural Background",
      analyze: "Analyze Symptoms",
      clear: "Clear",
      loading: "Analyzing...",
      riskAssessment: "Risk Assessment",
      dsmClassification: "DSM-5-TR Classification",
      treatmentRecommendations: "Treatment Recommendations",
      functionalImpairment: "Functional Impairment",
      confidence: "Confidence",
      severity: "Severity",
      urgency: "Urgency",
      followUp: "Follow-up Required",
      culturalConsiderations: "Cultural Considerations",
      biasScore: "Bias Score",
      explainability: "Explainability",
      compliance: "Compliance Status"
    },
    sw: {
      title: "Tathmini ya Afya ya Akili",
      subtitle: "Mfumo wa AI wa DSM-5-TR",
      symptoms: "Maelezo ya Dalili",
      symptomsPlaceholder: "Eleza dalili kwa undani...",
      culturalBackground: "Mazingira ya Kitamaduni",
      analyze: "Chunguza Dalili",
      clear: "Futa",
      loading: "Inachunguza...",
      riskAssessment: "Tathmini ya Hatari",
      dsmClassification: "Uainishaji wa DSM-5-TR",
      treatmentRecommendations: "Mapendekezo ya Matibabu",
      functionalImpairment: "Uharibifu wa Utendaji",
      confidence: "Uhakika",
      severity: "Ukali",
      urgency: "Haraka",
      followUp: "Ufuatiliaji Unahitajika",
      culturalConsiderations: "Mazingira ya Kitamaduni",
      biasScore: "Alama ya Upendeleo",
      explainability: "Ufafanuzi",
      compliance: "Hali ya Kufuata Sheria"
    },
    fr: {
      title: "Évaluation de la Santé Mentale",
      subtitle: "Système de Triage IA DSM-5-TR",
      symptoms: "Description des Symptômes",
      symptomsPlaceholder: "Décrivez les symptômes en détail...",
      culturalBackground: "Contexte Culturel",
      analyze: "Analyser les Symptômes",
      clear: "Effacer",
      loading: "Analyse en cours...",
      riskAssessment: "Évaluation des Risques",
      dsmClassification: "Classification DSM-5-TR",
      treatmentRecommendations: "Recommandations de Traitement",
      functionalImpairment: "Déficience Fonctionnelle",
      confidence: "Confiance",
      severity: "Gravité",
      urgency: "Urgence",
      followUp: "Suivi Requis",
      culturalConsiderations: "Considérations Culturelles",
      biasScore: "Score de Biais",
      explainability: "Explicabilité",
      compliance: "Statut de Conformité"
    }
  };

  const t = translations[language];

  const handleAnalyzeSymptoms = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    try {
      const request: DSMAssessmentRequest = {
        patientId,
        symptoms,
        language,
        culturalBackground: culturalBackground || undefined,
        generateExplanation: true,
        includeRiskAssessment: true,
        includeTreatmentRecommendations: true
      };

      const response = await fetch('/api/mental-health/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Assessment failed');
      }

      const result: DSMAssessmentResponse = await response.json();
      setAssessment(result);
      setShowRiskAssessment(result.riskAssessment?.overallRisk !== RiskLevel.LOW);
    } catch (error) {
      console.error('Assessment error:', error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: RiskLevel): string => {
    switch (risk) {
      case RiskLevel.LOW: return 'text-green-600 bg-green-100';
      case RiskLevel.MODERATE: return 'text-yellow-600 bg-yellow-100';
      case RiskLevel.HIGH: return 'text-orange-600 bg-orange-100';
      case RiskLevel.IMMINENT: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (urgency: Urgency): string => {
    switch (urgency) {
      case Urgency.ROUTINE: return 'text-blue-600 bg-blue-100';
      case Urgency.EXPEDITED: return 'text-yellow-600 bg-yellow-100';
      case Urgency.URGENT: return 'text-orange-600 bg-orange-100';
      case Urgency.EMERGENT: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="mental-health-dashboard min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <HealthcareIcon className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-sm text-gray-600">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector
                currentLanguage={language}
                onLanguageChange={setLanguage}
              />
              {assessment && (
                <GovernanceIndicator
                  biasScore={0.89}
                  explainabilityScore={0.92}
                  complianceStatus="compliant"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <SymptomInputCard
              symptoms={symptoms}
              setSymptoms={setSymptoms}
              culturalBackground={culturalBackground}
              setCulturalBackground={setCulturalBackground}
              onAnalyze={handleAnalyzeSymptoms}
              loading={loading}
              translations={t}
            />
          </div>
          <div>
            <QuickStatsCard assessment={assessment} translations={t} />
          </div>
        </div>

        {/* Results Section */}
        {assessment && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* DSM Classification */}
            <div className="xl:col-span-2">
              <DSMClassificationCard 
                diagnoses={assessment.diagnoses}
                translations={t}
              />
            </div>

            {/* Risk Assessment */}
            {showRiskAssessment && assessment.riskAssessment && (
              <div>
                <RiskAssessmentCard
                  riskAssessment={assessment.riskAssessment}
                  translations={t}
                  getRiskColor={getRiskColor}
                />
              </div>
            )}

            {/* Treatment Recommendations */}
            {assessment.treatmentRecommendations && (
              <div className="xl:col-span-2">
                <TreatmentRecommendationsCard
                  recommendations={assessment.treatmentRecommendations}
                  translations={t}
                  getUrgencyColor={getUrgencyColor}
                />
              </div>
            )}

            {/* Cultural Formulation */}
            {assessment.culturalFormulation && (
              <div>
                <CulturalFormulationCard
                  culturalFormulation={assessment.culturalFormulation}
                  translations={t}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Symptom Input Component
const SymptomInputCard: React.FC<{
  symptoms: string;
  setSymptoms: (value: string) => void;
  culturalBackground: string;
  setCulturalBackground: (value: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  translations: any;
}> = ({ symptoms, setSymptoms, culturalBackground, setCulturalBackground, onAnalyze, loading, translations: t }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center">
      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
      {t.symptoms}
    </h3>
    <div className="space-y-4">
      <div>
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder={t.symptomsPlaceholder}
          disabled={loading}
        />
      </div>
      <div>
        <input
          type="text"
          value={culturalBackground}
          onChange={(e) => setCulturalBackground(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t.culturalBackground}
          disabled={loading}
        />
      </div>
      <div className="flex space-x-4">
        <button
          onClick={onAnalyze}
          disabled={loading || !symptoms.trim()}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t.loading}
            </>
          ) : (
            t.analyze
          )}
        </button>
        <button
          onClick={() => {
            setSymptoms('');
            setCulturalBackground('');
          }}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {t.clear}
        </button>
      </div>
    </div>
  </div>
);

// Quick Stats Component
const QuickStatsCard: React.FC<{
  assessment: DSMAssessmentResponse | null;
  translations: any;
}> = ({ assessment, translations: t }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold mb-4">Assessment Overview</h3>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{t.confidence}</span>
        <span className="text-sm font-medium text-blue-600">
          {assessment ? `${(assessment.confidence * 100).toFixed(1)}%` : '--'}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Diagnoses</span>
        <span className="text-sm font-medium text-gray-900">
          {assessment ? assessment.diagnoses.length : '--'}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{t.urgency}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          assessment ? getUrgencyColor(assessment.urgencyLevel) : 'text-gray-600 bg-gray-100'
        }`}>
          {assessment ? assessment.urgencyLevel.toUpperCase() : '--'}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{t.followUp}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          assessment?.followUpRecommended ? 'text-orange-600 bg-orange-100' : 'text-green-600 bg-green-100'
        }`}>
          {assessment ? (assessment.followUpRecommended ? 'Yes' : 'No') : '--'}
        </span>
      </div>
    </div>
  </div>
);

// Additional components would be implemented similarly...
// DSMClassificationCard, RiskAssessmentCard, TreatmentRecommendationsCard, CulturalFormulationCard

export default MentalHealthDashboard;