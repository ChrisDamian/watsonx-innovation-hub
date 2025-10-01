-- =============================================================================
-- WATSONX INNOVATION HUB - SUPABASE DATABASE SETUP
-- =============================================================================
-- This script sets up the complete database schema for the Watsonx Innovation Hub
-- including tables, indexes, RLS policies, and functions
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    roles JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    avatar_url TEXT,
    department TEXT,
    organization TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    is_active BOOLEAN DEFAULT true
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action TEXT NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id),
    module_id TEXT,
    model_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    request_id TEXT,
    status_code INTEGER,
    response_time INTEGER
);

-- Governance rules table
CREATE TABLE IF NOT EXISTS public.governance_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    module_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.user_profiles(id),
    description TEXT,
    priority INTEGER DEFAULT 0,
    tags TEXT[]
);

-- Datasets table
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    module_id TEXT NOT NULL,
    schema JSONB NOT NULL,
    governance JSONB NOT NULL,
    location TEXT NOT NULL,
    size BIGINT DEFAULT 0,
    watsonx_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.user_profiles(id),
    version TEXT DEFAULT '1.0.0',
    status TEXT DEFAULT 'active',
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Predictions table
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_id TEXT NOT NULL,
    input JSONB NOT NULL,
    output JSONB NOT NULL,
    confidence DECIMAL(5,4),
    explanation JSONB,
    governance_checks JSONB DEFAULT '[]'::jsonb,
    user_id UUID REFERENCES public.user_profiles(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    request_id TEXT,
    processing_time INTEGER,
    model_version TEXT,
    deployment_id TEXT
);

-- =============================================================================
-- MENTAL HEALTH MODULE TABLES
-- =============================================================================

-- Mental health patients table
CREATE TABLE IF NOT EXISTS public.mental_health_patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    cultural_background TEXT,
    primary_language TEXT NOT NULL DEFAULT 'en',
    secondary_languages TEXT[],
    contact_info JSONB,
    emergency_contact JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.user_profiles(id),
    is_active BOOLEAN DEFAULT true,
    medical_record_number TEXT UNIQUE,
    insurance_info JSONB,
    consent_status JSONB DEFAULT '{}'::jsonb
);

-- Mental health assessments table
CREATE TABLE IF NOT EXISTS public.mental_health_assessments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.mental_health_patients(id),
    clinician_id UUID REFERENCES public.user_profiles(id),
    assessment_date TIMESTAMPTZ DEFAULT NOW(),
    symptoms TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    cultural_background TEXT,
    demographic_info JSONB,
    dsm_diagnoses JSONB DEFAULT '[]'::jsonb,
    risk_assessment JSONB,
    treatment_recommendations JSONB DEFAULT '[]'::jsonb,
    cultural_formulation JSONB,
    confidence_score DECIMAL(5,4) NOT NULL,
    urgency_level TEXT NOT NULL,
    follow_up_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    previous_diagnoses JSONB DEFAULT '[]'::jsonb,
    current_medications JSONB DEFAULT '[]'::jsonb,
    functional_impairment JSONB,
    governance_results JSONB DEFAULT '[]'::jsonb
);

-- Treatment plans table
CREATE TABLE IF NOT EXISTS public.treatment_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.mental_health_patients(id) NOT NULL,
    assessment_id UUID REFERENCES public.mental_health_assessments(id),
    clinician_id UUID REFERENCES public.user_profiles(id) NOT NULL,
    primary_diagnosis TEXT NOT NULL,
    treatment_goals JSONB NOT NULL,
    interventions JSONB NOT NULL,
    follow_up_schedule JSONB NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    cultural_adaptations JSONB DEFAULT '[]'::jsonb
);

-- Progress notes table
CREATE TABLE IF NOT EXISTS public.progress_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.mental_health_patients(id) NOT NULL,
    treatment_plan_id UUID REFERENCES public.treatment_plans(id),
    clinician_id UUID REFERENCES public.user_profiles(id) NOT NULL,
    session_date TIMESTAMPTZ NOT NULL,
    session_type TEXT NOT NULL,
    progress_notes TEXT NOT NULL,
    risk_assessment JSONB,
    next_steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    session_duration INTEGER,
    attendance_status TEXT DEFAULT 'attended',
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    goals_progress JSONB DEFAULT '[]'::jsonb
);

-- Health check table for monitoring
CREATE TABLE IF NOT EXISTS public.health_check (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'healthy',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    details JSONB
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization ON public.user_profiles(organization);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_id ON public.audit_logs(module_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Governance rules indexes
CREATE INDEX IF NOT EXISTS idx_governance_rules_type ON public.governance_rules(type);
CREATE INDEX IF NOT EXISTS idx_governance_rules_is_active ON public.governance_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_governance_rules_module_ids ON public.governance_rules USING GIN(module_ids);

-- Datasets indexes
CREATE INDEX IF NOT EXISTS idx_datasets_module_id ON public.datasets(module_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON public.datasets(status);
CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON public.datasets(created_at DESC);

-- Predictions indexes
CREATE INDEX IF NOT EXISTS idx_predictions_model_id ON public.predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON public.predictions(timestamp DESC);

-- Mental health indexes
CREATE INDEX IF NOT EXISTS idx_mh_patients_created_by ON public.mental_health_patients(created_by);
CREATE INDEX IF NOT EXISTS idx_mh_patients_is_active ON public.mental_health_patients(is_active);
CREATE INDEX IF NOT EXISTS idx_mh_patients_cultural_background ON public.mental_health_patients(cultural_background);

CREATE INDEX IF NOT EXISTS idx_mh_assessments_patient_id ON public.mental_health_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_mh_assessments_clinician_id ON public.mental_health_assessments(clinician_id);
CREATE INDEX IF NOT EXISTS idx_mh_assessments_assessment_date ON public.mental_health_assessments(assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_mh_assessments_urgency_level ON public.mental_health_assessments(urgency_level);
CREATE INDEX IF NOT EXISTS idx_mh_assessments_language ON public.mental_health_assessments(language);

CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON public.treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_clinician_id ON public.treatment_plans(clinician_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON public.treatment_plans(status);

CREATE INDEX IF NOT EXISTS idx_progress_notes_patient_id ON public.progress_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_progress_notes_treatment_plan_id ON public.progress_notes(treatment_plan_id);
CREATE INDEX IF NOT EXISTS idx_progress_notes_session_date ON public.progress_notes(session_date DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_health_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND roles @> '[{"name": "admin"}]'::jsonb
        )
    );

-- Audit logs policies (admin only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND roles @> '[{"name": "admin"}]'::jsonb
        )
    );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Governance rules policies
CREATE POLICY "Authenticated users can view governance rules" ON public.governance_rules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage governance rules" ON public.governance_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND roles @> '[{"name": "admin"}]'::jsonb
        )
    );

-- Datasets policies
CREATE POLICY "Authenticated users can view datasets" ON public.datasets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Data scientists can manage datasets" ON public.datasets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND (
                roles @> '[{"name": "admin"}]'::jsonb OR
                roles @> '[{"name": "data_scientist"}]'::jsonb
            )
        )
    );

-- Predictions policies
CREATE POLICY "Users can view their own predictions" ON public.predictions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create predictions" ON public.predictions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all predictions" ON public.predictions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND roles @> '[{"name": "admin"}]'::jsonb
        )
    );

-- Mental health patients policies (HIPAA compliant)
CREATE POLICY "Clinicians can view their patients" ON public.mental_health_patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND (
                roles @> '[{"name": "clinician"}]'::jsonb OR
                roles @> '[{"name": "mental_health_admin"}]'::jsonb
            )
        )
    );

CREATE POLICY "Clinicians can create patients" ON public.mental_health_patients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND (
                roles @> '[{"name": "clinician"}]'::jsonb OR
                roles @> '[{"name": "mental_health_admin"}]'::jsonb
            )
        )
    );

-- Mental health assessments policies
CREATE POLICY "Clinicians can view assessments for their patients" ON public.mental_health_assessments
    FOR SELECT USING (
        auth.uid() = clinician_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND roles @> '[{"name": "mental_health_admin"}]'::jsonb
        )
    );

CREATE POLICY "Clinicians can create assessments" ON public.mental_health_assessments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND (
                roles @> '[{"name": "clinician"}]'::jsonb OR
                roles @> '[{"name": "mental_health_admin"}]'::jsonb
            )
        )
    );

-- Treatment plans policies
CREATE POLICY "Clinicians can manage their treatment plans" ON public.treatment_plans
    FOR ALL USING (
        auth.uid() = clinician_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND roles @> '[{"name": "mental_health_admin"}]'::jsonb
        )
    );

-- Progress notes policies
CREATE POLICY "Clinicians can manage their progress notes" ON public.progress_notes
    FOR ALL USING (
        auth.uid() = clinician_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND roles @> '[{"name": "mental_health_admin"}]'::jsonb
        )
    );

-- Health check policies (public read)
CREATE POLICY "Anyone can check health" ON public.health_check
    FOR SELECT USING (true);

CREATE POLICY "System can update health status" ON public.health_check
    FOR ALL USING (true);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_governance_rules_updated_at BEFORE UPDATE ON public.governance_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON public.datasets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mental_health_patients_updated_at BEFORE UPDATE ON public.mental_health_patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mental_health_assessments_updated_at BEFORE UPDATE ON public.mental_health_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON public.treatment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_notes_updated_at BEFORE UPDATE ON public.progress_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create audit log
CREATE OR REPLACE FUNCTION public.create_audit_log(
    p_action TEXT,
    p_user_id UUID DEFAULT NULL,
    p_module_id TEXT DEFAULT NULL,
    p_model_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        action, user_id, module_id, model_id, details, ip_address, user_agent
    ) VALUES (
        p_action, p_user_id, p_module_id, p_model_id, p_details, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('patient-documents', 'patient-documents', false),
    ('model-artifacts', 'model-artifacts', false),
    ('datasets', 'datasets', false),
    ('reports', 'reports', false),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Clinicians can upload patient documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'patient-documents' AND
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND (
                roles @> '[{"name": "clinician"}]'::jsonb OR
                roles @> '[{"name": "mental_health_admin"}]'::jsonb
            )
        )
    );

CREATE POLICY "Clinicians can view patient documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'patient-documents' AND
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND (
                roles @> '[{"name": "clinician"}]'::jsonb OR
                roles @> '[{"name": "mental_health_admin"}]'::jsonb
            )
        )
    );

CREATE POLICY "Data scientists can manage model artifacts" ON storage.objects
    FOR ALL USING (
        bucket_id = 'model-artifacts' AND
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND (
                roles @> '[{"name": "admin"}]'::jsonb OR
                roles @> '[{"name": "data_scientist"}]'::jsonb
            )
        )
    );

CREATE POLICY "Users can manage their own avatars" ON storage.objects
    FOR ALL USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert health check record
INSERT INTO public.health_check (status, details) 
VALUES ('healthy', '{"message": "Database initialized successfully"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert default governance rules
INSERT INTO public.governance_rules (name, type, config, description) VALUES
    (
        'Default Bias Detection', 
        'bias_detection', 
        '{"threshold": 0.8, "protected_attributes": ["gender", "age", "ethnicity"]}'::jsonb,
        'Default bias detection rule for all models'
    ),
    (
        'HIPAA Compliance Check', 
        'compliance', 
        '{"regulation": "HIPAA", "required_fields": ["patient_consent", "data_encryption"]}'::jsonb,
        'Ensures HIPAA compliance for mental health data'
    ),
    (
        'Explainability Requirement', 
        'explainability', 
        '{"required": true, "method": "lime", "confidence_threshold": 0.7}'::jsonb,
        'Requires explainable AI for all high-stakes decisions'
    )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Watsonx Innovation Hub database setup completed successfully!';
    RAISE NOTICE 'Tables created: %, Indexes: %, Policies: %', 
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'),
        (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public'),
        (SELECT count(*) FROM pg_policies WHERE schemaname = 'public');
END $$;