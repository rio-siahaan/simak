import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/layout/auth-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}
