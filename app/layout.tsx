import type { Metadata } from "next";
import "./globals.css";
import { AppAuthProvider } from "@/lib/appauth";

export const metadata: Metadata = {
  title: "Dinely",
  description: "Zie de vibe voordat je aankomt. Ontdek restaurants en deals.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>
        <AppAuthProvider>
          <div className="app-shell">{children}</div>
        </AppAuthProvider>
      </body>
    </html>
  );
}
