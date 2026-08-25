"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import type { FormulaPericia } from "../lib/foundry-types";

export default function ModalFormulaPericia({
  formula,
  onFechar
}: {
  formula: FormulaPericia;
  onFechar: () => void;
}) {
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(evento) => evento.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border-2 border-red-900 bg-olive-300 p-6 text-olive-800 shadow-xl dark:bg-olive-900 dark:text-olive-400"
      >
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-2xl font-bold">{formula?.label ?? "Perícia"}</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <FontAwesomeIcon icon={faXmark} className="size-5!" />
          </button>
        </div>

        {formula ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-lg">
              <span className="font-bold">1d20</span>
              {formula.partes.map((parte) => (
                <span key={parte.rotulo}>
                  {parte.valorFormatado} <span className="text-sm opacity-70">({parte.rotulo})</span>
                </span>
              ))}
            </div>
            <div className="border-t border-red-900/40 pt-3 text-lg font-bold">
              Total dos bônus: {formula.totalFormatado}
            </div>
          </>
        ) : (
          <p className="opacity-70">Perícia não encontrada.</p>
        )}
      </div>
    </div>
  );
}
