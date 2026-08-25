import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppAuthProvider } from "@/lib/appauth";
import RegisterSW from "./RegisterSW";
import DeviceFrame from "./DeviceFrame";
import InstallPrompt from "./InstallPrompt";

export const metadata: Metadata = {
  title: "Dinely",
  description: "Zie de vibe voordat je aankomt. Ontdek restaurants en deals.",
  manifest: "/manifest.webmanifest",
  applicationName: "Dinely",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Dinely" },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#201B15",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>
        <AppAuthProvider>
          <DeviceFrame>{children}</DeviceFrame>
        </AppAuthProvider>
        <InstallPrompt />
        <RegisterSW />
      </body>
    </html>
  );
}
