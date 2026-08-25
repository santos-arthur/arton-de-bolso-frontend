"use client";

import { faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFoundry } from "../lib/foundry-provider";

/**
 * Faixa de erro vinda do Foundry (permissão negada, relay fora do ar...).
 * Dispensável de propósito: a maioria desses erros é pontual, e sem o botão a
 * faixa ficaria no topo até a próxima ficha chegar.
 */
export default function AvisoServidor() {
  const { erroServidor, limparErro } = useFoundry();
  if (!erroServidor) return null;

  return (
    <div
      role="alert"
      className="flex w-full shrink-0 flex-row items-center justify-center gap-3 bg-red-800 px-4 py-2 text-sm font-semibold text-white"
    >
      <FontAwesomeIcon icon={faTriangleExclamation} className="size-3.5! shrink-0" />
      <span className="min-w-0">{erroServidor}</span>
      <button
        type="button"
        onClick={limparErro}
        aria-label="Dispensar aviso"
        className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-white/15"
      >
        <FontAwesomeIcon icon={faXmark} className="size-3.5!" />
      </button>
    </div>
  );
}
