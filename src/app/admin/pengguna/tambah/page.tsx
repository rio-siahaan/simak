"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { TEAMS } from "@/lib/constants";
import { API_ENDPOINTS } from "@/lib/constants";

const ROLES = ["Admin", "Aktor"] as const;

export default function TambahPenggunaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    team: "",
    role: "Aktor",
    whatsapp: "",
    nip: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama lengkap wajib diisi";
    }
    if (!formData.team) {
      newErrors.team = "Tim wajib dipilih";
    }
    if (!formData.role) {
      newErrors.role = "Role wajib dipilih";
    }
    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = "Nomor WhatsApp wajib diisi";
    } else if (!formData.whatsapp.startsWith("+62")) {
      newErrors.whatsapp = "Nomor WhatsApp harus diawali +62";
    }
    if (formData.nip && formData.nip.length < 10) {
      newErrors.nip = "NIP minimal 10 digit";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error saat user mengetik
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = await fetch(API_ENDPOINTS.users, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal menambah pengguna");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push("/admin/pengguna");
        router.refresh();
      }, 1000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[800px] mx-auto p-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Link
              href="/admin/pengguna"
              className="hover:text-slate-900 transition-colors"
            >
              Manajemen Pengguna
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-medium">Tambah Pengguna</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Tambah Pengguna</h1>
          <p className="text-slate-500 mt-1">
            Isi formulir di bawah untuk menambahkan pengguna baru ke sistem
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nama Lengkap */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  errors.name ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="Masukkan nama lengkap"
                disabled={submitting}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* NIP */}
            <div>
              <label
                htmlFor="nip"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                NIP (Nomor Induk Pegawai) <span className="text-slate-400">(Opsional)</span>
              </label>
              <input
                type="text"
                id="nip"
                name="nip"
                value={formData.nip}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  errors.nip ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="Contoh: 198001012005011000"
                disabled={submitting}
              />
              {errors.nip && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.nip}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Digunakan untuk login ke sistem. Kosongkan jika belum ada.
              </p>
            </div>

            {/* Tim */}
            <div>
              <label
                htmlFor="team"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Tim <span className="text-red-500">*</span>
              </label>
              <select
                id="team"
                name="team"
                value={formData.team}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  errors.team ? "border-red-500" : "border-slate-300"
                }`}
                disabled={submitting}
              >
                <option value="">Pilih tim</option>
                {TEAMS.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {errors.team && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.team}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Peran (Role) <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  errors.role ? "border-red-500" : "border-slate-300"
                }`}
                disabled={submitting}
              >
                <option value="">Pilih peran</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role === "Admin" ? "Admin / Ketua Tim" : "Aktor / Staf Pelaksana"}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.role}
                </p>
              )}
            </div>

            {/* Role Description */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 mt-2 rounded-full ${
                  formData.role === "Admin" ? "bg-purple-500" : "bg-blue-500"
                }`} />
                <div>
                  <p className="font-medium text-slate-900 text-sm">
                    {formData.role === "Admin" ? "Admin / Ketua Tim" : "Aktor / Staf Pelaksana"}
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    {formData.role === "Admin"
                      ? "Dapat menambah kegiatan, mengelola pengguna, dan melihat semua dashboard"
                      : "Dapat melihat jadwal, upload bukti dukung, dan menerima notifikasi WhatsApp"}
                  </p>
                </div>
              </div>
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label
                htmlFor="whatsapp"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Nomor WhatsApp <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="w-20">
                  <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-sm focus:outline-none" disabled>
                    <option>+62</option>
                  </select>
                </div>
                <input
                  type="tel"
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  required
                  pattern="[0-9]+"
                  className={`flex-1 px-4 py-2.5 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    errors.whatsapp ? "border-red-500" : "border-slate-300"
                  }`}
                  placeholder="812xxxxxxxx"
                  disabled={submitting}
                />
              </div>
              {errors.whatsapp && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.whatsapp}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Format: +628xxxxxxxxxx (tanpa spasi). Digunakan untuk notifikasi kegiatan.
              </p>
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{submitError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={submitting}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  submitting
                    ? "bg-slate-400 text-white cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
              <Link
                href="/admin/pengguna"
                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Batal
              </Link>
            </div>
          </form>

          {submitSuccess && (
            <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50">
              <CheckCircle2 className="w-5 h-5" />
              <span>Pengguna berhasil ditambahkan!</span>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}