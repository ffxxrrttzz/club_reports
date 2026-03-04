import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Система отчетности клубов",
  description: "Автоматизация сбора и анализа данных",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
