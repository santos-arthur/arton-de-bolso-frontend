"use client";

import { useMemo, type ReactNode } from "react";
import FolhaModal from "./folha-modal";
import { ListaAprimoramentos, RodapeGasto, useAprimoramentos, useCongelado } from "./lista-aprimoramentos";
import { aprimoramentosDe, bonusDe, somarTermos } from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type {
  Aprimoramento,
  ConsumoDeItem,
  EscopoAprimoramento,
  RolagemMagia,
  TesteDeUso
} from "../lib/foundry-types";

function formatar(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

/**
 * Chaves que um aprimoramento mexe aqui. Não são as do ataque: nem magia nem
 * consumível têm margem de crítico ou bônus de ataque — têm o efeito (a
 * fórmula) e a CD.
 */
const CHAVES = [
  { chave: "dano", rotulo: "no efeito" },
  { chave: "cd", rotulo: "na CD" }
];

/** Modo do Active Effect que troca o valor do campo em vez de somar a ele. */
const SUBSTITUI = 5;

/**
 * O que se usa, no formato que este painel mostra. Magia e consumível caem no
 * mesmo molde porque no sistema são a mesma coisa: um pergaminho é a magia
 * copiada para dentro de um item, com o custo em PM zerado.
 */
export type AcaoDeUso = {
  id: string;
  nome: string;
  /** Primeira linha da conta de PM — a magia traz o círculo junto. */
  rotuloDoCusto: string;
  custo: number;
  ativacao: string;
  alcance: string;
  alvo: string;
  area: string;
  duracao: string;
  resistencia: string;
  cd: number | null;
  rolagens: RolagemMagia[];
  consumo: ConsumoDeItem | null;
  /** Só o pergaminho tem: o teste para ler uma magia que não se conhece. */
  teste?: TesteDeUso | null;
};

/**
 * Aplica nos campos de texto (alcance, alvo, duração...) o que os
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

/** Ficha técnica: o que não muda com aprimoramento. */
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
 * Painel de usar. Espelha a ideia do painel de ataque — mostrar de onde vem
 * cada número e o que se rola na mesa —, mas o conteúdo é o de magia: custo
 * em PM, CD da resistência e o efeito, no lugar de ataque e crítico.
 *
 * Serve a magia e a pergaminho/poção porque o sistema não os separa: o
 * mecanismo de uso é o mesmo, muda o que se paga — a magia nunca sai de graça
 * (e nunca por menos de 1 PM), o consumível costuma custar zero e se gastar a
 * si mesmo.
 */
export default function PainelDeUso({
  acao: atual,
  escopo,
  contexto,
  custoMinimo = 0,
  exclusivos,
  rotulos = {},
  onFechar
}: {
  acao: AcaoDeUso;
  escopo: EscopoAprimoramento;
  /** Como a lista de aprimoramentos se refere ao uso: "nesta magia". */
  contexto: string;
  custoMinimo?: number;
  exclusivos?: {
    quando: (item: Aprimoramento) => boolean;
    exclui: (item: Aprimoramento) => boolean;
    rotulo: string;
  };
  /** Textos das linhas que só existem em alguns usos (o piso, o truque). */
  rotulos?: { minimo?: string; exclusivo?: string };
  onFechar: () => void;
}) {
  const { ficha } = useFoundry();
  const todos = ficha?.aprimoramentos;
  const aplicaveis = useMemo(
    () => aprimoramentosDe(todos ?? [], escopo, atual.nome, atual.id),
    [todos, escopo, atual.nome, atual.id]
  );

  const uso = useAprimoramentos(aplicaveis, {
    acao: atual.nome,
    custoBase: atual.custo,
    custoMinimo,
    consumo: atual.consumo,
    exclusivos
  });
  // Pago o uso, o painel vira extrato: nem o que chega da ficha nova mexe
  // mais no que está na tela.
  const acao = useCongelado(atual, uso.pago);
  const rolagem = acao.rolagens[0];
  const cd = acao.cd === null ? null : acao.cd + uso.bonusTotal("cd");

  const formula = rolagem
    ? somarTermos([
        rolagem.formula,
        ...uso.formulasExtras("dano").map((e) => e.formula),
        String(uso.bonusTotal("dano"))
      ])
    : null;

  // Um pergaminho custa zero e não aceita desconto: a conta de PM não teria o
  // que mostrar, e o rodapé já diz que sai uma unidade do item.
  const temConta = acao.custo > 0 || uso.custoTotal > 0 || uso.escolhidos.some((item) => item.custo !== 0);

  const campo = (base: string, chave: string) => comAprimoramentos(base, chave, uso.escolhidos);
  const alvo = acao.area ? campo(acao.area, "area") : campo(acao.alvo, "alvo");
  const resistencia = campo(acao.resistencia, "resistencia");

  const fichaTecnica = [
    { rotulo: "Execução", ...campo(acao.ativacao, "execucao") },
    { rotulo: "Alcance", ...campo(acao.alcance, "alcance") },
    { rotulo: acao.area ? "Área" : "Alvo", ...alvo },
    { rotulo: "Duração", ...campo(acao.duracao, "duracao") },
    // Só aparece quando algum aprimoramento acrescenta condição — a magia em
    // si não tem esse campo.
    { rotulo: "Condição", ...campo("", "condicao") }
  ].filter((item) => item.valor);

  return (
    <FolhaModal titulo={acao.nome} onFechar={onFechar} rodape={<RodapeGasto uso={uso} />}>
      {/* --- O teste que vem antes de tudo: identificar a magia do
              pergaminho. Quem conhece a magia não vê nada aqui. --- */}
      {acao.teste && (
        <div className="flex flex-col gap-2">
          <Titulo>Antes de usar</Titulo>
          <div className="flex flex-row gap-2">
            <Caixa rotulo={`Role ${acao.teste.pericia}`}>1d20 {acao.teste.totalFormatado}</Caixa>
            <Caixa rotulo="Identificar a magia">CD {acao.teste.cd}</Caixa>
          </div>
          {/* O que se arrisca aqui é a ação, não o item: por isso o botão de
              gasto continua livre, e é o jogador que aperta quando o teste
              passou de verdade. */}
          <p className="text-xs opacity-60">
            Esta magia não está na sua ficha — é preciso identificá-la para ler o pergaminho. Falhar custa a
            ação e mais nada: o pergaminho continua com você.
          </p>
        </div>
      )}

      {/* --- Custo --- */}
      {temConta && (
        <div className="flex flex-col gap-2">
          <Titulo>Custo</Titulo>
          <div className="flex flex-col">
            <div className="flex flex-col">
              {acao.custo > 0 && <Linha rotulo={acao.rotuloDoCusto} valor={`${acao.custo} PM`} />}
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
              {/* Sem isto o Total contraria as linhas acima: elas somam zero (ou
                  menos) e a conta fecha no mínimo. */}
              {uso.noMinimo && rotulos.minimo && (
                <Linha destacado rotulo={rotulos.minimo} valor={`${custoMinimo} PM`} />
              )}
              {uso.exclusivo && rotulos.exclusivo && (
                <Linha destacado rotulo={rotulos.exclusivo} valor="não gasta PM" />
              )}
            </div>
            <Total valor={`${uso.custoTotal} PM`} />
          </div>
        </div>
      )}

      {/* --- Efeito: só quando há fórmula --- */}
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

      {/* Sem as regras: aqui a lista é de escolha rápida — o que marcar antes
          de usar —, e a descrição dos poderes que aparecem nela é a regra do
          poder inteiro, que já mora na página de Poderes. */}
      <ListaAprimoramentos uso={uso} chaves={CHAVES} contexto={contexto} comRegra={false} />
    </FolhaModal>
  );
}
