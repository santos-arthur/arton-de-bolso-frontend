import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import { InlineScript } from "./components/inline-script";
import { ThemeProvider } from "./theme-provider";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";
import BarraResumo from "./components/barra-resumo";

// Evita que o Font Awesome injete o CSS via JS em runtime (o que causaria um
// flash de ícones sem estilo no SSR); o styles.css importado acima já cobre.
fontAwesomeConfig.autoAddCss = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const iowan = localFont({
  src: [
    {
      path: "./fonts/iowan/IowanOldStyleBT-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/iowan/IowanOldStyleBT-Italic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/iowan/IowanOldStyleBT-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/iowan/IowanOldStyleBT-BoldItalic.woff",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/iowan/IowanOldStyleBT-Black.woff",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/iowan/IowanOldStyleBT-BlackItalic.woff",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-iowan",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arton de Bolso",
  description: "Sistema usado para criar os designs de telas para o Arton de Bolso, extensão estilo companion para FoundryVtt com o sistema Tormenta20",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${iowan.variable} h-full antialiased`}
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
