import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/shared/auth/require-staff";
import { supabaseConfig } from "@/config/env";
import { QueryProvider } from "@/shared/providers/query-provider";
import { AdminShell } from "./admin-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser(supabaseConfig);
  if (!user) {
    redirect("/login");
  }

  const t = await getTranslations("nav");
  const tShell = await getTranslations("shell");

  return (
    <QueryProvider>
      <AdminShell
        brand={t("brand")}
        subtitle={t("subtitle")}
        openMenuLabel={tShell("openMenu")}
        closeMenuLabel={tShell("closeMenu")}
        pageTitles={{
          dashboard: t("dashboard"),
          categories: t("categories"),
          products: t("products"),
          containers: t("containers"),
          bundles: t("bundles"),
          delivery: t("delivery"),
          orders: t("orders"),
        }}
      >
        {children}
      </AdminShell>
    </QueryProvider>
  );
}
