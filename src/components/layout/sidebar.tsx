"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/layout/auth-guard";
import {
  LayoutDashboard,
  Calendar,
  ListChecks,
  Users,
  FileText,
  UserCircle,
  LogOut,
} from "lucide-react";
import Image from "next/image";

const menuItems = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["Admin", "Aktor"],
  },
  {
    name: "Kalender Kegiatan",
    href: "/admin/kalender",
    icon: Calendar,
    roles: ["Admin", "Aktor"],
  },
  {
    name: "Daftar Kegiatan",
    href: "/admin/kegiatan",
    icon: ListChecks,
    roles: ["Admin", "Aktor"],
  },
  {
    name: "Manajemen Pengguna",
    href: "/admin/pengguna",
    icon: Users,
    roles: ["Admin"], // Admin only
  },
  {
    name: "Rekap & Laporan",
    href: "/admin/laporan",
    icon: FileText,
    roles: ["Admin"], // Admin only
  },
  {
    name: "Profil Pengguna",
    href: "/admin/profil",
    icon: UserCircle,
    roles: ["Admin", "Aktor"],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Filter menu berdasarkan role user
  const filteredMenuItems = menuItems.filter((item) =>
    user ? item.roles.includes(user.role) : true
  );

  return (
    <aside className="w-[240px] min-h-screen bg-gray-50 border-r border-gray-200 flex flex-col justify-between">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 text-white rounded-lg flex items-center justify-center font-bold text-lg">
              <Image
                src="/logo.png"
                width={500}
                height={500}
                alt="Picture of the author"
              />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight block">SIMAK</span>
              <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider -mt-1 block">BPS FLOTIM</span>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gray-800 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* User Session Info & Logout */}
      {user && (
        <div className="p-4 border-t border-gray-200 bg-white flex flex-col gap-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-bold uppercase shrink-0">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate" title={user.name}>
                {user.name}
              </p>
              <p className="text-[10px] text-gray-500 font-medium truncate">
                {user.role === "Admin" ? "Ketua Tim" : `Aktor - ${user.team}`}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            Keluar Sesi
          </button>
        </div>
      )}
    </aside>
  );
};

