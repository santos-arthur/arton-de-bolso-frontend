"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import AvisoServidor from "./aviso-servidor";
import BarraPrincipal from "./barra-principal";
import BarraResumoCondicional from "./barra-resumo-condicional";
import GateFicha from "./gate-ficha";
import Navegacao, { eRotaDeFicha } from "./navegacao";
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
 * Casca da aplicação autenticada. É um client component porque duas decisões
 * dependem da rota e do estado: a reserva de espaço para o dock (que só
 * existe nas abas da ficha) e o título da janela.
 */
export default function MolduraApp({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ficha } = useFoundry();

  const naFicha = eRotaDeFicha(pathname);
  const comDock = naFicha && !!ficha;
  const nomeDaFicha = ficha?.nome ?? null;

  // Com várias abas abertas — coisa comum em mesa — "Arton de Bolso" em todas
  // não distingue nada; o nome do personagem e a seção sim.
  useEffect(() => {
    const partes = [naFicha ? nomeDaFicha : null, TITULOS[pathname], APP].filter(Boolean);
    document.title = partes.join(" · ");
  }, [pathname, nomeDaFicha, naFicha]);

  return (
    <div
      className={`flex min-h-dvh w-full flex-col items-center bg-olive-300 dark:bg-olive-800 ${
        comDock ? "pb-24" : "pb-8"
      }`}
    >
      <BarraPrincipal />
      <AvisoServidor />
      <BarraResumoCondicional />
      <Navegacao />
      <div className="flex w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 min-[1313px]:px-0">
        <GateFicha>{children}</GateFicha>
      </div>
    </div>
  );
}
