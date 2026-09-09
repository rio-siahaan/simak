"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Building2, Shield, Calendar, Edit2, Save, X, Loader2 } from "lucide-react";
import { useAuth } from "@/components/layout/auth-guard";
import { API_ENDPOINTS } from "@/lib/constants";

export default function ProfilPenggunaPage() {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    team: "",
    position: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: `${user.name.toLowerCase().replace(/\s+/g, ".")}@bps.go.id`,
        whatsapp: user.whatsapp,
        team: user.team,
        position: user.role === "Admin" ? "Ketua Tim / Admin" : "Staf Aktor / Pegawai Biasa",
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);

      const response = await fetch(`${API_ENDPOINTS.users}/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          team: formData.team,
          whatsapp: formData.whatsapp,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal memperbarui profil di database");
      }

      const result = await response.json();
      const updatedUser = result.data;

      // Update local storage dan context state
      login({
        id: user.id,
        name: updatedUser.name,
        team: updatedUser.team,
        whatsapp: updatedUser.whatsapp,
        role: user.role, // role tidak boleh diedit sendiri
      });

      setIsEditing(false);
      alert("Profil berhasil diperbarui!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: `${user.name.toLowerCase().replace(/\s+/g, ".")}@bps.go.id`,
        whatsapp: user.whatsapp,
        team: user.team,
        position: user.role === "Admin" ? "Ketua Tim / Admin" : "Staf Aktor / Pegawai Biasa",
      });
    }
    setIsEditing(false);
  };

  const TEAMS = [
    "Ketua Tim IPDS",
    "Ketua Tim Sosial",
    "Ketua Tim Produksi",
    "Ketua Tim Distribusi",
    "Ketua Tim Nerwilis",
    "Ketua Tim PSS",
    "Kepala Sub Bagian Umum",
    "Ketua Tim Sakernas",
  ];

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-[1200px] mx-auto p-8">
        
        {/* Header */}
        <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Pengaturan Akun</p>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Profil Saya</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column - Profile Card */}
          <div className="col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gray-800 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-inner">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {user.name}
                </h2>
                <p className="text-xs text-gray-500 font-semibold mb-4">
                  {formData.position}
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    user.role === "Admin"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-green-50 text-green-700 border-green-200"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {user.role === "Admin" ? "Ketua Tim / Admin" : "Aktor / Staf"}
                </span>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                Informasi Keanggotaan
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500">Grup Kerja</span>
                  <span className="text-xs font-bold text-gray-800 uppercase">
                    Tim {user.team}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Status Akun</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Informasi Profil Pengguna
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-55/40 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Profil
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-xl transition-all shadow-sm"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Simpan
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-750 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Batal
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                
                {/* Nama Lengkap */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Nama Lengkap
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-850 bg-gray-50/50 p-3 rounded-xl border border-gray-100">{formData.name}</p>
                  )}
                </div>

                {/* Email (Simulated) */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Alamat Surat Elektronik (Email)
                  </label>
                  <p className="text-sm font-semibold text-gray-850 bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-gray-500">
                    {formData.email}
                  </p>
                  <span className="text-[10px] text-gray-400 block mt-1">
                    * Alamat email disesuaikan otomatis dengan nama akun instansi BPS Anda.
                  </span>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Nomor Telepon WhatsApp
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-850 bg-gray-50/50 p-3 rounded-xl border border-gray-100">{formData.whatsapp}</p>
                  )}
                  <span className="text-[10px] text-gray-400 block mt-1">
                    * Harus diawali dengan +62 untuk memastikan pengiriman notifikasi WhatsApp Fonnte berjalan normal.
                  </span>
                </div>

                {/* Tim */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    Tim Kerja
                  </label>
                  {isEditing ? (
                    <select
                      name="team"
                      value={formData.team}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      {TEAMS.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-semibold text-gray-850 bg-gray-50/50 p-3 rounded-xl border border-gray-100">{formData.team}</p>
                  )}
                </div>

              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Keamanan Sesi</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                SIMAK menggunakan validasi role Supabase untuk memisahkan otorisasi Ketua Tim dan Staf Aktor. Informasi sesi ini disimpan aman dalam perangkat lokal Anda.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
