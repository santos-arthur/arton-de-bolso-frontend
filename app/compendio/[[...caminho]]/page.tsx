"use client";

import {
  FaChevronRight,
  FaExpand,
  FaFileLines,
  FaFolder,
  FaImage,
  FaSpinner,
  FaXmark
} from "react-icons/fa6";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import CabecalhoPagina, { EstadoVazio } from "../../components/cabecalho-pagina";
import CampoBusca from "../../components/campo-busca";
import Prosa from "../../components/prosa";
import {
  buscarNoCompendio,
  destinoDoJournal,
  resolverCaminho,
  rotaDoCompendio,
  useCompendio,
  type Degrau
} from "../../lib/compendio";
import type { ItemCompendio, JournalCompendio, PastaCompendio } from "../../lib/foundry-types";

/** Tudo que houver dentro da pasta, em qualquer profundidade — a contagem do cartão. */
function contarItens(pasta: PastaCompendio): number {
  const dosJournals = pasta.journals.reduce((soma, journal) => soma + journal.paginas.length, 0);
  return pasta.pastas.reduce((soma, filha) => soma + contarItens(filha), dosJournals);
}

function plural(quantidade: number, singular: string, plural: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

/** Cartão de navegação: pasta, journal ou página — mesmo desenho para os três. */
function Cartao({
  href,
  titulo,
  detalhe,
  miniatura,
  Icone
}: {
  href: string;
  titulo: string;
  detalhe?: string;
  miniatura?: string;
  Icone: typeof FaFolder;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex flex-row items-center gap-3 rounded-2xl border border-borda bg-superficie-alta p-3 transition-colors hover:bg-foreground/5"
      >
        {miniatura ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={miniatura} alt="" className="size-14 shrink-0 rounded-lg border border-borda object-cover" />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-borda">
            <Icone aria-hidden="true" className="size-4! opacity-40" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-display text-base font-bold">{titulo}</span>
          {detalhe && <span className="line-clamp-2 text-xs opacity-60">{detalhe}</span>}
        </span>
        <FaChevronRight aria-hidden="true" className="size-3! shrink-0 opacity-40" />
      </Link>
    </li>
  );
}

/** Imagem em tela cheia — é o que um mapa ou um retrato pede numa mesa. */
function Ampliada({ item, onFechar }: { item: ItemCompendio; onFechar: () => void }) {
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = anterior;
    };
  }, [onFechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.titulo}
      onClick={onFechar}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/90 p-4"
    >
      <button
        type="button"
        onClick={onFechar}
        aria-label="Fechar"
        className="absolute right-3 top-3 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
      >
        <FaXmark aria-hidden="true" className="size-4!" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.src} alt={item.titulo} className="max-h-full max-w-full object-contain" />
      {item.legenda && <p className="text-center text-sm text-white/80">{item.legenda}</p>}
    </div>
  );
}

/** Trilha de volta: cada degrau é um lugar da árvore do mestre. */
function Trilha({ trilha }: { trilha: Degrau[] }) {
  const partes: { nome: string; href: string }[] = [{ nome: "Compêndio", href: rotaDoCompendio([]) }];
  const ids: string[] = [];
  for (const degrau of trilha) {
    ids.push(degrau.id);
    partes.push({ nome: degrau.nome, href: rotaDoCompendio([...ids]) });
  }

  return (
    <nav aria-label="Trilha" className="flex flex-row flex-wrap items-center gap-1 text-xs opacity-70">
      {partes.map((parte, indice) => (
        <span key={parte.href} className="flex flex-row items-center gap-1">
          {indice > 0 && <FaChevronRight aria-hidden="true" className="size-2! opacity-50" />}
          {indice === partes.length - 1 ? (
            <span className="font-semibold">{parte.nome}</span>
          ) : (
            <Link href={parte.href} className="transition-opacity hover:opacity-100">
              {parte.nome}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

function Lista({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-2">{children}</ul>;
}

/** O item final: a imagem ou o texto que o mestre quis mostrar. */
function ConteudoDoItem({ item }: { item: ItemCompendio }) {
  const [ampliada, setAmpliada] = useState(false);

  if (item.tipo === "imagem") {
    return (
      <>
        <figure className="flex flex-col gap-2 overflow-hidden rounded-2xl border border-borda bg-superficie-alta">
          <button
            type="button"
            onClick={() => setAmpliada(true)}
            className="relative block w-full"
            aria-label={`Ampliar ${item.titulo}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={item.titulo} className="max-h-[65dvh] w-full object-contain" />
            <span className="absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full bg-black/50 text-white">
              <FaExpand aria-hidden="true" className="size-3.5!" />
            </span>
          </button>
          {item.legenda && <figcaption className="px-3 pb-3 text-xs opacity-60">{item.legenda}</figcaption>}
        </figure>
        {ampliada && <Ampliada item={item} onFechar={() => setAmpliada(false)} />}
      </>
    );
  }

  return (
    <Prosa
      html={item.conteudo}
      className="break-words rounded-2xl border border-borda bg-superficie-alta p-4 text-sm leading-relaxed"
    />
  );
}

/**
 * Compêndio: o que o mestre já mostrou à mesa. A tela navega a árvore do Foundry
 * como ela é — pastas, subpastas, o journal como mais um nível — até a página,
 * que é o item que se abre para ver.
 *
 * Nada aqui escreve: um item aparece quando o mestre dá Observador no journal
 * e some quando ele tira.
 */
export default function Page() {
  const { caminho } = useParams<{ caminho?: string[] }>();
  const { compendio, carregando } = useCompendio();
  const [busca, setBusca] = useState("");

  const ids = useMemo(() => caminho ?? [], [caminho]);
  const lugar = useMemo(() => resolverCaminho(compendio, ids), [compendio, ids]);
  const achados = useMemo(() => buscarNoCompendio(compendio, busca), [compendio, busca]);

  if (carregando) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        <FaSpinner aria-hidden="true" className="size-5! animate-spin opacity-60" />
        <p className="text-sm opacity-60">Carregando o compêndio...</p>
      </div>
    );
  }

  const titulo = lugar.trilha.at(-1)?.nome ?? "Compêndio";
  const vazioNaRaiz = !compendio.pastas.length && !compendio.journals.length;

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina titulo={titulo} />
      {lugar.trilha.length > 0 && <Trilha trilha={lugar.trilha} />}

      {/* A busca atravessa a árvore inteira: quem procura uma carta lembra do
          nome dela, não da sessão em que o mestre a arquivou. */}
      {!vazioNaRaiz && (
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar no compêndio..." />
      )}

      {busca ? (
        achados.length === 0 ? (
          <EstadoVazio>Nada encontrado no compêndio.</EstadoVazio>
        ) : (
          <Lista>
            {achados.map((achado) => (
              <Cartao
                key={achado.caminho.join("/")}
                href={rotaDoCompendio(achado.caminho)}
                titulo={achado.item.titulo}
                detalhe={achado.rotulo || achado.item.resumo}
                miniatura={achado.item.tipo === "imagem" ? achado.item.src : undefined}
                Icone={FaFileLines}
              />
            ))}
          </Lista>
        )
      ) : lugar.tipo === "perdido" ? (
        <EstadoVazio>Isto não está mais disponível para você.</EstadoVazio>
      ) : lugar.tipo === "item" ? (
        <ConteudoDoItem item={lugar.item} />
      ) : lugar.tipo === "journal" ? (
        <PaginasDoJournal journal={lugar.journal} ids={ids} />
      ) : vazioNaRaiz ? (
        <EstadoVazio>
          O mestre ainda não liberou nada. O que ele mostrar à mesa aparece aqui.
        </EstadoVazio>
      ) : (
        <Lista>
          {lugar.pastas.map((pasta) => (
            <Cartao
              key={pasta.id}
              href={rotaDoCompendio([...ids, pasta.id])}
              titulo={pasta.nome}
              detalhe={plural(contarItens(pasta), "item", "itens")}
              Icone={FaFolder}
            />
          ))}
          {lugar.journals.map((journal) => (
            <CartaoDeJournal key={journal.id} journal={journal} ids={ids} />
          ))}
        </Lista>
      )}
    </div>
  );
}

/** As páginas de um journal — o último nível antes do conteúdo. */
function PaginasDoJournal({ journal, ids }: { journal: JournalCompendio; ids: string[] }) {
  return (
    <Lista>
      {journal.paginas.map((item) => (
        <Cartao
          key={item.id}
          href={rotaDoCompendio([...ids, item.id])}
          titulo={item.titulo}
          detalhe={item.resumo}
          miniatura={item.tipo === "imagem" ? item.src : undefined}
          Icone={item.tipo === "imagem" ? FaImage : FaFileLines}
        />
      ))}
    </Lista>
  );
}

function CartaoDeJournal({ journal, ids }: { journal: JournalCompendio; ids: string[] }) {
  const unica = journal.paginas.length === 1 ? journal.paginas[0] : null;

  return (
    <Cartao
      href={destinoDoJournal(journal, ids)}
      titulo={journal.nome}
      // Ícone de pasta, igual ao das pastas de verdade: na árvore do Foundry o
      // journal é mais um nível de arrumação, e quem tem conteúdo é a página.
      // Por isso ele também não mostra miniatura — a imagem é da página.
      Icone={FaFolder}
      // Com uma página só o journal é apenas o nome dela em outro nível: o
      // cartão mostra o conteúdo, não a contagem.
      detalhe={unica ? unica.resumo : plural(journal.paginas.length, "página", "páginas")}
    />
  );
}
