import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/auth/require-staff";
import { supabaseConfig } from "@/config/env";
import { QueryProvider } from "@/shared/providers/query-provider";
import { AdminNav } from "./admin-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser(supabaseConfig);
  if (!user) {
    redirect("/login");
  }

  return (
    <QueryProvider>
      <div className="flex min-h-screen">
        <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white p-6">
          <p className="text-sm font-semibold text-rose-600">De Tin Marín</p>
          <p className="mt-1 text-xs text-zinc-500">Admin</p>
          <AdminNav />
        </aside>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </QueryProvider>
  );
}
