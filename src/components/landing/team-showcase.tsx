"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
// import { TEAMS } from "@/lib/constants";

interface Pegawai {
  name: string;
  nip: string;
  team: string;
  photo: string | null;
}

interface TeamGroup {
  teamId: string;
  teamName: string;
  teamColor: string;
  members: Pegawai[];
}

const DEFAULT_TEAM_COLOR = "#6B7280"; // abu-abu untuk tim yang tidak dikenali

/** Ambil 2 inisial awal dari nama, uppercase (mis. "Rio Siahaan" -> "RS") */
function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/** Fallback avatar: inisial di tengah, background warna tim opacity rendah */
function AvatarFallback({ name, color }: { name: string; color: string }) {
  const bg = `${color}1A`; // hex + 1A (10%) -> warna tim dengan opacity rendah
  return (
    <div
      className="w-full h-full flex items-center justify-center rounded-xl"
      style={{ backgroundColor: bg, color }}
    >
      <span className="text-lg md:text-xl font-bold tracking-wide">
        {getInitials(name)}
      </span>
    </div>
  );
}

function PegawaiCard({
  pegawai,
  color,
  eager,
}: {
  pegawai: Pegawai;
  color: string;
  eager: boolean;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const showPhoto = !!pegawai.photo && !imgError;
  const hexColor = color || DEFAULT_TEAM_COLOR;

  return (
    <div className="group">
      {/* Ring/border tipis warna tim mengelilingi foto */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden p-1.5 bg-white transition-transform duration-300 ease-out group-hover:scale-[1.04] group-hover:shadow-lg group-hover:shadow-slate-200/70"
        style={{ border: `2px solid ${hexColor}` }}
      >
        <div className="relative w-full h-full">
          {/* Inisial selalu dirender sebagai dasar — terlihat saat foto
              belum dimuat / masih loading / gagal dimuat */}
          <AvatarFallback name={pegawai.name} color={hexColor} />

          {/* Foto dari bucket: ditimpa di atas, fade-in setelah selesai dimuat.
              Kalau photo null / gagal (onError), cukup inisial saja. */}
          {showPhoto && (
            <Image
              src={pegawai.photo!}
              alt={pegawai.name}
              width={150}
              height={150}
              loading={eager ? "eager" : "lazy"}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-300 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </div>
      </div>
      <p className="mt-2.5 text-sm font-semibold text-slate-800 truncate leading-tight">
        {pegawai.name}
      </p>
      <p className="text-xs text-slate-400 font-mono truncate">{pegawai.nip}</p>
    </div>
  );
}

const TEAMS = [
  { id: 'kepala', name: 'Kepala BPS Kab. Flores Timur', color: '#0F172A' },
  { id: 'sosial', name: 'Ketua Tim Sosial', color: '#3B82F6' },
  { id: 'sosial', name: 'Tim Sosial', color: '#3B82F6' },
  { id: 'produksi', name: 'Ketua Tim Produksi', color: '#F97316' },
  { id: 'produksi', name: 'Tim Produksi', color: '#F97316' },
  { id: 'distribusi', name: 'Ketua Tim Distribusi', color: '#10B981' },
  { id: 'distribusi', name: 'Tim Distribusi', color: '#10B981' },
  { id: 'ipds', name: 'Ketua Tim IPDS', color: '#8B5CF6' },
  { id: 'ipds', name: 'Tim IPDS', color: '#8B5CF6' },
  { id: 'nwas', name: 'Ketua Tim Nerwilis', color: '#EF4444' },
  { id: 'nwas', name: 'Tim Nerwilis', color: '#EF4444' },
  { id: 'pss', name: 'Ketua Tim PSS', color: '#06B6D4' },
  { id: 'pss', name: 'Tim PSS', color: '#06B6D4' },
  { id: 'umum', name: 'Kepala Sub Bagian Umum', color: '#F59E0B' },
  { id: 'umum', name: 'Tim Sub Bagian Umum', color: '#F59E0B' },
  { id: 'sakernas', name: 'Ketua Tim Sakernas', color: '#EC4899' },
] 

function TeamShowcase() {
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPegawai() {
      try {
        const response = await fetch("/api/public/pegawai");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!cancelled && Array.isArray(data?.data)) {
          setPegawaiList(data.data);
        } else if (!cancelled) {
          setError(true);
        }
      } catch (err) {
        // Network error / response tidak ok -> jangan crash, tampilkan pesan
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPegawai();
    return () => {
      cancelled = true;
    };
  }, []);

  // Kelompokkan per tim & urutkan sesuai urutan di array TEAMS (bukan alfabet)
  const groups = useMemo<TeamGroup[]>(() => {
    // Lookup nama tim -> data tim. Database menyimpan nama tim dalam 2 varian:
    // "Ketua Tim X" (ketua) dan "Tim X" (anggota), jadi keduanya dipetakan ke
    // id tim yang sama agar tergabung dalam satu grup.
    const teamByName = new Map<string, { id: string; name: string; color: string }>();
    for (const t of TEAMS) {
      if (t.id === "all") continue;
      teamByName.set(t.name, t);
      if (t.name.startsWith("Ketua ")) {
        teamByName.set(t.name.replace("Ketua ", ""), t); // "Tim X" -> tim yang sama
        teamByName.set(t.name.replace("Kepala Sub ", "Sub"), t); // "Tim X" -> tim yang sama
      }
    }

    const byId = new Map<string, TeamGroup>();

    for (const p of pegawaiList) {
      const team = teamByName.get(p.team);
      const teamId = team?.id ?? "unknown";
      const name = team?.name ?? p.team;
      const color = team?.color ?? DEFAULT_TEAM_COLOR;

      if (!byId.has(teamId)) {
        byId.set(teamId, { teamId, teamName: name, teamColor: color, members: [] });
      }
      byId.get(teamId)!.members.push(p);
    }

    // Urutan index berdasarkan posisi di TEAMS ('all' dikecualikan otomatis
    // karena tidak akan cocok dengan nama tim pegawai manapun)
    const order = new Map(TEAMS.map((t, i) => [t.id, i]));
    return Array.from(byId.values())
      .filter((g) => g.members.length > 0)
      .sort((a, b) => {
        const ia = order.get(a.teamId) ?? 999;
        const ib = order.get(b.teamId) ?? 999;
        return ia - ib;
      })
      .map((g) => {
        // Ketua (nama tim berawalan "Ketua") diletakkan paling kanan
        const sorted = [...g.members].sort((a, b) => {
          const aLeader = a.team.startsWith("Ketua ") ? 0 : 1;
          const bLeader = b.team.startsWith("Ketua ") ? 0 : 1;
          return aLeader - bLeader;
        });
        return { ...g, members: sorted };
      });
  }, [pegawaiList]);

  return (
    <section id="tim" className="relative z-10 py-16 md:py-20 px-6 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* Heading section */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
            Keluarga BPS Kab. Flores Timur
          </h2>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
            Kenalan dengan kami!
          </p>
        </div>

        {/* Loading skeleton: 9 placeholder, hindari section kosong */}
        {loading && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2.5">
                <div className="aspect-square rounded-2xl bg-slate-200 animate-pulse" />
                <div className="h-3.5 bg-slate-200 animate-pulse rounded-md w-3/4" />
                <div className="h-3 bg-slate-200 animate-pulse rounded-md w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error state: jangan crash, tampilkan pesan singkat */}
        {!loading && error && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">Data pegawai belum tersedia</p>
          </div>
        )}

        {/* Grup per tim */}
        {!loading && !error && groups.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">Belum ada data pegawai yang tersedia</p>
          </div>
        )}

        {!loading &&
          !error &&
          groups.map((group, gi) => (
            <div key={group.teamId} className="mb-12 last:mb-0">
              {/* Heading tim + titik warna sesuai team.color */}
              <div className="flex items-center gap-2.5 mb-6">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: group.teamColor }}
                />
                <h3 className="text-lg md:text-xl font-bold text-slate-900">
                  {group.teamName}
                </h3>
                <span className="text-sm text-slate-400 font-medium">
                  &middot; {group.members.length}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-5">
                {group.members.map((p) => (
                  <PegawaiCard
                    key={p.nip}
                    pegawai={p}
                    color={group.teamColor}
                    eager={gi === 0} // foto grup pertama eager (langsung terlihat)
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

export default TeamShowcase;
