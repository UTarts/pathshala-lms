import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google"; // <-- Changed this
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";


export const metadata: Metadata = {
  title: "Pathshala - Digital Library",
  description: "The Self Study Digital Library",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pathshala",
  },
  formatDetection: {
    telephone: false,
  }
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents pinch-to-zoom (crucial for native app feel)
};
// <-- Configured the new font
const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-plus-jakarta',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Applied the new font to the body */}
      <body className={`${plusJakarta.variable} font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen transition-colors duration-300">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}