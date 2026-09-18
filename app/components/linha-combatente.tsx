"use client";

import type { ReactNode } from "react";
import type { Combatente } from "../lib/foundry-types";

/**
 * Barra fina, no mesmo desenho das do cabeçalho da ficha. Recebe a proporção
 * pronta (0 a 1) porque o inimigo não manda número nenhum — só o quanto
 * resta, que é o que se enxerga olhando para a criatura.
 */
function Barra({ proporcao, classe }: { proporcao: number; classe: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${classe}`}
        style={{ width: `${Math.max(0, Math.min(1, proporcao)) * 100}%` }}
      />
    </div>
  );
}

const CLASSE_PV = "bg-red-700 dark:bg-red-600";
const CLASSE_PM = "bg-sky-700 dark:bg-sky-500";

/**
 * Rótulo, barra e — quando há — os números. O inimigo usa a mesma peça sem
 * `valores`: a legenda "PV" diz o que a barra mede, que é o que falta para
 * ela não ser uma tarja colorida sem explicação. Quanto exatamente lhe resta
 * continua sendo assunto do mestre.
 */
function Recurso({
  rotulo,
  proporcao,
  valores,
  classe
}: {
  rotulo: string;
  proporcao: number;
  valores?: ReactNode;
  classe: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex flex-row items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-55">{rotulo}</span>
        {valores}
      </div>
      <Barra proporcao={proporcao} classe={classe} />
    </div>
  );
}

/** Os números de um aliado: "12+3/34", com o temporário destacado. */
function Valores({ atual, max, temp }: { atual: number; max: number; temp: number }) {
  return (
    <span className="numero text-xs font-semibold">
      {atual}
      {temp > 0 && <span className="text-acento">+{temp}</span>}
      <span className="opacity-50">/{max}</span>
    </span>
  );
}

/**
 * Uma linha da ordem de combate.
 *
 * O que ela mostra muda com quem é:
 *
 * - **aliado** traz vida e mana com números — o grupo sabe como está o grupo;
 * - **inimigo** traz, no máximo, a barra de vida sem números, e só quando o
 *   mestre liga a opção no módulo (do contrário vem `vidaFracao: null` e
 *   nem barra existe);
 * - **a ficha que você tem aberta** não repete vida nem mana: os dois estão
 *   no cabeçalho, acima, o tempo todo. Vale tanto para o seu personagem
 *   quanto para o companheiro que você abriu.
 */
export default function LinhaCombatente({
  combatente,
  ehFichaAberta,
  detalhado = false
}: {
  combatente: Combatente;
  ehFichaAberta: boolean;
  /** Na listagem completa a linha ganha altura e os recursos aparecem. */
  detalhado?: boolean;
}) {
  const { nome, img, iniciativa, aliado, derrotado, ehAtual, ehProximo, pv, pm, vidaFracao } = combatente;
  const mostrarRecursos = detalhado && !ehFichaAberta;

  return (
    <li
      className={`flex flex-row items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
        ehAtual ? "border-acento bg-acento/5" : "border-borda bg-superficie-alta"
      } ${derrotado ? "opacity-50" : ""}`}
    >
      {img ? (
        // Sem borda: a arte do token já vem com moldura desenhada, e uma
        // borda nossa em volta virava a segunda. O vazio abaixo mantém a
        // dele — não há arte ali para dar contorno ao quadrado.
        <span
          className="size-14 shrink-0 rounded-lg bg-cover bg-center"
          style={{ backgroundImage: `url("${img}")` }}
          aria-hidden="true"
        />
      ) : (
        <span className="size-14 shrink-0 rounded-lg border border-borda bg-foreground/5" aria-hidden="true" />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <span className={`min-w-0 truncate text-sm ${ehAtual ? "font-bold" : "font-semibold"}`}>{nome}</span>
          {ehFichaAberta && <span className="shrink-0 text-[10px] font-bold uppercase opacity-50">você</span>}
          {derrotado && <span className="shrink-0 text-[10px] font-bold uppercase opacity-60">caído</span>}
          {ehAtual && (
            <span className="shrink-0 rounded-full bg-acento px-2 py-0.5 text-[10px] font-bold uppercase text-acento-tinta">
              turno
            </span>
          )}
          {!ehAtual && ehProximo && (
            <span className="shrink-0 rounded-full border border-borda px-2 py-0.5 text-[10px] font-bold uppercase opacity-60">
              próximo
            </span>
          )}
        </div>

        {mostrarRecursos && aliado && (pv || pm) && (
          <div className="flex flex-row gap-3">
            {pv && (
              <Recurso
                rotulo="PV"
                proporcao={pv.max ? (pv.atual + pv.temp) / pv.max : 0}
                valores={<Valores atual={pv.atual} max={pv.max} temp={pv.temp} />}
                classe={CLASSE_PV}
              />
            )}
            {pm && (
              <Recurso
                rotulo="PM"
                proporcao={pm.max ? (pm.atual + pm.temp) / pm.max : 0}
                valores={<Valores atual={pm.atual} max={pm.max} temp={pm.temp} />}
                classe={CLASSE_PM}
              />
            )}
          </div>
        )}

        {/* Inimigo: a legenda e a proporção, nunca o número — e só se o
            mestre liberou. */}
        {mostrarRecursos && !aliado && vidaFracao !== null && (
          <Recurso rotulo="PV" proporcao={vidaFracao} classe={CLASSE_PV} />
        )}
      </div>

      <span
        className={`numero shrink-0 text-lg tabular-nums ${
          iniciativa === null ? "text-sm font-normal opacity-40" : "font-bold"
        }`}
        aria-label={iniciativa === null ? "sem iniciativa" : `iniciativa ${iniciativa}`}
      >
        {iniciativa ?? "—"}
      </span>
    </li>
  );
}
