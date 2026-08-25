"use client";

import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { eRotaDeFicha } from "./navegacao";
import { useFoundry } from "../lib/foundry-provider";

function Aviso({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">{children}</div>;
}

/**
 * As seções da ficha só fazem sentido com um personagem aberto. Em vez de cada
 * página devolver uma tela em branco, o gate mostra o estado certo e o caminho
 * de volta para a home.
 */
export default function GateFicha({ children }: { children: ReactNode }) {
  const { ficha, personagens, trocandoPara } = useFoundry();
  const pathname = usePathname();

  if (!eRotaDeFicha(pathname)) return <>{children}</>;

  if (trocandoPara || (!ficha && personagens === null)) {
    return (
      <Aviso>
        <FontAwesomeIcon icon={faSpinner} className="size-5! animate-spin opacity-60" />
        <p className="text-sm opacity-60">Carregando ficha...</p>
      </Aviso>
    );
  }

  if (!ficha) {
    return (
      <Aviso>
        <p className="max-w-sm text-sm opacity-70">Nenhum personagem aberto.</p>
        <Link
          href="/"
          className="min-h-11 rounded-xl bg-acento px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Escolher personagem
        </Link>
      </Aviso>
    );
  }

  return <>{children}</>;
}
