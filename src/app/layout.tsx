import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "realdump",
  description: "Comparte videos cortos",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black`}
    >
      <body className="min-h-full overflow-x-hidden bg-black text-white">
        <AuthProvider>
          <LanguageProvider>
            <QueryProvider>
              <Header />
              {children}
              <BottomNav />
              <Toaster
                position="bottom-center"
                toastOptions={{
                  style: { background: "#27272a", color: "#fafafa", border: "1px solid #3f3f46" },
                }}
              />
            </QueryProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
