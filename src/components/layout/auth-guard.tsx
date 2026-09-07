"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export interface UserSession {
  id: string;
  name: string;
  team: string;
  whatsapp: string;
  role: "Admin" | "Aktor";
  nip: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; // BARU: dipanggil manual setelah login berhasil
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook untuk fetch user dari server (via API /api/auth/me atau header)
async function fetchUser(): Promise<UserSession | null> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include", // Include cookies
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.user : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Dipisah jadi fungsi tersendiri (bukan langsung di dalam useEffect) supaya
  // bisa dipanggil ulang secara manual lewat refreshUser(), tidak cuma sekali
  // saat AuthProvider pertama kali mount di root layout.
  const checkAuth = async () => {
    try {
      const userData = await fetchUser();
      setUser(userData);
    } catch (err) {
      console.error("Gagal memverifikasi sesi:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch user dari server saat AuthProvider pertama kali mount
    // (biasanya cuma sekali per sesi tab, karena root layout tidak remount
    // saat pindah halaman di App Router — makanya kita butuh refreshUser
    // di bawah untuk kasus login ulang tanpa reload penuh).
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  // refreshUser: dipanggil manual setelah login berhasil, supaya Context
  // langsung sinkron dengan sesi baru tanpa menunggu remount AuthProvider
  // (yang praktis tidak pernah terjadi selama masih di tab yang sama).
  // Ini yang memperbaiki bug "login NIP baru tapi tampil data user lama".
  const refreshUser = async () => {
    setLoading(true);
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Memverifikasi sesi...</p>
        </div>
      </div>
    );
  }

  // Jika belum login dan di halaman selain login, tampilkan layar kosong sementara redirect
  if (!user && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
};