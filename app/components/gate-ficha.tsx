"use client";

import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { eRotaDeFicha } from "./navegacao";
import { useFoundry } from "../lib/foundry-provider";

function Aviso({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center text-olive-800 dark:text-olive-400">
      {children}
    </div>
  );
}

/**
 * As rotas de ficha (/detalhes, /combate, ...) só fazem sentido com um
 * personagem aberto. Em vez de cada página repetir `if (!ficha) return null`
 * — que deixava a tela em branco sem explicar nada —, o gate mostra o estado
 * certo e um caminho de volta pra home.
 */
export default function GateFicha({ children }: { children: ReactNode }) {
  const { ficha, personagens, trocandoPara } = useFoundry();
  const pathname = usePathname();

  if (!eRotaDeFicha(pathname)) return <>{children}</>;

  if (trocandoPara || (!ficha && personagens === null)) {
    return (
      <Aviso>
        <FontAwesomeIcon icon={faSpinner} className="size-6! animate-spin" />
        <p className="text-sm opacity-70">Carregando ficha...</p>
      </Aviso>
    );
  }

  if (!ficha) {
    return (
      <Aviso>
        <p className="max-w-sm">Nenhum personagem aberto.</p>
        <Link
          href="/"
          className="rounded-full border-2 border-red-900 bg-red-900 px-4 py-2 text-sm font-semibold text-olive-50 transition-opacity hover:opacity-90"
        >
          Escolher personagem
        </Link>
      </Aviso>
    );
  }

  return <>{children}</>;
}
