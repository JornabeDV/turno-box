import type { Metadata, Viewport } from "next";
import { Oswald, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Bee Box", template: "%s · Bee Box" },
  description: "Sistema operativo de entrenamiento competitivo. Reservá tu turno en segundos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bee Box",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1F2A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${oswald.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="icon" href="/icons/icon-512.png" sizes="32x32" />
        <link rel="icon" href="/icons/icon-512.png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-dvh bg-[#0A1F2A] text-[#EAEAEA] antialiased">
        {children}
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: "#0E2A38",
              border: "1px solid #1A4A63",
              borderRadius: "2px",
              color: "#EAEAEA",
              fontFamily: "var(--font-oswald), system-ui, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
