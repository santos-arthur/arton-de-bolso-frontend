import { type ReactNode } from "react";

/**
 * Peças do visor numérico usado no topo das folhas de PV, PM e Defesa.
 * Ficam aqui porque o painel de edição e o de leitura precisam ser
 * visualmente idênticos — a única diferença entre eles é haver ou não
 * controle, nunca o desenho.
 */

/**
 * `block` e a altura fixa não são decorativos: largura não se aplica a
 * elemento inline (o máximo é um <span>), e <input> e <span> calculam altura
 * de formas diferentes a partir do mesmo padding. Travando altura e
 * entrelinha, os dois campos ficam idênticos.
 */
export const CAIXA_NUMERO =
  "numero block h-16 w-28 rounded-xl border border-borda bg-superficie-alta px-2 py-0 text-center text-4xl font-bold leading-[4rem]";

/**
 * Mesma caixa, com cara de desativada. É o máximo de PV/PM: um valor que o
 * sistema calcula e você não digita. Antes ele tinha borda tracejada e outro
 * tamanho, o que fazia parecer um controle de outro tipo em vez do mesmo
 * campo em outro estado.
 */
export const CAIXA_NUMERO_CALCULADO = `${CAIXA_NUMERO} opacity-45`;

export function RotuloCampo({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">{children}</span>;
}

/**
 * Bloco "atual / máximo". Em grade de duas linhas para os rótulos ficarem
 * exatamente sobre as suas caixas e a barra no meio, na altura delas —
 * empilhar em colunas independentes deixava os dois lados desalinhados.
 */
export function ParAtualMaximo({ atual, maximo }: { atual: ReactNode; maximo: ReactNode }) {
  return (
    <div className="mx-auto grid grid-cols-[auto_auto_auto] items-center justify-center gap-x-3 gap-y-1.5">
      <div className="justify-self-center">
        <RotuloCampo>Atual</RotuloCampo>
      </div>
      <span />
      <div className="justify-self-center">
        <RotuloCampo>Máximo</RotuloCampo>
      </div>

      {atual}
      <span className="text-3xl font-bold opacity-25">/</span>
      {maximo}
    </div>
  );
}
