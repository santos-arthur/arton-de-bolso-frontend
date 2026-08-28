"use client";

/**
 * A mesma peneira de `html-seguro.mjs` no módulo, aplicada de novo na hora de
 * exibir.
 *
 * O módulo já sanitiza tudo que grava e tudo que serve, então em operação
 * normal isto não tem o que remover. Existe porque o front e o módulo têm
 * ciclos de vida independentes — o Foundry de uma mesa pode estar rodando uma
 * versão antiga do módulo enquanto o servidor do app já subiu a nova — e o
 * preço de errar é executar, no navegador do jogador, marcação escrita por
 * outra pessoa. Sanitizar dos dois lados custa este arquivo.
 *
 * Também é o que permite exibir com `dangerouslySetInnerHTML` sem que o nome
 * do atributo seja uma mentira: o que entra ali passou por aqui.
 */

const PERMITIDAS = new Set([
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "sub", "sup", "code", "pre", "blockquote",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th",
  "a", "span", "div"
]);

/** Removidas com o conteúdo junto — o miolo de um `<script>` é o próprio código. */
const REMOVIDAS_INTEIRAS = new Set([
  "script", "style", "iframe", "object", "embed", "link", "meta", "form",
  "input", "button", "select", "textarea", "svg", "math", "audio", "video",
  "source", "canvas", "template", "noscript", "base", "img"
]);

const ATRIBUTOS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
  ol: new Set(["start"])
};

function hrefSeguro(valor: string) {
  return /^(https?:\/\/|mailto:)/i.test(valor.trim());
}

function limparElemento(elemento: Element) {
  const tag = elemento.tagName.toLowerCase();

  if (REMOVIDAS_INTEIRAS.has(tag)) {
    elemento.remove();
    return;
  }

  for (const filho of [...elemento.children]) limparElemento(filho);

  if (!PERMITIDAS.has(tag)) {
    elemento.replaceWith(...elemento.childNodes);
    return;
  }

  const permitidos = ATRIBUTOS[tag];
  for (const atributo of [...elemento.attributes]) {
    const nome = atributo.name.toLowerCase();
    if (!permitidos?.has(nome)) elemento.removeAttribute(atributo.name);
    else if (nome === "href" && !hrefSeguro(atributo.value)) elemento.removeAttribute(atributo.name);
  }
}

/**
 * HTML podado à allowlist. Sem DOM (a renderização no servidor) devolve
 * vazio: melhor a tela nascer sem o texto e ganhá-lo na hidratação do que
 * emitir marcação que ninguém conferiu — e, na prática, no servidor este
 * conteúdo nem existe, porque chega pelo stream depois que a página abriu.
 */
export function sanitizarHtml(html: string | undefined | null): string {
  const bruto = String(html ?? "").trim();
  if (!bruto || typeof window === "undefined") return "";
  const documento = new DOMParser().parseFromString(bruto, "text/html");
  for (const filho of [...documento.body.children]) limparElemento(filho);
  return documento.body.innerHTML.trim();
}

const BLOCOS = "p, div, br, li, tr, h1, h2, h3, h4, h5, h6, blockquote, pre";

/** O texto visível, para prévias e buscas — sem contar a marcação. */
export function textoDoHtml(html: string | undefined | null): string {
  const bruto = String(html ?? "");
  if (!bruto || typeof window === "undefined") return "";
  const documento = new DOMParser().parseFromString(bruto, "text/html");
  for (const bloco of documento.body.querySelectorAll(BLOCOS)) {
    bloco.after(documento.createTextNode("\n"));
  }
  return (documento.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}
