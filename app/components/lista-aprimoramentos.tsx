"use client";

import { FaCheck, FaChevronDown, FaCircleMinus, FaEye, FaMinus, FaPlus } from "react-icons/fa6";
import { useState, type ReactNode } from "react";
import { bonusDe, formulasDe, multiplicarFormula } from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type { Aprimoramento, ConsumoDeItem } from "../lib/foundry-types";

/** Um item do gasto, já com o total de unidades deste uso. */
export type ItemGasto = { itemId: string; nome: string; quantidade: number; disponivel: number };

/**
 * O que o uso cobra, em texto de botão: "5 PM e Flecha", "Enxofre ×2",
 * "3 PM, Flecha e Pó de dragão".
 *
 * A partir de três itens vira contagem ("3 itens"): a lista logo acima já diz
 * quais são, e um botão que quebra em três linhas some com o polegar.
 */
function resumirGasto(pm: number, itens: ItemGasto[]) {
  const partes: string[] = [];
  if (pm > 0) partes.push(`${pm} PM`);
  if (itens.length > 2) {
    partes.push(`${itens.reduce((soma, item) => soma + item.quantidade, 0)} itens`);
  } else {
    for (const item of itens) {
      partes.push(item.quantidade > 1 ? `${item.nome} ×${item.quantidade}` : item.nome);
    }
  }
  if (partes.length < 2) return partes[0] ?? "";
  return `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}`;
}

/**
 * Junta os consumos num gasto só, por item: a mesma erva pode vir do material
 * declarado na magia e de um aprimoramento marcado, e o que o jogador precisa
 * ver (e o Foundry, baixar) é o total.
 */
function juntarConsumos(entradas: { consumo: ConsumoDeItem; vezes: number }[]): ItemGasto[] {
  const porItem = new Map<string, ItemGasto>();
  for (const { consumo, vezes } of entradas) {
    const quantidade = consumo.quantidade * vezes;
    if (quantidade <= 0) continue;
    const atual = porItem.get(consumo.itemId);
    if (atual) atual.quantidade += quantidade;
    else {
      porItem.set(consumo.itemId, {
        itemId: consumo.itemId,
        nome: consumo.nome,
        quantidade,
        disponivel: consumo.disponivel
      });
    }
  }
  return [...porItem.values()];
}

/**
 * Segura o valor de antes: enquanto `congelar` é falso o valor acompanha o
 * que chega; ligado, fica o último.
 *
 * Companheiro do gasto: `useAprimoramentos` congela por dentro a lista de
 * aprimoramentos, e isto congela o que veio de fora do painel (a arma, a
 * magia, a fórmula da perícia). Sem os dois, o item que acabou some da ficha
 * e o painel se reescreve enquanto o jogador ainda confere o que rolar.
 */
export function useCongelado<T>(valor: T, congelar: boolean): T {
  // "Ajustar estado durante o render", o padrão do próprio React para estado
  // derivado de props: o guardado acompanha o que chega até `congelar` ligar.
  // Devolver `valor` enquanto está solto evita renderizar o valor de ontem no
  // quadro em que a prop muda.
  const [guardado, setGuardado] = useState(valor);
  if (!congelar && !Object.is(guardado, valor)) setGuardado(valor);
  return congelar ? guardado : valor;
}

export type UsoDeAprimoramentos = ReturnType<typeof useAprimoramentos>;

/**
 * Estado de uso dos aprimoramentos de um teste, ataque ou conjuração — e do
 * que esse uso vai cobrar em PM e em itens.
 *
 * Cada aprimoramento pode ser aplicado N vezes quando marcado como repetível
 * (`aumenta`) no Foundry — é o caso do "Golpe Divino: Aumentar dano +1d8", em
 * que cada PM extra soma mais um d8. Custo e bônus crescem juntos, como no
 * sistema.
 *
 * As opções:
 *
 * - `acao` é o nome do que está sendo usado; só serve para o aviso no chat.
 * - `custoBase` é o que a ação custa antes de qualquer aprimoramento — o PM
 *   da própria magia. Ataque não tem: a arma não custa PM, só os
 *   aprimoramentos.
 * - `custoMinimo` é o piso do que se paga quando há custo base: em T20 nem
 *   toda redução chega a zero — a magia nunca sai por menos de 1 PM.
 * - `consumo` é o item que o próprio uso gasta (a munição da arma, o material
 *   da magia). Some a ele os aprimoramentos marcados que moram num
 *   consumível: marcar é usar o frasco.
 * - `exclusivos` descreve o aprimoramento que muda a natureza da ação em vez
 *   de somar a ela — nas magias, o truque. Escolhido um desses, o custo
 *   inteiro zera (nem a ação em si é cobrada) e o que ele `exclui` sai de
 *   cena: fica desmarcado e travado. Quem diz o que conta como exclusivo, o
 *   que ele exclui e como chamá-lo na tela é quem usa o hook — a regra e a
 *   palavra são de magia, não daqui.
 */
export function useAprimoramentos(
  aplicaveis: Aprimoramento[],
  opcoes: {
    acao?: string;
    custoBase?: number;
    custoMinimo?: number;
    consumo?: ConsumoDeItem | null;
    /**
     * Item que originou o uso. Preenchido, o Foundry publica o card do poder
     * no chat — e é o que dá um botão a quem não gasta nada.
     */
    origemId?: string;
    /** Ids dos efeitos que a ativação vai ligar na ficha. */
    efeitos?: string[];
    exclusivos?: {
      quando: (item: Aprimoramento) => boolean;
      /** O que o exclusivo desliga. Fora disso, tudo segue disponível. */
      exclui: (item: Aprimoramento) => boolean;
      rotulo: string;
    };
  } = {}
) {
  const {
    acao = "",
    custoBase = 0,
    custoMinimo = 0,
    consumo = null,
    origemId,
    efeitos,
    exclusivos
  } = opcoes;
  const { ficha, somenteLeitura, gastarUso } = useFoundry();
  // Quem já vem ligado na ficha entra marcado: o jogador não precisa lembrar
  // de ativar todo turno o que o personagem tem sempre. Continua desmarcável.
  const [vezes, setVezes] = useState<Record<string, number>>(() =>
    Object.fromEntries(aplicaveis.filter((item) => item.ativoPorPadrao).map((item) => [item.id, 1]))
  );
  /**
   * O uso, congelado no instante em que foi pago.
   *
   * Não é só um "já gastei": gastar muda a ficha, a ficha nova desce pelo
   * stream e o que está em volta se mexeria sozinho — o consumível que
   * acabou some do Foundry, e com ele o aprimoramento que morava nele
   * desapareceria da lista, mudando bônus e totais debaixo do olho de quem
   * ainda está conferindo o que rolar na mesa. Depois de pago a tela
   * congela: mesma lista, mesmas contas, até fechar o painel.
   */
  const [pagoCom, setPagoCom] = useState<{
    aplicaveis: Aprimoramento[];
    consumo: ConsumoDeItem | null;
  } | null>(null);
  const pago = !!pagoCom;

  // Depois do gasto, tudo se calcula sobre o retrato de então.
  const emUso = pagoCom?.aplicaveis ?? aplicaveis;
  const consumoEmUso = pagoCom ? pagoCom.consumo : consumo;

  const pmAtual = ficha?.pm.atual ?? 0;
  const quantidadeDe = (item: Aprimoramento) => vezes[item.id] ?? 0;
  const escolhidos = emUso.filter((item) => quantidadeDe(item) > 0);

  const exclusivo = exclusivos ? (escolhidos.find(exclusivos.quando) ?? null) : null;

  /** "Truque" no lugar do custo, para o que não se mede em PM. */
  const rotuloExclusivo = (item: Aprimoramento) =>
    exclusivos?.quando(item) ? exclusivos.rotulo : null;

  // Custo negativo é desconto de verdade ("−1 PM nesta magia") e entra na
  // soma; o que ele não pode é virar crédito.
  const somaDosCustos = escolhidos.reduce(
    (soma, item) => soma + item.custo * quantidadeDe(item),
    custoBase
  );
  // O piso só vale onde há custo base a reduzir — é limite de desconto, não
  // cobrança inventada num ataque ou num teste que não custam nada.
  const piso = custoBase > 0 ? custoMinimo : 0;
  const custoTotal = exclusivo ? 0 : Math.max(piso, somaDosCustos);
  /** Os descontos passaram do limite e o custo parou no mínimo da regra. */
  const noMinimo = !exclusivo && piso > 0 && somaDosCustos < piso;
  const semPM = custoTotal > pmAtual;

  // `porPM` é o `mpMultiplier` do sistema: gasta uma unidade por PM da
  // conjuração, então só dá para resolver aqui, depois de fechado o custo.
  const itensGastos = juntarConsumos([
    ...(consumoEmUso ? [{ consumo: consumoEmUso, vezes: consumoEmUso.porPM ? custoTotal : 1 }] : []),
    ...escolhidos.flatMap((item) =>
      item.consumo ? [{ consumo: item.consumo, vezes: quantidadeDe(item) }] : []
    )
  ]);
  /** O primeiro item que não dá para gastar — é o que o botão vai dizer. */
  const faltando = itensGastos.find((item) => item.quantidade > item.disponivel) ?? null;

  const resumoDoGasto = resumirGasto(custoTotal, itensGastos);

  // Trava por dois motivos: o uso já foi pago — daí em diante o painel é um
  // extrato do que se gastou, e nada mais se marca ou desmarca — ou um
  // exclusivo está em uso e este é um dos que ele desliga.
  const travado = (item: Aprimoramento) =>
    pago || (!!exclusivo && item.id !== exclusivo.id && !!exclusivos?.exclui(item));

  function definir(item: Aprimoramento, quantidade: number) {
    if (travado(item)) return;
    setVezes((atual) => {
      const novo = { ...atual, [item.id]: Math.max(0, quantidade) };
      // Ligar o truque apaga o que ele exclui: são jeitos diferentes de
      // lançar a mesma magia, não se somam. Deixar marcado o que vai travar
      // em seguida daria a entender que ainda vale.
      if (quantidade > 0 && exclusivos?.quando(item)) {
        for (const outro of emUso) {
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

  /**
   * Um uso que vale a viagem até o Foundry mesmo custando zero: é o poder que
   * só toma a ação do turno, e que ainda assim a mesa precisa ver anunciado.
   */
  const podeAnunciar = !!origemId;

  /**
   * Cobra o uso: PM e itens de uma vez só, e o Foundry anuncia no chat da
   * mesa. Um pedido só para os dois — é um gasto, não dois; se o item não
   * couber, nem o PM sai.
   */
  function gastar() {
    if (somenteLeitura || pago || semPM || faltando) return;
    if (custoTotal === 0 && !itensGastos.length && !podeAnunciar) return;
    gastarUso({
      acao,
      pm: custoTotal,
      itens: itensGastos.map(({ itemId, quantidade }) => ({ itemId, quantidade })),
      origemId,
      // Só os ids: quem sabe o nome de cada aprimoramento (e o que cada
      // efeito faz) é o Foundry.
      aprimoramentos: escolhidos.map((item) => item.id),
      efeitos
    });
    setPagoCom({ aplicaveis, consumo });
  }

  return {
    /** A lista que a tela mostra: a atual, ou a congelada depois do gasto. */
    aplicaveis: emUso,
    escolhidos,
    pmAtual,
    custoTotal,
    /** O que sai da mochila neste uso, agrupado por item. */
    itensGastos,
    /** Item que o personagem não tem em quantidade suficiente, ou null. */
    faltando,
    /** "5 PM e Flecha" — o que o botão de gasto anuncia. */
    resumoDoGasto,
    /** O custo parou no mínimo da regra (a magia não sai por menos de 1 PM). */
    noMinimo,
    /** Aprimoramento exclusivo em uso (o truque), ou null. */
    exclusivo,
    rotuloExclusivo,
    semPM,
    pago,
    /** Há o que anunciar na mesa mesmo sem gasto — o botão existe assim mesmo. */
    podeAnunciar,
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
      {/* Mesma largura dos botões: o número cresce para dois dígitos sem
          empurrar nada. */}
      <span className="numero w-8 text-center text-sm font-bold leading-none">{quantidade}×</span>
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

  // O que este aprimoramento tira da mochila. "sem custo" ao lado disso seria
  // mentira: não custa PM, mas custa o frasco.
  const gastoDeItem = item.consumo
    ? `gasta ${item.consumo.nome}${quantidade > 1 ? ` ×${quantidade * item.consumo.quantidade}` : ""}`
    : null;

  // Truque não é "de graça": é outro jeito de lançar a magia, e a palavra na
  // etiqueta é o que o jogador procura na lista.
  const custo =
    uso.rotuloExclusivo(item) ??
    (item.custo > 0 ? `${item.custo * Math.max(1, quantidade)} PM` : gastoDeItem ? null : "sem custo");
  const detalhes = [...efeitos, custo, gastoDeItem].filter(Boolean).join(" · ");

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

  // Apagar a linha só faz sentido enquanto ela é uma escolha: com o truque
  // ligado, a opacidade separa o que ficou de fora do que segue disponível.
  // Depois de pago está tudo travado igual, e apagar a lista inteira
  // atrapalharia justamente quem abriu o painel para conferir.
  const classe = `flex flex-row items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
    travado && !uso.pago ? "opacity-70" : ""
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
        {/* Pago, o convite a marcar vira registro: a lista continua na tela
            para conferência, mas não é mais uma escolha. */}
        {uso.pago
          ? `Usado ${contexto}`
          : uso.somenteLeitura
            ? `Pode usar ${contexto}`
            : `Marque o que vai usar ${contexto}`}{" "}
        · {uso.pmAtual} PM disponíveis
      </span>
      {uso.aplicaveis.map((item) => (
        <Linha key={item.id} item={item} uso={uso} chaves={chaves} comRegra={comRegra} />
      ))}
    </div>
  );
}

/**
 * Rodapé de confirmação — vira aviso quando a ficha é só de leitura.
 *
 * O botão diz exatamente o que vai sair: PM, itens, ou os dois. Um uso que não
 * cobra nada não tem rodapé nenhum. O ícone é o menos, e não uma moeda, porque
 * o custo aqui quase nunca é dinheiro — o par dele é o `FaCheck` de "Gastou".
 */
export function RodapeGasto({ uso }: { uso: UsoDeAprimoramentos }): ReactNode {
  // Sem gasto e sem anúncio não há botão: o painel é só consulta.
  if (!uso.resumoDoGasto && !uso.podeAnunciar) return undefined;

  // Ficha de companheiro: não se ativa poder dos outros, e o que não custa
  // nada não tem sequer o "custaria" a mostrar.
  if (uso.somenteLeitura && !uso.resumoDoGasto) return undefined;

  if (uso.somenteLeitura) {
    return (
      <p className="flex min-h-12 flex-row items-center justify-center gap-2 text-sm font-semibold opacity-60">
        <FaEye aria-hidden="true" className="size-3.5!" />
        <span className="numero">Custaria {uso.resumoDoGasto}</span>
      </p>
    );
  }

  // Falta de PM e falta de item travam igual; o botão nomeia o que faltou,
  // porque "não dá" sem dizer o quê manda o jogador procurar sozinho.
  const impedido = uso.semPM ? "Sem PM suficiente" : uso.faltando ? `Sem ${uso.faltando.nome}` : null;

  return (
    <button
      type="button"
      onClick={uso.gastar}
      disabled={uso.pago || !!impedido}
      className={`flex min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity ${
        uso.pago
          ? "border border-borda opacity-60"
          : impedido
            ? "border border-borda opacity-50"
            : "bg-acento text-acento-tinta hover:opacity-90"
      }`}
    >
      {uso.pago ? <FaCheck aria-hidden="true" className="size-4!" /> : <FaCircleMinus aria-hidden="true" className="size-4!" />}
      {/* Sem custo, o botão não fala de gasto: ele anuncia a ativação na mesa. */}
      {uso.resumoDoGasto
        ? uso.pago
          ? `Gastou ${uso.resumoDoGasto}`
          : (impedido ?? `Gastar ${uso.resumoDoGasto}`)
        : uso.pago
          ? "Anunciado na mesa"
          : "Ativar"}
    </button>
  );
}
