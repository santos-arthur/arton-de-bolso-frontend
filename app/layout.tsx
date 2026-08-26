import type { Metadata, Viewport } from "next";
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

/**
 * O app é uma ficha de mesa consultada no celular durante a partida — zoom
 * ali é sempre acidente (o dedo escorrega, a tela fica torta no meio de um
 * combate). Daí `maximum-scale` e `user-scalable`, que no iOS também matam o
 * zoom automático ao focar um campo: o Safari amplia sozinho quando o campo
 * tem fonte menor que 16px, e os nossos têm 14px.
 *
 * O pinch em si o Safari deixa passar mesmo assim (ignora `user-scalable=no`
 * desde o iOS 10) — quem barra é o listener de `gesture*` lá embaixo.
 */
export const viewport: Viewport = {
  // Cor que o navegador usa na barra dele (e na status bar quando o app está
  // na tela inicial do iPhone): a mesma `--superficie` do fundo, senão o
  // sistema pinta o topo de branco e a faixa clara volta por outro caminho.
  // Hexadecimal porque aqui não há CSS pra ler variável — o par abaixo cobre
  // o tema do sistema, e o ThemeProvider corrige quando a escolha é manual.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#abab9c" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1d16" }
  ],
  width: "device-width",
  initialScale: 1,
  // Deixa a página ocupar a tela inteira do aparelho, recorte de câmera
  // incluído — é o que faz `env(safe-area-inset-*)` valer alguma coisa (sem
  // isto o valor é sempre zero, e o navegador reserva as bordas por conta
  // própria, pintadas com o fundo da página). Quem cuida do respiro passa a
  // ser o CSS: `.area-segura-topo` aqui em cima e `.area-segura-baixo` na
  // barra de abas e nas folhas.
  viewportFit: "cover",
  maximumScale: 1,
  userScalable: false
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
        {/* Pinch de dois dedos no Safari iOS: só para com preventDefault —
            a meta viewport não basta. Eventos "gesture*" são do WebKit, os
            outros navegadores simplesmente nunca os disparam. */}
        <InlineScript
          html={`(function(){["gesturestart","gesturechange","gestureend"].forEach(function(e){document.addEventListener(e,function(evento){evento.preventDefault()},{passive:false})})})()`}
        />
      </head>
      <body className="min-h-full bg-superficie text-foreground">
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
