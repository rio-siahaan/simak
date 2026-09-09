"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Loader2, X, ExternalLink, Save, CheckCircle2, Clock } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants";
import { getTeamColor } from "@/lib/db-helpers";
import { displayTeamName } from "@/lib/db-helpers";
import { useAuth } from "@/components/layout/auth-guard";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Setup localizer dengan date-fns dan locale Indonesia
const locales = {
  id: id,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: id }),
  getDay,
  locales,
});

// Interface untuk Event
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  team: string;
  teamColor: string;
  actorId?: string;
  aktor?: string;
  deadline?: Date;
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

// Data tim dengan warna masing-masing
const TEAMS = [
  { id: "all", name: "Semua Tim", color: "" },
  { id: "sosial", name: "Ketua Tim Sosial", color: "#3B82F6" },
  { id: "produksi", name: "Ketua Tim Produksi", color: "#F97316" },
  { id: "distribusi", name: "Ketua Tim Distribusi", color: "#10B981" },
  { id: "ipds", name: "Ketua Tim IPDS", color: "#8B5CF6" },
  { id: "nwas", name: "Ketua Tim NWAS", color: "#EF4444" },
  { id: "pss", name: "Ketua Tim PSS", color: "#06B6D4" },
  { id: "umum", name: "Kepala Sub Bagian Umum", color: "#F59E0B" },
  { id: "sakernas", name: "Ketua Tim Sakernas", color: "#EC4899" },
];

// Lookup cepat: team id -> warna hex
const TEAM_COLOR_MAP: Record<string, string> = TEAMS.reduce((acc, t) => {
  if (t.id !== "all") acc[t.id] = t.color;
  return acc;
}, {} as Record<string, string>);

// Warna teks putih kadang susah dibaca di warna terang (kuning, cyan) —
// daftar manual team yang perlu teks gelap biar tetap kontras
const DARK_TEXT_TEAMS = new Set(["umum", "pss"]);

const eventStyleGetter = (event: any) => {
  const teamColor = TEAM_COLOR_MAP[event.team] || "#6B7280"; // fallback abu-abu kalau team tidak dikenali
  const isDarkText = DARK_TEXT_TEAMS.has(event.team);

  return {
    style: {
      backgroundColor: teamColor,
      borderRadius: "6px",
      border: "none",
      color: isDarkText ? "#1F2937" : "#ffffff",
      fontSize: "12px",
      fontWeight: 600,
      padding: "2px 6px",
    },
  };
};

export default function KalenderKegiatanPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>("month");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States untuk Toggle Aktor & Modalnya
  const [showOnlyMyEvents, setShowOnlyMyEvents] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editStatus, setEditStatus] = useState<CalendarEvent["status"]>("pending");
  const [editEvidenceUrl, setEditEvidenceUrl] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");

  // Fetch activities dari API berdasarkan bulan yang ditampilkan
  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user, currentDate, selectedTeam]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dapatkan range tanggal untuk bulan yang ditampilkan
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const params = new URLSearchParams({
        start_date: monthStart.toISOString(),
        end_date: monthEnd.toISOString(),
      });

      // Filter tim dari dropdown jika admin (atau aktor tapi tidak filter event pribadi)
      if (selectedTeam && selectedTeam !== "all") {
        params.append("team", TEAMS.find(t => t.id === selectedTeam)?.name || "");
      }

      const response = await fetch(
        `${API_ENDPOINTS.activities}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data kegiatan");
      }

      const result = await response.json();

      // Transform data dari API ke format CalendarEvent
      const transformedEvents: CalendarEvent[] = (result.data || []).map((activity: any) => ({
        id: activity.id,
        title: activity.title,
        start: new Date(activity.start_date),
        end: new Date(activity.deadline),
        team: activity.team,
        teamColor: activity.team_color || getTeamColor(activity.team),
        actorId: activity.actor_id,
        aktor: activity.actor_name,
        deadline: new Date(activity.deadline),
        // Normalisasi status lama (overdue/delayed) jadi active
        status: activity.status === "overdue" || activity.status === "delayed" ? "active" : activity.status,
        description: activity.description,
        evidence_url: activity.evidence_url,
      }));

      setEvents(transformedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      console.error("Error fetching activities:", err);
    } finally {
      setView("month"); // default back to month on loading
      setLoading(false);
    }
  };

  // Filter events berdasarkan filter tim & toggle aktor
  const filteredEvents = useMemo(() => {
    let result = events;

    // Saring tim jika ada pilihan tim khusus
    if (selectedTeam !== "all") {
      const teamName = TEAMS.find((t) => t.id === selectedTeam)?.name;
      result = result.filter((event) => event.team === teamName);
    }

    // Jika Aktor dan toggle aktif, saring yang milik pribadi saja
    if (user?.role === "Aktor" && showOnlyMyEvents) {
      result = result.filter((event) => event.actorId === user.id);
    }

    return result;
  }, [events, selectedTeam, user, showOnlyMyEvents]);

  // // Custom event style berdasarkan tim
  // const eventStyleGetter = (event: CalendarEvent) => {
  //   const style = {
  //     backgroundColor: event.teamColor,
  //     borderRadius: "8px",
  //     opacity: 0.9,
  //     color: "white",
  //     border: "none",
  //     display: "block",
  //     fontSize: "12px",
  //     fontWeight: 600,
  //     padding: "3px 8px",
  //     boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  //   };
  //   return { style };
  // };

  // Handle navigasi bulan
  const handleNavigate = useCallback((action: "PREV" | "NEXT" | "TODAY") => {
    setCurrentDate((prevDate) => {
      if (action === "PREV") return subMonths(prevDate, 1);
      if (action === "NEXT") return addMonths(prevDate, 1);
      return new Date();
    });
  }, []);

  // Handle klik event untuk edit / detail
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditStatus(event.status);
    setEditEvidenceUrl(event.evidence_url || "");
    setModalMode("view");
    setIsModalOpen(true);
  }, []);

  // Custom messages dalam Bahasa Indonesia
  const messages = {
    allDay: "Sepanjang hari",
    previous: "Sebelumnya",
    next: "Selanjutnya",
    today: "Hari ini",
    month: "Bulan",
    week: "Minggu",
    day: "Hari",
    agenda: "Agenda",
    date: "Tanggal",
    time: "Waktu",
    event: "Kegiatan",
    noEventsInRange: "Tidak ada kegiatan pada rentang waktu ini.",
    showMore: (total: number) => `+${total} lagi`,
  };

  // Cek apakah user boleh edit status
  const canUserEditStatus = (event: CalendarEvent) => {
    if (!user) return false;
    return user.role === "Admin" || event.actorId === user.id;
  };

  // Handle submit perubahan status
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    if (editEvidenceUrl && !editEvidenceUrl.startsWith("http://") && !editEvidenceUrl.startsWith("https://")) {
      alert("Tautan bukti dukung harus berupa URL yang valid (diawali http:// atau https://)");
      return;
    }

    try {
      setSavingStatus(true);
      const response = await fetch(`${API_ENDPOINTS.activities}/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          evidence_url: editEvidenceUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengupdate status kegiatan");
      }

      await fetchActivities();
      setIsModalOpen(false);
      alert("Status kegiatan berhasil diperbarui");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui");
      console.error(err);
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-[1400px] mx-auto p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
              Kalender Lintas Tim
            </p>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Kalender Kegiatan
            </h1>
          </div>

          <div className="flex items-center gap-4">

            {/* Toggle filter Aktor */}
            {user?.role === "Aktor" && (
              <label className="flex items-center gap-2 cursor-pointer bg-purple-50/80 border border-purple-200 rounded-xl px-4 py-2.5 hover:bg-purple-50 transition-all shadow-sm">
                <input
                  type="checkbox"
                  checked={showOnlyMyEvents}
                  onChange={(e) => setShowOnlyMyEvents(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-purple-700">Tampilkan kegiatan saya saja</span>
              </label>
            )}

            {user?.role === "Admin" && (
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 shadow-sm"
              >
                {TEAMS.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}

            {user?.role === "Admin" && (
              <Link
                href="/admin/kalender/tambah"
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
              >
                <Plus className="w-5 h-5" />
                Tambah Kegiatan
              </Link>
            )}
          </div>
        </div>
        {/* Legend - Keterangan Warna Tim */}
        {!loading && !error && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
              Keterangan Warna Tim Kerja
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {TEAMS.filter((team) => team.id !== "all").map((team) => (
                <div key={team.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-md shadow-sm shrink-0"
                    style={{ backgroundColor: team.color }}
                  ></div>
                  <span className="text-xs font-semibold text-gray-700">{team.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <br />
        {/* Loading & Error */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
            <span className="text-gray-500 font-medium text-sm">Memuat kalender kegiatan...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <p className="text-red-700 font-semibold mb-3">{error}</p>
            <button
              onClick={fetchActivities}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Calendar Container */}
        {!loading && !error && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
            {/* Custom Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 capitalize">
                {format(currentDate, "MMMM yyyy", { locale: id })}
              </h2>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => handleNavigate("TODAY")}
                  className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => handleNavigate("PREV")}
                  className="p-2 hover:bg-gray-105 rounded-lg text-gray-700 transition-colors"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavigate("NEXT")}
                  className="p-2 hover:bg-gray-105 rounded-lg text-gray-700 transition-colors"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* React Big Calendar */}
            <div className="p-6" style={{ height: "680px" }}>
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                view={view}
                onView={setView}
                date={currentDate}
                onNavigate={(date: Date) => setCurrentDate(date)}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                messages={messages}
                culture="id"
                popup
                views={["month", "week", "day", "agenda"]}
                toolbar={false}
              />
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* DETAIL & EDIT MODAL FOR CALENDAR EVENTS                    */}
        {/* ========================================================== */}
        {isModalOpen && selectedEvent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col">

              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">
                    Kegiatan &middot; {displayTeamName(selectedEvent.team)}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    {selectedEvent.title}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 flex-1">
                {modalMode === "view" ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mulai Kegiatan</span>
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedEvent.start.toLocaleDateString("id-ID", { dateStyle: "long" })}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Deadline / Selesai</span>
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedEvent.end.toLocaleDateString("id-ID", { dateStyle: "long" })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Aktor / PIC</span>
                        <p className="text-sm font-semibold text-gray-800">{selectedEvent.aktor || "Tidak ditugaskan"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${STATUS_CONFIG[selectedEvent.status]?.color || STATUS_CONFIG.pending.color
                            }`}>
                            {STATUS_CONFIG[selectedEvent.status]?.label || selectedEvent.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Keterangan / Deskripsi</span>
                      <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed min-h-[60px]">
                        {selectedEvent.description || "Tidak ada deskripsi rinci."}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Tautan Bukti Dukung (Drive)</span>
                      {selectedEvent.evidence_url ? (
                        <a
                          href={selectedEvent.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50/50 border border-blue-100 px-4 py-2.5 rounded-xl transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Buka Google Drive Bukti Dukung
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400 italic bg-gray-50 border border-gray-100 p-3.5 rounded-xl">
                          Belum melampirkan bukti dukung.
                        </p>
                      )}
                    </div>

                    {canUserEditStatus(selectedEvent) && (
                      <div className="pt-4 border-t border-gray-150 flex justify-end">
                        <button
                          onClick={() => setModalMode("edit")}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          Update Status & Bukti Dukung
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveStatus} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status Kegiatan
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as CalendarEvent["status"])}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="pending">Belum Dimulai</option>
                        <option value="active">Sedang Berjalan</option>
                        <option value="completed">Selesai</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Tautan Google Drive Bukti Dukung
                      </label>
                      <input
                        type="text"
                        placeholder="https://drive.google.com/drive/folders/..."
                        value={editEvidenceUrl}
                        onChange={(e) => setEditEvidenceUrl(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

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
                        disabled={savingStatus}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                      >
                        {savingStatus ? (
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

        {/* Global styles overriding big calendar defaults */}
        <style jsx global>{`
          .rbc-calendar {
            font-family: inherit;
          }

          .rbc-header {
            padding: 12px 8px;
            font-weight: 700;
            font-size: 13px;
            color: #4b5563;
            border-bottom: 1px solid #e5e7eb;
            background-color: #f9fafb;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .rbc-date-cell {
            padding: 8px;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
          }

          .rbc-today {
            background-color: #fef3c7/50 !important;
          }

          .rbc-off-range-bg {
            background-color: #f9fafb/50;
          }

          .rbc-event {
            transition: all 0.2s ease;
          }

          .rbc-event:hover {
            transform: scale(1.02);
            opacity: 1 !important;
          }

          .rbc-month-view {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }

          .rbc-day-bg:hover {
            background-color: #f3f4f6/50;
          }
        `}</style>

      </div>
    </div>
  );
}
