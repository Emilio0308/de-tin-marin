import type { Metadata } from "next";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans, Quicksand } from "next/font/google";
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

export const metadata: Metadata = {
  title: "De Tin Marín — ¡Endulza cada sorpresa!",
  description:
    "Ecommerce de dulces y sorpresas: caramelos, chocolates, gomitas y combos cumpleañeros.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${displayFont.variable} ${bodyFont.variable} ${labelFont.variable}`}
    >
      <body className="bg-background font-body text-on-surface selection:bg-secondary-fixed selection:text-on-secondary-fixed min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
