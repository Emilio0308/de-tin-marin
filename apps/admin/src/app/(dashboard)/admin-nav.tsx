"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@de-tin-marin/shared/cn";
import { createAdminBrowserClient } from "@/shared/clients/supabase-browser";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/categories", label: "Categorías" },
  { href: "/products", label: "Productos" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createAdminBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="mt-8 flex flex-col gap-6">
      <ul className="space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                "block rounded-md px-2 py-1.5 transition-colors",
                pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href))
                  ? "bg-rose-50 font-medium text-rose-700"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="text-left text-sm text-zinc-500 hover:text-zinc-800"
      >
        Cerrar sesión
      </button>
    </nav>
  );
}
