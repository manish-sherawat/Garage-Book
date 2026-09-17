import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AgentationWrapper from "@/components/AgentationWrapper";
import AuthWrapper from "@/components/AuthWrapper";
import { ToastProvider } from "@/components/ToastProvider";
import OfflineBanner from "@/components/OfflineBanner";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "GarageBook Pro - Garage & Workshop SaaS Platform",
  description: "Next-Generation Workshop Management, Job Cards, Inventory, CRM & Financial Accounting System.",
};

const themeInitializerScript = `
  (function() {
    try {
      var theme = localStorage.getItem('app_theme');
      var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (theme === 'dark' || (theme === 'system' && supportDarkMode)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <Script id="theme-initializer" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitializerScript }} />
      </head>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0, fontFamily: 'var(--font-inter)' }}>
        <OfflineBanner />
        <ToastProvider>
          <AuthWrapper>
            {children}
            <AgentationWrapper />
          </AuthWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
