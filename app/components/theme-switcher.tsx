"use client";

import { FaCheck } from "react-icons/fa6";
import { useTheme, type Accent, type Palette, type Theme } from "../theme-provider";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

/**
 * As amostras são classes escritas por extenso, e não montadas com template
 * string, porque o Tailwind varre o texto do arquivo: um `bg-${familia}-400`
 * nunca chega ao CSS. As duplas `claro dark:escuro` mostram o tom que a opção
 * vai valer *no tema em que o app está agora* — escolher uma cor por uma
 * amostra que não é a que aparece seria pior do que não ter amostra.
 */
const PALETAS: { value: Palette; label: string; fundo: string; barra: string; cartao: string }[] = [
  {
    value: "olive",
    label: "Olive",
    fundo: "bg-olive-300 dark:bg-olive-800",
    barra: "bg-olive-400 dark:bg-olive-900",
    cartao: "bg-olive-200 dark:bg-olive-700"
  },
  {
    value: "neutral",
    label: "Neutral",
    fundo: "bg-neutral-300 dark:bg-neutral-800",
    barra: "bg-neutral-400 dark:bg-neutral-900",
    cartao: "bg-neutral-200 dark:bg-neutral-700"
  },
  {
    value: "slate",
    label: "Slate",
    fundo: "bg-slate-300 dark:bg-slate-800",
    barra: "bg-slate-400 dark:bg-slate-900",
    cartao: "bg-slate-200 dark:bg-slate-700"
  }
];

/** Ordem do círculo cromático, igual à do globals.css. */
const ACENTOS: { value: Accent; label: string; amostra: string }[] = [
  { value: "red", label: "Vermelho", amostra: "bg-red-900 dark:bg-red-500" },
  { value: "amber", label: "Âmbar", amostra: "bg-amber-900 dark:bg-amber-500" },
  { value: "green", label: "Verde", amostra: "bg-green-900 dark:bg-green-500" },
  { value: "cyan", label: "Ciano", amostra: "bg-cyan-900 dark:bg-cyan-500" },
  { value: "blue", label: "Azul", amostra: "bg-blue-900 dark:bg-blue-500" },
  { value: "purple", label: "Roxo", amostra: "bg-purple-900 dark:bg-purple-500" },
  { value: "pink", label: "Rosa", amostra: "bg-pink-900 dark:bg-pink-500" }
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="flex w-full max-w-sm items-center gap-1 rounded-xl border border-borda bg-superficie-alta p-1"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={`min-h-9 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors ${
              active ? "bg-acento text-acento-tinta" : "hover:bg-foreground/5"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Família de cinza do app: fundo, barras e cartões saem toda dela. */
export function PaletteSwitcher() {
  const { palette, setPalette } = useTheme();

  return (
    <div role="radiogroup" aria-label="Cor de fundo" className="flex w-full max-w-sm flex-row gap-2">
      {PALETAS.map((opcao) => {
        const ativa = palette === opcao.value;
        return (
          <button
            key={opcao.value}
            type="button"
            role="radio"
            aria-checked={ativa}
            onClick={() => setPalette(opcao.value)}
            className={`flex flex-1 flex-col items-center gap-2 rounded-xl border p-2 transition-colors ${
              ativa ? "border-acento bg-acento/10" : "border-borda hover:bg-foreground/5"
            }`}
          >
            {/* Miniatura do app: a barra, o fundo e um cartão em cima dele. */}
            <span
              aria-hidden="true"
              className={`flex h-10 w-full flex-row overflow-hidden rounded-lg border border-borda ${opcao.fundo}`}
            >
              <span className={`h-full w-2.5 shrink-0 ${opcao.barra}`} />
              <span className="flex flex-1 items-center p-1">
                <span className={`h-full w-full rounded-sm ${opcao.cartao}`} />
              </span>
            </span>
            <span className="text-xs font-semibold">{opcao.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Cor de destaque: botões, aba acesa, seleção. */
export function AccentSwitcher() {
  const { accent, setAccent } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Cor de destaque"
      className="grid w-full max-w-sm grid-cols-7 gap-2"
    >
      {ACENTOS.map((opcao) => {
        const ativa = accent === opcao.value;
        return (
          <button
            key={opcao.value}
            type="button"
            role="radio"
            aria-checked={ativa}
            aria-label={opcao.label}
            title={opcao.label}
            className={`flex h-11 w-full items-center justify-center rounded-full transition-transform ${
              // O anel é o próprio acento *já escolhido*, não a cor do botão:
              // assim a marca de selecionado combina com o resto da tela.
              ativa ? "ring-2 ring-acento ring-offset-2 ring-offset-background" : "hover:scale-105"
            }`}
            onClick={() => setAccent(opcao.value)}
          >
            <span
              className={`flex size-8 items-center justify-center rounded-full ${opcao.amostra}`}
            >
              {ativa && <FaCheck aria-hidden="true" className="size-3! text-acento-tinta" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
