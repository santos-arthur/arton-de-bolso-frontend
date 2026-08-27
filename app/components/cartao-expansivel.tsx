"use client";

import { FaChevronDown } from "react-icons/fa6";
import { useState, type ReactNode } from "react";

/**
 * Linha de lista que abre a descrição no lugar. Poderes, magias e itens têm o
 * mesmo formato — nome, etiquetas e um texto do compêndio que só interessa na
 * hora de usar — então compartilham o mesmo cartão.
 */
export default function CartaoExpansivel({
  nome,
  img,
  descricao,
  etiquetas,
  acessorio,
  acoes,
  destacado = false
}: {
  nome: string;
  img?: string;
  descricao?: string;
  etiquetas?: ReactNode;
  acessorio?: ReactNode;
  /** Controles que moram dentro do cartão aberto, acima da descrição. */
  acoes?: ReactNode;
  destacado?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const temDescricao = !!descricao;
  // Com ações dentro, o cartão abre mesmo sem descrição — é onde os
  // controles do item moram agora.
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

        {acessorio}
      </div>

      {/* Antes da descrição: quem abre o cartão para conferir ou usar o item
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
