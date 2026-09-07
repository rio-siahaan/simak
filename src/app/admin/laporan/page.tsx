"use client";

import React, { useState } from "react";
import { Download, Calendar, TrendingUp, Users, FileText, BarChart3, PieChart } from "lucide-react";

// Data sample untuk rekap
const MONTHLY_STATS = [
  { month: "Januari", total: 45, completed: 40, onTime: 38, delayed: 2 },
  { month: "Februari", total: 52, completed: 48, onTime: 45, delayed: 3 },
  { month: "Maret", total: 48, completed: 44, onTime: 42, delayed: 2 },
  { month: "April", total: 55, completed: 50, onTime: 47, delayed: 3 },
  { month: "Mei", total: 50, completed: 46, onTime: 44, delayed: 2 },
  { month: "Juni", total: 58, completed: 52, onTime: 49, delayed: 3 },
  { month: "Juli", total: 62, completed: 56, onTime: 52, delayed: 4 },
  { month: "Agustus", total: 48, completed: 18, onTime: 16, delayed: 2 },
];

const TEAM_PERFORMANCE = [
  { team: "IPDS", total: 42, completed: 39, onTime: 36, percentage: 92 },
  { team: "Stat. Sosial", total: 38, completed: 34, onTime: 32, percentage: 85 },
  { team: "Produksi", total: 44, completed: 38, onTime: 27, percentage: 61 },
  { team: "Distribusi", total: 36, completed: 32, onTime: 28, percentage: 78 },
  { team: "NWAS", total: 40, completed: 35, onTime: 28, percentage: 70 },
  { team: "PSS", total: 32, completed: 28, onTime: 25, percentage: 78 },
  { team: "Subbag Umum", total: 35, completed: 30, onTime: 27, percentage: 77 },
  { team: "Humas", total: 28, completed: 25, onTime: 22, percentage: 79 },
];

const TOP_ACTORS = [
  { name: "Rio Manuppak S.", team: "IPDS", completed: 18, onTime: 17, percentage: 94 },
  { name: "Maria Goreti", team: "Stat. Sosial", completed: 16, onTime: 15, percentage: 94 },
  { name: "Yosef Making", team: "Distribusi", completed: 15, onTime: 13, percentage: 87 },
  { name: "Angelina Wiking", team: "Subbag Umum", completed: 14, onTime: 13, percentage: 93 },
  { name: "Petrus Kamur", team: "Produksi", completed: 13, onTime: 11, percentage: 85 },
];

const NOTIFICATION_STATS = {
  total_sent: 486,
  success: 478,
  failed: 8,
  reminder_h1: 234,
  activity_created: 252,
};

export default function RekapLaporanPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("Bulan Ini");
  const [selectedReport, setSelectedReport] = useState("overview");

  const handleExport = (type: string) => {
    // Nanti implementasi export ke Excel/PDF
    console.log(`Exporting ${type} report...`);
    alert(`Export ${type} akan segera diunduh`);
  };

  // Hitung total kegiatan tahun ini
  const yearTotal = MONTHLY_STATS.reduce((acc, month) => acc + month.total, 0);
  const yearCompleted = MONTHLY_STATS.reduce((acc, month) => acc + month.completed, 0);
  const yearOnTime = MONTHLY_STATS.reduce((acc, month) => acc + month.onTime, 0);
  const complianceRate = Math.round((yearOnTime / yearCompleted) * 100);

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
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option>Bulan Ini</option>
              <option>3 Bulan Terakhir</option>
              <option>6 Bulan Terakhir</option>
              <option>Tahun Ini</option>
              <option>Custom Range</option>
            </select>
            <button
              onClick={() => handleExport("excel")}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-gray-200">
          <button
            onClick={() => setSelectedReport("overview")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              selectedReport === "overview"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedReport("team")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              selectedReport === "team"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Per Tim
          </button>
          <button
            onClick={() => setSelectedReport("actor")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              selectedReport === "actor"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Per Aktor
          </button>
          <button
            onClick={() => setSelectedReport("notification")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              selectedReport === "notification"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Notifikasi
          </button>
        </div>

        {/* Overview Report */}
        {selectedReport === "overview" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Kegiatan</p>
                <p className="text-3xl font-bold text-gray-900">{yearTotal}</p>
                <p className="text-xs text-gray-500 mt-2">Tahun 2026</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Selesai</p>
                <p className="text-3xl font-bold text-gray-900">{yearCompleted}</p>
                <p className="text-xs text-green-600 mt-2">
                  {Math.round((yearCompleted / yearTotal) * 100)}% dari total
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Tepat Waktu</p>
                <p className="text-3xl font-bold text-gray-900">{yearOnTime}</p>
                <p className="text-xs text-purple-600 mt-2">
                  {Math.round((yearOnTime / yearTotal) * 100)}% dari total
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <PieChart className="w-8 h-8 text-amber-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Tingkat Kepatuhan</p>
                <p className="text-3xl font-bold text-gray-900">{complianceRate}%</p>
                <p className="text-xs text-amber-600 mt-2">
                  {yearCompleted - yearOnTime} terlambat
                </p>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tren Bulanan 2026
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
                        Tepat Waktu
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                        Terlambat
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                        Tingkat Kepatuhan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {MONTHLY_STATS.map((stat, index) => {
                      const compliancePercentage = Math.round(
                        (stat.onTime / stat.completed) * 100
                      );
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {stat.month}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {stat.total}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {stat.completed}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-green-700 font-medium">
                            {stat.onTime}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-red-700 font-medium">
                            {stat.delayed}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    compliancePercentage >= 90
                                      ? "bg-green-500"
                                      : compliancePercentage >= 75
                                      ? "bg-blue-500"
                                      : "bg-amber-500"
                                  }`}
                                  style={{ width: `${compliancePercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {compliancePercentage}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Team Performance Report */}
        {selectedReport === "team" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Performa Per Tim
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
                        Tepat Waktu
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                        Tingkat Kepatuhan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {TEAM_PERFORMANCE.map((team, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {team.team}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-700">
                          {team.total}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-700">
                          {team.completed}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-green-700 font-medium">
                          {team.onTime}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${
                                  team.percentage >= 85
                                    ? "bg-green-500"
                                    : team.percentage >= 70
                                    ? "bg-blue-500"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${team.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 min-w-[45px]">
                              {team.percentage}%
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

        {/* Actor Performance Report */}
        {selectedReport === "actor" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Top 5 Aktor Terbaik
              </h2>
              <div className="space-y-4">
                {TOP_ACTORS.map((actor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{actor.name}</p>
                        <p className="text-sm text-gray-600">{actor.team}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Selesai</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {actor.completed}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Tepat Waktu</p>
                        <p className="text-lg font-semibold text-green-700">
                          {actor.onTime}
                        </p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-sm text-gray-600">Kepatuhan</p>
                        <p className="text-lg font-semibold text-blue-700">
                          {actor.percentage}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notification Report */}
        {selectedReport === "notification" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-2">Total Notifikasi</p>
                <p className="text-3xl font-bold text-gray-900">
                  {NOTIFICATION_STATS.total_sent}
                </p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                <p className="text-sm text-green-600 mb-2">Berhasil Terkirim</p>
                <p className="text-3xl font-bold text-green-700">
                  {NOTIFICATION_STATS.success}
                </p>
                <p className="text-xs text-green-600 mt-2">
                  {Math.round(
                    (NOTIFICATION_STATS.success /
                      NOTIFICATION_STATS.total_sent) *
                      100
                  )}
                  % success rate
                </p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                <p className="text-sm text-red-600 mb-2">Gagal</p>
                <p className="text-3xl font-bold text-red-700">
                  {NOTIFICATION_STATS.failed}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  {Math.round(
                    (NOTIFICATION_STATS.failed /
                      NOTIFICATION_STATS.total_sent) *
                      100
                  )}
                  % failure rate
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Breakdown Per Tipe Notifikasi
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Notifikasi Kegiatan Baru
                    </p>
                    <p className="text-sm text-gray-600">
                      Dikirim saat admin membuat kegiatan baru
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {NOTIFICATION_STATS.activity_created}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Pengingat H-1</p>
                    <p className="text-sm text-gray-600">
                      Dikirim 1 hari sebelum deadline
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {NOTIFICATION_STATS.reminder_h1}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
