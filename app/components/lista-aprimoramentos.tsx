"use client";

import { FaCheck, FaChevronDown, FaCoins, FaEye, FaMinus, FaPlus } from "react-icons/fa6";
import { useState, type ReactNode } from "react";
import { bonusDe, formulasDe, multiplicarFormula } from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type { Aprimoramento } from "../lib/foundry-types";

export type UsoDeAprimoramentos = ReturnType<typeof useAprimoramentos>;

/**
 * Estado de uso dos aprimoramentos de um teste ou ataque.
 *
 * Cada um pode ser aplicado N vezes quando marcado como repetível (`aumenta`)
 * no Foundry — é o caso do "Golpe Divino: Aumentar dano +1d8", em que cada
 * PM extra soma mais um d8. Custo e bônus crescem juntos, como no sistema.
 */
/**
 * `custoBase` é o que a ação custa antes de qualquer aprimoramento — o PM da
 * própria magia. Ataque não tem: a arma não custa PM, só os aprimoramentos.
 *
 * `exclusivo` descreve o aprimoramento que muda a natureza da ação em vez de
 * somar a ela — nas magias, o truque. Escolhido um desses, o custo inteiro
 * zera (nem a ação em si é cobrada) e o que ele `exclui` sai de cena: fica
 * desmarcado e travado. Quem diz o que conta como exclusivo, o que ele
 * exclui e como chamá-lo na tela é quem usa o hook — a regra e a palavra são
 * de magia, não daqui.
 */
export function useAprimoramentos(
  aplicaveis: Aprimoramento[],
  custoBase = 0,
  exclusivos?: {
    quando: (item: Aprimoramento) => boolean;
    /** O que o exclusivo desliga. Fora disso, tudo segue disponível. */
    exclui: (item: Aprimoramento) => boolean;
    rotulo: string;
  }
) {
  const { ficha, somenteLeitura, ajustarPM } = useFoundry();
  // Quem já vem ligado na ficha entra marcado: o jogador não precisa lembrar
  // de ativar todo turno o que o personagem tem sempre. Continua desmarcável.
  const [vezes, setVezes] = useState<Record<string, number>>(() =>
    Object.fromEntries(aplicaveis.filter((item) => item.ativoPorPadrao).map((item) => [item.id, 1]))
  );
  const [pago, setPago] = useState(false);

  const pmAtual = ficha?.pm.atual ?? 0;
  const quantidadeDe = (item: Aprimoramento) => vezes[item.id] ?? 0;
  const escolhidos = aplicaveis.filter((item) => quantidadeDe(item) > 0);

  const exclusivo = exclusivos ? (escolhidos.find(exclusivos.quando) ?? null) : null;

  /** "Truque" no lugar do custo, para o que não se mede em PM. */
  const rotuloExclusivo = (item: Aprimoramento) =>
    exclusivos?.quando(item) ? exclusivos.rotulo : null;

  // Custo negativo é desconto de verdade ("−1 PM nesta magia") e entra na
  // soma; o que ele não pode é virar crédito, daí o piso em zero.
  const custoTotal = exclusivo
    ? 0
    : Math.max(0, escolhidos.reduce((soma, item) => soma + item.custo * quantidadeDe(item), custoBase));
  const semPM = custoTotal > pmAtual;
  // Trava por dois motivos: já foi pago (não dá pra mexer no que se gastou) ou
  // um exclusivo está em uso e este é um dos que ele desliga.
  const travado = (item: Aprimoramento) =>
    (pago && item.custo > 0) ||
    (!!exclusivo && item.id !== exclusivo.id && !!exclusivos?.exclui(item));

  function definir(item: Aprimoramento, quantidade: number) {
    if (travado(item)) return;
    setVezes((atual) => {
      const novo = { ...atual, [item.id]: Math.max(0, quantidade) };
      // Ligar o truque apaga o que ele exclui: são jeitos diferentes de
      // lançar a mesma magia, não se somam. Deixar marcado o que vai travar
      // em seguida daria a entender que ainda vale.
      if (quantidade > 0 && exclusivos?.quando(item)) {
        for (const outro of aplicaveis) {
          if (outro.id !== item.id && exclusivos.exclui(outro)) novo[outro.id] = 0;
        }
      }
      return novo;
    });
  }

  /** Soma dos bônus numéricos de uma chave ("roll", "ataque", "dano"). */
  function bonusTotal(chave: string) {
    return escolhidos.reduce(
      (soma, item) => soma + (bonusDe(item, chave) ?? 0) * quantidadeDe(item),
      0
    );
  }

  /**
   * Fórmulas extras de uma chave, já multiplicadas (ex.: "3d8"). Vêm com id
   * próprio porque dois aprimoramentos podem render a mesma fórmula — o
   * Golpe Divino e o "Aumentar dano" somam "1d8" cada um — e o texto sozinho
   * não serve de chave de lista.
   */
  function formulasExtras(chave: string) {
    return escolhidos.flatMap((item) =>
      formulasDe(item, chave).map((formula, indice) => ({
        id: `${item.id}-${chave}-${indice}`,
        formula: multiplicarFormula(formula, quantidadeDe(item))
      }))
    );
  }

  function gastar() {
    if (somenteLeitura || pago || semPM || custoTotal === 0) return;
    ajustarPM(-custoTotal);
    setPago(true);
  }

  return {
    aplicaveis,
    escolhidos,
    pmAtual,
    custoTotal,
    /** Aprimoramento exclusivo em uso (o truque), ou null. */
    exclusivo,
    rotuloExclusivo,
    semPM,
    pago,
    somenteLeitura,
    quantidadeDe,
    definir,
    travado,
    bonusTotal,
    formulasExtras,
    gastar
  };
}

/**
 * Empilhado, e não em linha: fica na mesma coluna da esquerda que a caixa de
 * marcação das outras linhas, então o controle está sempre no mesmo lugar,
 * seja o aprimoramento repetível ou não.
 */
function Contador({
  quantidade,
  travado,
  aoMudar
}: {
  quantidade: number;
  travado: boolean;
  aoMudar: (valor: number) => void;
}) {
  const botao =
    "flex h-6 w-8 items-center justify-center rounded-md border border-borda transition-colors hover:bg-foreground/5 disabled:opacity-30";

  return (
    <span className="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => aoMudar(quantidade + 1)}
        disabled={travado}
        aria-label="Aplicar mais uma vez"
        className={botao}
      >
        <FaPlus aria-hidden="true" className="size-2.5!" />
      </button>
      <span className="numero text-sm font-bold leading-none">{quantidade}×</span>
      <button
        type="button"
        onClick={() => aoMudar(quantidade - 1)}
        disabled={travado || quantidade === 0}
        aria-label="Aplicar menos uma vez"
        className={botao}
      >
        <FaMinus aria-hidden="true" className="size-2.5!" />
      </button>
    </span>
  );
}

function Linha({
  item,
  uso,
  chaves,
  comRegra
}: {
  item: Aprimoramento;
  uso: UsoDeAprimoramentos;
  chaves: { chave: string; rotulo: string }[];
  comRegra: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const regra = comRegra ? item.descricao : "";
  const quantidade = uso.quantidadeDe(item);
  const travado = uso.travado(item);
  const marcado = quantidade > 0;

  const efeitos = chaves
    .flatMap(({ chave, rotulo }) => {
      const numero = bonusDe(item, chave);
      const formulas = formulasDe(item, chave);
      const partes: string[] = [];
      if (numero !== null) partes.push(`${numero >= 0 ? "+" : ""}${numero * Math.max(1, quantidade)} ${rotulo}`);
      for (const formula of formulas) {
        partes.push(`+${multiplicarFormula(formula, Math.max(1, quantidade))} ${rotulo}`);
      }
      return partes;
    })
    .filter(Boolean);

  // Truque não é "de graça": é outro jeito de lançar a magia, e a palavra na
  // etiqueta é o que o jogador procura na lista.
  const custo =
    uso.rotuloExclusivo(item) ?? (item.custo > 0 ? `${item.custo * Math.max(1, quantidade)} PM` : "sem custo");
  const detalhes = [...efeitos, custo].join(" · ");

  const conteudo = (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="flex flex-row items-start gap-2">
        <span className="min-w-0 flex-1 text-sm font-bold">{item.nome}</span>
        {regra && (
          // preventDefault: dentro do <label>, um clique aqui acionaria o
          // checkbox junto — aqui ele só abre a regra.
          <button
            type="button"
            onClick={(evento) => {
              evento.preventDefault();
              setAberto((v) => !v);
            }}
            aria-expanded={aberto}
            aria-label={aberto ? "Ocultar a regra" : "Ver a regra"}
            className="-mr-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg border border-borda transition-colors hover:bg-foreground/5"
          >
            <FaChevronDown
              aria-hidden="true"
              className={`size-3.5! opacity-60 transition-transform ${aberto ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </span>
      <span className="numero text-xs font-semibold text-acento">{detalhes}</span>
      {aberto && regra && (
        <span
          className="prosa-foundry border-t border-borda pt-2 text-xs opacity-70"
          dangerouslySetInnerHTML={{ __html: regra }}
        />
      )}
    </span>
  );

  const classe = `flex flex-row items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
    travado ? "opacity-70" : ""
  } ${marcado ? "border-acento bg-acento/10" : "border-borda bg-superficie-alta"}`;

  const imagem = item.img ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.img} alt="" className="mt-0.5 size-8 shrink-0 rounded-lg object-cover" />
  ) : null;

  // Repetível ganha contador; o resto continua sendo um liga/desliga.
  if (item.aumenta) {
    return (
      <div className={classe}>
        <Contador quantidade={quantidade} travado={travado} aoMudar={(v) => uso.definir(item, v)} />
        {imagem}
        {conteudo}
      </div>
    );
  }

  return (
    <label className={`${classe} ${travado ? "cursor-default" : "cursor-pointer"}`}>
      {/* Mesma largura do contador (w-8) para as duas colunas de controle
          ficarem alinhadas entre linhas com e sem repetição. */}
      <span className="flex w-8 shrink-0 justify-center">
        <input
          type="checkbox"
          checked={marcado}
          onChange={() => uso.definir(item, marcado ? 0 : 1)}
          disabled={travado}
          className="checkbox-personalizado mt-0.5 size-5 cursor-pointer rounded border border-borda disabled:cursor-default"
        />
      </span>
      {imagem}
      {conteudo}
    </label>
  );
}

/**
 * A lista em si, com o rótulo da seção.
 *
 * `comRegra` liga o dropdown que abre a descrição do efeito. Ele vale onde o
 * texto explica o próprio aprimoramento, mas o que vem de um poder traz a
 * regra inteira do poder — parágrafos que o jogador já leu na página de
 * Poderes e que, no meio de conjurar, só afastam o que ele veio ver.
 */
export function ListaAprimoramentos({
  uso,
  chaves,
  contexto,
  comRegra = true
}: {
  uso: UsoDeAprimoramentos;
  chaves: { chave: string; rotulo: string }[];
  contexto: string;
  comRegra?: boolean;
}) {
  if (!uso.aplicaveis.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">
        {uso.somenteLeitura ? `Pode usar ${contexto}` : `Marque o que vai usar ${contexto}`} · {uso.pmAtual} PM
        disponíveis
      </span>
      {uso.aplicaveis.map((item) => (
        <Linha key={item.id} item={item} uso={uso} chaves={chaves} comRegra={comRegra} />
      ))}
    </div>
  );
}

/** Rodapé de confirmação — vira aviso quando a ficha é só de leitura. */
export function RodapeGasto({ uso }: { uso: UsoDeAprimoramentos }): ReactNode {
  if (uso.custoTotal === 0) return undefined;

  if (uso.somenteLeitura) {
    return (
      <p className="flex min-h-12 flex-row items-center justify-center gap-2 text-sm font-semibold opacity-60">
        <FaEye aria-hidden="true" className="size-3.5!" />
        <span className="numero">Custaria {uso.custoTotal} PM</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={uso.gastar}
      disabled={uso.pago || uso.semPM}
      className={`flex min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity ${
        uso.pago
          ? "border border-borda opacity-60"
          : uso.semPM
            ? "border border-borda opacity-50"
            : "bg-acento text-white hover:opacity-90"
      }`}
    >
      {uso.pago ? <FaCheck aria-hidden="true" className="size-4!" /> : <FaCoins aria-hidden="true" className="size-4!" />}
      {uso.pago
        ? `${uso.custoTotal} PM gastos`
        : uso.semPM
          ? "Sem PM suficiente"
          : `Gastar ${uso.custoTotal} PM`}
    </button>
  );
}
