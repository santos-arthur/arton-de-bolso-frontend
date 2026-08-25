"use client";

import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import CampoComDetalhe from "./campo-com-detalhe";
import FolhaModal from "./folha-modal";
import { CAIXA_NUMERO, CAIXA_NUMERO_CALCULADO, ParAtualMaximo } from "./visor-numero";
import { useCampoNumerico } from "../lib/campo-numerico";
import { useFoundry } from "../lib/foundry-provider";

const PASSOS = [1, 5, 10];

/**
 * Ajuste de PV/PM. Tomar dano é o gesto mais repetido de uma sessão, então os
 * passos rápidos vêm primeiro e grandes o bastante para o toque (44px), com o
 * campo numérico logo abaixo para o valor exato.
 */
export default function AjusteRecurso({
  recurso,
  onFechar
}: {
  recurso: "pv" | "pm";
  onFechar: () => void;
}) {
  const { ficha, definirAtual, definirTemporario, ajustarPV, ajustarPM } = useFoundry();
  // Delegar ao provider mantém o clamp num lugar só (e PV negativo possível).
  const ajustarRecurso = (qual: "pv" | "pm", delta: number) =>
    qual === "pv" ? ajustarPV(delta) : ajustarPM(delta);
  const dado = ficha?.[recurso];
  // Decidido só na abertura: se o temporário já vinha zerado, o campo começa
  // oculto; um clique o revela sem que ele suma no meio da digitação.
  const [mostrarTemporario, setMostrarTemporario] = useState(() => (dado?.temp ?? 0) > 0);

  const atual = dado?.atual ?? 0;
  const maximo = dado?.max ?? 0;
  const rotulo = recurso === "pv" ? "Pontos de Vida" : "Pontos de Mana";

  // PV pode ficar negativo (em T20 é o que separa "caído" de "morrendo");
  // PM não — o próprio sistema trava em 0.
  const permiteNegativo = recurso === "pv";

  // Hooks antes de qualquer return condicional.
  const campoAtual = useCampoNumerico(atual, (valor) => definirAtual(recurso, valor), {
    min: permiteNegativo ? Number.NEGATIVE_INFINITY : 0,
    max: maximo
  });
  const campoTemporario = useCampoNumerico(dado?.temp ?? 0, (valor) => definirTemporario(recurso, valor));

  if (!ficha || !dado) return null;

  const ajustar = (delta: number) => ajustarRecurso(recurso, delta);

  return (
    <FolhaModal titulo={rotulo} onFechar={onFechar}>
      <ParAtualMaximo
        atual={
          <input
            type="number"
            step={1}
            aria-label={`${rotulo} atual`}
            {...campoAtual}
            className={`input-numero-sem-setas ${CAIXA_NUMERO} outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento`}
          />
        }
        maximo={
          <CampoComDetalhe
            titulo={`Máximo de ${rotulo}`}
            classeContainer="relative"
            classeGatilho=""
            itens={dado.itensMax}
            total={maximo}
          >
            <span className={CAIXA_NUMERO_CALCULADO}>{maximo}</span>
          </CampoComDetalhe>
        }
      />

      {/* Duas linhas de três em vez de seis apertadas: são os botões mais
          tocados do app, muitas vezes no meio de um turno. Alvos de 56px. */}
      <div className="flex flex-col gap-2">
        <span className="text-center text-[11px] font-bold uppercase tracking-wider opacity-60">Ajuste rápido</span>
        <div className="grid grid-cols-3 gap-2">
          {PASSOS.map((passo) => (
            <button
              key={`menos-${passo}`}
              type="button"
              onClick={() => ajustar(-passo)}
              aria-label={`Diminuir ${passo}`}
              className="numero flex min-h-14 flex-row items-center justify-center gap-1.5 rounded-xl border border-borda bg-superficie-alta text-lg font-bold transition-colors hover:border-red-700 hover:bg-red-700/10 hover:text-red-700 dark:hover:border-red-500 dark:hover:text-red-400"
            >
              <FontAwesomeIcon icon={faMinus} className="size-3!" />
              {passo}
            </button>
          ))}
          {PASSOS.map((passo) => (
            <button
              key={`mais-${passo}`}
              type="button"
              onClick={() => ajustar(passo)}
              aria-label={`Aumentar ${passo}`}
              className="numero flex min-h-14 flex-row items-center justify-center gap-1.5 rounded-xl border border-borda bg-superficie-alta text-lg font-bold transition-colors hover:border-emerald-700 hover:bg-emerald-700/10 hover:text-emerald-700 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3!" />
              {passo}
            </button>
          ))}
        </div>
      </div>

      {mostrarTemporario ? (
        <label className="flex min-h-14 flex-row items-center justify-between gap-3 rounded-xl border border-borda bg-superficie-alta px-4">
          <span className="text-sm font-semibold">Temporários</span>
          <input
            type="number"
            step={1}
            min={0}
            {...campoTemporario}
            className="input-numero-sem-setas numero w-20 bg-transparent text-right text-xl font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
          />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => setMostrarTemporario(true)}
          className="mx-auto flex min-h-11 flex-row items-center gap-2 rounded-xl border border-borda px-4 text-sm font-semibold transition-colors hover:bg-foreground/5"
        >
          <FontAwesomeIcon icon={faPlus} className="size-2.5!" />
          Pontos temporários
        </button>
      )}
    </FolhaModal>
  );
}
