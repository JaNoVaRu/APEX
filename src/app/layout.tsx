import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Libro Mayor — Estudio para Contadores",
  description: "Aprendizaje guiado para estudiantes y profesionales de Contaduría",
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
