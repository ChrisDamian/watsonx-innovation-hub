# Watsonx Model Training Guide

## Overview

This guide provides comprehensive instructions for training, connecting, and testing Watsonx models across all industry modules in the Innovation Hub.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Watsonx Setup](#watsonx-setup)
3. [Model Training by Industry](#model-training-by-industry)
4. [Connection Integration](#connection-integration)
5. [Testing Framework](#testing-framework)
6. [Deployment and Monitoring](#deployment-and-monitoring)

## Prerequisites

### Required Accounts and Access
- IBM Cloud account with Watsonx access
- Watsonx.ai project with appropriate permissions
- Watsonx.data catalog access
- Watsonx.governance instance

### Development Environment
```bash
# Install required dependencies
npm install @ibm-cloud/watsonx-ai
npm install ibm-watson
npm install @ibm-cloud/platform-services

# Install Python dependencies for training scripts
pip install ibm-watson-machine-learning
pip install pandas numpy scikit-learn
pip install transformers torch
```

### Environment Configuration
```bash
# Core Watsonx Configuration
export WATSONX_API_KEY="your_api_key"
export WATSONX_PROJECT_ID="your_project_id"
export WATSONX_URL="https://us-south.ml.cloud.ibm.com"
export WATSONX_REGION="us-south"

# Service-specific URLs
export WATSONX_AI_URL="https://us-south.ml.cloud.ibm.com/ml/v4"
export WATSONX_DATA_URL="https://us-south.lakehouse.cloud.ibm.com"
export WATSONX_GOVERNANCE_URL="https://us-south.aiopenscale.cloud.ibm.com"
```## Watso
nx Setup

### 1. Project Initialization

```bash
# Create Watsonx project setup script
./scripts/setup-watsonx-project.sh
```

### 2. Data Catalog Configuration

```python
# scripts/setup-data-catalog.py
from ibm_watson_machine_learning import APIClient
import pandas as pd

def setup_data_catalog():
    wml_credentials = {
        "url": "https://us-south.ml.cloud.ibm.com",
        "apikey": "your_api_key"
    }
    
    client = APIClient(wml_credentials)
    client.set.default_project("your_project_id")
    
    # Create data catalog structure
    catalog_structure = {
        "fintech": ["credit_scoring", "fraud_detection", "kyc_compliance"],
        "mental_health": ["dsm_classification", "risk_assessment", "triage"],
        "mobility": ["demand_forecasting", "route_optimization", "traffic_prediction"],
        "healthcare": ["symptom_classification", "drug_interactions", "diagnosis_support"],
        "agriculture": ["yield_prediction", "crop_monitoring", "weather_analysis"],
        "education": ["learning_analytics", "skill_assessment", "adaptive_learning"],
        "aviation": ["safety_monitoring", "maintenance_prediction", "flight_optimization"],
        "collaboration": ["meeting_summarization", "translation", "sentiment_analysis"]
    }
    
    return catalog_structure
```

### 3. Foundation Model Access

```python
# List available foundation models
def list_foundation_models():
    from ibm_watsonx_ai.foundation_models import ModelInference
    
    model_inference = ModelInference(
        model_id="ibm/granite-13b-instruct-v2",
        credentials=wml_credentials,
        project_id="your_project_id"
    )
    
    available_models = [
        "ibm/granite-13b-instruct-v2",
        "meta-llama/llama-2-70b-chat",
        "google/flan-t5-xxl",
        "bigscience/bloom",
        "eleutherai/gpt-j-6b"
    ]
    
    return available_models
```