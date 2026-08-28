"use client";

import { FaBold, FaItalic, FaListOl, FaListUl, FaUnderline } from "react-icons/fa6";
import { useEffect, useRef, useState, type ClipboardEvent } from "react";
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

  // Congelado na primeira renderização (inicializador do useState): se este
  // valor mudasse, o React reescreveria o miolo e levaria o cursor junto. Uma
  // anotação diferente entra por uma montagem nova (o `key` no formulário),
  // nunca por uma prop nova.
  const [inicial] = useState(() => ({ __html: sanitizarHtml(htmlInicial) }));

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
            className="flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-foreground/10"
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
        className="prosa-foundry editor-rico min-h-[40vh] flex-1 overflow-y-auto p-3 text-sm leading-relaxed outline-none"
        dangerouslySetInnerHTML={inicial}
      />
    </div>
  );
}
