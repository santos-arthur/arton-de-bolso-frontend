"use client";

import { FaBold, FaItalic, FaListOl, FaListUl, FaUnderline } from "react-icons/fa6";
import { useCallback, useEffect, useRef, useState, type ClipboardEvent } from "react";
import type { IconType } from "react-icons";
import { sanitizarHtml } from "../lib/html-seguro";

/**
 * Editor de texto formatado — negrito, itálico, sublinhado e listas.
 *
 * É um `contentEditable` cru, sem biblioteca: o app inteiro tem cinco
 * dependências, e trazer um editor completo (com o próprio modelo de
 * documento, os próprios plugins e o próprio bundle) para negrito e lista
 * seria desproporcional. `document.execCommand` está marcado como obsoleto
 * há anos, mas continua sendo o que todos os navegadores implementam para
 * isto, e não há substituto padronizado.
 *
 * **Não controlado de propósito.** O conteúdo inicial entra uma vez via
 * `dangerouslySetInnerHTML` e o React nunca mais toca na árvore: reescrever o
 * HTML a cada tecla jogaria o cursor para o começo. O que sai daqui é o
 * `aoMudar`, avisando o formulário do texto novo — o formulário pode
 * re-renderizar à vontade, porque o miolo do editor não depende do estado
 * dele.
 */

const COMANDOS: { icone: IconType; rotulo: string; comando: string }[] = [
  { icone: FaBold, rotulo: "Negrito", comando: "bold" },
  { icone: FaItalic, rotulo: "Itálico", comando: "italic" },
  { icone: FaUnderline, rotulo: "Sublinhado", comando: "underline" },
  { icone: FaListUl, rotulo: "Lista", comando: "insertUnorderedList" },
  { icone: FaListOl, rotulo: "Lista numerada", comando: "insertOrderedList" }
];

export default function EditorRico({
  htmlInicial,
  aoMudar,
  placeholder = "Escreva o que quiser lembrar depois."
}: {
  htmlInicial: string;
  /** Chamado a cada digitação com o HTML atual da área. */
  aoMudar: (html: string) => void;
  placeholder?: string;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  /** Comandos ligados no ponto onde o cursor está. */
  const [ativos, setAtivos] = useState<Record<string, boolean>>({});

  // Congelado na primeira renderização (inicializador do useState): se este
  // valor mudasse, o React reescreveria o miolo e levaria o cursor junto. Uma
  // anotação diferente entra por uma montagem nova (o `key` no formulário),
  // nunca por uma prop nova.
  const [inicial] = useState(() => ({ __html: sanitizarHtml(htmlInicial) }));

  /**
   * Lê do navegador o que vale na seleção atual. `queryCommandState` é o par
   * de `execCommand` — igualmente obsoleto no papel, igualmente o único que
   * todos implementam —, e é ele que sabe que o cursor está dentro de um <b>
   * mesmo quando o negrito veio de fora do editor.
   *
   * Só conta se a seleção estiver *dentro* da área: com o cursor em outro
   * campo da página, os botões não representam nada e voltam ao normal.
   */
  const sincronizar = useCallback(() => {
    const area = areaRef.current;
    const selecao = document.getSelection();
    if (!area || !selecao?.anchorNode || !area.contains(selecao.anchorNode)) {
      setAtivos((atual) => (Object.keys(atual).length ? {} : atual));
      return;
    }

    const novo: Record<string, boolean> = {};
    for (const { comando } of COMANDOS) {
      try {
        novo[comando] = document.queryCommandState(comando);
      } catch {
        // Comando que o navegador não conhece: sem marca, como antes.
        novo[comando] = false;
      }
    }
    // Só troca o objeto quando algo mudou de verdade: `selectionchange` dispara
    // a cada movimento do cursor, e re-renderizar em todos custaria caro num
    // texto longo.
    setAtivos((atual) =>
      COMANDOS.every(({ comando }) => atual[comando] === novo[comando]) ? atual : novo
    );
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", sincronizar);
    return () => document.removeEventListener("selectionchange", sincronizar);
  }, [sincronizar]);

  useEffect(() => {
    // Sem isto o Chrome formata com `<span style="font-weight:bold">`, que a
    // peneira do módulo descarta (`style` não está na allowlist) — o negrito
    // sumiria ao salvar. Com `styleWithCSS` desligado ele usa <b>/<i>/<u>.
    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      // Navegador que não aceita o comando: as tags saem no formato dele
      // mesmo, e o que não passar pela peneira vira texto sem formatação.
    }
  }, []);

  function aplicar(comando: string) {
    areaRef.current?.focus();
    document.execCommand(comando);
    avisar();
  }

  function avisar() {
    aoMudar(areaRef.current?.innerHTML ?? "");
    // Ligar o negrito não move o cursor, então `selectionchange` não dispara:
    // sem esta chamada o botão só acenderia no clique seguinte.
    sincronizar();
  }

  /**
   * Colar entra como texto puro. O que vem da área de transferência costuma
   * arrastar a folha de estilo inteira do lugar de origem (uma página web,
   * uma ficha do Foundry) — e tudo isso seria descartado na peneira, deixando
   * o resultado diferente do que a pessoa viu ao colar.
   */
  function aoColar(evento: ClipboardEvent<HTMLDivElement>) {
    evento.preventDefault();
    const texto = evento.clipboardData.getData("text/plain");
    if (texto) document.execCommand("insertText", false, texto);
    avisar();
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-borda bg-superficie-alta focus-within:border-acento">
      <div className="flex flex-row flex-wrap gap-1 border-b border-borda px-2 py-1.5">
        {COMANDOS.map(({ icone: Icone, rotulo, comando }) => (
          <button
            key={comando}
            type="button"
            title={rotulo}
            aria-label={rotulo}
            // O botão não pode roubar o foco: sem seleção dentro da área, o
            // comando não teria em que trecho agir.
            onMouseDown={(evento) => evento.preventDefault()}
            onClick={() => aplicar(comando)}
            aria-pressed={ativos[comando] ?? false}
            className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
              // Aceso é o acento chapado, com a tinta que faz par com ele — a
              // mesma dupla dos outros controles ligados do app. Um `text-acento`
              // sozinho não daria contraste garantido nos sete acentos.
              ativos[comando] ? "bg-acento text-acento-tinta" : "hover:bg-foreground/10"
            }`}
          >
            <Icone aria-hidden="true" className="size-3.5!" />
          </button>
        ))}
      </div>

      <div
        ref={areaRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Anotação"
        data-placeholder={placeholder}
        onPaste={aoColar}
        onInput={avisar}
        // Ctrl+B e companhia formatam sem mover o cursor — mesmo caso do
        // clique no botão.
        onKeyUp={sincronizar}
        onFocus={sincronizar}
        className="prosa-foundry editor-rico min-h-[40vh] flex-1 overflow-y-auto p-3 text-sm leading-relaxed outline-none"
        dangerouslySetInnerHTML={inicial}
      />
    </div>
  );
}
