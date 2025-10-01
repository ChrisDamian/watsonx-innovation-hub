#!/bin/bash

# =============================================================================
# WATSONX PROJECT SETUP SCRIPT
# =============================================================================
# This script sets up a complete Watsonx project with all required components
# for the Innovation Hub across all industry modules
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${1}${2}${NC}"
}

print_section() {
    echo ""
    print_status $BLUE "=============================================="
    print_status $BLUE "$1"
    print_status $BLUE "=============================================="
}

# Check prerequisites
check_prerequisites() {
    print_section "🔍 CHECKING PREREQUISITES"
    
    # Check IBM Cloud CLI
    if ! command -v ibmcloud &> /dev/null; then
        print_status $RED "❌ IBM Cloud CLI not found. Please install it first."
        print_status $YELLOW "   Install from: https://cloud.ibm.com/docs/cli"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_status $RED "❌ Python 3 not found. Please install Python 3.8+."
        exit 1
    fi
    
    # Check required environment variables
    if [ -z "$WATSONX_API_KEY" ]; then
        print_status $RED "❌ WATSONX_API_KEY environment variable not set"
        exit 1
    fi
    
    print_status $GREEN "✅ Prerequisites check passed"
}

# Login to IBM Cloud
login_ibm_cloud() {
    print_section "🔐 IBM CLOUD LOGIN"
    
    print_status $BLUE "Logging into IBM Cloud..."
    ibmcloud login --apikey $WATSONX_API_KEY
    
    # Target resource group
    print_status $BLUE "Targeting resource group..."
    ibmcloud target -g Default
    
    print_status $GREEN "✅ IBM Cloud login successful"
}

# Create Watsonx services
create_watsonx_services() {
    print_section "🚀 CREATING WATSONX SERVICES"
    
    # Create Watson Machine Learning service
    print_status $BLUE "Creating Watson Machine Learning service..."
    ibmcloud resource service-instance-create watsonx-ml-instance watsonmachinelearning lite us-south || {
        print_status $YELLOW "⚠️  Service may already exist, continuing..."
    }
    
    # Create Watson Studio service
    print_status $BLUE "Creating Watson Studio service..."
    ibmcloud resource service-instance-create watsonx-studio-instance data-science-experience lite us-south || {
        print_status $YELLOW "⚠️  Service may already exist, continuing..."
    }
    
    # Create Cloud Object Storage
    print_status $BLUE "Creating Cloud Object Storage..."
    ibmcloud resource service-instance-create watsonx-cos-instance cloud-object-storage lite global || {
        print_status $YELLOW "⚠️  Service may already exist, continuing..."
    }
    
    print_status $GREEN "✅ Watsonx services created"
}

# Setup project structure
setup_project_structure() {
    print_section "📁 SETTING UP PROJECT STRUCTURE"
    
    # Create directories for training data and models
    mkdir -p data/training/{fintech,mental-health,mobility,healthcare,agriculture,education,aviation,collaboration}
    mkdir -p models/{fintech,mental-health,mobility,healthcare,agriculture,education,aviation,collaboration}
    mkdir -p scripts/training/{fintech,mental-health,mobility,healthcare,agriculture,education,aviation,collaboration}
    mkdir -p tests/models/{fintech,mental-health,mobility,healthcare,education,aviation,collaboration}
    
    print_status $GREEN "✅ Project structure created"
}

# Install Python dependencies
install_python_dependencies() {
    print_section "🐍 INSTALLING PYTHON DEPENDENCIES"
    
    cat > requirements-watsonx.txt << 'EOF'
ibm-watson-machine-learning>=1.0.335
ibm-watsonx-ai>=0.2.6
pandas>=1.5.0
numpy>=1.21.0
scikit-learn>=1.1.0
transformers>=4.21.0
torch>=1.12.0
datasets>=2.5.0
accelerate>=0.12.0
evaluate>=0.2.0
seaborn>=0.11.0
matplotlib>=3.5.0
jupyter>=1.0.0
notebook>=6.4.0
ipywidgets>=7.7.0
plotly>=5.10.0
kaleido>=0.2.1
EOF
    
    print_status $BLUE "Installing Python dependencies..."
    pip install -r requirements-watsonx.txt
    
    print_status $GREEN "✅ Python dependencies installed"
}

# Create training configuration
create_training_config() {
    print_section "⚙️  CREATING TRAINING CONFIGURATION"
    
    cat > config/watsonx-training-config.json << 'EOF'
{
  "watsonx": {
    "credentials": {
      "url": "https://us-south.ml.cloud.ibm.com",
      "apikey": "${WATSONX_API_KEY}"
    },
    "project_id": "${WATSONX_PROJECT_ID}",
    "region": "us-south"
  },
  "training": {
    "batch_size": 16,
    "learning_rate": 2e-5,
    "epochs": 3,
    "max_length": 512,
    "validation_split": 0.2,
    "test_split": 0.1
  },
  "models": {
    "fintech": {
      "credit_scoring": {
        "base_model": "ibm/granite-13b-instruct-v2",
        "task_type": "classification",
        "num_labels": 3
      },
      "fraud_detection": {
        "base_model": "ibm/granite-13b-instruct-v2",
        "task_type": "classification",
        "num_labels": 2
      }
    },
    "mental_health": {
      "dsm_classification": {
        "base_model": "clinical-bert-base",
        "task_type": "multi_label_classification",
        "num_labels": 22
      },
      "risk_assessment": {
        "base_model": "mental-health-bert",
        "task_type": "regression",
        "output_range": [0, 1]
      }
    },
    "mobility": {
      "demand_forecasting": {
        "base_model": "time-series-transformer",
        "task_type": "regression",
        "sequence_length": 168
      }
    },
    "healthcare": {
      "symptom_classification": {
        "base_model": "bio-clinical-bert",
        "task_type": "multi_label_classification",
        "num_labels": 50
      }
    },
    "agriculture": {
      "yield_prediction": {
        "base_model": "tabular-transformer",
        "task_type": "regression",
        "features": ["weather", "soil", "crop_type"]
      }
    },
    "education": {
      "learning_analytics": {
        "base_model": "educational-bert",
        "task_type": "classification",
        "num_labels": 5
      }
    },
    "aviation": {
      "safety_monitoring": {
        "base_model": "technical-bert",
        "task_type": "anomaly_detection",
        "threshold": 0.8
      }
    },
    "collaboration": {
      "meeting_summarization": {
        "base_model": "summarization-t5",
        "task_type": "text_generation",
        "max_output_length": 256
      }
    }
  }
}
EOF
    
    print_status $GREEN "✅ Training configuration created"
}

# Main execution
main() {
    print_status $BLUE "🚀 Watsonx Project Setup"
    print_status $BLUE "========================"
    
    check_prerequisites
    login_ibm_cloud
    create_watsonx_services
    setup_project_structure
    install_python_dependencies
    create_training_config
    
    print_status $GREEN "🎉 Watsonx project setup complete!"
    print_status $YELLOW "Next steps:"
    print_status $YELLOW "1. Run training scripts for each industry module"
    print_status $YELLOW "2. Deploy models to Watsonx.ai"
    print_status $YELLOW "3. Test model endpoints"
    print_status $YELLOW "4. Configure governance and monitoring"
}

main "$@"