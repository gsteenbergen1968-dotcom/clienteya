import "./globals.css";
import "../styles/brand.css";

export const metadata = {
  title: "ClienteYA",
  description: "ClienteYA para Paraguay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}