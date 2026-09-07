"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Edit, Trash2, Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants";

interface User {
  id: string;
  name: string;
  team: string;
  whatsapp: string;
  role: "Admin" | "Aktor";
}

export default function ManajemenPenggunaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("Semua Tim");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users dari API
  useEffect(() => {
    fetchUsers();
  }, [selectedTeam]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedTeam && selectedTeam !== "Semua Tim") {
        params.append("team", selectedTeam);
      }

      const response = await fetch(
        `${API_ENDPOINTS.users}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data pengguna");
      }

      const result = await response.json();
      setUsers(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${name}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.users}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus pengguna");
      }

      // Refresh data setelah delete
      fetchUsers();
      alert("Pengguna berhasil dihapus");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus pengguna");
      console.error("Error deleting user:", err);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-gray-600 mb-1">Manajemen Pengguna</p>
            <h1 className="text-3xl font-bold text-gray-900">
              Manajemen Pengguna
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option>Semua Tim</option>
              <option>IPDS</option>
              <option>Statistik Sosial</option>
              <option>Produksi</option>
              <option>Distribusi</option>
              <option>NWAS</option>
              <option>PSS</option>
              <option>Subbag Umum</option>
              <option>Humas</option>
            </select>
            <Link
              href="/admin/pengguna/tambah"
              className="px-5 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              + Tambah Pengguna
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            <span className="ml-3 text-gray-600">Memuat data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Tim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    No. WhatsApp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.team}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.whatsapp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "Admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/pengguna/${user.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </Link>
                        <span className="text-gray-300">·</span>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <p className="text-gray-500">
              {searchQuery
                ? `Tidak ada pengguna yang ditemukan dengan kata kunci "${searchQuery}"`
                : "Belum ada data pengguna. Tambahkan pengguna baru untuk memulai."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
