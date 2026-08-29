"use client";

import { FaChevronDown } from "react-icons/fa6";
import { useState, type ReactNode } from "react";
import type { IconType } from "react-icons";

/**
 * A pílula de ação principal — a que resolve o cartão: Usar, Conjurar,
 * Atacar. Só uma por cartão, sempre no mesmo canto, em todas as telas.
 */
export function AcaoPrincipal({
  icone: Icone,
  onClick,
  children
}: {
  icone: IconType;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-acento px-3.5 text-[11px] font-bold text-acento-tinta transition-opacity hover:opacity-90"
    >
      <Icone aria-hidden="true" className="size-3! shrink-0" />
      {children}
    </button>
  );
}

/**
 * As demais: equipar, preparar, guardar no baú. Vivem dentro do cartão
 * aberto, nunca na lista — o cabeçalho é para ler, não para operar.
 * `ligado` marca o estado atual (equipado, preparada, guardado).
 */
export function AcaoSecundaria({
  icone: Icone,
  onClick,
  ligado = false,
  children
}: {
  icone: IconType;
  onClick: () => void;
  ligado?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ligado}
      // `w-fit` porque o bloco de ações é uma coluna flex, e sem isso o botão
      // esticava de ponta a ponta do cartão — era o que acontecia no Combate,
      // onde ele é o único filho.
      className={`flex min-h-9 w-fit shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors ${
        ligado ? "border-acento text-acento" : "border-borda hover:bg-foreground/5"
      }`}
    >
      <Icone aria-hidden="true" className="size-3! shrink-0" />
      {children}
    </button>
  );
}

/**
 * Uma linha de lista da ficha — item, poder, magia, arma, armadura. Todas
 * seguem o mesmo desenho, e é ele que faz as telas parecerem a mesma
 * aplicação:
 *
 *   [img] Nome do item                            [ Ação ]
 *         etiqueta · etiqueta · etiqueta
 *   ─────────────────────────────────────────────────────
 *   nome completo, dados e as ações secundárias
 *   ─────────────────────────────────────────────────────
 *   descrição do compêndio
 *
 * O cabeçalho é para correr o olho: nome, o que o item faz (as etiquetas) e
 * a única ação que resolve aquele cartão. Tudo que muda estado — equipar,
 * preparar, guardar, contar unidades — mora dentro, no mesmo lugar em todas
 * as telas, e é o que separa ler de operar.
 */
export default function CartaoExpansivel({
  nome,
  img,
  descricao,
  etiquetas,
  acao,
  acoes,
  destacado = false
}: {
  nome: string;
  img?: string;
  descricao?: string;
  etiquetas?: ReactNode;
  /** A ação principal, no canto do cabeçalho. Use <AcaoPrincipal />. */
  acao?: ReactNode;
  /** O que aparece dentro do cartão aberto, acima da descrição. */
  acoes?: ReactNode;
  destacado?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const temDescricao = !!descricao;
  // Com ações dentro, o cartão abre mesmo sem descrição — é onde os
  // controles do item moram.
  const expansivel = temDescricao || !!acoes;

  return (
    <li
      className={`overflow-hidden rounded-2xl border bg-superficie-alta transition-colors ${
        destacado ? "border-acento/60" : "border-borda"
      }`}
    >
      <div className="flex flex-row items-center gap-3 px-3 py-2.5">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
        )}

        <button
          type="button"
          onClick={() => expansivel && setAberto((v) => !v)}
          disabled={!expansivel}
          aria-expanded={expansivel ? aberto : undefined}
          className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left disabled:cursor-default"
        >
          <span className="flex w-full min-w-0 flex-row items-center gap-2">
            <span className="min-w-0 truncate text-sm font-bold">{nome}</span>
            {expansivel && (
              <FaChevronDown
                aria-hidden="true"
                className={`size-2.5! shrink-0 opacity-40 transition-transform ${aberto ? "rotate-180" : ""}`}
              />
            )}
          </span>
          {etiquetas && <span className="flex flex-row flex-wrap gap-1">{etiquetas}</span>}
        </button>

        {acao}
      </div>

      {/* Antes da descrição: quem abre o cartão para conferir ou operar o item
          não precisa rolar um texto de compêndio inteiro para chegar lá. */}
      {aberto && acoes && (
        <div className="flex flex-col gap-2.5 border-t border-borda px-3 py-2.5">{acoes}</div>
      )}

      {aberto && temDescricao && (
        <div
          className="prosa-foundry border-t border-borda px-3 py-2.5 text-sm opacity-85"
          dangerouslySetInnerHTML={{ __html: descricao }}
        />
      )}
    </li>
  );
}
