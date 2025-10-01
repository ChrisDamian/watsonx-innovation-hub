#!/usr/bin/env python3
"""
FinTech Credit Scoring Model Training Script
==========================================

This script trains credit scoring models for the FinTech module with
bias detection and explainability features.
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# IBM Watsonx imports
from ibm_watson_machine_learning import APIClient
from ibm_watsonx_ai.foundation_models import ModelInference

# ML imports
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.inspection import permutation_importance
import shap

class CreditScoringTrainer:
    """Credit Scoring Model Training Class"""
    
    def __init__(self, config_path: str = "config/watsonx-training-config.json"):
        """Initialize the credit scoring trainer"""
        self.config = self.load_config(config_path)
        self.setup_watsonx_client()
        self.setup_directories()
        
    def load_config(self, config_path: str) -> Dict:
        """Load training configuration"""
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        # Replace environment variables
        config_str = json.dumps(config)
        for env_var in ['WATSONX_API_KEY', 'WATSONX_PROJECT_ID']:
            if env_var in os.environ:
                config_str = config_str.replace(f"${{{env_var}}}", os.environ[env_var])
        
        return json.loads(config_str)
    
    def setup_watsonx_client(self):
        """Setup Watsonx API client"""
        self.wml_credentials = self.config['watsonx']['credentials']
        self.project_id = self.config['watsonx']['project_id']
        
        self.client = APIClient(self.wml_credentials)
        self.client.set.default_project(self.project_id)
        
        print("✅ Watsonx client initialized")
    
    def setup_directories(self):
        """Create necessary directories"""
        directories = [
            "data/training/fintech",
            "models/fintech",
            "logs/training",
            "results/fintech"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    def load_credit_dataset(self, dataset_path: str) -> pd.DataFrame:
        """Load and preprocess credit scoring dataset"""
        print(f"💳 Loading credit dataset from {dataset_path}")
        
        # Load dataset
        df = pd.read_csv(dataset_path)
        
        # Validate required columns
        required_columns = ['age', 'income', 'credit_history', 'loan_amount', 'employment_years', 'default_risk']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Clean and preprocess
        df = df.dropna()
        
        # Feature engineering
        df['debt_to_income'] = df['loan_amount'] / df['income']
        df['age_group'] = pd.cut(df['age'], bins=[0, 25, 35, 50, 100], labels=['young', 'adult', 'middle', 'senior'])
        df['income_bracket'] = pd.qcut(df['income'], q=5, labels=['low', 'low_mid', 'mid', 'mid_high', 'high'])
        
        print(f"✅ Dataset loaded: {len(df)} samples")
        print(f"   Features: {df.columns.tolist()}")
        print(f"   Target distribution: {df['default_risk'].value_counts().to_dict()}")
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare features for training"""
        print("🔧 Preparing features...")
        
        # Define feature columns
        numerical_features = ['age', 'income', 'loan_amount', 'employment_years', 'debt_to_income']
        categorical_features = ['credit_history', 'age_group', 'income_bracket']
        
        # Handle categorical variables
        df_processed = df.copy()
        for col in categorical_features:
            if col in df_processed.columns:
                df_processed[col] = LabelEncoder().fit_transform(df_processed[col])
        
        # Select features
        feature_columns = numerical_features + categorical_features
        X = df_processed[feature_columns]
        y = df_processed['default_risk']
        
        # Encode target if string
        if y.dtype == 'object':
            label_encoder = LabelEncoder()
            y = label_encoder.fit_transform(y)
        
        print(f"✅ Features prepared: {X.shape}")
        
        return X, y
    
    def train_credit_models(self, X_train: pd.DataFrame, y_train: pd.Series,
                          X_val: pd.DataFrame, y_val: pd.Series) -> Dict:
        """Train multiple credit scoring models"""
        print("💰 Training credit scoring models...")
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_val_scaled = scaler.transform(X_val)
        
        # Define models
        models = {
            'logistic_regression': LogisticRegression(random_state=42, max_iter=1000),
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingClassifier(n_estimators=100, random_state=42)
        }
        
        trained_models = {}
        model_performances = {}
        
        for name, model in models.items():
            print(f"   Training {name}...")
            
            # Train model
            if name == 'logistic_regression':
                model.fit(X_train_scaled, y_train)
                val_pred = model.predict(X_val_scaled)
                val_proba = model.predict_proba(X_val_scaled)[:, 1]
            else:
                model.fit(X_train, y_train)
                val_pred = model.predict(X_val)
                val_proba = model.predict_proba(X_val)[:, 1]
            
            # Evaluate
            accuracy = (val_pred == y_val).mean()
            auc_score = roc_auc_score(y_val, val_proba)
            
            trained_models[name] = {
                'model': model,
                'scaler': scaler if name == 'logistic_regression' else None
            }
            
            model_performances[name] = {
                'accuracy': accuracy,
                'auc_score': auc_score
            }
            
            print(f"     Accuracy: {accuracy:.3f}, AUC: {auc_score:.3f}")
        
        # Select best model
        best_model_name = max(model_performances.keys(), 
                            key=lambda x: model_performances[x]['auc_score'])
        
        print(f"✅ Best model: {best_model_name}")
        
        return {
            'models': trained_models,
            'performances': model_performances,
            'best_model': best_model_name,
            'feature_names': X_train.columns.tolist()
        }
    
    def analyze_bias(self, model_results: Dict, X_test: pd.DataFrame, 
                    y_test: pd.Series, df_test: pd.DataFrame) -> Dict:
        """Analyze model bias across protected attributes"""
        print("⚖️ Analyzing model bias...")
        
        best_model_name = model_results['best_model']
        model_info = model_results['models'][best_model_name]
        model = model_info['model']
        scaler = model_info['scaler']
        
        # Make predictions
        if scaler:
            X_test_processed = scaler.transform(X_test)
        else:
            X_test_processed = X_test
        
        predictions = model.predict(X_test_processed)
        probabilities = model.predict_proba(X_test_processed)[:, 1]
        
        bias_analysis = {}
        
        # Analyze by age group
        if 'age' in df_test.columns:
            age_groups = pd.cut(df_test['age'], bins=[0, 30, 50, 100], labels=['young', 'middle', 'senior'])
            
            for group in age_groups.unique():
                if pd.notna(group):
                    group_mask = age_groups == group
                    group_approval_rate = (predictions[group_mask] == 0).mean()  # Assuming 0 is approval
                    
                    bias_analysis[f'age_{group}'] = {
                        'approval_rate': float(group_approval_rate),
                        'sample_size': int(group_mask.sum()),
                        'avg_probability': float(probabilities[group_mask].mean())
                    }
        
        # Analyze by income bracket
        if 'income' in df_test.columns:
            income_quartiles = pd.qcut(df_test['income'], q=4, labels=['Q1', 'Q2', 'Q3', 'Q4'])
            
            for quartile in income_quartiles.unique():
                if pd.notna(quartile):
                    quartile_mask = income_quartiles == quartile
                    quartile_approval_rate = (predictions[quartile_mask] == 0).mean()
                    
                    bias_analysis[f'income_{quartile}'] = {
                        'approval_rate': float(quartile_approval_rate),
                        'sample_size': int(quartile_mask.sum()),
                        'avg_probability': float(probabilities[quartile_mask].mean())
                    }
        
        # Calculate demographic parity
        approval_rates = [info['approval_rate'] for info in bias_analysis.values()]
        if approval_rates:
            demographic_parity = max(approval_rates) - min(approval_rates)
            bias_analysis['demographic_parity_difference'] = float(demographic_parity)
        
        print(f"✅ Bias analysis complete")
        print(f"   Demographic parity difference: {bias_analysis.get('demographic_parity_difference', 'N/A')}")
        
        return bias_analysis
    
    def generate_explanations(self, model_results: Dict, X_test: pd.DataFrame) -> Dict:
        """Generate SHAP explanations for model predictions"""
        print("🔍 Generating model explanations...")
        
        best_model_name = model_results['best_model']
        model_info = model_results['models'][best_model_name]
        model = model_info['model']
        scaler = model_info['scaler']
        
        # Prepare data for SHAP
        if scaler:
            X_test_processed = scaler.transform(X_test)
            X_test_df = pd.DataFrame(X_test_processed, columns=X_test.columns)
        else:
            X_test_df = X_test
        
        # Create SHAP explainer
        if best_model_name == 'logistic_regression':
            explainer = shap.LinearExplainer(model, X_test_df)
        else:
            explainer = shap.TreeExplainer(model)
        
        # Calculate SHAP values
        shap_values = explainer.shap_values(X_test_df[:100])  # Limit for performance
        
        # Feature importance
        feature_importance = np.abs(shap_values).mean(0)
        feature_names = model_results['feature_names']
        
        importance_dict = dict(zip(feature_names, feature_importance))
        sorted_importance = sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
        
        explanations = {
            'feature_importance': dict(sorted_importance),
            'shap_values_sample': shap_values[:10].tolist(),  # First 10 samples
            'base_value': float(explainer.expected_value) if hasattr(explainer, 'expected_value') else 0.0
        }
        
        print(f"✅ Explanations generated")
        print(f"   Top features: {list(dict(sorted_importance[:3]).keys())}")
        
        return explanations
    
    def evaluate_model(self, model_results: Dict, X_test: pd.DataFrame, 
                      y_test: pd.Series, df_test: pd.DataFrame) -> Dict:
        """Comprehensive model evaluation"""
        print("📊 Evaluating model performance...")
        
        best_model_name = model_results['best_model']
        model_info = model_results['models'][best_model_name]
        model = model_info['model']
        scaler = model_info['scaler']
        
        # Make predictions
        if scaler:
            X_test_processed = scaler.transform(X_test)
        else:
            X_test_processed = X_test
        
        predictions = model.predict(X_test_processed)
        probabilities = model.predict_proba(X_test_processed)[:, 1]
        
        # Calculate metrics
        accuracy = (predictions == y_test).mean()
        auc_score = roc_auc_score(y_test, probabilities)
        report = classification_report(y_test, predictions, output_dict=True)
        
        # Bias analysis
        bias_analysis = self.analyze_bias(model_results, X_test, y_test, df_test)
        
        # Generate explanations
        explanations = self.generate_explanations(model_results, X_test)
        
        evaluation_results = {
            'model_name': best_model_name,
            'accuracy': float(accuracy),
            'auc_score': float(auc_score),
            'classification_report': report,
            'bias_analysis': bias_analysis,
            'explanations': explanations,
            'evaluation_timestamp': datetime.now().isoformat()
        }
        
        # Save results
        results_path = f"results/fintech/credit_evaluation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_path, 'w') as f:
            json.dump(evaluation_results, f, indent=2)
        
        print(f"✅ Evaluation complete. Results saved to {results_path}")
        print(f"   Accuracy: {accuracy:.3f}")
        print(f"   AUC Score: {auc_score:.3f}")
        
        return evaluation_results
    
    def deploy_to_watsonx(self, model_results: Dict) -> str:
        """Deploy best model to Watsonx.ai"""
        print("🚀 Deploying model to Watsonx.ai...")
        
        best_model_name = model_results['best_model']
        model_info = model_results['models'][best_model_name]
        
        # Save model locally first
        import joblib
        model_path = f"models/fintech/credit_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        os.makedirs(model_path, exist_ok=True)
        
        joblib.dump(model_info['model'], f"{model_path}/model.pkl")
        if model_info['scaler']:
            joblib.dump(model_info['scaler'], f"{model_path}/scaler.pkl")
        
        # Save feature names
        with open(f"{model_path}/feature_names.json", 'w') as f:
            json.dump(model_results['feature_names'], f)
        
        # Package for Watsonx
        model_metadata = {
            'name': f'credit-scoring-{best_model_name}-{datetime.now().strftime("%Y%m%d_%H%M%S")}',
            'description': f'Credit Scoring Model ({best_model_name}) with Bias Detection',
            'type': 'scikit-learn_1.0',
            'software_spec': {
                'name': 'default_py3.9'
            }
        }
        
        # Store model
        stored_model = self.client.repository.store_model(
            model=model_path,
            meta_props=model_metadata
        )
        
        model_uid = self.client.repository.get_model_uid(stored_model)
        
        # Deploy model
        deployment_metadata = {
            'name': f'credit-scoring-deployment-{datetime.now().strftime("%Y%m%d_%H%M%S")}',
            'description': 'Credit Scoring Model Deployment',
            'online': {}
        }
        
        deployment = self.client.deployments.create(
            artifact_uid=model_uid,
            meta_props=deployment_metadata
        )
        
        deployment_uid = self.client.deployments.get_uid(deployment)
        
        print(f"✅ Model deployed successfully!")
        print(f"   Model UID: {model_uid}")
        print(f"   Deployment UID: {deployment_uid}")
        
        return deployment_uid

def main():
    """Main training function"""
    print("💳 Credit Scoring Model Training Pipeline")
    print("========================================")
    
    # Initialize trainer
    trainer = CreditScoringTrainer()
    
    # Load dataset
    dataset_path = "data/training/fintech/credit_scoring_dataset.csv"
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found: {dataset_path}")
        print("   Please ensure the credit scoring dataset is available")
        return
    
    df = trainer.load_credit_dataset(dataset_path)
    
    # Prepare features
    X, y = trainer.prepare_features(df)
    
    # Split data
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp)
    
    # Get corresponding dataframe rows for bias analysis
    df_test = df.iloc[X_test.index]
    
    print(f"📊 Data split:")
    print(f"   Training: {len(X_train)} samples")
    print(f"   Validation: {len(X_val)} samples")
    print(f"   Testing: {len(X_test)} samples")
    
    # Train models
    model_results = trainer.train_credit_models(X_train, y_train, X_val, y_val)
    
    # Evaluate model
    evaluation_results = trainer.evaluate_model(model_results, X_test, y_test, df_test)
    
    # Deploy to Watsonx (optional)
    deploy_choice = input("Deploy model to Watsonx.ai? (y/n): ")
    if deploy_choice.lower() == 'y':
        deployment_uid = trainer.deploy_to_watsonx(model_results)
        print(f"🎉 Training and deployment complete!")
        print(f"   Deployment UID: {deployment_uid}")
    else:
        print("🎉 Training complete!")
    
    print(f"   Best Model: {model_results['best_model']}")
    print(f"   Accuracy: {evaluation_results['accuracy']:.3f}")
    print(f"   AUC Score: {evaluation_results['auc_score']:.3f}")

if __name__ == "__main__":
    main()