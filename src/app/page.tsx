"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Bell,
  Shield,
  ArrowRight,
  FileText,
  Building2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Hero } from "@/components/ui/animated-hero";
import TeamShowcase from "@/components/landing/team-showcase";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("simak_user");
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-purple-600 selection:text-white">
      {/* ===== NAVBAR ===== */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-[60]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.webp"
              alt="Logo BPS"
              width={40}
              height={40}
              className="rounded-xl"
              priority
            />
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block">
                Badan Pusat Statistik
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase -mt-1 block">
                Kabupaten Flores Timur
              </span>
            </div>
          </div>
          <div>
            <Link
              href={isLoggedIn ? "/admin/dashboard" : "/login"}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold tracking-wide text-white transition-all duration-300 flex items-center gap-2"
            >
              {isLoggedIn ? "Masuk ke Dasbor" : "Pilih Akun / Masuk"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO: SCROLL EXPAND ===== */}
        {/* bg-landing.webp sebagai layer di belakang card */}
        <div className="relative overflow-hidden -mx-4 md:mx-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/bg-landing.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* Card putih transparan + backdrop blur: mengaburkan bg-landing di belakangnya */}
          <div className="relative min-h-screen bg-white/60 border border-white/30 p-8 md:p-12 shadow-2xl flex items-center justify-center">
            <Hero />
          </div>
        </div>

      {/* ===== TIM KAMI: TEAM SHOWCASE ===== */}
      <TeamShowcase />

      {/* ===== FITUR UTAMA ===== */}
      <section
        id="fitur"
        className="relative z-10 py-20 px-6 bg-white border-t border-slate-200"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Fitur Utama
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Dirancang untuk mendukung koordinasi kegiatan lintas tim kerja
              yang efisien dan terstruktur
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/30 transition-all duration-300 group"
            >
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600 inline-block group-hover:bg-purple-200 transition-colors">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Kalender Bersama Lintas Tim
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Tampilkan semua jadwal kegiatan lintas tim secara transparan
                guna menghindari penugasan tumpang tindih untuk aktor yang sama.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100/30 transition-all duration-300 group"
            >
              <div className="p-3 bg-pink-100 rounded-xl text-pink-600 inline-block group-hover:bg-pink-200 transition-colors">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Notifikasi WhatsApp Otomatis
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Pengiriman otomatis notifikasi penugasan baru dan pengingat
                tenggat H-1 secara langsung ke nomor WhatsApp aktor via API
                Fonnte.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/30 transition-all duration-300 group"
            >
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600 inline-block group-hover:bg-blue-200 transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Bukti Dukung Terpusat
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Mempermudah aktor untuk mengunggah tautan Google Drive bukti
                dukung kegiatan dan melacak progres langsung di sistem.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== VALUE PROPOSITIONS ===== */}
      <section className="relative z-10 py-20 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm"
            >
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 inline-block">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Transparansi & Akuntabilitas
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Setiap kegiatan memiliki PIC jelas, tenggat waktu pasti, dan
                jejak audit lengkap — mengurangi ambiguitas tanggung jawab.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm"
            >
              <div className="p-3 bg-amber-100 rounded-xl text-amber-600 inline-block">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Otomasi Administratif
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Notifikasi WA, reminder H-1, dan rekap laporan otomatis
                mengurangi beban manual admin dan keterlambatan pelaporan.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm"
            >
              <div className="p-3 bg-cyan-100 rounded-xl text-cyan-600 inline-block">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Satu Sistem untuk Seluruh BPS
              </h3>
              <p className="text-slate-500 leading-relaxed">
                IPDS, Statistik Sosial, Produksi, Distribusi, NWAS, PSS,
                Subbagian Umum — terhubung dalam satu platform koordinasi.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 border-t border-slate-200 py-8 text-center text-xs text-slate-400 bg-white">
        <p>
          &copy; 2026 SIMAK — Sistem Informasi Manajemen Administrasi
          Kegiatan.
        </p>
        <p className="mt-1">
          Dikembangkan untuk BPS Kabupaten Flores Timur oleh Rio Manuppak
          Siahaan (Pranata Komputer Ahli).
        </p>
      </footer>

      {/* Marquee Keyframes */}
      {/* <script
        dangerouslySetInnerHTML={{
          __html: `
            if (!document.getElementById('marquee-keyframes')) {
              const style = document.createElement('style');
              style.id = 'marquee-keyframes';
              style.textContent = \`
                @keyframes marquee {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-33.33%); }
                }
              \`;
              document.head.appendChild(style);
            }
          `,
        }}
      /> */}
    </div>
  );
}
