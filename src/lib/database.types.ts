export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          chat_room_id: string | null
          created_at: string
          doctor_id: string
          doctor_name: string
          doctor_specialization: string
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          patient_name: string
          payment_id: string | null
          prescription_id: string | null
          scheduled_at: string
          status: string
          type: string
        }
        Insert: {
          chat_room_id?: string | null
          created_at?: string
          doctor_id: string
          doctor_name: string
          doctor_specialization: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          patient_name: string
          payment_id?: string | null
          prescription_id?: string | null
          scheduled_at: string
          status?: string
          type: string
        }
        Update: {
          chat_room_id?: string | null
          created_at?: string
          doctor_id?: string
          doctor_name?: string
          doctor_specialization?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          patient_name?: string
          payment_id?: string | null
          prescription_id?: string | null
          scheduled_at?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          appointment_id: string | null
          created_at: string
          doctor_id: string
          id: string
          last_message: string | null
          last_message_at: string | null
          patient_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          patient_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "chat_rooms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      doctors: {
        Row: {
          about: string | null
          address: string | null
          approved_at: string | null
          approved_by: string | null
          availability: Json
          city: string
          consultation_fee: number
          experience: number
          is_approved: boolean
          pmdc_number: string
          qualifications: string[]
          rating: number
          rejection_reason: string | null
          specialization: string
          total_consultations: number
          total_reviews: number
          uid: string
        }
        Insert: {
          about?: string | null
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          availability?: Json
          city?: string
          consultation_fee?: number
          experience?: number
          is_approved?: boolean
          pmdc_number: string
          qualifications?: string[]
          rating?: number
          rejection_reason?: string | null
          specialization: string
          total_consultations?: number
          total_reviews?: number
          uid: string
        }
        Update: {
          about?: string | null
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          availability?: Json
          city?: string
          consultation_fee?: number
          experience?: number
          is_approved?: boolean
          pmdc_number?: string
          qualifications?: string[]
          rating?: number
          rejection_reason?: string | null
          specialization?: string
          total_consultations?: number
          total_reviews?: number
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "doctors_uid_fkey"
            columns: ["uid"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          file_type: string | null
          file_url: string | null
          id: string
          is_read: boolean
          room_id: string
          sender_id: string
          sender_name: string
          sender_role: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          room_id: string
          sender_id: string
          sender_name: string
          sender_role: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          room_id?: string
          sender_id?: string
          sender_name?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          blood_group: string | null
          city: string | null
          date_of_birth: string | null
          gender: string | null
          uid: string
        }
        Insert: {
          address?: string | null
          blood_group?: string | null
          city?: string | null
          date_of_birth?: string | null
          gender?: string | null
          uid: string
        }
        Update: {
          address?: string | null
          blood_group?: string | null
          city?: string | null
          date_of_birth?: string | null
          gender?: string | null
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_uid_fkey"
            columns: ["uid"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          doctor_id: string
          id: string
          method: string
          notes: string | null
          patient_id: string
          screenshot_url: string | null
          status: string
          transaction_ref: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          method: string
          notes?: string | null
          patient_id: string
          screenshot_url?: string | null
          status?: string
          transaction_ref?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          method?: string
          notes?: string | null
          patient_id?: string
          screenshot_url?: string | null
          status?: string
          transaction_ref?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      prescriptions: {
        Row: {
          advice: string | null
          appointment_id: string | null
          created_at: string
          diagnosis: string
          doctor_id: string
          doctor_name: string
          doctor_pmdc_number: string
          doctor_specialization: string
          follow_up_date: string | null
          id: string
          medicines: Json
          patient_id: string
          patient_name: string
          tests: string[]
        }
        Insert: {
          advice?: string | null
          appointment_id?: string | null
          created_at?: string
          diagnosis: string
          doctor_id: string
          doctor_name: string
          doctor_pmdc_number: string
          doctor_specialization: string
          follow_up_date?: string | null
          id?: string
          medicines?: Json
          patient_id: string
          patient_name: string
          tests?: string[]
        }
        Update: {
          advice?: string | null
          appointment_id?: string | null
          created_at?: string
          diagnosis?: string
          doctor_id?: string
          doctor_name?: string
          doctor_pmdc_number?: string
          doctor_specialization?: string
          follow_up_date?: string | null
          id?: string
          medicines?: Json
          patient_id?: string
          patient_name?: string
          tests?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          is_blocked: boolean
          name: string
          phone: string
          role: string
          uid: string
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          is_blocked?: boolean
          name: string
          phone: string
          role: string
          uid?: string
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          is_blocked?: boolean
          name?: string
          phone?: string
          role?: string
          uid?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          patient_name: string
          rating: number
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
          patient_name: string
          rating: number
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          patient_name?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
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
