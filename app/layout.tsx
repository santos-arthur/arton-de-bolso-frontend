import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { InlineScript } from "./components/inline-script";
import { ThemeProvider } from "./theme-provider";
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
  title: "Arton de Bolso",
  description: "Sistema usado para criar os designs de telas para o Arton de Bolso, extensão estilo companion para FoundryVtt com o sistema Tormenta20",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <InlineScript
          html={`(function(){try{var t=localStorage.getItem("theme")||"system";var resolved=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;document.documentElement.setAttribute("data-theme",resolved)}catch(e){}})()`}
        />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <div className="flex flex-col items-center w-full min-h-dvh dark:bg-olive-800 bg-olive-300">
            <BarraResumo />
            <div className="flex-1 flex flex-col w-4/5 shadow-2xs dark:shadow-2xs-dark overflow-hidden">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
