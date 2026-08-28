"use client";

import { useState, type FormEvent, type ReactNode } from "react";

/** Mesmo teto do módulo (`TITULO_MAX` em diarios.mjs) — cortar aqui evita uma ida ao Foundry só para levar erro. */
const TITULO_MAX = 100;
const TEXTO_MAX = 20000;

/**
 * Formulário de uma anotação: título e corpo. Serve para criar e para editar,
 * porque a única diferença entre os dois casos é o que já vem escrito.
 *
 * O salvamento é explícito, e não automático a cada tecla: o texto viaja pelo
 * relay até o Foundry e volta pelo stream para todo mundo, e um autosave
 * transformaria cada palavra digitada numa rodada dessas. Com o botão, o
 * jogador também sabe exatamente quando o que ele escreveu virou público.
 */
export default function EditorAnotacao({
  tituloInicial = "",
  textoInicial = "",
  rotuloSalvar = "Salvar",
  onSalvar,
  onCancelar,
  extra
}: {
  tituloInicial?: string;
  textoInicial?: string;
  rotuloSalvar?: string;
  onSalvar: (titulo: string, texto: string) => void;
  onCancelar: () => void;
  /** Ações que só existem em um dos usos (excluir, na edição). */
  extra?: ReactNode;
}) {
  const [titulo, setTitulo] = useState(tituloInicial);
  const [texto, setTexto] = useState(textoInicial);

  const tituloLimpo = titulo.trim();
  const podeSalvar = tituloLimpo.length > 0;

  function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    if (!podeSalvar) return;
    onSalvar(tituloLimpo, texto);
  }

  return (
    <form onSubmit={aoSubmeter} className="flex flex-1 flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Título</span>
        <input
          type="text"
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          maxLength={TITULO_MAX}
          placeholder="Sessão 12, pistas do templo..."
          // Só no formulário de criação, onde o campo está vazio: entrar numa
          // anotação existente com o teclado aberto por cima do texto seria
          // atrapalhar quem só quis corrigir uma palavra no meio.
          autoFocus={!tituloInicial}
          className="min-h-11 rounded-xl border border-borda bg-superficie-alta px-3 text-sm outline-none transition-colors placeholder:opacity-40 focus:border-acento"
        />
      </label>

      <label className="flex flex-1 flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Anotação</span>
        <textarea
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          maxLength={TEXTO_MAX}
          placeholder="Escreva o que quiser lembrar depois."
          className="min-h-[45vh] flex-1 resize-y rounded-xl border border-borda bg-superficie-alta p-3 text-sm leading-relaxed outline-none transition-colors placeholder:opacity-40 focus:border-acento"
        />
      </label>

      <div className="flex flex-row flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!podeSalvar}
          className="min-h-11 rounded-xl bg-acento px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {rotuloSalvar}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="min-h-11 rounded-xl border border-borda px-4 text-sm font-semibold transition-colors hover:bg-foreground/5"
        >
          Cancelar
        </button>
        {extra && <div className="ml-auto">{extra}</div>}
      </div>
    </form>
  );
}
