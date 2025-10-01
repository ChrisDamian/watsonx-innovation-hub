import React from 'react';

// Extract and create reusable SVG components based on the provided design
export const WatsonxLogo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="watsonxGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0f62fe" />
        <stop offset="100%" stopColor="#4589ff" />
      </linearGradient>
    </defs>
    <rect width="120" height="40" rx="8" fill="url(#watsonxGradient)" />
    <text x="60" y="25" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
      Watsonx Hub
    </text>
  </svg>
);

export const AfricanPattern: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="africanPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="3" fill="#f4a261" opacity="0.3" />
        <path d="M5,5 L15,15 M15,5 L5,15" stroke="#e76f51" strokeWidth="1" opacity="0.5" />
      </pattern>
    </defs>
    <rect width="100" height="100" fill="url(#africanPattern)" />
  </svg>
);

export const FinTechIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="finTechGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2e8b57" />
        <stop offset="100%" stopColor="#90ee90" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#finTechGradient)" opacity="0.1" />
    <path d="M20 24 L44 24 L44 48 L20 48 Z" fill="none" stroke="#2e8b57" strokeWidth="2" />
    <circle cx="32" cy="36" r="6" fill="#2e8b57" />
    <text x="32" y="40" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">$</text>
    <path d="M16 20 L48 20" stroke="#2e8b57" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const HealthcareIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#dc143c" />
        <stop offset="100%" stopColor="#ff6b6b" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#healthGradient)" opacity="0.1" />
    <path d="M32 16 L32 48 M16 32 L48 32" stroke="#dc143c" strokeWidth="4" strokeLinecap="round" />
    <circle cx="32" cy="32" r="12" fill="none" stroke="#dc143c" strokeWidth="2" />
  </svg>
);

export const MobilityIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mobilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4169e1" />
        <stop offset="100%" stopColor="#87ceeb" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#mobilityGradient)" opacity="0.1" />
    <path d="M16 32 Q32 16 48 32" fill="none" stroke="#4169e1" strokeWidth="3" strokeLinecap="round" />
    <circle cx="20" cy="36" r="4" fill="#4169e1" />
    <circle cx="44" cy="36" r="4" fill="#4169e1" />
    <path d="M16 36 L48 36" stroke="#4169e1" strokeWidth="2" />
  </svg>
);

export const AgricultureIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="agriGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#228b22" />
        <stop offset="100%" stopColor="#90ee90" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#agriGradient)" opacity="0.1" />
    <path d="M32 48 L32 24" stroke="#228b22" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 32 Q32 20 40 32" fill="#228b22" opacity="0.7" />
    <path d="M20 36 Q32 24 44 36" fill="#228b22" opacity="0.5" />
    <circle cx="32" cy="20" r="3" fill="#ffd700" />
  </svg>
);

export const EducationIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="eduGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff8c00" />
        <stop offset="100%" stopColor="#ffd700" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#eduGradient)" opacity="0.1" />
    <path d="M16 28 L32 20 L48 28 L32 36 Z" fill="#ff8c00" opacity="0.7" />
    <path d="M20 32 L20 42 L32 48 L44 42 L44 32" fill="none" stroke="#ff8c00" strokeWidth="2" />
    <circle cx="32" cy="16" r="2" fill="#ffd700" />
  </svg>
);

export const AviationIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="aviationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4682b4" />
        <stop offset="100%" stopColor="#87ceeb" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#aviationGradient)" opacity="0.1" />
    <path d="M16 32 L32 24 L48 32 L40 36 L32 32 L24 36 Z" fill="#4682b4" />
    <path d="M32 24 L32 40" stroke="#4682b4" strokeWidth="2" />
    <circle cx="32" cy="20" r="2" fill="#4682b4" />
  </svg>
);

export const CollaborationIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="collabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9370db" />
        <stop offset="100%" stopColor="#dda0dd" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#collabGradient)" opacity="0.1" />
    <circle cx="24" cy="28" r="6" fill="#9370db" opacity="0.7" />
    <circle cx="40" cy="28" r="6" fill="#9370db" opacity="0.7" />
    <circle cx="32" cy="40" r="6" fill="#9370db" opacity="0.7" />
    <path d="M24 28 L40 28 M28 34 L36 34" stroke="#9370db" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const DashboardCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
}> = ({ title, icon, value, change, changeType = 'neutral', className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {change && (
        <div className={`text-sm font-medium ${
          changeType === 'positive' ? 'text-green-600' : 
          changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
        }`}>
          {change}
        </div>
      )}
    </div>
  </div>
);

export const ModuleGrid: React.FC<{ className?: string }> = ({ className = "" }) => {
  const modules = [
    { name: 'FinTech', icon: <FinTechIcon />, path: '/fintech', color: 'bg-green-50 hover:bg-green-100' },
    { name: 'Healthcare', icon: <HealthcareIcon />, path: '/healthcare', color: 'bg-red-50 hover:bg-red-100' },
    { name: 'Mobility', icon: <MobilityIcon />, path: '/mobility', color: 'bg-blue-50 hover:bg-blue-100' },
    { name: 'Agriculture', icon: <AgricultureIcon />, path: '/agriculture', color: 'bg-green-50 hover:bg-green-100' },
    { name: 'Education', icon: <EducationIcon />, path: '/education', color: 'bg-orange-50 hover:bg-orange-100' },
    { name: 'Aviation', icon: <AviationIcon />, path: '/aviation', color: 'bg-blue-50 hover:bg-blue-100' },
    { name: 'Collaboration', icon: <CollaborationIcon />, path: '/collaboration', color: 'bg-purple-50 hover:bg-purple-100' }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {modules.map((module) => (
        <div
          key={module.name}
          className={`${module.color} rounded-lg p-6 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md`}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16">
              {module.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{module.name}</h3>
            <p className="text-sm text-gray-600 text-center">
              AI-powered solutions for {module.name.toLowerCase()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export const LanguageSelector: React.FC<{
  currentLanguage: 'en' | 'sw' | 'fr';
  onLanguageChange: (lang: 'en' | 'sw' | 'fr') => void;
  className?: string;
}> = ({ currentLanguage, onLanguageChange, className = "" }) => {
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value as 'en' | 'sw' | 'fr')}
        className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};

export const GovernanceIndicator: React.FC<{
  biasScore: number;
  explainabilityScore: number;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending';
  className?: string;
}> = ({ biasScore, explainabilityScore, complianceStatus, className = "" }) => {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'non_compliant': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 mb-3">Governance Status</h4>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Bias Score</span>
          <span className={`text-sm font-medium ${getScoreColor(biasScore)}`}>
            {(biasScore * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Explainability</span>
          <span className={`text-sm font-medium ${getScoreColor(explainabilityScore)}`}>
            {(explainabilityScore * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Compliance</span>
          <span className={`text-xs px-2 py-1 rounded-full ${getComplianceColor(complianceStatus)}`}>
            {complianceStatus.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};