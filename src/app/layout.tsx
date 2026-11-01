import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "@/components/common/AppShell";
import { ToastProvider } from "@/components/common/ToastProvider";
import { getThemeInitScript } from "@/lib/theme";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CALO - Calorie & Macro Tracker",
  description:
    "Aplikasi pelacak nutrisi & kalori harian yang presisi dan mudah digunakan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
