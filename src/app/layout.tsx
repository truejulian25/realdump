import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { countryToLocale } from "@/lib/locales";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const country = h.get("x-vercel-ip-country") ?? null;
  const detectedLocale = countryToLocale(country) ?? "en";

  return (
    <html
      lang={detectedLocale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-app-bg`}
    >
      <body className="min-h-full overflow-x-hidden bg-app-bg text-zinc-900">
        <AuthProvider>
          <LanguageProvider initialCountry={country}>
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
