"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import AvisoServidor from "./aviso-servidor";
import CabecalhoFicha from "./cabecalho-ficha";
import GateFicha from "./gate-ficha";
import MenuLateral from "./menu-lateral";
import { eRotaDeFicha } from "./navegacao";
import { useFoundry } from "../lib/foundry-provider";

const TITULOS: Record<string, string> = {
  "/": "Início",
  "/detalhes": "Detalhes",
  "/combate": "Combate",
  "/pericias": "Perícias",
  "/poderes": "Poderes",
  "/inventario": "Inventário",
  "/magias": "Magias",
  "/configuracoes": "Configurações"
};

const APP = "Arton de Bolso";

/**
 * Casca da aplicação autenticada: uma coluna de navegação à esquerda e o
 * conteúdo à direita. Não há barra superior — tudo que ela carregava (marca,
 * troca de personagem, configurações, sair) mora no <MenuLateral />.
 */
export default function MolduraApp({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ficha } = useFoundry();

  const naFicha = eRotaDeFicha(pathname);
  const nomeDaFicha = ficha?.nome ?? null;

  // Com várias abas abertas — comum em mesa — "Arton de Bolso" em todas não
  // distingue nada; o nome do personagem e a seção sim.
  useEffect(() => {
    const partes = [naFicha ? nomeDaFicha : null, TITULOS[pathname], APP].filter(Boolean);
    document.title = partes.join(" · ");
  }, [pathname, nomeDaFicha, naFicha]);

  return (
    // Sem cor própria: quem pinta é o <body>, com o tom das barras. Se este
    // envelope tivesse fundo, ele cobriria a área do recorte da câmera (a
    // altura é `dvh`, que inclui a faixa segura) e a tira clara voltaria.
    <div className="flex min-h-dvh w-full flex-row text-foreground">
      <MenuLateral />

      <main className="area-segura-topo flex min-w-0 flex-1 flex-col bg-background">
        <AvisoServidor />
        <CabecalhoFicha />
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 md:pb-12">
          <GateFicha>{children}</GateFicha>
        </div>
      </main>
    </div>
  );
}
