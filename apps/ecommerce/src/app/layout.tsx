import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "De Tin Marín — Tienda",
  description: "Ecommerce de dulces y sorpresas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
