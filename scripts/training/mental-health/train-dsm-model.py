#!/usr/bin/env python3
"""
Mental Health DSM Model Training Script
=====================================

This script trains DSM-5-TR classification models for the mental health module
with support for multiple languages and cultural adaptations.
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
from ibm_watsonx_ai.foundation_models.utils.enums import ModelTypes

# ML imports
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import torch
from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    TrainingArguments, Trainer, EarlyStoppingCallback
)

class DSMModelTrainer:
    """DSM-5-TR Model Training Class"""
    
    def __init__(self, config_path: str = "config/watsonx-training-config.json"):
        """Initialize the DSM model trainer"""
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
            "data/training/mental-health",
            "models/mental-health",
            "logs/training",
            "results/mental-health"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    def load_dsm_dataset(self, dataset_path: str) -> pd.DataFrame:
        """Load and preprocess DSM training dataset"""
        print(f"📊 Loading DSM dataset from {dataset_path}")
        
        # Load dataset
        if dataset_path.endswith('.csv'):
            df = pd.read_csv(dataset_path)
        elif dataset_path.endswith('.json'):
            df = pd.read_json(dataset_path)
        else:
            raise ValueError("Unsupported dataset format")
        
        # Validate required columns
        required_columns = ['symptoms', 'dsm_category', 'dsm_code', 'language', 'cultural_context']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Clean and preprocess
        df = df.dropna(subset=['symptoms', 'dsm_category'])
        df['symptoms'] = df['symptoms'].str.strip()
        df['dsm_category'] = df['dsm_category'].str.strip()
        
        print(f"✅ Dataset loaded: {len(df)} samples")
        print(f"   Languages: {df['language'].unique()}")
        print(f"   DSM Categories: {df['dsm_category'].nunique()}")
        
        return df
    
    def prepare_multilingual_data(self, df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """Prepare data for multilingual training"""
        language_data = {}
        
        for language in ['en', 'sw', 'fr']:
            lang_df = df[df['language'] == language].copy()
            if len(lang_df) > 0:
                language_data[language] = lang_df
                print(f"   {language.upper()}: {len(lang_df)} samples")
        
        return language_data
    
    def create_cultural_adaptations(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply cultural adaptations to the dataset"""
        print("🌍 Applying cultural adaptations...")
        
        # Cultural context mappings
        cultural_mappings = {
            'East African': {
                'somatic_emphasis': True,
                'family_involvement': True,
                'spiritual_context': True
            },
            'West African': {
                'community_focus': True,
                'traditional_healing': True,
                'collective_identity': True
            },
            'European': {
                'individual_focus': True,
                'medical_model': True,
                'privacy_emphasis': True
            }
        }
        
        # Apply cultural context
        for idx, row in df.iterrows():
            cultural_context = row.get('cultural_context', 'European')
            if cultural_context in cultural_mappings:
                adaptations = cultural_mappings[cultural_context]
                df.at[idx, 'cultural_adaptations'] = json.dumps(adaptations)
        
        return df
    
    def train_dsm_classifier(self, train_data: pd.DataFrame, val_data: pd.DataFrame) -> Dict:
        """Train DSM-5-TR classification model"""
        print("🧠 Training DSM-5-TR classifier...")
        
        # Prepare labels
        label_encoder = LabelEncoder()
        train_labels = label_encoder.fit_transform(train_data['dsm_category'])
        val_labels = label_encoder.transform(val_data['dsm_category'])
        
        # Model configuration
        model_config = self.config['models']['mental_health']['dsm_classification']
        base_model = model_config['base_model']
        
        # Initialize tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(base_model)
        model = AutoModelForSequenceClassification.from_pretrained(
            base_model,
            num_labels=len(label_encoder.classes_)
        )
        
        # Tokenize data
        train_encodings = tokenizer(
            train_data['symptoms'].tolist(),
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors='pt'
        )
        
        val_encodings = tokenizer(
            val_data['symptoms'].tolist(),
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors='pt'
        )
        
        # Create dataset class
        class DSMDataset(torch.utils.data.Dataset):
            def __init__(self, encodings, labels):
                self.encodings = encodings
                self.labels = labels
            
            def __getitem__(self, idx):
                item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
                item['labels'] = torch.tensor(self.labels[idx])
                return item
            
            def __len__(self):
                return len(self.labels)
        
        train_dataset = DSMDataset(train_encodings, train_labels)
        val_dataset = DSMDataset(val_encodings, val_labels)
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir='./models/mental-health/dsm-classifier',
            num_train_epochs=self.config['training']['epochs'],
            per_device_train_batch_size=self.config['training']['batch_size'],
            per_device_eval_batch_size=self.config['training']['batch_size'],
            learning_rate=self.config['training']['learning_rate'],
            warmup_steps=500,
            weight_decay=0.01,
            logging_dir='./logs/training',
            logging_steps=100,
            evaluation_strategy="steps",
            eval_steps=500,
            save_strategy="steps",
            save_steps=500,
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
            greater_is_better=False,
        )
        
        # Initialize trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
        )
        
        # Train model
        print("🚀 Starting training...")
        trainer.train()
        
        # Save model
        model_path = f"./models/mental-health/dsm-classifier-{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        trainer.save_model(model_path)
        tokenizer.save_pretrained(model_path)
        
        # Save label encoder
        import joblib
        joblib.dump(label_encoder, f"{model_path}/label_encoder.pkl")
        
        print(f"✅ Model saved to {model_path}")
        
        return {
            'model_path': model_path,
            'label_encoder': label_encoder,
            'training_history': trainer.state.log_history
        }
    
    def evaluate_model(self, model_path: str, test_data: pd.DataFrame) -> Dict:
        """Evaluate trained model"""
        print("📊 Evaluating model performance...")
        
        # Load model and tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForSequenceClassification.from_pretrained(model_path)
        
        # Load label encoder
        import joblib
        label_encoder = joblib.load(f"{model_path}/label_encoder.pkl")
        
        # Prepare test data
        test_encodings = tokenizer(
            test_data['symptoms'].tolist(),
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors='pt'
        )
        
        # Make predictions
        model.eval()
        with torch.no_grad():
            outputs = model(**test_encodings)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            predicted_classes = torch.argmax(predictions, dim=-1)
        
        # Convert to labels
        predicted_labels = label_encoder.inverse_transform(predicted_classes.numpy())
        true_labels = test_data['dsm_category'].values
        
        # Calculate metrics
        report = classification_report(true_labels, predicted_labels, output_dict=True)
        confusion_mat = confusion_matrix(true_labels, predicted_labels)
        
        # Cultural bias analysis
        cultural_bias = self.analyze_cultural_bias(
            test_data, predicted_labels, true_labels
        )
        
        evaluation_results = {
            'classification_report': report,
            'confusion_matrix': confusion_mat.tolist(),
            'cultural_bias_analysis': cultural_bias,
            'overall_accuracy': report['accuracy'],
            'macro_f1': report['macro avg']['f1-score'],
            'weighted_f1': report['weighted avg']['f1-score']
        }
        
        # Save evaluation results
        results_path = f"results/mental-health/evaluation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_path, 'w') as f:
            json.dump(evaluation_results, f, indent=2)
        
        print(f"✅ Evaluation complete. Results saved to {results_path}")
        print(f"   Overall Accuracy: {evaluation_results['overall_accuracy']:.3f}")
        print(f"   Macro F1: {evaluation_results['macro_f1']:.3f}")
        
        return evaluation_results
    
    def analyze_cultural_bias(self, test_data: pd.DataFrame, 
                            predicted_labels: np.ndarray, 
                            true_labels: np.ndarray) -> Dict:
        """Analyze cultural bias in model predictions"""
        bias_analysis = {}
        
        if 'cultural_context' in test_data.columns:
            for culture in test_data['cultural_context'].unique():
                culture_mask = test_data['cultural_context'] == culture
                culture_predictions = predicted_labels[culture_mask]
                culture_true = true_labels[culture_mask]
                
                if len(culture_predictions) > 0:
                    accuracy = (culture_predictions == culture_true).mean()
                    bias_analysis[culture] = {
                        'accuracy': float(accuracy),
                        'sample_size': int(len(culture_predictions)),
                        'prediction_distribution': dict(
                            zip(*np.unique(culture_predictions, return_counts=True))
                        )
                    }
        
        return bias_analysis
    
    def deploy_to_watsonx(self, model_path: str) -> str:
        """Deploy trained model to Watsonx.ai"""
        print("🚀 Deploying model to Watsonx.ai...")
        
        # Package model for deployment
        model_metadata = {
            'name': f'dsm-classifier-{datetime.now().strftime("%Y%m%d_%H%M%S")}',
            'description': 'DSM-5-TR Classification Model with Cultural Adaptations',
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
            'name': f'dsm-classifier-deployment-{datetime.now().strftime("%Y%m%d_%H%M%S")}',
            'description': 'DSM-5-TR Classifier Deployment',
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
    print("🧠 DSM-5-TR Model Training Pipeline")
    print("===================================")
    
    # Initialize trainer
    trainer = DSMModelTrainer()
    
    # Load dataset
    dataset_path = "data/training/mental-health/dsm-5-tr-dataset.csv"
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found: {dataset_path}")
        print("   Please ensure the DSM dataset is available")
        return
    
    df = trainer.load_dsm_dataset(dataset_path)
    
    # Apply cultural adaptations
    df = trainer.create_cultural_adaptations(df)
    
    # Split data
    train_df, temp_df = train_test_split(df, test_size=0.3, random_state=42, stratify=df['dsm_category'])
    val_df, test_df = train_test_split(temp_df, test_size=0.5, random_state=42, stratify=temp_df['dsm_category'])
    
    print(f"📊 Data split:")
    print(f"   Training: {len(train_df)} samples")
    print(f"   Validation: {len(val_df)} samples")
    print(f"   Testing: {len(test_df)} samples")
    
    # Train model
    training_results = trainer.train_dsm_classifier(train_df, val_df)
    
    # Evaluate model
    evaluation_results = trainer.evaluate_model(training_results['model_path'], test_df)
    
    # Deploy to Watsonx (optional)
    deploy_choice = input("Deploy model to Watsonx.ai? (y/n): ")
    if deploy_choice.lower() == 'y':
        deployment_uid = trainer.deploy_to_watsonx(training_results['model_path'])
        print(f"🎉 Training and deployment complete!")
        print(f"   Deployment UID: {deployment_uid}")
    else:
        print("🎉 Training complete!")
    
    print(f"   Model saved at: {training_results['model_path']}")
    print(f"   Accuracy: {evaluation_results['overall_accuracy']:.3f}")

if __name__ == "__main__":
    main()