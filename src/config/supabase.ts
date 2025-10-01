import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { logger } from '../utils/logger';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

// Client-side Supabase client (with RLS enabled)
export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Admin client (bypasses RLS for server operations)
export const supabaseAdmin: SupabaseClient<Database> = createClient(
  supabaseUrl, 
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database service class
export class SupabaseService {
  private client: SupabaseClient<Database>;
  private adminClient: SupabaseClient<Database>;

  constructor() {
    this.client = supabase;
    this.adminClient = supabaseAdmin;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('health_check')
        .select('*')
        .limit(1);
      
      return !error;
    } catch (error) {
      logger.error('Supabase health check failed:', error);
      return false;
    }
  }

  // User management
  async createUser(userData: {
    email: string;
    password: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const { data, error } = await this.adminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: userData.metadata,
        email_confirm: true
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        await this.createUserProfile(data.user.id, {
          email: userData.email,
          ...userData.metadata
        });
      }

      return { user: data.user, error: null };
    } catch (error) {
      logger.error('Error creating user:', error);
      return { user: null, error };
    }
  }

  async createUserProfile(userId: string, profileData: any) {
    try {
      const { data, error } = await this.adminClient
        .from('user_profiles')
        .insert({
          id: userId,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error creating user profile:', error);
      return { data: null, error };
    }
  }

  // Authentication
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Sign in error:', error);
      return { data: null, error };
    }
  }

  async signOut() {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      logger.error('Sign out error:', error);
      return { error };
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      logger.error('Get current user error:', error);
      return { user: null, error };
    }
  }

  // Governance and audit logs
  async createAuditLog(logData: {
    action: string;
    user_id?: string;
    module_id?: string;
    model_id?: string;
    details?: any;
    ip_address?: string;
    user_agent?: string;
  }) {
    try {
      const { data, error } = await this.adminClient
        .from('audit_logs')
        .insert({
          ...logData,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error creating audit log:', error);
      return { data: null, error };
    }
  }

  async getAuditLogs(filters: {
    user_id?: string;
    module_id?: string;
    action?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      let query = this.adminClient
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.module_id) {
        query = query.eq('module_id', filters.module_id);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      return { data: null, error };
    }
  }

  // Governance rules
  async createGovernanceRule(ruleData: {
    name: string;
    type: string;
    config: any;
    is_active?: boolean;
    module_ids?: string[];
  }) {
    try {
      const { data, error } = await this.adminClient
        .from('governance_rules')
        .insert({
          ...ruleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error creating governance rule:', error);
      return { data: null, error };
    }
  }

  async getGovernanceRules(filters: {
    type?: string;
    is_active?: boolean;
    module_id?: string;
  } = {}) {
    try {
      let query = this.client
        .from('governance_rules')
        .select('*');

      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.module_id) {
        query = query.contains('module_ids', [filters.module_id]);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching governance rules:', error);
      return { data: null, error };
    }
  }

  // Datasets
  async createDataset(datasetData: {
    name: string;
    description?: string;
    module_id: string;
    schema: any;
    governance: any;
    location: string;
    size?: number;
    watsonx_config?: any;
  }) {
    try {
      const { data, error } = await this.adminClient
        .from('datasets')
        .insert({
          ...datasetData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error creating dataset:', error);
      return { data: null, error };
    }
  }

  async getDatasets(moduleId?: string) {
    try {
      let query = this.client
        .from('datasets')
        .select('*');

      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching datasets:', error);
      return { data: null, error };
    }
  }

  // Predictions
  async createPrediction(predictionData: {
    model_id: string;
    input: any;
    output: any;
    confidence?: number;
    explanation?: any;
    governance_checks?: any[];
    user_id?: string;
  }) {
    try {
      const { data, error } = await this.adminClient
        .from('predictions')
        .insert({
          ...predictionData,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error creating prediction:', error);
      return { data: null, error };
    }
  }

  async getPredictions(filters: {
    model_id?: string;
    user_id?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      let query = this.client
        .from('predictions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.model_id) {
        query = query.eq('model_id', filters.model_id);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching predictions:', error);
      return { data: null, error };
    }
  }

  // Mental Health specific methods
  async createMentalHealthAssessment(assessmentData: {
    patient_id?: string;
    symptoms: string;
    language: string;
    cultural_background?: string;
    demographic_info?: any;
    dsm_diagnoses?: any[];
    risk_assessment?: any;
    treatment_recommendations?: any[];
    cultural_formulation?: any;
    confidence_score: number;
    urgency_level: string;
    follow_up_required: boolean;
    clinician_id?: string;
  }) {
    try {
      const { data, error } = await this.adminClient
        .from('mental_health_assessments')
        .insert({
          ...assessmentData,
          assessment_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error creating mental health assessment:', error);
      return { data: null, error };
    }
  }

  async getMentalHealthAssessments(filters: {
    patient_id?: string;
    clinician_id?: string;
    language?: string;
    urgency_level?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      let query = this.client
        .from('mental_health_assessments')
        .select('*')
        .order('assessment_date', { ascending: false });

      if (filters.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }
      if (filters.clinician_id) {
        query = query.eq('clinician_id', filters.clinician_id);
      }
      if (filters.language) {
        query = query.eq('language', filters.language);
      }
      if (filters.urgency_level) {
        query = query.eq('urgency_level', filters.urgency_level);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching mental health assessments:', error);
      return { data: null, error };
    }
  }

  // Real-time subscriptions
  subscribeToAuditLogs(callback: (payload: any) => void) {
    return this.client
      .channel('audit_logs')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'audit_logs' }, 
        callback
      )
      .subscribe();
  }

  subscribeToMentalHealthAssessments(callback: (payload: any) => void) {
    return this.client
      .channel('mental_health_assessments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'mental_health_assessments' }, 
        callback
      )
      .subscribe();
  }

  // File storage
  async uploadFile(bucket: string, path: string, file: File | Buffer, options?: {
    contentType?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file, {
          contentType: options?.contentType,
          metadata: options?.metadata
        });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error uploading file:', error);
      return { data: null, error };
    }
  }

  async downloadFile(bucket: string, path: string) {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .download(path);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error downloading file:', error);
      return { data: null, error };
    }
  }

  async getFileUrl(bucket: string, path: string, expiresIn: number = 3600) {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error getting file URL:', error);
      return { data: null, error };
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();