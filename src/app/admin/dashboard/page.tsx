"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  Bell,
  TrendingUp,
  Loader2,
  ListTodo,
  CheckCircle,
} from "lucide-react";
import { getDashboardStats, getAttentionRequired, getTeamCompliance } from "@/lib/db-helpers";
import { useAuth } from "@/components/layout/auth-guard";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardStats {
  active: number;
  overdue: number;
  dueSoon: number;
  failedNotifications: number;
}

interface AttentionItem {
  id: string;
  title: string;
  team: string;
  deadline: string;
  status: string;
}

interface TeamCompliance {
  name: string;
  percentage: number;
  total: number;
  onTime: number;
}

export default function DashboardAdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    active: 0,
    overdue: 0,
    dueSoon: 0,
    failedNotifications: 0,
  });
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [teamCompliance, setTeamCompliance] = useState<TeamCompliance[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("Semua Tim");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tentukan apakah harus filter khusus aktor
      const actorId = user?.role === "Aktor" ? user.id : undefined;

      // Fetch dashboard statistics
      const statsResult = (await getDashboardStats(actorId)) as any;
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      // Fetch attention required items
      const attentionResult = (await getAttentionRequired(actorId)) as any;
      if (attentionResult.success && attentionResult.data) {
        setAttentionItems(attentionResult.data);
      }

      // Fetch team compliance (hanya untuk Admin)
      if (user?.role === "Admin") {
        const complianceResult = (await getTeamCompliance()) as any;
        if (complianceResult.success && complianceResult.data) {
          setTeamCompliance(complianceResult.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data dashboard");
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string, deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (status === "overdue" || diffDays < 0) {
      return {
        label: "Terlambat",
        color: "bg-red-100 text-red-700",
        deadline: `deadline lewat ${Math.abs(diffDays)} hari`,
      };
    } else if (diffDays === 0) {
      return {
        label: "Hari ini",
        color: "bg-amber-100 text-amber-700",
        deadline: "deadline hari ini",
      };
    } else if (diffDays === 1) {
      return {
        label: "H-1",
        color: "bg-amber-100 text-amber-700",
        deadline: "deadline besok",
      };
    } else {
      return {
        label: `H-${diffDays}`,
        color: "bg-blue-100 text-blue-700",
        deadline: `deadline ${diffDays} hari lagi`,
      };
    }
  };

  // Tampilkan statistik kustom sesuai peran
  const statsDisplay = user?.role === "Aktor"
    ? [
        {
          label: "Kegiatan Aktif Saya",
          value: stats.active,
          color: "bg-white border-gray-200",
          textColor: "text-gray-900",
          icon: Clock,
        },
        {
          label: "Jatuh Tempo Saya (≤ 2 Hari)",
          value: stats.dueSoon,
          color: "bg-amber-50 border-amber-100",
          textColor: "text-amber-700",
          icon: Calendar,
        },
      ]
    : [
        {
          label: "Kegiatan Aktif Lintas Tim",
          value: stats.active,
          color: "bg-white border-gray-200",
          textColor: "text-gray-900",
          icon: Clock,
        },
        {
          label: "Jatuh Tempo (≤ 2 Hari)",
          value: stats.dueSoon,
          color: "bg-amber-50 border-amber-100",
          textColor: "text-amber-700",
          icon: Calendar,
        },
        {
          label: "Gagal Notifikasi WA",
          value: stats.failedNotifications,
          color: "bg-gray-50 border-gray-200",
          textColor: "text-gray-700",
          icon: Bell,
        },
      ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-[1400px] mx-auto p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
              {user?.role === "Admin" ? "Panel Dasbor Ketua Tim" : `Dasbor Staf / Aktor · ${user?.team}`}
            </p>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Selamat datang, {user?.name}
            </h1>
          </div>
          
          {user?.role === "Admin" && (
            <div className="flex items-center gap-2">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800"
              >
                <option>Semua Tim</option>
                <option>IPDS</option>
                <option>Statistik Sosial</option>
                <option>Produksi</option>
                <option>Distribusi</option>
                <option>NWAS</option>
                <option>PSS</option>
                <option>Subbag Umum</option>
              </select>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <Loader2 className="w-10 h-10 text-gray-800 animate-spin mb-4" />
            <span className="text-gray-500 font-medium">Memuat data dasbor...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && (
          <>
            {/* Statistik Cards */}
            <div className={`grid ${user?.role === "Aktor" ? "grid-cols-3" : "grid-cols-4"} gap-6 mb-8`}>
              {statsDisplay.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border ${stat.color} shadow-sm flex items-center justify-between`}
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className={`text-3xl font-extrabold ${stat.textColor}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-xl",
                      stat.textColor.includes("red") ? "bg-red-100/50 text-red-600" :
                      stat.textColor.includes("amber") ? "bg-amber-100/50 text-amber-600" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-3 gap-8">
              
              {/* Left Column - Perlu Perhatian */}
              <div className={user?.role === "Aktor" ? "col-span-3" : "col-span-2"}>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-gray-700" />
                    Kegiatan yang Perlu Perhatian
                  </h2>
                  {attentionItems.length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Semua kegiatan berjalan lancar!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attentionItems.slice(0, 6).map((item) => {
                        const statusInfo = getStatusLabel(item.status, item.deadline);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <h3 className="font-bold text-gray-800 truncate mb-1">
                                {item.title}
                              </h3>
                              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                {item.team} &middot; <span className="lowercase text-gray-400 font-normal">{statusInfo.deadline}</span>
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Calendar quick link */}
                <div className="bg-gradient-to-r from-gray-900 to-slate-800 border border-slate-900 text-white rounded-2xl p-6 shadow-md mt-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold">Kalender Kegiatan Bersama</h2>
                    <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                      {user?.role === "Admin" 
                        ? "Lihat seluruh jadwal kegiatan lintas tim kerja untuk melacak progress dan penugasan aktor." 
                        : "Lihat jadwal kegiatan lintas tim dan filter jadwal pribadi Anda untuk koordinasi kerja."}
                    </p>
                  </div>
                  <Link
                    href="/admin/kalender"
                    className="px-5 py-2.5 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors shrink-0"
                  >
                    Buka Kalender
                  </Link>
                </div>
              </div>

              {/* Right Column (Only for Admin role) */}
              {user?.role === "Admin" && (
                <div className="space-y-6">
                  {/* Kepatuhan Tenggat per Tim */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-gray-700" />
                      Kepatuhan Tenggat Tim
                    </h2>
                    {teamCompliance.length === 0 ? (
                      <p className="text-gray-500 text-sm font-medium">Belum ada data kepatuhan.</p>
                    ) : (
                      <div className="space-y-4">
                        {teamCompliance.slice(0, 5).map((team, index) => (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">{team.name}</span>
                              <span className="text-sm font-bold text-gray-900">
                                {team.percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  team.percentage >= 80 ? "bg-green-500" :
                                  team.percentage >= 60 ? "bg-amber-500" :
                                  "bg-red-500"
                                }`}
                                style={{ width: `${team.percentage}%` }}
                              ></div>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium mt-1">
                              {team.onTime} dari {team.total} kegiatan tepat waktu
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* System Quick Logs */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Otomasi WhatsApp</h2>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">
                      SIMAK memicu pengiriman pesan WhatsApp secara langsung ke aktor yang ditugaskan saat kegiatan disimpan oleh Ketua Tim.
                    </p>
                    <Link
                      href="/admin/kegiatan"
                      className="text-xs font-bold text-slate-800 hover:text-slate-900 inline-flex items-center gap-1.5"
                    >
                      Kelola Kegiatan &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
