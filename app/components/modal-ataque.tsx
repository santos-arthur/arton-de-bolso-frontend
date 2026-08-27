"use client";

import { useMemo, type ReactNode } from "react";
import FolhaModal from "./folha-modal";
import { ListaAprimoramentos, RodapeGasto, useAprimoramentos, useCongelado } from "./lista-aprimoramentos";
import { aprimoramentosDe, bonusDe, somarTermos } from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type { Arma } from "../lib/foundry-types";

function formatar(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

const CHAVES = [
  { chave: "ataque", rotulo: "no ataque" },
  { chave: "dano", rotulo: "de dano" },
  { chave: "criticom", rotulo: "na margem de crítico" },
  { chave: "criticox", rotulo: "no multiplicador de crítico" }
];

/** Uma linha da decomposição: de onde vem cada pedaço. */
function Linha({ rotulo, valor, destacado = false }: { rotulo: ReactNode; valor: ReactNode; destacado?: boolean }) {
  return (
    <div
      className={`flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2 last:border-b-0 ${
        destacado ? "text-acento" : ""
      }`}
    >
      <span className="min-w-0 truncate text-sm">{rotulo}</span>
      <span className="numero shrink-0 text-sm font-semibold">{valor}</span>
    </div>
  );
}

function Total({ valor }: { valor: ReactNode }) {
  return (
    <div className="mt-1 flex flex-row items-center justify-between gap-4 border-t-2 border-borda pt-2 font-bold">
      <span>Total</span>
      <span className="numero">{valor}</span>
    </div>
  );
}

/** O que se joga na mesa. */
function Caixa({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-xl border border-borda bg-superficie-alta px-3 py-3 text-center">
      <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">{rotulo}</span>
      <span className="numero text-xl font-bold">{children}</span>
    </div>
  );
}

function Titulo({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">{children}</span>;
}

/**
 * Painel de ataque de uma arma. Cada bloco mostra de onde vem o número e, em
 * seguida, o que se rola na mesa — o app nunca rola nada.
 */
export default function ModalAtaque({ arma: atual, onFechar }: { arma: Arma; onFechar: () => void }) {
  const { ficha } = useFoundry();
  const todos = ficha?.aprimoramentos;
  const aplicaveis = useMemo(
    () => aprimoramentosDe(todos ?? [], "attack", atual.nome, atual.id),
    [todos, atual.nome, atual.id]
  );

  const uso = useAprimoramentos(aplicaveis, { acao: atual.nome, consumo: atual.consumo });
  // Pago o uso, o painel vira extrato: nem a arma que chega da ficha nova
  // mexe mais no que está na tela.
  const arma = useCongelado(atual, uso.pago);
  const totalAtaque = (arma.ataque?.total ?? 0) + uso.bonusTotal("ataque");
  const dano = arma.dano[0];

  // Margem menor = crítico mais fácil, por isso os efeitos somam negativo.
  const margem = Math.min(20, arma.critico.margem + uso.bonusTotal("criticom"));
  const multiplicador = arma.critico.multiplicador + uso.bonusTotal("criticox");
  const textoCritico = `${margem} / ×${multiplicador}`;

  // Junta tudo numa fórmula só: os pedaços estão explicados logo acima.
  const formulaDano = dano
    ? somarTermos([
        dano.formula,
        ...uso.formulasExtras("dano").map((e) => e.formula),
        String(uso.bonusTotal("dano"))
      ])
    : null;

  return (
    <FolhaModal titulo={arma.nome} onFechar={onFechar} rodape={<RodapeGasto uso={uso} />}>
      {/* --- Ataque --- */}
      <div className="flex flex-col gap-2">
        <Titulo>Ataque</Titulo>
        {arma.ataque && (
          <div className="flex flex-col">
            <div className="flex flex-col">
              {arma.ataque.itens.map((item) => (
                <Linha key={item.rotulo} rotulo={item.rotulo} valor={formatar(item.valor)} />
              ))}
              {uso.escolhidos.map((item) => {
                const valor = bonusDe(item, "ataque");
                if (valor === null) return null;
                const vezes = uso.quantidadeDe(item);
                return (
                  <Linha
                    key={item.id}
                    destacado
                    rotulo={`${item.nome}${vezes > 1 ? ` ×${vezes}` : ""}`}
                    valor={formatar(valor * vezes)}
                  />
                );
              })}
            </div>
            <Total valor={formatar(totalAtaque)} />
          </div>
        )}
        <div className="flex flex-row gap-2">
          <Caixa rotulo="Role na mesa">1d20 {formatar(totalAtaque)}</Caixa>
          <Caixa rotulo="Crítico">{textoCritico}</Caixa>
        </div>
      </div>

      {/* --- Dano --- */}
      {dano && (
        <div className="flex flex-col gap-2">
          <Titulo>Dano{dano.tipo ? ` · ${dano.tipo}` : ""}</Titulo>
          <div className="flex flex-col">
            <div className="flex flex-col">
            {dano.itens.map((item) => (
              <Linha
                key={item.rotulo}
                rotulo={item.rotulo}
                valor={item.dado ?? formatar(item.valor)}
              />
            ))}
            {uso.escolhidos.map((item) => {
              const valor = bonusDe(item, "dano");
              const vezes = uso.quantidadeDe(item);
              const extras = uso.formulasExtras("dano").filter((e) => e.id.startsWith(`${item.id}-`));
              if (valor === null && !extras.length) return null;
              return (
                <Linha
                  key={item.id}
                  destacado
                  rotulo={`${item.nome}${vezes > 1 ? ` ×${vezes}` : ""}`}
                  valor={[valor !== null ? formatar(valor * vezes) : null, ...extras.map((e) => `+${e.formula}`)]
                    .filter(Boolean)
                    .join(" ")}
                />
              );
            })}
            </div>
            <Total valor={formulaDano} />
          </div>
          <Caixa rotulo="Role na mesa">{formulaDano}</Caixa>
        </div>
      )}

      <ListaAprimoramentos uso={uso} chaves={CHAVES} contexto="neste ataque" />
    </FolhaModal>
  );
}
