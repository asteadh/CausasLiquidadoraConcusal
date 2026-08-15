import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Causas Liquidadora Concursal",
  description: "Panel administrativo de causas de liquidación concursal",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
