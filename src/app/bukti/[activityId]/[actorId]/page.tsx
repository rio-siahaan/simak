"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  Calendar,
  Users,
  Upload,
} from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants";

interface Activity {
  id: string;
  title: string;
  team: string;
  team_color: string;
  start_date: string;
  deadline: string;
  description?: string;
  evidence_url?: string;
}

interface Actor {
  user_id: string;
  user_name: string;
}

export default function BuktiDukungPage() {
  const params = useParams();
  const router = useRouter();

  const activityId = params.activityId as string;
  const actorId = params.actorId as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [actor, setActor] = useState<Actor | null>(null);
  const [loading, setLoading] = useState(true);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Fetch data kegiatan dan aktor saat mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil data kegiatan
        const activityRes = await fetch(`${API_ENDPOINTS.activities}/${activityId}`);
        if (!activityRes.ok) {
          setNotFound(true);
          return;
        }
        const activityResult = await activityRes.json();
        setActivity(activityResult.data);
        setEvidenceUrl(activityResult.data?.evidence_url || "");

        // Verifikasi aktor adalah pelaksana kegiatan ini
        const actorsRes = await fetch(
          `/api/activities/${activityId}/actors?actor_id=${actorId}`
        );

        if (actorsRes.ok) {
          const actorsResult = await actorsRes.json();
          if (actorsResult.data && actorsResult.data.length > 0) {
            setActor(actorsResult.data[0]);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (activityId && actorId) {
      fetchData();
    }
  }, [activityId, actorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validasi URL sederhana
    if (!evidenceUrl.trim()) {
      setSubmitError("Link bukti dukung harus diisi");
      return;
    }

    if (!evidenceUrl.startsWith("http://") && !evidenceUrl.startsWith("https://")) {
      setSubmitError("Link harus diawali dengan http:// atau https://");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${API_ENDPOINTS.activities}/${activityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence_url: evidenceUrl.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Gagal menyimpan bukti dukung");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        // Redirect ke halaman sukses atau tutup
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Format tanggal
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Makassar",
      });
    } catch {
      return dateStr;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Memuat data kegiatan...</span>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound || !activity || !actor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Data Tidak Ditemukan
          </h1>
          <p className="text-gray-600 text-sm">
            Kegiatan atau aktor tidak ditemukan. Pastikan link yang Anda akses sudah benar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-2xl mx-auto p-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <Upload className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Bukti Dukung
          </h1>
          <p className="text-gray-600">
            Sistem Informasi Manajemen Administrasi Kegiatan
          </p>
          <p className="text-sm text-gray-500 mt-1">
            BPS Kabupaten Flores Timur
          </p>
        </div>

        {/* Card Informasi Kegiatan */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div
            className="px-6 py-4 border-b"
            style={{ backgroundColor: activity.team_color + "10" }}
          >
            <div className="flex items-start gap-3">
              <FileText
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: activity.team_color }}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  {activity.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{activity.team}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">
                      {formatDate(activity.start_date)} s/d{" "}
                      {formatDate(activity.deadline)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
            <p className="text-sm text-indigo-900">
              <span className="font-semibold">Pelaksana:</span> {actor.user_name}
            </p>
          </div>

          {activity.description && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {activity.description}
              </p>
            </div>
          )}
        </div>

        {/* Form Upload */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Success */}
          {submitSuccess && (
            <div className="flex items-center gap-3 bg-green-50 border-b border-green-100 px-6 py-4 text-green-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">
                  Bukti dukung berhasil disimpan!
                </p>
                <p className="text-xs mt-0.5">
                  Terima kasih telah melengkapi dokumentasi kegiatan.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {submitError && (
            <div className="flex items-center gap-3 bg-red-50 border-b border-red-100 px-6 py-4 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label
                htmlFor="evidence_url"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
              >
                <LinkIcon className="w-4 h-4 text-indigo-500" />
                Link Bukti Dukung (Google Drive / Cloud Storage)
              </label>
              <input
                type="url"
                id="evidence_url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://drive.google.com/... atau https://..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
                disabled={submitting || submitSuccess}
              />
              <p className="text-xs text-gray-500 mt-2">
                Upload file kegiatan Anda ke Google Drive atau cloud storage lain, lalu
                paste link-nya di sini. Pastikan link bisa diakses oleh admin.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                📌 Petunjuk Upload:
              </h3>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Upload file ke Google Drive atau cloud storage</li>
                <li>
                  Ubah pengaturan berbagi menjadi "Anyone with the link can view"
                </li>
                <li>Salin link dan paste di form ini</li>
                <li>Klik tombol Simpan</li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="submit"
                disabled={submitting || submitSuccess}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : submitSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Tersimpan!
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Simpan Bukti Dukung
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Link ini bersifat pribadi untuk Anda sebagai pelaksana kegiatan ini.
          <br />
          Jangan bagikan link ini ke pihak lain.
        </p>
      </div>
    </div>
  );
}
