import { createClient } from '@supabase/supabase-js';

// Validasi environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL dan Anon Key harus diset di .env.local. ' +
    'Silakan tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types untuk database
export interface User {
  id?: string;
  name: string;
  team: string;
  whatsapp: string;
  role: 'Admin' | 'Aktor';
  created_at?: string;
  updated_at?: string;
}

export interface Activity {
  id?: string;
  title: string;
  team: string;
  team_color: string;
  // PIC utama (Ketua Tim yang membuat kegiatan)
  pic_id?: string;
  pic_name?: string;
  // Legacy single actor (backward compat)
  actor_id: string;
  actor_name?: string;
  // Multi-actor via tabel activity_actors
  actor_ids?: string[];   // array UUID pelaksana
  actor_names?: string[]; // array nama pelaksana (denormalized)
  start_date: string;
  deadline: string;
  status: 'pending' | 'active' | 'completed' | 'overdue' | 'delayed';
  progress: number;
  description?: string;
  evidence_url?: string; // Link ke Google Drive untuk bukti dukung
  created_at?: string;
  updated_at?: string;
}

// Relasi many-to-many: satu kegiatan bisa punya banyak petugas pelaksana
export interface ActivityOfficer {
  id?: string;
  activity_id: string;
  user_id: string;
  user_name: string;
  user_team: string;
  created_at?: string;
}

// Legacy: ActivityActor (untuk backward compatibility, akan diganti dengan ActivityOfficer)
export interface ActivityActor {
  id?: string;
  activity_id: string;
  user_id: string;
  user_name: string;
  created_at?: string;
}

export interface Notification {
  id?: string;
  activity_id: string;
  user_id: string;
  type: 'created' | 'reminder_h1' | 'overdue' | 'evidence_uploaded';
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  error_message?: string;
  created_at?: string;
}

