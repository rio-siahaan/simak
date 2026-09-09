// Interface untuk tipe data yang akan digunakan di Supabase
// File ini akan menjadi single source of truth untuk struktur data SIMAK

export interface User {
  id: string;
  name: string;
  team: TeamType;
  whatsapp: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = "Admin" | "Aktor";

export type TeamType =
  | "ipds"
  | "sosial"
  | "produksi"
  | "distribusi"
  | "nwas"
  | "pss"
  | "umum"
  | "sakernas";

export interface Activity {
  id: string;
  title: string;
  team: TeamType;
  actor_id?: string; // Foreign key ke User
  actor_name: string;
  actor_whatsapp: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  deadline?: string; // ISO date string
  status: ActivityStatus;
  notes?: string;
  attachment_urls?: string[]; // Array URL file bukti dukung
  notification_sent?: boolean;
  reminder_sent?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string; // Admin yang membuat
}

export type ActivityStatus =
  | "pending" // Belum dimulai
  | "active" // Sedang berjalan
  | "completed"; // Selesai

export interface Notification {
  id: string;
  activity_id: string;
  user_id: string;
  type: NotificationType;
  sent_at: string;
  status: NotificationStatus;
  whatsapp_message_id?: string;
  error_message?: string;
}

export type NotificationType =
  | "created" // Notifikasi saat kegiatan dibuat
  | "completed"; // Notifikasi saat kegiatan selesai

export type NotificationStatus = "pending" | "sent" | "failed";

export interface Attachment {
  id: string;
  activity_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
}

// Team metadata dengan warna untuk kalender
export interface TeamMetadata {
  id: TeamType;
  name: string;
  color: string; // Hex color untuk display di kalender
}

export const TEAM_METADATA: Record<TeamType, TeamMetadata> = {
  sosial: { id: "sosial", name: "Ketua Tim Sosial", color: "#3B82F6" },
  produksi: { id: "produksi", name: "Ketua Tim Produksi", color: "#F97316" },
  distribusi: { id: "distribusi", name: "Ketua Tim Distribusi", color: "#10B981" },
  ipds: { id: "ipds", name: "Ketua Tim IPDS", color: "#8B5CF6" },
  nwas: { id: "nwas", name: "Ketua Tim Nerwilis", color: "#EF4444" },
  pss: { id: "pss", name: "Ketua Tim PSS", color: "#06B6D4" },
  umum: { id: "umum", name: "Kepala Sub Bagian Umum", color: "#F59E0B" },
  sakernas: { id: "sakernas", name: "Ketua Tim Sakernas", color: "#EC4899" },
};

// Helper type untuk form data
export interface ActivityFormData {
  title: string;
  team: TeamType | "";
  actor_name: string;
  actor_whatsapp: string;
  start_date: string;
  deadline: string;
  status: ActivityStatus;
  notes?: string;
}

export interface UserFormData {
  name: string;
  team: TeamType | "";
  role: UserRole | "";
  whatsapp: string;
}

// Response type untuk API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Statistik dashboard
export interface DashboardStats {
  active_activities: number;
  overdue_activities: number;
  due_soon_activities: number; // ≤2 hari
  failed_notifications: number;
}

export interface TeamCompliance {
  team: TeamType;
  team_name: string;
  total_activities: number;
  on_time_activities: number;
  compliance_percentage: number;
}

export interface RecentActivity {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  activity_title?: string;
}
