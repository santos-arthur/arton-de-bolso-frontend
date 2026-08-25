"use client";

import { faMinus, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import CampoComDetalhe, { type ItemDetalhe } from "./campo-com-detalhe";

const AJUSTES_RAPIDOS = [1, 5, 10];

export default function ModalRecurso({
  rotulo,
  atual,
  maximo,
  itensMaximo,
  temporario,
  onFechar,
  onAlterarAtual,
  onAlterarTemporario,
}: {
  rotulo: string;
  atual: number;
  maximo: number;
  itensMaximo: ItemDetalhe[];
  temporario: number;
  onFechar: () => void;
  onAlterarAtual: (novoValor: number) => void;
  onAlterarTemporario: (novoValor: number) => void;
}) {
  // Decidido só na abertura do modal: se o temporário já vinha zerado, o campo
  // começa oculto (evita mostrar um campo "vazio" à toa); um clique revela o
  // campo pra permitir adicionar um valor novo, sem que ele suma no meio da
  // digitação caso o valor volte a zero.
  const [mostrarTemporario, setMostrarTemporario] = useState(() => temporario > 0);

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  function ajustar(delta: number) {
    onAlterarAtual(Math.min(maximo, Math.max(0, atual + delta)));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`titulo-modal-recurso-${rotulo}`}
        onClick={(evento) => evento.stopPropagation()}
        className="flex w-full max-w-fit flex-col gap-6 rounded-xl border-2 border-red-900 bg-olive-300 p-8 text-olive-800 shadow-xl dark:bg-olive-900 dark:text-olive-400"
      >
        <div className="flex flex-row items-center justify-between">
          <h2 id={`titulo-modal-recurso-${rotulo}`} className="text-2xl font-bold">
            {rotulo}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <FontAwesomeIcon icon={faXmark} className="size-5!" />
          </button>
        </div>

        <div className="flex flex-row items-center justify-center gap-3">
          <fieldset className="flex flex-col items-center gap-0.5 rounded-lg border-2 border-red-900 px-3 pb-2 text-center">
            <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">
              Atual
            </legend>
            <input
              type="number"
              step={1}
              value={atual}
              onChange={(evento) => {
                const bruto = Number(evento.target.value);
                if (Number.isNaN(bruto)) return;
                onAlterarAtual(Math.min(maximo, Math.max(0, bruto)));
              }}
              className="input-numero-sem-setas w-20 bg-transparent text-center text-3xl font-bold outline-none"
            />
          </fieldset>
          <span className="text-3xl font-bold opacity-50">/</span>
          <CampoComDetalhe
            classeContainer="relative"
            classeGatilho="flex flex-col items-center gap-0.5 rounded-lg border-2 border-red-900 px-3 pb-2 text-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            itens={itensMaximo}
            total={maximo}
          >
            <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">
              Máximo
            </legend>
            <span className="w-20 text-center text-3xl font-bold opacity-70">{maximo}</span>
          </CampoComDetalhe>
        </div>

        {mostrarTemporario ? (
          <fieldset className="mx-auto flex w-fit flex-col items-center gap-0.5 rounded-lg border-2 border-red-900 px-3 pb-2 text-center">
            <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">
              Temp.
            </legend>
            <input
              type="number"
              step={1}
              min={0}
              value={temporario}
              onChange={(evento) => {
                const bruto = Number(evento.target.value);
                if (Number.isNaN(bruto)) return;
                onAlterarTemporario(Math.max(0, bruto));
              }}
              className="input-numero-sem-setas w-20 bg-transparent text-center text-xl font-bold outline-none"
            />
          </fieldset>
        ) : (
          <button
            type="button"
            onClick={() => setMostrarTemporario(true)}
            className="mx-auto flex items-center gap-1.5 rounded-full border-2 border-red-900 px-3 py-1 text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <FontAwesomeIcon icon={faPlus} className="size-3!" />
            Temp.
          </button>
        )}

        <div className="flex flex-col gap-2 w-full!">
          <span className="text-center text-xs font-semibold uppercase tracking-wide opacity-70">
            Ajuste rápido
          </span>
          {/* Abaixo de 768px: lista de duas colunas fixas ("-" à esquerda,
              "+" à direita), com botões um pouco maiores pra facilitar o
              toque. A partir de 768px volta a ser uma única linha. */}
          <div className="grid grid-cols-2 gap-2.5 md:hidden">
            {AJUSTES_RAPIDOS.map((quantidade) => (
              <div key={`par-${quantidade}`} className="contents">
                <button
                  type="button"
                  onClick={() => ajustar(-quantidade)}
                  className="flex items-center justify-center gap-2 rounded-full border-2 border-red-900 px-4 py-3 text-base font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <FontAwesomeIcon icon={faMinus} className="size-3.5!" />
                  {quantidade}
                </button>
                <button
                  type="button"
                  onClick={() => ajustar(quantidade)}
                  className="flex items-center justify-center gap-2 rounded-full border-2 border-red-900 px-4 py-3 text-base font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <FontAwesomeIcon icon={faPlus} className="size-3.5!" />
                  {quantidade}
                </button>
              </div>
            ))}
          </div>

          <div className="hidden md:flex md:flex-row md:items-center md:justify-center md:gap-3">
            {AJUSTES_RAPIDOS.slice()
              .reverse()
              .map((quantidade) => (
                <button
                  key={`menos-${quantidade}`}
                  type="button"
                  onClick={() => ajustar(-quantidade)}
                  className="flex items-center gap-1.5 rounded-full border-2 border-red-900 px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <FontAwesomeIcon icon={faMinus} className="size-3!" />
                  {quantidade}
                </button>
              ))}
            {AJUSTES_RAPIDOS.map((quantidade) => (
              <button
                key={`mais-${quantidade}`}
                type="button"
                onClick={() => ajustar(quantidade)}
                className="flex items-center gap-1.5 rounded-full border-2 border-red-900 px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3!" />
                {quantidade}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
