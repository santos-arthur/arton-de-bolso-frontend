"use client";

import { useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa6";
import FolhaModal from "./folha-modal";
import { useFoundry } from "../lib/foundry-provider";
import type { Negocio, OperacaoCofre } from "../lib/foundry-types";
import { tibares } from "../lib/negocios";

/**
 * Sacar do cofre do negócio para a ficha, ou depositar da ficha no cofre.
 * Só T$ — é a moeda em que o módulo de negócios conta tudo. A quantia não
 * passa do que existe do outro lado: o Foundry recusaria, e é melhor o botão
 * já dizer isso do que a faixa de erro depois.
 */
export default function ModalCofreNegocio({
  negocio,
  operacao,
  tibaresNaMao,
  nomePersonagem,
  onFechar
}: {
  negocio: Negocio;
  operacao: OperacaoCofre;
  tibaresNaMao: number | null;
  nomePersonagem: string;
  onFechar: () => void;
}) {
  const { movimentarCofre } = useFoundry();
  const [quantia, setQuantia] = useState("");

  const sacando = operacao === "sacar";
  const limite = sacando ? negocio.cofre : (tibaresNaMao ?? 0);
  const valor = Number.parseInt(quantia, 10);
  const valido = Number.isFinite(valor) && valor > 0 && valor <= limite;
  const Icone = sacando ? FaArrowDown : FaArrowUp;

  function confirmar() {
    if (!valido) return;
    movimentarCofre(negocio.id, operacao, valor);
    onFechar();
  }

  const rodape = (
    <button
      type="button"
      onClick={confirmar}
      disabled={!valido}
      className={`flex min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity disabled:transition-none ${
        valido ? "bg-acento text-acento-tinta hover:opacity-90" : "border border-borda opacity-50"
      }`}
    >
      <Icone aria-hidden="true" className="size-4! shrink-0" />
      {limite <= 0
        ? sacando
          ? "O cofre está vazio"
          : `${nomePersonagem} não tem T$`
        : valido
          ? `${sacando ? "Sacar" : "Depositar"} ${tibares(valor)}`
          : "Digite a quantia"}
    </button>
  );

  return (
    <FolhaModal titulo={sacando ? "Sacar do cofre" : "Depositar no cofre"} onFechar={onFechar} rodape={rodape}>
      <div className="flex flex-col text-base">
        <div className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5">
          <span className="opacity-80">Cofre de {negocio.nome}</span>
          <span className="numero font-semibold">{tibares(negocio.cofre)}</span>
        </div>
        <div className="flex flex-row items-center justify-between gap-4 py-2.5">
          <span className="opacity-80">Com {nomePersonagem}</span>
          <span className="numero font-semibold">{tibaresNaMao === null ? "—" : tibares(tibaresNaMao)}</span>
        </div>
      </div>

      <label className="flex flex-col gap-2 rounded-xl border border-borda bg-superficie-alta px-4 py-3">
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Quantia em T$</span>
        <div className="flex flex-row items-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={quantia}
            onChange={(evento) => setQuantia(evento.target.value.replace(/\D/g, "").slice(0, 9))}
            placeholder="0"
            aria-label="Quantia em T$"
            className="numero min-w-0 flex-1 rounded-lg border border-borda bg-transparent px-3 py-2 text-2xl font-bold outline-none focus:border-acento"
          />
          <button
            type="button"
            onClick={() => setQuantia(String(Math.max(0, limite)))}
            disabled={limite <= 0}
            className="min-h-11 shrink-0 rounded-xl border border-borda px-3 text-sm font-bold transition-colors hover:bg-foreground/5 disabled:opacity-40"
          >
            Tudo
          </button>
        </div>
        {quantia !== "" && valor > limite && (
          <span className="text-xs text-red-700 dark:text-red-400">
            {sacando ? `O cofre tem só ${tibares(limite)}.` : `${nomePersonagem} tem só ${tibares(limite)}.`}
          </span>
        )}
      </label>

      {sacando && (
        <p className="text-xs opacity-60">O valor entra nos T$ da ficha de {nomePersonagem}.</p>
      )}
    </FolhaModal>
  );
}
