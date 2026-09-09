"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  FileText,
  UserCheck,
  Zap,
  Search,
  ChevronDown,
  UserPlus,
  X,
} from "lucide-react";
import { TEAMS, API_ENDPOINTS } from "@/lib/constants";
import { displayTeamName } from "@/lib/db-helpers";
import { useAuth } from "@/components/layout/auth-guard";

interface UserOption {
  id: string;
  name: string;
  team: string;
  whatsapp: string;
  role: "Admin" | "Aktor";
}

type ActivityStatus = "pending" | "active" | "completed";

const TEAM_OPTIONS = TEAMS.filter((t) => t.id !== "all");

/** Hitung status otomatis dari tanggal mulai */
function computeAutoStatus(start_date: string, deadline: string): ActivityStatus {
  if (!start_date || !deadline) return "pending";
  const now = new Date();
  const start = new Date(start_date);
  if (now < start) return "pending";
  return "active";
}

const STATUS_PREVIEW: Record<ActivityStatus, { label: string; color: string; desc: string }> = {
  pending: {
    label: "Belum Dimulai",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    desc: "Tanggal mulai belum tiba",
  },
  active: {
    label: "Sedang Berjalan",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    desc: "Kegiatan dalam periode aktif",
  },
  completed: {
    label: "Selesai",
    color: "bg-green-100 text-green-700 border-green-200",
    desc: "Kegiatan sudah diselesaikan",
  },
};

export default function TambahKegiatanPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Daftar semua pegawai dari API
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // State form
  const [title, setTitle] = useState("");
  const [teamId, setTeamId] = useState(user?.team ?? "");
  const [actorId, setActorId] = useState("");
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  // UI State untuk petugas
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("");
  const [officerSearch, setOfficerSearch] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const teamObj = TEAM_OPTIONS.find((t) => t.id === teamId);
  const teamName = teamObj?.name ?? teamId;
  const teamColor = (teamObj as any)?.color ?? "#6B7280";
  const autoStatus = computeAutoStatus(startDate, deadline);
  const statusInfo = STATUS_PREVIEW[autoStatus];

  // Ambil semua pengguna saat mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.users);
        if (!res.ok) throw new Error();
        const result = await res.json();
        setAllUsers(result.data || []);
      } catch {
        // tetap bisa digunakan
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Data untuk dropdown aktor (semua pegawai, bisa lintas tim)
  const actorOptions = useMemo(() => {
    return allUsers.sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers]);

  const selectedActor = useMemo(() => {
    return allUsers.find((u) => u.id === actorId);
  }, [allUsers, actorId]);

  // Filter petugas berdasarkan tim yang dipilih dan search
  const availableOfficers = useMemo(() => {
    let officers = allUsers.filter((u) => u.id !== actorId); // Exclude aktor dari daftar petugas

    if (selectedTeamFilter && selectedTeamFilter !== "all") {
      officers = officers.filter((u) => u.team === selectedTeamFilter);
    }

    if (officerSearch.trim()) {
      const q = officerSearch.toLowerCase();
      officers = officers.filter((u) => u.name.toLowerCase().includes(q));
    }

    return officers.sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, actorId, selectedTeamFilter, officerSearch]);

  // Group petugas yang sudah dipilih berdasarkan tim
  const selectedOfficersByTeam = useMemo(() => {
    const grouped: Record<string, UserOption[]> = {};
    selectedOfficerIds.forEach((id) => {
      const officer = allUsers.find((u) => u.id === id);
      if (officer) {
        if (!grouped[officer.team]) grouped[officer.team] = [];
        grouped[officer.team].push(officer);
      }
    });
    return grouped;
  }, [allUsers, selectedOfficerIds]);

  const toggleOfficer = (id: string) => {
    setSelectedOfficerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeOfficer = (id: string) => {
    setSelectedOfficerIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const selectAllTeamOfficers = () => {
    const ids = availableOfficers.map((u) => u.id);
    setSelectedOfficerIds((prev) => new Set([...prev, ...ids]));
  };

  const clearAllOfficers = () => setSelectedOfficerIds(new Set());

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!actorId) {
      setSubmitError("Pilih Aktor/PIC terlebih dahulu.");
      return;
    }

    if (deadline && startDate && new Date(deadline) < new Date(startDate)) {
      setSubmitError("Tanggal deadline tidak boleh lebih awal dari tanggal mulai.");
      return;
    }

    const selectedOfficers = allUsers.filter((u) => selectedOfficerIds.has(u.id));

    try {
      setSubmitting(true);
      const payload = {
        title,
        team: teamId,
        team_color: teamColor,
        actor_id: actorId,
        actor_name: selectedActor?.name || "",
        officer_ids: selectedOfficers.map((u) => u.id),
        officer_names: selectedOfficers.map((u) => u.name),
        officer_teams: selectedOfficers.map((u) => u.team),
        start_date: new Date(startDate).toISOString(),
        deadline: new Date(deadline).toISOString(),
        description,
        evidence_url: evidenceUrl || null,
      };

      const res = await fetch(API_ENDPOINTS.activities, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan kegiatan");

      setSubmitSuccess(true);
      setTimeout(() => router.push("/admin/kalender"), 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <Link href="/admin/kalender" className="hover:text-gray-800 transition-colors">
              Kalender Kegiatan
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-800 font-medium">Tambah Kegiatan</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Kegiatan Baru</h1>
          <p className="text-gray-500 text-sm mt-1">
            Lengkapi informasi kegiatan, pilih PIC/Aktor, dan tentukan tim pelaksana.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Success */}
          {submitSuccess && (
            <div className="flex items-center gap-3 bg-green-50 border-b border-green-100 px-6 py-4 text-green-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                Kegiatan berhasil disimpan! Mengalihkan ke kalender…
              </span>
            </div>
          )}

          {/* Error */}
          {submitError && (
            <div className="flex items-center gap-3 bg-red-50 border-b border-red-100 px-6 py-4 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-7">
            {/* ─── Tim Pelaksana ─── */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Tim Pelaksana
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 bg-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
                // disabled={submitting || submitSuccess}
                disabled
              >
                <option value="">{displayTeamName(teamName)}</option>
                {TEAM_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ─── Nama Kegiatan ─── */}
            <div>
              <label htmlFor="title" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Nama Kegiatan
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Sosialisasi SIMAK ke Tim IPDS"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
                disabled={submitting || submitSuccess}
              />
            </div>

            {/* ─── Aktor / PIC (Dropdown) ─── */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <UserCheck className="w-4 h-4 text-amber-500" />
                Aktor / PIC / Penanggung Jawab
                <span className="text-xs font-normal text-gray-400">(Pilih 1 orang)</span>
              </label>

              {loadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memuat daftar pegawai…
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={actorId}
                    onChange={(e) => setActorId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none"
                    required
                    disabled={submitting || submitSuccess}
                  >
                    <option value="">Pilih PIC / Penanggung Jawab</option>
                    {actorOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {TEAM_OPTIONS.find((t) => t.id === u.team)?.name || u.team}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {selectedActor && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
                    {selectedActor.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900">{selectedActor.name}</p>
                    <p className="text-xs text-amber-700">
                      {TEAM_OPTIONS.find((t) => t.id === selectedActor.team)?.name || selectedActor.team}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Petugas Pelaksana (Multi-select dengan filter tim) ─── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <UserPlus className="w-4 h-4 text-indigo-500" />
                  Petugas Pelaksana
                  <span className="text-xs font-normal text-gray-400">(Bisa banyak, lintas tim)</span>
                  {selectedOfficerIds.size > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-bold">
                      {selectedOfficerIds.size} dipilih
                    </span>
                  )}
                </label>
              </div>

              {/* Petugas yang sudah dipilih (badges by team) */}
              {Object.keys(selectedOfficersByTeam).length > 0 && (
                <div className="mb-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <p className="text-xs font-semibold text-indigo-700 mb-2">Petugas Terpilih:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedOfficersByTeam).map(([team, officers]) => (
                      <div key={team} className="flex flex-wrap gap-1.5">
                        {officers.map((officer) => (
                          <span
                            key={officer.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-200 rounded-full text-xs font-medium text-gray-700"
                          >
                            {officer.name}
                            <button
                              type="button"
                              onClick={() => removeOfficer(officer.id)}
                              className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                              disabled={submitting || submitSuccess}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memuat daftar pegawai…
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Filter bar */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                    {/* Filter tim */}
                    <select
                      value={selectedTeamFilter}
                      onChange={(e) => setSelectedTeamFilter(e.target.value)}
                      className="flex-shrink-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={submitting || submitSuccess}
                    >
                      <option value="">Semua Tim</option>
                      {TEAM_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={officerSearch}
                        onChange={(e) => setOfficerSearch(e.target.value)}
                        placeholder="Cari nama petugas…"
                        className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={submitting || submitSuccess}
                      />
                    </div>

                    {/* Bulk actions */}
                    <button
                      type="button"
                      onClick={selectAllTeamOfficers}
                      className="px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                      disabled={submitting || submitSuccess}
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={clearAllOfficers}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                      disabled={submitting || submitSuccess}
                    >
                      Hapus Pilihan
                    </button>
                  </div>

                  {/* Daftar petugas */}
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {availableOfficers.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        Tidak ada petugas ditemukan
                      </p>
                    ) : (
                      availableOfficers.map((u) => {
                        const checked = selectedOfficerIds.has(u.id);
                        const teamInfo = TEAM_OPTIONS.find((t) => t.id === u.team);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                              checked ? "bg-indigo-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleOfficer(u.id)}
                              className="w-4 h-4 rounded accent-indigo-600"
                              disabled={submitting || submitSuccess}
                            />
                            <div
                              className="w-8 h-8 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0"
                              style={{ backgroundColor: teamInfo?.color || "#6B7280" }}
                            >
                              {u.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                              <p className="text-xs text-gray-400">{teamInfo?.name || u.team}</p>
                            </div>
                            {checked && <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-1.5">
                Petugas bisa dari tim mana saja. Mereka akan menerima notifikasi WhatsApp.
              </p>
            </div>

            {/* ─── Tanggal ─── */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label htmlFor="start_date" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  id="start_date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  required
                  disabled={submitting || submitSuccess}
                />
              </div>
              <div>
                <label htmlFor="deadline" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  Tanggal Deadline
                </label>
                <input
                  type="date"
                  id="deadline"
                  value={deadline}
                  min={startDate || undefined}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  required
                  disabled={submitting || submitSuccess}
                />
              </div>
            </div>

            {/* ─── Preview Status Otomatis ─── */}
            {startDate && deadline && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Status Otomatis
                </label>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${statusInfo.color}`}>
                  <span className="font-semibold">{statusInfo.label}</span>
                  <span className="text-opacity-70">—</span>
                  <span className="opacity-75">{statusInfo.desc}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Status dihitung otomatis dari tanggal dan tidak perlu dipilih manual.
                </p>
              </div>
            )}

            {/* ─── Deskripsi ─── */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Deskripsi / Catatan{" "}
                <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Keterangan tambahan, target luaran, atau instruksi khusus…"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
                disabled={submitting || submitSuccess}
              />
            </div>

            {/* ─── Tautan Bukti Dukung (Google Drive) ─── */}
            <div>
              <label htmlFor="evidence_url" className="block text-sm font-semibold text-gray-700 mb-2">
                Tautan Bukti Dukung (Google Drive){" "}
                <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                id="evidence_url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                disabled={submitting || submitSuccess}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Tempel link folder Google Drive berisi bukti pelaksanaan kegiatan.
              </p>
            </div>

            {/* ─── Aksi ─── */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {selectedOfficerIds.size === 0
                  ? "Belum ada petugas yang dipilih"
                  : `${selectedOfficerIds.size} petugas akan ditugaskan`}
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/kalender"
                  className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={submitting || submitSuccess}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:scale-95 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan…
                    </>
                  ) : submitSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Tersimpan!
                    </>
                  ) : (
                    "Simpan Kegiatan"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
