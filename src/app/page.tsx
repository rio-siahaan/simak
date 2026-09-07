"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Bell, Shield, ArrowRight, CheckCircle, FileSpreadsheet, Users, FileText } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("simak_user");
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden relative selection:bg-purple-600 selection:text-white">
      {/* Background gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
      <div className="absolute top-1/3 -right-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>

      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl text-white font-bold shadow-md shadow-purple-950/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">SIMAK</span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-1 block">BPS FLORES TIMUR</span>
            </div>
          </div>
          <div>
            <Link
              href={isLoggedIn ? "/admin/dashboard" : "/login"}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold tracking-wide border border-slate-800 transition-all duration-300 flex items-center gap-2"
            >
              {isLoggedIn ? "Masuk ke Dasbor" : "Pilih Akun / Masuk"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-xs font-semibold text-purple-400 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
            Tahap Aktualisasi Latsar CPNS 2026
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Kolaborasi Kegiatan <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Lintas Tim Kerja
            </span>{" "}
            Terintegrasi
          </h1>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed">
            Kurangi tumpang tindih agenda dan tingkatkan kepatuhan administrasi bukti dukung di BPS Kabupaten Flores Timur melalui satu sistem koordinasi terpusat.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
            <Link
              href={isLoggedIn ? "/admin/dashboard" : "/login"}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-2xl font-bold tracking-wide shadow-xl shadow-purple-950/40 hover:shadow-purple-600/30 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2.5 group"
            >
              {isLoggedIn ? "Buka Dasbor SIMAK" : "Mulai Sekarang"}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#fitur"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900/60 hover:bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center"
            >
              Pelajari Fitur
            </a>
          </div>
        </div>

        {/* Features section grid */}
        <div id="fitur" className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full pt-12 border-t border-slate-900">
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl space-y-4 hover:border-purple-500/25 transition-all duration-300">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 inline-block">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Kalender Bersama</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Tampilkan semua jadwal kegiatan lintas tim secara transparan guna menghindari penugasan tumpang tindih untuk aktor yang sama.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl space-y-4 hover:border-pink-500/25 transition-all duration-300">
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400 inline-block">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Notifikasi WhatsApp</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pengiriman otomatis notifikasi penugasan baru dan pengingat tenggat H-1 secara langsung ke nomor WhatsApp aktor via API Fonnte.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl space-y-4 hover:border-blue-500/25 transition-all duration-300">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 inline-block">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Bukti Dukung Terpusat</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Mempermudah aktor untuk mengunggah tautan Google Drive bukti dukung kegiatan dan melacak progres langsung di sistem.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-600 bg-slate-950/40">
        <p>&copy; 2026 SIMAK. Dirancang untuk BPS Kabupaten Flores Timur oleh Rio Manuppak Siahaan.</p>
      </footer>
    </div>
  );
}
