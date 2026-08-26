import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { InlineScript } from "./components/inline-script";
import { ThemeProvider } from "./theme-provider";
import "./globals.css";
import MolduraApp from "./components/moldura-app";
import { FoundryProvider } from "./lib/foundry-provider";
import FoundryGate from "./components/foundry-gate";

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
  description: "Ficha simplificada de Tormenta20 para jogos presenciais e híbridos — conecta por WebSocket no módulo Foundry arton-de-bolso.",
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
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <FoundryProvider>
            <FoundryGate>
              <MolduraApp>{children}</MolduraApp>
            </FoundryGate>
          </FoundryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
