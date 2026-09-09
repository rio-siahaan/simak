"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  Loader2,
  X,
  ExternalLink,
  Save,
} from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants";
import { useAuth } from "@/components/layout/auth-guard";

interface Activity {
  id: string;
  title: string;
  team: string;
  team_color: string;
  actor_id: string;
  actor_name: string;
  start_date: string;
  deadline: string;
  status: "pending" | "active" | "completed";
  description?: string;
  evidence_url?: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Belum Dimulai",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Clock,
  },
  active: {
    label: "Sedang Berjalan",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock,
  },
  completed: {
    label: "Selesai",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
};

const TEAMS = [
  "Semua Tim",
  "Ketua Tim IPDS",
  "Ketua Tim Sosial",
  "Ketua Tim Produksi",
  "Ketua Tim Distribusi",
  "Ketua Tim Nerwilis",
  "Ketua Tim PSS",
  "Kepala Sub Bagian Umum",
  "Ketua Tim Sakernas",
];

const STATUS_FILTERS = [
  "Semua Status",
  "Belum Dimulai",
  "Sedang Berjalan",
  "Selesai",
];

export default function DaftarKegiatanPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("Semua Tim");
  const [selectedStatus, setSelectedStatus] = useState("Semua Status");
  const [showFilters, setShowFilters] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States untuk Detail / Update Status Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [editStatus, setEditStatus] = useState<Activity["status"]>("pending");
  const [editEvidenceUrl, setEditEvidenceUrl] = useState("");
  const [savingProgress, setSavingProgress] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");

  // Fetch activities dari API - menggunakan useCallback untuk menghindari stale closure
  const fetchActivities = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // Jika login sebagai Aktor, batasi hanya kegiatan dia
      if (user.role === "Aktor") {
        params.append("actor_id", user.id);
      } else {
        if (selectedTeam && selectedTeam !== "Semua Tim") {
          params.append("team", selectedTeam);
        }
      }

      if (selectedStatus && selectedStatus !== "Semua Status") {
        params.append("status", selectedStatus);
      }

      const response = await fetch(
        `${API_ENDPOINTS.activities}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data kegiatan");
      }

      const result = await response.json();
      // Status "overdue"/"delayed" sudah dihapus dari sistem — data lama yang
      // masih ber-status tersebut diseragamkan tampil sebagai "Sedang Berjalan".
      const normalized = (result.data || []).map((a: any) => ({
        ...a,
        status:
          a.status === "overdue" || a.status === "delayed" ? "active" : a.status,
      }));
      setActivities(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedTeam, selectedStatus]);

  // Panggil fetchActivities saat dependencies berubah
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kegiatan "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.activities}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus kegiatan");
      }

      fetchActivities();
      alert("Kegiatan berhasil dihapus");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus kegiatan");
      console.error("Error deleting activity:", err);
    }
  };

  const openDetailsModal = (activity: Activity, mode: "view" | "edit" = "view") => {
    setSelectedActivity(activity);
    setEditStatus(activity.status);
    setEditEvidenceUrl(activity.evidence_url || "");
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    // Validasi URL bukti dukung jika diisi
    if (editEvidenceUrl && !editEvidenceUrl.startsWith("http://") && !editEvidenceUrl.startsWith("https://")) {
      alert("Tautan bukti dukung harus berupa URL yang valid (diawali http:// atau https://)");
      return;
    }

    try {
      setSavingProgress(true);
      const response = await fetch(`${API_ENDPOINTS.activities}/${selectedActivity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          evidence_url: editEvidenceUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan perubahan status");
      }

      // Refresh list & tutup modal
      await fetchActivities();
      setIsModalOpen(false);
      alert("Status kegiatan berhasil diperbarui");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan perubahan");
      console.error("Error updating activity:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = activity.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper untuk mapping warna tim ke badge color
  const getTeamBadgeColor = (team: string) => {
    const colorMap: { [key: string]: string } = {
      "Ketua Tim Sosial": "bg-blue-100 text-blue-800 border-blue-200",
      "Ketua Tim Produksi": "bg-orange-100 text-orange-800 border-orange-200",
      "Ketua Tim Distribusi": "bg-green-100 text-green-800 border-green-200",
      "Ketua Tim IPDS": "bg-purple-100 text-purple-800 border-purple-200",
      "Ketua Tim Nerwilis": "bg-red-100 text-red-800 border-red-200",
      "Ketua Tim PSS": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "Kepala Sub Bagian Umum": "bg-amber-100 text-amber-800 border-amber-200",
      "Ketua Tim Sakernas": "bg-pink-100 text-pink-800 border-pink-200",
    };
    return colorMap[team] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Cek apakah user memiliki otorisasi ubah status
  const canUserEditStatus = (activity: Activity) => {
    if (!user) return false;
    return user.role === "Admin" || activity.actor_id === user.id;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-[1400px] mx-auto p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
              {user?.role === "Admin" ? "Administrasi Kegiatan Lintas Tim" : "Tugas & Kegiatan Saya"}
            </p>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Daftar Kegiatan</h1>
          </div>
          
          {user?.role === "Admin" && (
            <Link
              href="/admin/kalender/tambah"
              className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
            >
              + Tambah Kegiatan
            </Link>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama kegiatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-850"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 border rounded-xl text-sm font-semibold transition-all ${
              showFilters
                ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-5 h-5" />
            Filter Saringan
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user?.role === "Admin" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Tim Kerja
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  >
                    {TEAMS.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={user?.role === "Aktor" ? "col-span-2" : ""}>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Status Kegiatan
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                >
                  {STATUS_FILTERS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
            <span className="text-gray-500 font-medium">Memuat data kegiatan...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <button
              onClick={fetchActivities}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Stats Summary */}
        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Kegiatan</p>
              <p className="text-3xl font-extrabold text-gray-900">
                {filteredActivities.length}
              </p>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Sedang Berjalan</p>
              <p className="text-3xl font-extrabold text-blue-700">
                {filteredActivities.filter((a) => a.status === "active").length}
              </p>
            </div>
            <div className="bg-green-50/50 border border-green-100 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Selesai</p>
              <p className="text-3xl font-extrabold text-green-700">
                {filteredActivities.filter((a) => a.status === "completed").length}
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filteredActivities.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Kegiatan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Tim
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Aktor / PIC
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Tenggat Waktu
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredActivities.map((activity) => {
                    const statusInfo =
                      STATUS_CONFIG[activity.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                    const StatusIcon = statusInfo.icon;
                    const daysUntil = getDaysUntilDeadline(activity.deadline);

                    return (
                      <tr
                        key={activity.id}
                        className="hover:bg-gray-55/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800 text-sm">
                            {activity.title}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Mulai: {new Date(activity.start_date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTeamBadgeColor(activity.team)}`}
                          >
                            {activity.team}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                          {activity.actor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-800">
                            {new Date(activity.deadline).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </div>
                          <div
                            className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                              daysUntil < 0
                                ? "text-red-600"
                                : daysUntil <= 2
                                ? "text-amber-600"
                                : "text-gray-400"
                            }`}
                          >
                            {daysUntil < 0
                              ? `Lewat ${Math.abs(daysUntil)} hari`
                              : daysUntil === 0
                              ? "Hari ini"
                              : `${daysUntil} hari lagi`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            
                            {/* Tombol Detail */}
                            <button
                              onClick={() => openDetailsModal(activity, "view")}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Tombol Edit Status (Bisa Admin / Aktor PIC) */}
                            {canUserEditStatus(activity) && (
                              <button
                                onClick={() => openDetailsModal(activity, "edit")}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                title="Update Status"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {/* Tombol Hapus (Hanya Admin) */}
                            {user?.role === "Admin" && (
                              <button
                                onClick={() => handleDelete(activity.id, activity.title)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                title="Hapus Kegiatan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredActivities.length === 0 && (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <p className="text-gray-500 font-medium">
              {searchQuery
                ? "Tidak ada kegiatan yang ditemukan untuk pencarian tersebut."
                : "Belum ada data kegiatan yang ditugaskan."}
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DETIL & UPDATE STATUS MODAL (Unifies Details + Status & Evidence form) */}
        {/* ========================================================================= */}
        {isModalOpen && selectedActivity && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">
                    Rincian Kegiatan &middot; Tim {selectedActivity.team}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    {selectedActivity.title}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 flex-1">
                {modalMode === "view" ? (
                  /* Mode Tampilan Biasa (Read-Only) */
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tanggal Mulai</span>
                        <p className="text-sm font-semibold text-gray-800">
                          {new Date(selectedActivity.start_date).toLocaleDateString("id-ID", {
                            dateStyle: "long"
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tenggat Waktu</span>
                        <p className="text-sm font-semibold text-gray-800">
                          {new Date(selectedActivity.deadline).toLocaleDateString("id-ID", {
                            dateStyle: "long"
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Aktor / PIC</span>
                        <p className="text-sm font-semibold text-gray-800">{selectedActivity.actor_name}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status Kegiatan</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            STATUS_CONFIG[selectedActivity.status]?.color || STATUS_CONFIG.pending.color
                          }`}>
                            {STATUS_CONFIG[selectedActivity.status]?.label || selectedActivity.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deskripsi */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Deskripsi Tugas</span>
                      <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed min-h-[60px]">
                        {selectedActivity.description || "Tidak ada deskripsi detail untuk kegiatan ini."}
                      </p>
                    </div>

                    {/* Bukti Dukung Link */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Tautan Bukti Dukung (Google Drive)</span>
                      {selectedActivity.evidence_url ? (
                        <a
                          href={selectedActivity.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50/50 border border-blue-100 px-4 py-2.5 rounded-xl transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Buka Google Drive Bukti Dukung
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400 italic bg-gray-50 border border-gray-100 p-3.5 rounded-xl">
                          Belum ada tautan bukti dukung yang dilampirkan.
                        </p>
                      )}
                    </div>

                    {/* Button to Switch to Edit Mode (jika diizinkan) */}
                    {canUserEditStatus(selectedActivity) && (
                      <div className="pt-4 border-t border-gray-150 flex justify-end">
                        <button
                          onClick={() => setModalMode("edit")}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          Perbarui Status & Bukti Dukung
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Mode Update Status & Bukti Dukung */
                  <form onSubmit={handleUpdateActivity} className="space-y-5">
                    
                    {/* Status Dropdown */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status Tugas
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as Activity["status"])}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="pending">Belum Dimulai</option>
                        <option value="active">Sedang Berjalan</option>
                        <option value="completed">Selesai</option>
                      </select>
                    </div>

                    {/* Google Drive Link */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Tautan Bukti Dukung (Google Drive Folder/File)
                      </label>
                      <input
                        type="text"
                        placeholder="https://drive.google.com/drive/folders/..."
                        value={editEvidenceUrl}
                        onChange={(e) => setEditEvidenceUrl(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <span className="text-[10px] text-gray-400 block leading-normal">
                        * Masukkan tautan Google Drive berisi folder bukti dukung (laporan, foto kegiatan, xls, dsb).
                      </span>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setModalMode("view")}
                        className="px-4 py-2 text-xs font-semibold text-gray-650 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        Batal
                      </button>
                      
                      <button
                        type="submit"
                        disabled={savingProgress}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
                      >
                        {savingProgress ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Simpan Perubahan
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
