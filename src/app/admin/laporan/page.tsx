"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Bell,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

interface Activity {
  id: string;
  title: string;
  team: string | null;
  actor_name: string | null;
  start_date: string;
  deadline: string;
  status: "pending" | "active" | "completed";
}

interface Notification {
  id: string;
  status: "pending" | "sent" | "failed";
}

export default function RekapLaporanPage() {
  const [selectedReport, setSelectedReport] = useState("overview");

  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Ambil semua kegiatan & notifikasi dari database (via API yang sudah ada)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [actRes, notifRes] = await Promise.all([
          fetch("/api/activities"),
          fetch("/api/notifications"),
        ]);
        const actData = actRes.ok ? await actRes.json() : null;
        const notifData = notifRes.ok ? await notifRes.json() : null;
        if (!cancelled) {
          setActivities(Array.isArray(actData?.data) ? actData.data : []);
          setNotifications(
            Array.isArray(notifData?.data) ? notifData.data : []
          );
        }
      } catch (err) {
        // Network error / response tidak ok -> jangan crash
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== AGREGASI KEGIATAN =====
  const totalKegiatan = activities.length;
  const totalSelesai = activities.filter((a) => a.status === "completed").length;
  const totalBerjalan = activities.filter((a) => a.status === "active").length;
  const totalBelum = activities.filter((a) => a.status === "pending").length;

  // Kelompokkan kegiatan per bulan (dari tanggal mulai start_date)
  const monthlyStats = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; total: number; completed: number; active: number; pending: number }
    >();
    for (const a of activities) {
      const d = new Date(a.start_date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (!map.has(key)) {
        map.set(key, { key, label, total: 0, completed: 0, active: 0, pending: 0 });
      }
      const row = map.get(key)!;
      row.total++;
      if (a.status === "completed") row.completed++;
      else if (a.status === "active") row.active++;
      else if (a.status === "pending") row.pending++;
    }
    // Urutkan ascending (bulan tertua -> terbaru)
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [activities]);

  // Kelompokkan kegiatan per tim
  const teamStats = useMemo(() => {
    const map = new Map<
      string,
      { team: string; total: number; completed: number; active: number; pending: number }
    >();
    for (const a of activities) {
      const team = a.team || "Tanpa Tim";
      if (!map.has(team)) {
        map.set(team, { team, total: 0, completed: 0, active: 0, pending: 0 });
      }
      const row = map.get(team)!;
      row.total++;
      if (a.status === "completed") row.completed++;
      else if (a.status === "active") row.active++;
      else if (a.status === "pending") row.pending++;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [activities]);

  // ===== AGREGASI NOTIFIKASI =====
  const notifTotal = notifications.length;
  const notifSent = notifications.filter((n) => n.status === "sent").length;
  const notifFailed = notifications.filter((n) => n.status === "failed").length;

  const pct = (part: number, total: number) =>
    total > 0 ? Math.round((part / total) * 100) : 0;

  // ===== EXPORT KE EXCEL (satu file, satu sheet per tab) =====
  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    const setCols = (ws: XLSX.WorkSheet, widths: number[]) => {
      ws["!cols"] = widths.map((wch) => ({ wch }));
    };

    // ----- Sheet 1: Overview -----
    const overviewAoa: (string | number)[][] = [
      ["REKAP KEGIATAN SIMAK", ""],
      ["BPS Kabupaten Flores Timur", ""],
      ["", ""],
      ["RINGKASAN", "", ""],
      ["Total Kegiatan", totalKegiatan],
      ["Selesai", totalSelesai],
      ["Sedang Berjalan", totalBerjalan],
      ["Belum Dimulai", totalBelum],
      ["", ""],
      ["KEGIATAN PER BULAN", "", "", "", ""],
      ["Bulan", "Total", "Selesai", "Sedang Berjalan", "Belum Dimulai"],
    ];
    for (const m of monthlyStats) {
      overviewAoa.push([m.label, m.total, m.completed, m.active, m.pending]);
    }
    const overviewWs = XLSX.utils.aoa_to_sheet(overviewAoa);
    setCols(overviewWs, [22, 10, 10, 16, 14]);
    XLSX.utils.book_append_sheet(wb, overviewWs, "Overview");

    // ----- Sheet 2: Per Tim -----
    const teamAoa: (string | number)[][] = [
      ["KEGIATAN PER TIM", "", "", "", "", ""],
      ["Tim", "Total", "Selesai", "Sedang Berjalan", "Belum Dimulai", "% Selesai"],
    ];
    for (const t of teamStats) {
      teamAoa.push([
        t.team,
        t.total,
        t.completed,
        t.active,
        t.pending,
        pct(t.completed, t.total),
      ]);
    }
    const teamWs = XLSX.utils.aoa_to_sheet(teamAoa);
    setCols(teamWs, [24, 10, 10, 16, 14, 10]);
    XLSX.utils.book_append_sheet(wb, teamWs, "Per Tim");

    // ----- Sheet 3: Notifikasi -----
    const notifAoa: (string | number)[][] = [
      ["REKAP NOTIFIKASI", ""],
      ["Total Notifikasi", notifTotal],
      ["Berhasil Terkirim", notifSent],
      ["Gagal", notifFailed],
      ["Success Rate", `${pct(notifSent, notifTotal)}%`],
      ["Failure Rate", `${pct(notifFailed, notifTotal)}%`],
    ];
    const notifWs = XLSX.utils.aoa_to_sheet(notifAoa);
    setCols(notifWs, [22, 16]);
    XLSX.utils.book_append_sheet(wb, notifWs, "Notifikasi");

    // Simpan & unduh file
    XLSX.writeFile(wb, `rekap-laporan-simak-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-gray-600 mb-1">Rekap & Laporan</p>
            <h1 className="text-3xl font-bold text-gray-900">Rekap & Laporan</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={loading || totalKegiatan === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-gray-200">
          {[
            { key: "overview", label: "Overview" },
            { key: "team", label: "Per Tim" },
            { key: "notification", label: "Notifikasi" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedReport(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                selectedReport === tab.key
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Memuat data laporan...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-sm">Data laporan belum tersedia</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Overview Report */}
            {selectedReport === "overview" && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Total Kegiatan</p>
                    <p className="text-3xl font-bold text-gray-900">{totalKegiatan}</p>
                    <p className="text-xs text-gray-500 mt-2">Semua status</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Selesai</p>
                    <p className="text-3xl font-bold text-gray-900">{totalSelesai}</p>
                    <p className="text-xs text-green-600 mt-2">
                      {pct(totalSelesai, totalKegiatan)}% dari total
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <BarChart3 className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Sedang Berjalan</p>
                    <p className="text-3xl font-bold text-gray-900">{totalBerjalan}</p>
                    <p className="text-xs text-purple-600 mt-2">
                      {pct(totalBerjalan, totalKegiatan)}% dari total
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <PieChart className="w-8 h-8 text-amber-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Belum Dimulai</p>
                    <p className="text-3xl font-bold text-gray-900">{totalBelum}</p>
                    <p className="text-xs text-amber-600 mt-2">
                      {pct(totalBelum, totalKegiatan)}% dari total
                    </p>
                  </div>
                </div>

                {/* Tabel bulan kegiatan (dari tanggal mulai) */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Kegiatan per Bulan
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Bulan
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            Total
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            Selesai
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            Sedang Berjalan
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            Belum Dimulai
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {monthlyStats.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                              Belum ada kegiatan tercatat
                            </td>
                          </tr>
                        )}
                        {monthlyStats.map((stat) => (
                          <tr key={stat.key} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {stat.label}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-700 font-semibold">
                              {stat.total}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-green-700 font-medium">
                              {stat.completed}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-purple-700 font-medium">
                              {stat.active}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-amber-700 font-medium">
                              {stat.pending}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Team Report */}
            {selectedReport === "team" && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Total Kegiatan per Tim
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Tim
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            Total Kegiatan
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            Selesai
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            Sedang Berjalan
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            Belum Dimulai
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            % Selesai
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {teamStats.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                              Belum ada kegiatan tercatat
                            </td>
                          </tr>
                        )}
                        {teamStats.map((team, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {team.team}
                            </td>
                            <td className="px-6 py-4 text-sm text-center text-gray-700 font-semibold">
                              {team.total}
                            </td>
                            <td className="px-6 py-4 text-sm text-center text-green-700 font-medium">
                              {team.completed}
                            </td>
                            <td className="px-6 py-4 text-sm text-center text-purple-700 font-medium">
                              {team.active}
                            </td>
                            <td className="px-6 py-4 text-sm text-center text-amber-700 font-medium">
                              {team.pending}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full ${
                                      pct(team.completed, team.total) >= 85
                                        ? "bg-green-500"
                                        : pct(team.completed, team.total) >= 50
                                        ? "bg-blue-500"
                                        : "bg-amber-500"
                                    }`}
                                    style={{ width: `${pct(team.completed, team.total)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 min-w-[45px]">
                                  {pct(team.completed, team.total)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Report */}
            {selectedReport === "notification" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Bell className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Total Notifikasi</p>
                    <p className="text-3xl font-bold text-gray-900">{notifTotal}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm text-green-600 mb-2">Berhasil Terkirim</p>
                    <p className="text-3xl font-bold text-green-700">{notifSent}</p>
                    <p className="text-xs text-green-600 mt-2">
                      {pct(notifSent, notifTotal)}% success rate
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-sm text-red-600 mb-2">Gagal</p>
                    <p className="text-3xl font-bold text-red-700">{notifFailed}</p>
                    <p className="text-xs text-red-600 mt-2">
                      {pct(notifFailed, notifTotal)}% failure rate
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
