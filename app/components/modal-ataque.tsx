"use client";

import { useMemo, useState, type ReactNode } from "react";
import FolhaModal from "./folha-modal";
import { ListaAprimoramentos, RodapeGasto, useAprimoramentos, useCongelado } from "./lista-aprimoramentos";
import {
  aprimoramentosDe,
  bonusDe,
  formulasComTipoDe,
  noContexto,
  somarTermos,
  textoDaFormula
} from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type { Aprimoramento, Arma, ConsumoDeItem } from "../lib/foundry-types";

/**
 * A partir de quantas unidades uma munição vira opção no ataque. Abaixo
 * disso ela continua na mochila, mas não há o que disparar.
 */
const MINIMO_DE_MUNICAO = 1;

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

/** "+2 no ataque · +1 de dano" — o que as melhorias de uma munição fazem. */
function resumirMelhorias(melhorias: Aprimoramento[]) {
  return melhorias
    .flatMap((melhoria) =>
      CHAVES.flatMap(({ chave, rotulo }) => {
        const numero = bonusDe(melhoria, chave);
        return [
          ...(numero !== null ? [`${formatar(numero)} ${rotulo}`] : []),
          ...formulasComTipoDe(melhoria, chave).map((extra) => `${textoDaFormula(extra)} ${rotulo}`)
        ];
      })
    )
    .join(" · ");
}

/**
 * Uma opção do seletor de munição. Rádio, e não caixa: um disparo gasta uma
 * munição só. Mesmo desenho das linhas de aprimoramento logo abaixo.
 */
function OpcaoMunicao({
  nome,
  detalhes,
  marcada,
  travada,
  aoEscolher
}: {
  nome: string;
  detalhes: string;
  marcada: boolean;
  travada: boolean;
  aoEscolher: () => void;
}) {
  return (
    <label
      className={`flex flex-row items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        travada ? "cursor-default" : "cursor-pointer"
      } ${marcada ? "border-acento bg-acento/10" : "border-borda bg-superficie-alta"}`}
    >
      <span className="flex w-8 shrink-0 justify-center">
        <input
          type="radio"
          name="municao"
          checked={marcada}
          onChange={aoEscolher}
          disabled={travada}
          className="checkbox-personalizado mt-0.5 size-5 cursor-pointer rounded-full border border-borda disabled:cursor-default"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-bold">{nome}</span>
        {detalhes && <span className="numero text-xs font-bold text-acento">{detalhes}</span>}
      </span>
    </label>
  );
}

/**
 * Painel de ataque de uma arma. Cada bloco mostra de onde vem o número e, em
 * seguida, o que se rola na mesa — o app nunca rola nada.
 */
export default function ModalAtaque({ arma: atual, onFechar }: { arma: Arma; onFechar: () => void }) {
  const { ficha } = useFoundry();
  // Os modificadores gerais da ficha valem conforme o golpe: "Dano A
  // Distância" só num ataque de Pontaria (arremesso incluso, como no
  // sistema), "Dano Corpo a Corpo" só nos de Luta. Sem a perícia (módulo
  // antigo), cai no propósito da arma.
  const aDistancia = atual.periciaAtaque
    ? atual.periciaAtaque === "pont"
    : atual.proposito === "disparo" || atual.proposito === "arremesso";
  const todos = useMemo(
    () => noContexto(ficha?.aprimoramentos ?? [], ["ataque", "dano", aDistancia ? "ad" : "cac"]),
    [ficha?.aprimoramentos, aDistancia]
  );
  const aplicaveis = useMemo(
    () => aprimoramentosDe(todos, "attack", atual.nome, atual.id),
    [todos, atual.nome, atual.id]
  );

  // Arma de disparo escolhe a munição na hora; as outras seguem com o que a
  // arma declara no Foundry (quando declara).
  const deDisparo = atual.proposito === "disparo";
  const municoes = useMemo(
    () => (atual.municoes ?? []).filter((m) => m.disponivel >= MINIMO_DE_MUNICAO),
    [atual.municoes]
  );
  // Começa na munição que a arma já declara no Foundry: quem configurou o
  // arco com as flechas não precisa escolhê-las a cada disparo.
  const [municaoId, setMunicaoId] = useState<string | null>(() =>
    atual.consumo && municoes.some((m) => m.itemId === atual.consumo?.itemId) ? atual.consumo.itemId : null
  );
  const municao: ConsumoDeItem | null = deDisparo
    ? (municoes.find((m) => m.itemId === municaoId) ?? null)
    : atual.consumo;

  // As melhorias da munição escolhida entram sozinhas no ataque: vêm com a
  // flecha, não se marcam à parte. O nome ganha o da munição para a linha da
  // decomposição dizer de onde veio o bônus.
  const melhoriasPorMunicao = useMemo(() => {
    const mapa = new Map<string, Aprimoramento[]>();
    for (const a of todos) {
      if (!a.municao || !a.origemId || !a.escopos.includes("attack")) continue;
      mapa.set(a.origemId, [...(mapa.get(a.origemId) ?? []), a]);
    }
    return mapa;
  }, [todos]);
  const fixos = useMemo(
    () =>
      deDisparo && municao
        ? (melhoriasPorMunicao.get(municao.itemId) ?? []).map((a) => ({
            ...a,
            nome: `${a.nome} (${municao.nome})`,
            // A unidade sai pela munição escolhida; cobrar a melhoria também
            // tiraria duas flechas por disparo.
            consumo: null
          }))
        : [],
    [deDisparo, municao, melhoriasPorMunicao]
  );

  const uso = useAprimoramentos(aplicaveis, { acao: atual.nome, consumo: municao, fixos });
  // Pago, o seletor vira registro: a lista que estava na tela fica, mesmo que
  // a última flecha tenha acabado de sair da mochila.
  const municoesNaTela = useCongelado(municoes, uso.pago);
  // A escolha também congela: gasta a última flecha, ela some da lista viva,
  // e sem isto o rádio pularia para "Sem munição" com o rodapé dizendo o
  // contrário.
  const municaoNaTela = useCongelado(municao, uso.pago);
  // Pago o uso, o painel vira extrato: nem a arma que chega da ficha nova
  // mexe mais no que está na tela.
  const arma = useCongelado(atual, uso.pago);
  const totalAtaque = (arma.ataque?.total ?? 0) + uso.bonusTotal("ataque");
  const dano = arma.dano[0];

  // Margem menor = crítico mais fácil, por isso os efeitos somam negativo.
  const margem = Math.min(20, arma.critico.margem + uso.bonusTotal("criticom"));
  const multiplicador = arma.critico.multiplicador + uso.bonusTotal("criticox");
  const textoCritico = `${margem} / ×${multiplicador}`;

  // Dano extra de outro tipo (o veneno da flecha, perda de PV) não entra na
  // conta do dano da arma: se rola à parte, porque a RD de um não é a do
  // outro — perda, inclusive, ignora RD.
  const extrasDeDano = uso.formulasExtras("dano");
  const deOutroTipo = (extra: { tipo: string }) => !!extra.tipo && extra.tipo !== dano?.tipo;
  const outrosTipos = [...new Set(extrasDeDano.filter(deOutroTipo).map((e) => e.tipo))].map((tipo) => {
    const doTipo = extrasDeDano.filter((e) => e.tipo === tipo);
    return { tipo, rotulo: doTipo[0].rotuloTipo || tipo, formula: somarTermos(doTipo.map((e) => e.formula)) };
  });

  // Junta tudo numa fórmula só: os pedaços estão explicados logo acima.
  const formulaDano = dano
    ? somarTermos([
        dano.formula,
        ...extrasDeDano.filter((e) => !deOutroTipo(e)).map((e) => e.formula),
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
              {arma.ataque.itens.map((item, indice) => (
                <Linha key={`${item.rotulo}-${indice}`} rotulo={item.rotulo} valor={formatar(item.valor)} />
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
            {dano.itens.map((item, indice) => (
              <Linha
                key={`${item.rotulo}-${indice}`}
                rotulo={item.rotulo}
                valor={item.dado ?? formatar(item.valor)}
              />
            ))}
            {uso.escolhidos.map((item) => {
              const valor = bonusDe(item, "dano");
              const vezes = uso.quantidadeDe(item);
              const extras = extrasDeDano.filter((e) => e.id.startsWith(`${item.id}-`));
              if (valor === null && !extras.length) return null;
              return (
                <Linha
                  key={item.id}
                  destacado
                  rotulo={`${item.nome}${vezes > 1 ? ` ×${vezes}` : ""}`}
                  valor={[
                    valor !== null ? formatar(valor * vezes) : null,
                    ...extras.map((e) => (deOutroTipo(e) ? textoDaFormula(e) : `+${e.formula}`))
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
              );
            })}
            </div>
            <Total valor={formulaDano} />
          </div>
          <Caixa rotulo="Role na mesa">{formulaDano}</Caixa>
          {outrosTipos.map((extra) => (
            <Caixa key={extra.tipo} rotulo={`E à parte · ${extra.rotulo}`}>
              {extra.formula}
            </Caixa>
          ))}
        </div>
      )}

      {/* --- Munição --- */}
      {deDisparo && (
        <div className="flex flex-col gap-2">
          <Titulo>{uso.pago ? "Munição usada" : "Munição"}</Titulo>
          {municoesNaTela.length ? (
            <>
              <OpcaoMunicao
                nome="Sem munição"
                detalhes=""
                marcada={!municaoNaTela}
                travada={uso.pago}
                aoEscolher={() => setMunicaoId(null)}
              />
              {municoesNaTela.map((m) => {
                const melhorias = resumirMelhorias(melhoriasPorMunicao.get(m.itemId) ?? []);
                const gasto = `gasta ${m.quantidade} de ${m.disponivel}`;
                return (
                  <OpcaoMunicao
                    key={m.itemId}
                    nome={m.nome}
                    detalhes={[melhorias, gasto].filter(Boolean).join(" · ")}
                    marcada={municaoNaTela?.itemId === m.itemId}
                    travada={uso.pago}
                    aoEscolher={() => setMunicaoId(m.itemId)}
                  />
                );
              })}
            </>
          ) : (
            <p className="text-sm opacity-60">Nenhuma munição na mochila.</p>
          )}
        </div>
      )}

      <ListaAprimoramentos uso={uso} chaves={CHAVES} contexto="neste ataque" />
    </FolhaModal>
  );
}
