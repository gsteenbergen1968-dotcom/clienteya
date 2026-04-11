import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ClienteYA",
  description: "Dashboard de ventas por WhatsApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}