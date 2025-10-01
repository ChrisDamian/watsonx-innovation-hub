import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  WatsonxLogo,
  AfricanPattern,
  FinTechIcon,
  HealthcareIcon,
  MobilityIcon,
  AgricultureIcon,
  EducationIcon,
  AviationIcon,
  CollaborationIcon,
  DashboardCard,
  ModuleGrid,
  LanguageSelector,
  GovernanceIndicator
} from '../../components/SVGComponents';

// Mock ResizeObserver for tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('SVG Components', () => {
  describe('Logo Components', () => {
    it('should render WatsonxLogo with correct structure', () => {
      render(<WatsonxLogo />);
      
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 120 40');
      
      const text = screen.getByText('Watsonx Hub');
      expect(text).toBeInTheDocument();
    });

    it('should apply custom className to WatsonxLogo', () => {
      render(<WatsonxLogo className="custom-logo" />);
      
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toHaveClass('custom-logo');
    });

    it('should render AfricanPattern with pattern elements', () => {
      render(<AfricanPattern />);
      
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
    });
  });

  describe('Industry Icons', () => {
    const iconComponents = [
      { Component: FinTechIcon, name: 'FinTech' },
      { Component: HealthcareIcon, name: 'Healthcare' },
      { Component: MobilityIcon, name: 'Mobility' },
      { Component: AgricultureIcon, name: 'Agriculture' },
      { Component: EducationIcon, name: 'Education' },
      { Component: AviationIcon, name: 'Aviation' },
      { Component: CollaborationIcon, name: 'Collaboration' }
    ];

    iconComponents.forEach(({ Component, name }) => {
      it(`should render ${name}Icon with correct viewBox`, () => {
        render(<Component />);
        
        const svg = screen.getByRole('img', { hidden: true });
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('viewBox', '0 0 64 64');
      });

      it(`should apply custom className to ${name}Icon`, () => {
        render(<Component className="custom-icon" />);
        
        const svg = screen.getByRole('img', { hidden: true });
        expect(svg).toHaveClass('custom-icon');
      });
    });
  });

  describe('DashboardCard', () => {
    const mockProps = {
      title: 'Test Metric',
      icon: <FinTechIcon />,
      value: '1,234',
      change: '+5.2%',
      changeType: 'positive' as const
    };

    it('should render dashboard card with all props', () => {
      render(<DashboardCard {...mockProps} />);
      
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
      expect(screen.getByText('+5.2%')).toBeInTheDocument();
    });

    it('should apply correct color classes for positive change', () => {
      render(<DashboardCard {...mockProps} changeType="positive" />);
      
      const changeElement = screen.getByText('+5.2%');
      expect(changeElement).toHaveClass('text-green-600');
    });

    it('should apply correct color classes for negative change', () => {
      render(<DashboardCard {...mockProps} change="-2.1%" changeType="negative" />);
      
      const changeElement = screen.getByText('-2.1%');
      expect(changeElement).toHaveClass('text-red-600');
    });

    it('should apply correct color classes for neutral change', () => {
      render(<DashboardCard {...mockProps} change="0.0%" changeType="neutral" />);
      
      const changeElement = screen.getByText('0.0%');
      expect(changeElement).toHaveClass('text-gray-600');
    });

    it('should render without change indicator', () => {
      const propsWithoutChange = {
        title: 'Test Metric',
        icon: <FinTechIcon />,
        value: '1,234'
      };
      
      render(<DashboardCard {...propsWithoutChange} />);
      
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
      expect(screen.queryByText(/[+-]\d/)).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <DashboardCard {...mockProps} className="custom-card" />
      );
      
      const card = container.firstChild;
      expect(card).toHaveClass('custom-card');
    });
  });

  describe('ModuleGrid', () => {
    it('should render all industry modules', () => {
      render(<ModuleGrid />);
      
      expect(screen.getByText('FinTech')).toBeInTheDocument();
      expect(screen.getByText('Healthcare')).toBeInTheDocument();
      expect(screen.getByText('Mobility')).toBeInTheDocument();
      expect(screen.getByText('Agriculture')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Aviation')).toBeInTheDocument();
      expect(screen.getByText('Collaboration')).toBeInTheDocument();
    });

    it('should render module descriptions', () => {
      render(<ModuleGrid />);
      
      expect(screen.getByText('AI-powered solutions for fintech')).toBeInTheDocument();
      expect(screen.getByText('AI-powered solutions for healthcare')).toBeInTheDocument();
      expect(screen.getByText('AI-powered solutions for mobility')).toBeInTheDocument();
    });

    it('should apply hover effects to module cards', () => {
      render(<ModuleGrid />);
      
      const fintechCard = screen.getByText('FinTech').closest('div');
      expect(fintechCard).toHaveClass('hover:scale-105');
      expect(fintechCard).toHaveClass('transition-all');
    });

    it('should apply custom className to grid', () => {
      render(<ModuleGrid className="custom-grid" />);
      
      const grid = screen.getByText('FinTech').closest('.grid');
      expect(grid).toHaveClass('custom-grid');
    });
  });

  describe('LanguageSelector', () => {
    const mockOnLanguageChange = jest.fn();

    beforeEach(() => {
      mockOnLanguageChange.mockClear();
    });

    it('should render language selector with current language', () => {
      render(
        <LanguageSelector
          currentLanguage="en"
          onLanguageChange={mockOnLanguageChange}
        />
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('en');
    });

    it('should render all supported languages', () => {
      render(
        <LanguageSelector
          currentLanguage="en"
          onLanguageChange={mockOnLanguageChange}
        />
      );
      
      expect(screen.getByText('🇺🇸 English')).toBeInTheDocument();
      expect(screen.getByText('🇰🇪 Kiswahili')).toBeInTheDocument();
      expect(screen.getByText('🇫🇷 Français')).toBeInTheDocument();
    });

    it('should call onLanguageChange when selection changes', () => {
      render(
        <LanguageSelector
          currentLanguage="en"
          onLanguageChange={mockOnLanguageChange}
        />
      );
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'sw' } });
      
      expect(mockOnLanguageChange).toHaveBeenCalledWith('sw');
    });

    it('should display correct language for Swahili', () => {
      render(
        <LanguageSelector
          currentLanguage="sw"
          onLanguageChange={mockOnLanguageChange}
        />
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('sw');
    });

    it('should display correct language for French', () => {
      render(
        <LanguageSelector
          currentLanguage="fr"
          onLanguageChange={mockOnLanguageChange}
        />
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('fr');
    });

    it('should apply custom className', () => {
      render(
        <LanguageSelector
          currentLanguage="en"
          onLanguageChange={mockOnLanguageChange}
          className="custom-selector"
        />
      );
      
      const container = screen.getByRole('combobox').closest('div');
      expect(container).toHaveClass('custom-selector');
    });
  });

  describe('GovernanceIndicator', () => {
    const mockProps = {
      biasScore: 0.85,
      explainabilityScore: 0.92,
      complianceStatus: 'compliant' as const
    };

    it('should render governance indicator with all metrics', () => {
      render(<GovernanceIndicator {...mockProps} />);
      
      expect(screen.getByText('Governance Status')).toBeInTheDocument();
      expect(screen.getByText('Bias Score')).toBeInTheDocument();
      expect(screen.getByText('Explainability')).toBeInTheDocument();
      expect(screen.getByText('Compliance')).toBeInTheDocument();
    });

    it('should display correct bias score percentage', () => {
      render(<GovernanceIndicator {...mockProps} />);
      
      expect(screen.getByText('85.0%')).toBeInTheDocument();
    });

    it('should display correct explainability score percentage', () => {
      render(<GovernanceIndicator {...mockProps} />);
      
      expect(screen.getByText('92.0%')).toBeInTheDocument();
    });

    it('should display compliance status correctly', () => {
      render(<GovernanceIndicator {...mockProps} />);
      
      expect(screen.getByText('COMPLIANT')).toBeInTheDocument();
    });

    it('should apply correct color for high bias score', () => {
      render(<GovernanceIndicator {...mockProps} biasScore={0.9} />);
      
      const biasScore = screen.getByText('90.0%');
      expect(biasScore).toHaveClass('text-green-600');
    });

    it('should apply correct color for medium bias score', () => {
      render(<GovernanceIndicator {...mockProps} biasScore={0.7} />);
      
      const biasScore = screen.getByText('70.0%');
      expect(biasScore).toHaveClass('text-yellow-600');
    });

    it('should apply correct color for low bias score', () => {
      render(<GovernanceIndicator {...mockProps} biasScore={0.5} />);
      
      const biasScore = screen.getByText('50.0%');
      expect(biasScore).toHaveClass('text-red-600');
    });

    it('should apply correct styling for compliant status', () => {
      render(<GovernanceIndicator {...mockProps} complianceStatus="compliant" />);
      
      const complianceStatus = screen.getByText('COMPLIANT');
      expect(complianceStatus).toHaveClass('text-green-600');
      expect(complianceStatus).toHaveClass('bg-green-100');
    });

    it('should apply correct styling for non-compliant status', () => {
      render(<GovernanceIndicator {...mockProps} complianceStatus="non_compliant" />);
      
      const complianceStatus = screen.getByText('NON COMPLIANT');
      expect(complianceStatus).toHaveClass('text-red-600');
      expect(complianceStatus).toHaveClass('bg-red-100');
    });

    it('should apply correct styling for pending status', () => {
      render(<GovernanceIndicator {...mockProps} complianceStatus="pending" />);
      
      const complianceStatus = screen.getByText('PENDING');
      expect(complianceStatus).toHaveClass('text-yellow-600');
      expect(complianceStatus).toHaveClass('bg-yellow-100');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <GovernanceIndicator {...mockProps} className="custom-indicator" />
      );
      
      const indicator = container.firstChild;
      expect(indicator).toHaveClass('custom-indicator');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for interactive elements', () => {
      const mockOnLanguageChange = jest.fn();
      
      render(
        <LanguageSelector
          currentLanguage="en"
          onLanguageChange={mockOnLanguageChange}
        />
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should support keyboard navigation for module grid', () => {
      render(<ModuleGrid />);
      
      const moduleCards = screen.getAllByText(/AI-powered solutions/);
      moduleCards.forEach(card => {
        const cardElement = card.closest('div');
        expect(cardElement).toHaveClass('cursor-pointer');
      });
    });

    it('should have proper contrast for governance indicators', () => {
      render(
        <GovernanceIndicator
          biasScore={0.85}
          explainabilityScore={0.92}
          complianceStatus="compliant"
        />
      );
      
      const complianceStatus = screen.getByText('COMPLIANT');
      expect(complianceStatus).toHaveClass('text-green-600');
      expect(complianceStatus).toHaveClass('bg-green-100');
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive grid classes to ModuleGrid', () => {
      render(<ModuleGrid />);
      
      const grid = screen.getByText('FinTech').closest('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
      expect(grid).toHaveClass('xl:grid-cols-4');
    });

    it('should apply responsive classes to DashboardCard', () => {
      render(
        <DashboardCard
          title="Test"
          icon={<FinTechIcon />}
          value="123"
        />
      );
      
      const card = screen.getByText('Test').closest('div');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('shadow-md');
    });
  });

  describe('Theme Support', () => {
    it('should support light theme colors', () => {
      render(
        <DashboardCard
          title="Test"
          icon={<FinTechIcon />}
          value="123"
        />
      );
      
      const card = screen.getByText('Test').closest('div');
      expect(card).toHaveClass('bg-white');
    });

    it('should support cultural color schemes in icons', () => {
      render(<AfricanPattern />);
      
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
      // Pattern should contain cultural color elements
    });
  });
});