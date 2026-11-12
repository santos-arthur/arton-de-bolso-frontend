"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaBagShopping, FaCheck, FaHourglassHalf, FaMinus, FaPlus, FaXmark } from "react-icons/fa6";
import CabecalhoPagina, { Cartao, EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import CampoBusca, { ChipFiltro, normalizar } from "../components/campo-busca";
import FolhaModal from "../components/folha-modal";
import PaginaFicha from "../components/pagina-ficha";
import { useFoundry } from "../lib/foundry-provider";
import type { ItemDaLoja, PedidoLoja } from "../lib/foundry-types";

/** Quantas linhas aparecem de cada vez — o catálogo pode ter centenas. */
const PAGINA = 40;
/** Maior quantidade por item, a mesma que o Foundry aceita. */
const QUANTIDADE_MAXIMA = 999;

/** Preço da loja (em TP, o "T$" do app), com os centavos de cobre quando houver. */
function preco(valor: number) {
  if (valor === 0) return "Grátis";
  return `T$ ${valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`;
}

/** O que as moedas da bolsa somam para a loja: TO, T$ e TC — a platina fica de fora, como na loja. */
function saldoParaLoja(dinheiro: { chave: string; valor: number; emTibar: number }[]) {
  return dinheiro.filter((m) => m.chave !== "tl").reduce((soma, m) => soma + m.valor * m.emTibar, 0);
}

function Contador({ valor, aoMudar }: { valor: number; aoMudar: (valor: number) => void }) {
  const botao =
    "flex size-9 shrink-0 items-center justify-center rounded-lg border border-borda transition-colors hover:bg-foreground/5";
  return (
    <div className="flex flex-row items-center gap-1.5">
      <button type="button" aria-label="Menos um" onClick={() => aoMudar(valor - 1)} className={botao}>
        <FaMinus aria-hidden="true" className="size-3!" />
      </button>
      <span className="numero w-8 text-center text-sm font-bold">{valor}</span>
      <button
        type="button"
        aria-label="Mais um"
        onClick={() => aoMudar(Math.min(QUANTIDADE_MAXIMA, valor + 1))}
        className={botao}
      >
        <FaPlus aria-hidden="true" className="size-3!" />
      </button>
    </div>
  );
}

function LinhaItem({
  item,
  quantidade,
  podePagar,
  somenteLeitura,
  aoMudar
}: {
  item: ItemDaLoja;
  quantidade: number;
  podePagar: boolean;
  somenteLeitura: boolean;
  aoMudar: (valor: number) => void;
}) {
  return (
    <li className="flex flex-row items-center gap-3 px-3 py-2.5">
      {item.img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.img} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-bold">{item.nome}</span>
        <span className="numero text-xs opacity-60">
          {item.tipo} · <span className={podePagar ? "" : "text-red-700 dark:text-red-400"}>{preco(item.preco)}</span>
          {item.espacos > 0 && ` · ${item.espacos.toLocaleString("pt-BR")} esp.`}
        </span>
      </span>
      {somenteLeitura ? null : quantidade > 0 ? (
        <Contador valor={quantidade} aoMudar={aoMudar} />
      ) : (
        <button
          type="button"
          onClick={() => aoMudar(1)}
          className="flex min-h-9 shrink-0 flex-row items-center gap-1.5 rounded-lg border border-borda px-3 text-xs font-bold transition-colors hover:bg-foreground/5"
        >
          <FaPlus aria-hidden="true" className="size-3!" />
          Carrinho
        </button>
      )}
    </li>
  );
}

const ESTADOS: Record<PedidoLoja["estado"], { rotulo: string; icone: typeof FaCheck; classe: string }> = {
  pendente: { rotulo: "Aguardando o mestre", icone: FaHourglassHalf, classe: "text-acento" },
  aprovado: { rotulo: "Aprovado", icone: FaCheck, classe: "text-green-700 dark:text-green-400" },
  recusado: { rotulo: "Recusado", icone: FaXmark, classe: "text-red-700 dark:text-red-400" },
  falhou: { rotulo: "Parou no meio — fale com o mestre", icone: FaXmark, classe: "text-red-700 dark:text-red-400" }
};

function CartaoPedido({ pedido }: { pedido: PedidoLoja }) {
  const estado = ESTADOS[pedido.estado];
  return (
    <Cartao className="flex flex-col gap-1.5 px-3 py-2.5">
      <span className={`flex flex-row items-center gap-2 text-xs font-bold uppercase tracking-wider ${estado.classe}`}>
        <estado.icone aria-hidden="true" className="size-3!" />
        {estado.rotulo}
        <span className="numero ml-auto normal-case tracking-normal opacity-80">{preco(pedido.total)}</span>
      </span>
      <span className="text-sm">
        {pedido.linhas.map((linha) => `${linha.nome}${linha.qtd > 1 ? ` ×${linha.qtd}` : ""}`).join(", ")}
      </span>
    </Cartao>
  );
}

/**
 * A loja do mundo (módulo t20-hayd-loja), pelo celular.
 *
 * O catálogo é o mesmo da loja do Foundry, com os mesmos preços. A diferença
 * é a compra: daqui ela é um **pedido** — vai ao chat dos mestres, com
 * Aprovar e Recusar, e só quando um mestre aprova o item entra na ficha e as
 * moedas saem. O pedido aparece no topo da tela até ser decidido.
 *
 * Magias (pergaminho e poção), fabricar, aprimorar e vender continuam na loja
 * do Foundry.
 */
export default function Page() {
  const { ficha, somenteLeitura, loja, pedidosLoja, carregarLoja, pedirCompra } = useFoundry();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [soQueDaPraPagar, setSoQueDaPraPagar] = useState(false);
  const [visiveis, setVisiveis] = useState(PAGINA);
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [abrirCarrinho, setAbrirCarrinho] = useState(false);

  useEffect(() => {
    carregarLoja();
    // Pedir uma vez ao abrir: o catálogo chega e os pedidos passam a vir sozinhos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itens = useMemo(() => loja?.itens ?? [], [loja]);
  const porUuid = useMemo(() => new Map(itens.map((item) => [item.uuid, item])), [itens]);
  const categorias = useMemo(() => {
    const vistas = new Map<string, string>();
    for (const item of itens) if (!vistas.has(item.categoria)) vistas.set(item.categoria, item.tipo);
    return [...vistas].sort(([, a], [, b]) => a.localeCompare(b, "pt-BR"));
  }, [itens]);

  // O saldo vem do Foundry, contado como a loja conta (com o cobre, que a
  // ficha do app não mostra). Módulo antigo: o que a ficha tem.
  const saldo = pedidosLoja?.saldo ?? (ficha ? saldoParaLoja(ficha.dinheiro) : 0);

  // O carrinho só esvazia quando o pedido aparece: se o Foundry recusar (item
  // que saiu da loja, moedas), a escolha continua ali para tentar de novo.
  const pendentesAntes = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!pendentesAntes.current) return;
    const novo = (pedidosLoja?.pedidos ?? []).some(
      (p) => p.estado === "pendente" && !pendentesAntes.current!.has(p.id)
    );
    if (novo) {
      pendentesAntes.current = null;
      setCarrinho({});
    }
  }, [pedidosLoja]);

  const linhasDoCarrinho = Object.entries(carrinho)
    .map(([uuid, qtd]) => ({ item: porUuid.get(uuid), qtd }))
    .filter((linha): linha is { item: ItemDaLoja; qtd: number } => !!linha.item && linha.qtd > 0);
  const totalDoCarrinho = linhasDoCarrinho.reduce((soma, l) => soma + l.item.preco * l.qtd, 0);
  const unidades = linhasDoCarrinho.reduce((soma, l) => soma + l.qtd, 0);
  // O que sobra para continuar comprando: "dá pra pagar" já conta o carrinho.
  const disponivel = saldo - totalDoCarrinho;

  const filtrados = useMemo(() => {
    const alvo = normalizar(busca);
    return itens.filter(
      (item) =>
        (categoria === null || item.categoria === categoria) &&
        (!alvo || normalizar(`${item.nome} ${item.tipo}`).includes(alvo)) &&
        (!soQueDaPraPagar || item.preco <= saldo)
    );
  }, [itens, busca, categoria, soQueDaPraPagar, saldo]);

  if (!ficha) return null;

  function definir(uuid: string, qtd: number) {
    setCarrinho((atual) => {
      const novo = { ...atual };
      if (qtd <= 0) delete novo[uuid];
      else novo[uuid] = Math.min(QUANTIDADE_MAXIMA, qtd);
      return novo;
    });
  }

  function pedir() {
    if (!linhasDoCarrinho.length || totalDoCarrinho > saldo || somenteLeitura) return;
    pendentesAntes.current = new Set(
      (pedidosLoja?.pedidos ?? []).filter((p) => p.estado === "pendente").map((p) => p.id)
    );
    pedirCompra(linhasDoCarrinho.map((l) => ({ uuid: l.item.uuid, qtd: l.qtd })));
    setAbrirCarrinho(false);
  }

  const pedidos = pedidosLoja?.pedidos ?? [];

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Loja">{`${preco(saldo)} na bolsa`}</CabecalhoPagina>

      {loja && !loja.disponivel && (
        <EstadoVazio>A loja não está ativa neste mundo — o mestre precisa ligar o módulo T20 Hayd Loja.</EstadoVazio>
      )}

      {pedidos.length > 0 && (
        <section className="flex flex-col gap-2">
          <TituloSecao>Pedidos</TituloSecao>
          {pedidos.map((pedido) => (
            <CartaoPedido key={pedido.id} pedido={pedido} />
          ))}
        </section>
      )}

      {linhasDoCarrinho.length > 0 && (
        <button
          type="button"
          onClick={() => setAbrirCarrinho(true)}
          className="flex min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-acento px-4 text-sm font-bold text-acento-tinta hover:opacity-90"
        >
          <FaBagShopping aria-hidden="true" className="size-4! shrink-0" />
          Carrinho · {unidades} {unidades === 1 ? "item" : "itens"} · {preco(totalDoCarrinho)}
        </button>
      )}

      {loja?.disponivel && (
        <>
          <CampoBusca valor={busca} aoMudar={(valor) => (setBusca(valor), setVisiveis(PAGINA))} placeholder="Buscar item...">
            <ChipFiltro ativo={categoria === null} onClick={() => (setCategoria(null), setVisiveis(PAGINA))}>
              Todos
            </ChipFiltro>
            {categorias.map(([chave, rotulo]) => (
              <ChipFiltro
                key={chave}
                ativo={categoria === chave}
                onClick={() => (setCategoria(categoria === chave ? null : chave), setVisiveis(PAGINA))}
              >
                {rotulo}
              </ChipFiltro>
            ))}
            <ChipFiltro ativo={soQueDaPraPagar} onClick={() => setSoQueDaPraPagar((v) => !v)}>
              Cabe na bolsa
            </ChipFiltro>
          </CampoBusca>

          {filtrados.length === 0 ? (
            <EstadoVazio>Nenhum item encontrado.</EstadoVazio>
          ) : (
            <Cartao>
              <ul className="flex flex-col divide-y divide-borda/60">
                {filtrados.slice(0, visiveis).map((item) => (
                  <LinhaItem
                    key={item.uuid}
                    item={item}
                    quantidade={carrinho[item.uuid] ?? 0}
                    podePagar={item.preco <= disponivel + item.preco * (carrinho[item.uuid] ?? 0)}
                    somenteLeitura={somenteLeitura}
                    aoMudar={(qtd) => definir(item.uuid, qtd)}
                  />
                ))}
              </ul>
              {filtrados.length > visiveis && (
                <button
                  type="button"
                  onClick={() => setVisiveis((v) => v + PAGINA)}
                  className="w-full border-t border-borda/60 py-3 text-sm font-bold text-acento"
                >
                  Mostrar mais ({filtrados.length - visiveis})
                </button>
              )}
            </Cartao>
          )}
        </>
      )}

      {!loja && <EstadoVazio>Carregando a loja…</EstadoVazio>}

      {abrirCarrinho && (
        <FolhaModal
          titulo="Carrinho"
          onFechar={() => setAbrirCarrinho(false)}
          rodape={
            somenteLeitura ? undefined : (
              <button
                type="button"
                onClick={pedir}
                disabled={!linhasDoCarrinho.length || totalDoCarrinho > saldo}
                className={`flex min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity disabled:transition-none ${
                  totalDoCarrinho > saldo || !linhasDoCarrinho.length
                    ? "border border-borda opacity-50"
                    : "bg-acento text-acento-tinta hover:opacity-90"
                }`}
              >
                <FaBagShopping aria-hidden="true" className="size-4! shrink-0" />
                {totalDoCarrinho > saldo ? "Moedas insuficientes" : `Pedir ao mestre · ${preco(totalDoCarrinho)}`}
              </button>
            )
          }
        >
          <Cartao>
            <ul className="flex flex-col divide-y divide-borda/60">
              {linhasDoCarrinho.map(({ item, qtd }) => (
                <li key={item.uuid} className="flex flex-row items-center gap-3 px-3 py-2.5">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-bold">{item.nome}</span>
                    <span className="numero text-xs opacity-60">
                      {preco(item.preco)} cada · {preco(item.preco * qtd)}
                    </span>
                  </span>
                  <Contador valor={qtd} aoMudar={(valor) => definir(item.uuid, valor)} />
                </li>
              ))}
            </ul>
          </Cartao>
          <div className="numero flex flex-col gap-1 text-sm">
            <div className="flex flex-row justify-between">
              <span className="opacity-70">Total</span>
              <span className="font-bold">{preco(totalDoCarrinho)}</span>
            </div>
            <div className="flex flex-row justify-between">
              <span className="opacity-70">Na bolsa</span>
              <span>{preco(saldo)}</span>
            </div>
            <div className="flex flex-row justify-between">
              <span className="opacity-70">Depois da compra</span>
              <span className={disponivel < 0 ? "text-red-700 dark:text-red-400" : ""}>{preco(disponivel)}</span>
            </div>
          </div>
          <p className="text-xs opacity-60">
            O pedido vai para o mestre no chat do Foundry. Nada sai da bolsa nem entra na mochila até ele aprovar — o troco
            segue as regras da loja.
          </p>
        </FolhaModal>
      )}
    </PaginaFicha>
  );
}
