"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";

interface LoginFormData {
  nip: string;
  role: "Admin" | "Aktor";
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/admin/dashboard";

  const [formData, setFormData] = useState<LoginFormData>({
    nip: "",
    role: "Aktor",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat login");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ===== KIRI: BRANDING PANEL ===== */}
      <div className="hidden md:flex md:w-[45%] relative overflow-hidden">
        {/* bg-hero.webp sebagai latar panel */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/bg-hero.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Overlay putih semi-transparan supaya teks terbaca jelas */}
        <div className="absolute inset-0 bg-white/60" />

        <Link href="/">
          <div className="relative z-10 flex flex-col justify-between w-full h-full p-8 md:p-12">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo.webp"
                alt="Logo BPS"
                width={48}
                height={48}
                className="rounded-xl"
              />
              <div>
                <span className="text-xl font-bold text-slate-900 tracking-tight block ">
                  SIMAK
                </span>
                <span className="font-bold text-xs text-slate-600 font-medium">
                  Sistem Informasi Manajemen Administrasi Kegiatan
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ===== KANAN: LOGIN FORM ===== */}
      <div className="w-full md:w-[55%] flex items-center justify-center bg-white p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Selamat datang kembali
            </h1>
            <p className="text-slate-500">
              Masuk ke akun SIMAK Anda
            </p>
          </div>

          {success ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Autentikasi Berhasil
              </h2>
              <p className="text-slate-500 text-sm text-center">
                Mengarahkan ke dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3 text-sm">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* NIP/Username Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  NIP atau Username
                </label>
                <input
                  type="text"
                  name="nip"
                  placeholder="Masukkan NIP atau username"
                  value={formData.nip}
                  onChange={handleInputChange}
                  autoComplete="username"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Pilih Peran Anda
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: "Admin" }))}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                      formData.role === "Admin"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 text-slate-700 hover:border-slate-900/50"
                    }`}
                  >
                    Admin / Ketua Tim
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: "Aktor" }))}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                      formData.role === "Aktor"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 text-slate-700 hover:border-slate-900/50"
                    }`}
                  >
                    Aktor / Staf
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !formData.nip.trim()}
                className="w-full py-3.5 px-4 bg-slate-900 text-white rounded-xl font-semibold text-sm tracking-wide shadow-lg hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>

              {/* Footer text */}
              <p className="text-center text-xs text-slate-400">
                Hubungi admin jika lupa akses
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
