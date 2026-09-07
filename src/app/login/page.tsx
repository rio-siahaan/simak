"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, KeyRound, Users, ShieldAlert, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { TEAMS } from "@/lib/constants";

interface LoginFormData {
  nip: string;
  role: "Admin" | "Aktor";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/admin/dashboard";
  const errorParam = searchParams.get("error");

  const [formData, setFormData] = useState<LoginFormData>({
    nip: "",
    role: "Aktor",
  });
  const [showNip, setShowNip] = useState(false);
  const [error, setError] = useState<string | null>(errorParam);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Login gagal");
      }

      setSuccess(true);
      // Redirect setelah delay singkat
      setTimeout(() => {
        // router.push(redirectUrl);
        // router.refresh();
        window.location.href = redirectUrl
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat login");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden font-sans">
      {/* Decorative background shapes */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md p-4 z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative">

          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-2xl shadow-lg mb-4 text-white">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">SIMAK</h1>
            <p className="text-sm text-slate-400 mt-2 font-medium">
              Sistem Informasi dan Manajemen Administrasi Kegiatan
            </p>
            <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mt-1">
              BPS Kabupaten Flores Timur
            </p>
          </div>

          {success ? (
            <div className="py-12 flex flex-col items-center justify-center animate-pulse">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
              <h2 className="text-xl font-bold text-white mb-2">Autentikasi Berhasil</h2>
              <p className="text-slate-400 text-sm text-center">
                Mengarahkan ke dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Error Alert */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl p-4 flex items-start gap-3 text-sm animate-shake">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* NIP Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  NIP (Nomor Induk Pegawai)
                </label>
                <div className="relative">
                  <input
                    type={showNip ? "text" : "password"}
                    name="nip"
                    placeholder="Masukkan NIP Anda"
                    value={formData.nip}
                    onChange={handleInputChange}
                    autoComplete="username"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-300 pr-12 placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNip(!showNip)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors"
                  >
                    {showNip ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  NIP adalah Nomor Induk Pegawai Anda (contoh: 198001012005011000)
                </p>
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Peran (Role)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: "Admin" }))}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-300 ${
                      formData.role === "Admin"
                        ? "border-purple-500 bg-purple-500/10 text-purple-300 shadow-lg shadow-purple-950/20"
                        : "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950/50"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>Admin / Ketua Tim</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: "Aktor" }))}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-300 ${
                      formData.role === "Aktor"
                        ? "border-blue-500 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-950/20"
                        : "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950/50"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>Aktor / Staf</span>
                  </button>
                </div>
              </div>

              {/* Info Role */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    formData.role === "Admin" ? "bg-purple-500" : "bg-blue-500"
                  }`} />
                  <div>
                    <p className="font-semibold text-slate-200">
                      {formData.role === "Admin" ? "Admin / Ketua Tim" : "Aktor / Staf"}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {formData.role === "Admin"
                        ? "Dapat menambah kegiatan, mengelola pengguna, dan melihat semua dashboard"
                        : "Dapat melihat jadwal, upload bukti dukung, dan menerima notifikasi WhatsApp"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !formData.nip.trim()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-purple-950/30 hover:shadow-purple-600/20 active:scale-[0.98] disabled:opacity-55 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "MASUK KE SISTEM"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6 font-medium">
          SIMAK v1.0.0 &middot; BPS Kabupaten Flores Timur &middot; Rio Manuppak Siahaan
        </p>
      </div>

      {/* Global CSS for Animations */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}