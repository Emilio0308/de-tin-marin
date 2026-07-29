"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { ABOUT_WHATSAPP_HREF } from "@/modules/about/data/about.data";

export function HelpFab() {
  const t = useTranslations("home.help");
  const label = t("label");
  const href = `${ABOUT_WHATSAPP_HREF}?text=${encodeURIComponent(t("whatsappMessage"))}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="bg-secondary text-on-secondary group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
    >
      <MessageCircle className="h-7 w-7" aria-hidden />
      <span className="bg-on-surface font-label text-on-secondary pointer-events-none absolute right-16 whitespace-nowrap rounded-lg px-3 py-1 text-sm opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </a>
  );
}
