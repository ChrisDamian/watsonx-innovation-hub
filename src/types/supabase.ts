export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          roles: Json | null
          preferences: Json | null
          created_at: string
          updated_at: string
          last_login: string | null
          avatar_url: string | null
          department: string | null
          organization: string | null
          phone: string | null
          timezone: string | null
          language: string | null
          is_active: boolean
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          roles?: Json | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
          avatar_url?: string | null
          department?: string | null
          organization?: string | null
          phone?: string | null
          timezone?: string | null
          language?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          roles?: Json | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
          avatar_url?: string | null
          department?: string | null
          organization?: string | null
          phone?: string | null
          timezone?: string | null
          language?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          action: string
          user_id: string | null
          module_id: string | null
          model_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          timestamp: string
          session_id: string | null
          request_id: string | null
          status_code: number | null
          response_time: number | null
        }
        Insert: {
          id?: string
          action: string
          user_id?: string | null
          module_id?: string | null
          model_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
          session_id?: string | null
          request_id?: string | null
          status_code?: number | null
          response_time?: number | null
        }
        Update: {
          id?: string
          action?: string
          user_id?: string | null
          module_id?: string | null
          model_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
          session_id?: string | null
          request_id?: string | null
          status_code?: number | null
          response_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      governance_rules: {
        Row: {
          id: string
          name: string
          type: string
          config: Json
          is_active: boolean
          module_ids: Json | null
          created_at: string
          updated_at: string
          created_by: string | null
          description: string | null
          priority: number | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          config: Json
          is_active?: boolean
          module_ids?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          description?: string | null
          priority?: number | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          config?: Json
          is_active?: boolean
          module_ids?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          description?: string | null
          priority?: number | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_rules_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      datasets: {
        Row: {
          id: string
          name: string
          description: string | null
          module_id: string
          schema: Json
          governance: Json
          location: string
          size: number | null
          watsonx_config: Json | null
          created_at: string
          updated_at: string
          created_by: string | null
          version: string | null
          status: string | null
          tags: string[] | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          module_id: string
          schema: Json
          governance: Json
          location: string
          size?: number | null
          watsonx_config?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          version?: string | null
          status?: string | null
          tags?: string[] | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          module_id?: string
          schema?: Json
          governance?: Json
          location?: string
          size?: number | null
          watsonx_config?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          version?: string | null
          status?: string | null
          tags?: string[] | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "datasets_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      predictions: {
        Row: {
          id: string
          model_id: string
          input: Json
          output: Json
          confidence: number | null
          explanation: Json | null
          governance_checks: Json | null
          user_id: string | null
          timestamp: string
          session_id: string | null
          request_id: string | null
          processing_time: number | null
          model_version: string | null
          deployment_id: string | null
        }
        Insert: {
          id?: string
          model_id: string
          input: Json
          output: Json
          confidence?: number | null
          explanation?: Json | null
          governance_checks?: Json | null
          user_id?: string | null
          timestamp?: string
          session_id?: string | null
          request_id?: string | null
          processing_time?: number | null
          model_version?: string | null
          deployment_id?: string | null
        }
        Update: {
          id?: string
          model_id?: string
          input?: Json
          output?: Json
          confidence?: number | null
          explanation?: Json | null
          governance_checks?: Json | null
          user_id?: string | null
          timestamp?: string
          session_id?: string | null
          request_id?: string | null
          processing_time?: number | null
          model_version?: string | null
          deployment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      mental_health_assessments: {
        Row: {
          id: string
          patient_id: string | null
          clinician_id: string | null
          assessment_date: string
          symptoms: string
          language: string
          cultural_background: string | null
          demographic_info: Json | null
          dsm_diagnoses: Json | null
          risk_assessment: Json | null
          treatment_recommendations: Json | null
          cultural_formulation: Json | null
          confidence_score: number
          urgency_level: string
          follow_up_required: boolean
          created_at: string
          updated_at: string
          session_id: string | null
          previous_diagnoses: Json | null
          current_medications: Json | null
          functional_impairment: Json | null
          governance_results: Json | null
        }
        Insert: {
          id?: string
          patient_id?: string | null
          clinician_id?: string | null
          assessment_date?: string
          symptoms: string
          language: string
          cultural_background?: string | null
          demographic_info?: Json | null
          dsm_diagnoses?: Json | null
          risk_assessment?: Json | null
          treatment_recommendations?: Json | null
          cultural_formulation?: Json | null
          confidence_score: number
          urgency_level: string
          follow_up_required: boolean
          created_at?: string
          updated_at?: string
          session_id?: string | null
          previous_diagnoses?: Json | null
          current_medications?: Json | null
          functional_impairment?: Json | null
          governance_results?: Json | null
        }
        Update: {
          id?: string
          patient_id?: string | null
          clinician_id?: string | null
          assessment_date?: string
          symptoms?: string
          language?: string
          cultural_background?: string | null
          demographic_info?: Json | null
          dsm_diagnoses?: Json | null
          risk_assessment?: Json | null
          treatment_recommendations?: Json | null
          cultural_formulation?: Json | null
          confidence_score?: number
          urgency_level?: string
          follow_up_required?: boolean
          created_at?: string
          updated_at?: string
          session_id?: string | null
          previous_diagnoses?: Json | null
          current_medications?: Json | null
          functional_impairment?: Json | null
          governance_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mental_health_assessments_clinician_id_fkey"
            columns: ["clinician_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mental_health_assessments_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "mental_health_patients"
            referencedColumns: ["id"]
          }
        ]
      }
      mental_health_patients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          date_of_birth: string | null
          gender: string | null
          cultural_background: string | null
          primary_language: string
          secondary_languages: string[] | null
          contact_info: Json | null
          emergency_contact: Json | null
          created_at: string
          updated_at: string
          created_by: string | null
          is_active: boolean
          medical_record_number: string | null
          insurance_info: Json | null
          consent_status: Json | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          date_of_birth?: string | null
          gender?: string | null
          cultural_background?: string | null
          primary_language: string
          secondary_languages?: string[] | null
          contact_info?: Json | null
          emergency_contact?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_active?: boolean
          medical_record_number?: string | null
          insurance_info?: Json | null
          consent_status?: Json | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string | null
          gender?: string | null
          cultural_background?: string | null
          primary_language?: string
          secondary_languages?: string[] | null
          contact_info?: Json | null
          emergency_contact?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_active?: boolean
          medical_record_number?: string | null
          insurance_info?: Json | null
          consent_status?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mental_health_patients_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      treatment_plans: {
        Row: {
          id: string
          patient_id: string
          assessment_id: string | null
          clinician_id: string
          primary_diagnosis: string
          treatment_goals: Json
          interventions: Json
          follow_up_schedule: Json
          status: string
          created_at: string
          updated_at: string
          start_date: string | null
          end_date: string | null
          notes: string | null
          cultural_adaptations: Json | null
        }
        Insert: {
          id?: string
          patient_id: string
          assessment_id?: string | null
          clinician_id: string
          primary_diagnosis: string
          treatment_goals: Json
          interventions: Json
          follow_up_schedule: Json
          status?: string
          created_at?: string
          updated_at?: string
          start_date?: string | null
          end_date?: string | null
          notes?: string | null
          cultural_adaptations?: Json | null
        }
        Update: {
          id?: string
          patient_id?: string
          assessment_id?: string | null
          clinician_id?: string
          primary_diagnosis?: string
          treatment_goals?: Json
          interventions?: Json
          follow_up_schedule?: Json
          status?: string
          created_at?: string
          updated_at?: string
          start_date?: string | null
          end_date?: string | null
          notes?: string | null
          cultural_adaptations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_assessment_id_fkey"
            columns: ["assessment_id"]
            referencedRelation: "mental_health_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_clinician_id_fkey"
            columns: ["clinician_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "mental_health_patients"
            referencedColumns: ["id"]
          }
        ]
      }
      progress_notes: {
        Row: {
          id: string
          patient_id: string
          treatment_plan_id: string | null
          clinician_id: string
          session_date: string
          session_type: string
          progress_notes: string
          risk_assessment: Json | null
          next_steps: Json | null
          created_at: string
          updated_at: string
          session_duration: number | null
          attendance_status: string | null
          mood_rating: number | null
          goals_progress: Json | null
        }
        Insert: {
          id?: string
          patient_id: string
          treatment_plan_id?: string | null
          clinician_id: string
          session_date: string
          session_type: string
          progress_notes: string
          risk_assessment?: Json | null
          next_steps?: Json | null
          created_at?: string
          updated_at?: string
          session_duration?: number | null
          attendance_status?: string | null
          mood_rating?: number | null
          goals_progress?: Json | null
        }
        Update: {
          id?: string
          patient_id?: string
          treatment_plan_id?: string | null
          clinician_id?: string
          session_date?: string
          session_type?: string
          progress_notes?: string
          risk_assessment?: Json | null
          next_steps?: Json | null
          created_at?: string
          updated_at?: string
          session_duration?: number | null
          attendance_status?: string | null
          mood_rating?: number | null
          goals_progress?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_notes_clinician_id_fkey"
            columns: ["clinician_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notes_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "mental_health_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notes_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          }
        ]
      }
      health_check: {
        Row: {
          id: string
          status: string
          timestamp: string
          details: Json | null
        }
        Insert: {
          id?: string
          status: string
          timestamp?: string
          details?: Json | null
        }
        Update: {
          id?: string
          status?: string
          timestamp?: string
          details?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}