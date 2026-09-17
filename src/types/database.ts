export type OrgRole = 'owner' | 'trainer';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: number;
  organization_id: number;
  user_id: string;
  role: OrgRole;
  created_at: string;
  profile?: Profile;
  organization?: Organization;
}

export interface Student {
  id: number;
  organization_id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  id_number?: string | null;
  // Datos deportivos
  discipline: string;
  level: string;
  sport_goals?: string | null;
  coach_notes?: string | null;
  // Datos de emergencia
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  medical_insurance?: string | null;
  medical_insurance_number?: string | null;
  emergency_notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentDocument {
  id: number;
  organization_id: number;
  student_id: number;
  title: string;
  file_path: string;
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  created_at: string;
}

export interface Workout {
  id: number;
  organization_id: number;
  student_id: number;
  created_by?: string | null;
  workout_date: string;
  title: string;
  workout_type: string;
  notes?: string | null;
  distance_km?: number | null;
  duration_seconds?: number | null;
  elevation_gain_m?: number | null;
  average_pace_sec_km?: number | null;
  average_hr?: number | null;
  max_hr?: number | null;
  extra_metrics?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  student?: Student;
}

export interface Report {
  id: number;
  organization_id: number;
  student_id: number;
  created_by?: string | null;
  title: string;
  date_from: string;
  date_to: string;
  coach_summary?: string | null;
  metrics_snapshot: {
    total_workouts?: number;
    total_distance_km?: number;
    total_duration_seconds?: number;
    total_elevation_m?: number;
    avg_pace_sec_km?: number;
    avg_hr?: number;
    workouts_list?: Workout[];
  };
  created_at: string;
  student?: Student;
}
