"use client";

import { ehTruque } from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type { Aprimoramento } from "../lib/foundry-types";

/**
 * Tira o `<p>` que embrulha um texto de um parágrafo só, para o rótulo em
 * negrito ficar na mesma linha ("**+2 PM:** aumenta o dano…"), como no livro.
 */
function semParagrafo(html: string) {
  const unico = html.trim().match(/^<p>([\s\S]*)<\/p>$/i);
  return unico && !/<p[\s>]/i.test(unico[1]) ? unico[1] : html;
}

/** "Truque", "+2 PM", "−1 PM" — o rótulo que abre cada aprimoramento no livro. */
function rotulo(item: Aprimoramento) {
  if (ehTruque(item)) return "Truque";
  return `${item.custo > 0 ? "+" : "−"}${Math.abs(item.custo)} PM`;
}

/**
 * Os aprimoramentos escritos na própria magia, como o livro os lista abaixo
 * da descrição. No Foundry eles saíram do texto da magia e viraram efeitos —
 * sem isto, abrir a magia não mostrava nenhum. Truques primeiro, depois por
 * custo, que é a ordem do livro.
 */
export function aprimoramentosDaMagia(todos: Aprimoramento[], magiaId: string) {
  return todos
    .filter((a) => a.origemId === magiaId && a.escopos.includes("self") && a.resumo)
    .sort((a, b) => Number(ehTruque(b)) - Number(ehTruque(a)) || a.custo - b.custo);
}

export default function AprimoramentosDaMagia({ magiaId }: { magiaId: string }) {
  const { ficha } = useFoundry();
  const aprimoramentos = aprimoramentosDaMagia(ficha?.aprimoramentos ?? [], magiaId);
  if (!aprimoramentos.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Aprimoramentos</span>
      {aprimoramentos.map((item) => (
        <p key={item.id} className="prosa-foundry text-sm">
          <strong>{rotulo(item)}:</strong>{" "}
          <span dangerouslySetInnerHTML={{ __html: semParagrafo(item.resumo ?? "") }} />
        </p>
      ))}
    </div>
  );
}
