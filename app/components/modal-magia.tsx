"use client";

import { useMemo, type ReactNode } from "react";
import FolhaModal from "./folha-modal";
import { ListaAprimoramentos, RodapeGasto, useAprimoramentos } from "./lista-aprimoramentos";
import { aprimoramentosDe, bonusDe, somarTermos } from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type { Aprimoramento, Magia } from "../lib/foundry-types";

function formatar(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

/**
 * Chaves que um aprimoramento de magia mexe. Não são as do ataque: magia não
 * tem margem de crítico nem bônus de ataque — tem o efeito (a fórmula) e a CD.
 */
const CHAVES = [
  { chave: "dano", rotulo: "no efeito" },
  { chave: "cd", rotulo: "na CD" }
];

/** Modo do Active Effect que troca o valor do campo em vez de somar a ele. */
const SUBSTITUI = 5;

/**
 * Truque é o aprimoramento gratuito escrito na própria magia — o livro os
 * lista como "Truque: muda o alvo para 1 morto-vivo…". Conjurar assim não
 * gasta PM nenhum, nem o da magia, e por ser outro jeito de lançar não aceita
 * mais nada junto.
 *
 * Ser da própria magia (escopo "self") é parte da regra: aprimoramento de
 * graça vindo de um poder — o "+1 na CD" do Xamã Místico — é de graça, mas
 * não é truque.
 */
const ehTruque = (item: Aprimoramento) => item.escopos.includes("self") && item.custo === 0;

/**
 * O que o truque desliga: os aprimoramentos escritos na própria magia — os
 * outros truques dela e os que se paga em PM. Poder, item e consumível ficam
 * de fora porque não são jeitos de lançar a magia: eles incidem sobre o que
 * for lançado, truque ou não.
 */
const daPropriaMagia = (item: Aprimoramento) => item.escopos.includes("self");

/**
 * Aplica nos campos de texto da magia (alcance, alvo, duração...) o que os
 * aprimoramentos escolhidos mudarem. Metade dos aprimoramentos de magia é
 * disso: "muda o alcance para curto", "a duração passa a ser sustentada" —
 * sem isso, marcar o aprimoramento não mexia em nada na tela.
 *
 * Vários mexendo no mesmo campo: o último escolhido vence, como no Foundry.
 */
function comAprimoramentos(base: string, chave: string, escolhidos: Aprimoramento[]) {
  let valor = base;
  let mudou = false;

  for (const item of escolhidos) {
    for (const modificador of item.modificadores) {
      if (modificador.chave.toLowerCase() !== chave) continue;
      if (modificador.modo === SUBSTITUI) valor = modificador.formula;
      // Somar num campo de texto ("+1 alvo") é acréscimo, não troca — mas em
      // campo vazio (a condição, que a magia não tem) o "+" não faz sentido.
      else valor = valor ? `${valor} +${modificador.formula}` : modificador.formula;
      mudou = true;
    }
  }

  return { valor, mudou };
}

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

/** Ficha técnica da magia: o que não muda com aprimoramento. */
function Dado({ rotulo, mudou, children }: { rotulo: string; mudou?: boolean; children: ReactNode }) {
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-xl border bg-superficie-alta px-3 py-2 ${
        mudou ? "border-acento" : "border-borda"
      }`}
    >
      <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">{rotulo}</span>
      {/* Sem truncar quando mudou: o texto do aprimoramento costuma ser mais
          longo que o da magia ("criaturas escolhidas"), e cortá-lo esconderia
          justamente o que o jogador acabou de ligar. */}
      <span className={`text-sm font-semibold ${mudou ? "text-acento" : "truncate"}`}>{children}</span>
    </div>
  );
}

/**
 * Painel de conjurar. Espelha a ideia do painel de ataque — mostrar de onde
 * vem cada número e o que se rola na mesa —, mas o conteúdo é o de magia:
 * custo em PM, CD da resistência e o efeito, no lugar de ataque e crítico.
 *
 * O gasto aqui inclui o PM da própria magia, não só o dos aprimoramentos: no
 * ataque a arma é de graça, aqui a magia nunca é.
 */
export default function ModalMagia({ magia, onFechar }: { magia: Magia; onFechar: () => void }) {
  const { ficha } = useFoundry();
  const todos = ficha?.aprimoramentos;
  const aplicaveis = useMemo(
    () => aprimoramentosDe(todos ?? [], "spell", magia.nome, magia.id),
    [todos, magia.nome, magia.id]
  );

  const uso = useAprimoramentos(aplicaveis, magia.custo, {
    quando: ehTruque,
    exclui: daPropriaMagia,
    rotulo: "Truque"
  });
  const rolagem = magia.rolagens[0];
  const cd = magia.cd === null ? null : magia.cd + uso.bonusTotal("cd");

  const formula = rolagem
    ? somarTermos([
        rolagem.formula,
        ...uso.formulasExtras("dano").map((e) => e.formula),
        String(uso.bonusTotal("dano"))
      ])
    : null;

  const campo = (base: string, chave: string) => comAprimoramentos(base, chave, uso.escolhidos);
  const alvo = magia.area
    ? campo(magia.area, "area")
    : campo(magia.alvo, "alvo");
  const resistencia = campo(magia.resistencia, "resistencia");

  const fichaTecnica = [
    { rotulo: "Execução", ...campo(magia.ativacao, "execucao") },
    { rotulo: "Alcance", ...campo(magia.alcance, "alcance") },
    { rotulo: magia.area ? "Área" : "Alvo", ...alvo },
    { rotulo: "Duração", ...campo(magia.duracao, "duracao") },
    // Só aparece quando algum aprimoramento acrescenta condição — a magia em
    // si não tem esse campo.
    { rotulo: "Condição", ...campo("", "condicao") }
  ].filter((item) => item.valor);

  return (
    <FolhaModal titulo={magia.nome} onFechar={onFechar} rodape={<RodapeGasto uso={uso} />}>
      {/* --- Custo --- */}
      <div className="flex flex-col gap-2">
        <Titulo>Custo</Titulo>
        <div className="flex flex-col">
          <div className="flex flex-col">
            <Linha rotulo={`${magia.nome} (${magia.circulo}º círculo)`} valor={`${magia.custo} PM`} />
            {uso.escolhidos.map((item) => {
              const vezes = uso.quantidadeDe(item);
              // Custo 0 não vira linha; negativo vira, porque abater PM é
              // justamente o que o jogador quer ver na conta.
              if (item.custo === 0) return null;
              return (
                <Linha
                  key={item.id}
                  destacado
                  rotulo={`${item.nome}${vezes > 1 ? ` ×${vezes}` : ""}`}
                  valor={`${formatar(item.custo * vezes)} PM`}
                />
              );
            })}
            {uso.exclusivo && <Linha destacado rotulo="Conjurada como truque" valor="não gasta PM" />}
          </div>
          <Total valor={`${uso.custoTotal} PM`} />
        </div>
      </div>

      {/* --- Efeito: só quando a magia tem fórmula --- */}
      {rolagem && (
        <div className="flex flex-col gap-2">
          <Titulo>{rolagem.efeito || rolagem.nome}</Titulo>
          <div className="flex flex-col">
            <div className="flex flex-col">
              {rolagem.itens.map((item) => (
                <Linha key={item.rotulo} rotulo={item.rotulo} valor={item.dado ?? formatar(item.valor)} />
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
            <Total valor={formula} />
          </div>
        </div>
      )}

      {/* --- O que vai pra mesa --- */}
      {(formula || resistencia.valor) && (
        <div className="flex flex-row gap-2">
          {formula && <Caixa rotulo="Role na mesa">{formula}</Caixa>}
          {resistencia.valor && cd !== null && <Caixa rotulo={resistencia.valor}>CD {cd}</Caixa>}
        </div>
      )}

      {fichaTecnica.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {fichaTecnica.map((item) => (
            <Dado key={item.rotulo} rotulo={item.rotulo} mudou={item.mudou}>
              {item.valor}
            </Dado>
          ))}
        </div>
      )}

      <ListaAprimoramentos uso={uso} chaves={CHAVES} contexto="nesta magia" />
    </FolhaModal>
  );
}
