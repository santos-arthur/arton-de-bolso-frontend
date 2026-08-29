"use client";

import { BsFillBackpackFill } from "react-icons/bs";
import type { Carga } from "../lib/foundry-types";

/** "7,5" e não "7,50"; "15" e não "15,0". */
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/**
 * Quanto da mochila já foi usado.
 *
 * A escala vai de zero ao **dobro** do limite, que é o teto do sistema: até o
 * limite se anda normalmente, e o trecho seguinte é o que dá para arrastar
 * sobrecarregado. Por isso a marca no meio — sem ela, uma barra pela metade
 * pareceria folga, quando na verdade é exatamente o ponto de virada.
 *
 * Azul enquanto cabe, vermelho quando passa: a cor é o aviso, e o número ao
 * lado diz de quanto foi o estouro.
 */
export default function BarraEspacos({ carga }: { carga: Carga }) {
  if (carga.max <= 0) return null;

  const sobrecarregado = carga.atual > carga.limite;
  const preenchido = Math.min(100, Math.max(0, (carga.atual / carga.max) * 100));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-row items-baseline justify-between gap-3">
        <span className="flex flex-row items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-55">
          <BsFillBackpackFill aria-hidden="true" className="size-3.5!" />
          Espaços
        </span>
        <span className={`numero text-xs font-semibold ${sobrecarregado ? "text-red-600 dark:text-red-400" : "opacity-60"}`}>
          {numero.format(carga.atual)} de {numero.format(carga.limite)}
          {sobrecarregado && " · sobrecarregado"}
        </span>
      </div>

      <div
        role="meter"
        aria-label="Espaços ocupados na mochila"
        aria-valuenow={carga.atual}
        aria-valuemin={0}
        aria-valuemax={carga.max}
        aria-valuetext={`${numero.format(carga.atual)} de ${numero.format(carga.limite)} espaços`}
        className="relative h-2 w-full overflow-hidden rounded-full bg-superficie"
      >
        <div
          className={`h-full rounded-full transition-[width,background-color] ${
            sobrecarregado ? "bg-red-600 dark:bg-red-500" : "bg-sky-600 dark:bg-sky-400"
          }`}
          style={{ width: `${preenchido}%` }}
        />
        {/* O limite cai sempre na metade da barra (o máximo é o dobro dele). */}
        <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-foreground/30" />
      </div>
    </div>
  );
}
