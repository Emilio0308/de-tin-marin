import type { Metadata } from "next";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans, Quicksand } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { QueryProvider } from "@/shared/providers/query-provider";
import "./globals.css";

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const labelFont = Quicksand({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-quicksand",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${displayFont.variable} ${bodyFont.variable} ${labelFont.variable}`}
    >
      <body className="bg-background font-body text-on-surface selection:bg-secondary-fixed selection:text-on-secondary-fixed min-h-screen antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>{children}</QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
