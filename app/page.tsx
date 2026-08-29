"use client";

import { FaEye, FaSpinner, FaUser } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { EstadoVazio } from "./components/cabecalho-pagina";
import { useFoundry, usePersonagens } from "./lib/foundry-provider";
import type { PersonagemDisponivel } from "./lib/foundry-types";

/** Depois disso, esperar em silêncio vira "travou" — a home passa a explicar o que pode faltar. */
const LIMITE_ESPERA_MS = 8000;

function CardPersonagem({
  personagem,
  somenteLeitura,
  carregando,
  aberto,
  aoAbrir
}: {
  personagem: PersonagemDisponivel;
  somenteLeitura: boolean;
  carregando: boolean;
  aberto: boolean;
  aoAbrir: () => void;
}) {
  const subtitulo = [personagem.raca, personagem.classes].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={aoAbrir}
      disabled={carregando}
      aria-current={aberto ? "true" : undefined}
      className={`group flex flex-row items-center gap-3 rounded-2xl border bg-superficie-alta p-3 text-left transition-all disabled:opacity-60 ${
        aberto ? "border-acento ring-1 ring-acento" : "border-borda hover:border-acento/60 hover:bg-foreground/[0.03]"
      }`}
    >
      {personagem.img ? (
        <div
          role="img"
          aria-hidden="true"
          className="size-16 shrink-0 rounded-xl bg-cover bg-center border border-acento "
          style={{ backgroundImage: `url(${personagem.img})` }}
        />
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-acento">
          <FaUser aria-hidden="true" className="size-5!" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-row items-center gap-2">
          <span className="min-w-0 truncate font-display text-lg font-bold">{personagem.nome}</span>
          {somenteLeitura && <FaEye role="img" className="size-3! shrink-0 opacity-40" title="Somente leitura" />}
        </span>
        {subtitulo && <span className="truncate text-xs opacity-60">{subtitulo}</span>}
        <span className="numero flex flex-row items-center gap-2 text-xs font-semibold opacity-60">
          {personagem.nivel !== null && <span>Nível {personagem.nivel}</span>}
          {aberto && <span className="text-acento">· aberto agora</span>}
        </span>
      </div>

      {carregando && <FaSpinner aria-hidden="true" className="size-4! shrink-0 animate-spin" />}
    </button>
  );
}

function Secao({ titulo, descricao, children }: { titulo: string; descricao: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col">
        <h2 className="font-display text-xl font-bold">{titulo}</h2>
        <p className="text-xs opacity-55">{descricao}</p>
      </div>
      {children}
    </section>
  );
}

function Grade({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export default function Home() {
  const { selecionarPersonagem, trocandoPara, ficha, recarregarPersonagens } = useFoundry();
  const { listas, carregando } = usePersonagens();
  const [demorou, setDemorou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const router = useRouter();

  // As listas vêm do client do mestre: se ele estiver fechado, ninguém
  // responde e o spinner giraria para sempre sem dizer o motivo.
  useEffect(() => {
    if (!carregando) return;
    const id = setTimeout(() => setDemorou(true), LIMITE_ESPERA_MS);
    return () => clearTimeout(id);
  }, [carregando, tentativa]);

  function abrir(id: string) {
    if (ficha?.id !== id) selecionarPersonagem(id);
    router.push("/detalhes");
  }

  if (carregando) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
        <FaSpinner aria-hidden="true" className="size-5! animate-spin opacity-60" />
        <p className="text-sm opacity-60">Carregando seus personagens...</p>
        {demorou && (
          <>
            <p className="max-w-sm text-sm opacity-60">
              O Foundry não respondeu. A lista vem do client do <strong>mestre</strong> — confira se ele está com o
              jogo aberto e o módulo ativo.
            </p>
            <button
              type="button"
              onClick={() => {
                setDemorou(false);
                setTentativa((n) => n + 1);
                recarregarPersonagens();
              }}
              className="rounded-full border border-borda px-4 py-2 text-sm font-semibold transition-colors hover:bg-foreground/5"
            >
              Tentar de novo
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pt-6">
      <Secao titulo="Meus Personagens" descricao="Fichas que você controla — pode alterar PV, PM, itens e dinheiro.">
        {listas.meus.length === 0 ? (
          <EstadoVazio>
            Nenhum personagem seu foi encontrado. Peça ao mestre para configurar a posse (Ownership) do seu Actor.
          </EstadoVazio>
        ) : (
          <Grade>
            {listas.meus.map((personagem) => (
              <CardPersonagem
                key={personagem.id}
                personagem={personagem}
                somenteLeitura={false}
                carregando={trocandoPara === personagem.id}
                aberto={ficha?.id === personagem.id}
                aoAbrir={() => abrir(personagem.id)}
              />
            ))}
          </Grade>
        )}
      </Secao>

      <Secao titulo="Companheiros" descricao="Fichas do grupo que você pode consultar, mas não alterar.">
        {listas.companheiros.length === 0 ? (
          <EstadoVazio>
            Nenhum companheiro por aqui. O mestre precisa dar permissão de Observador nos Actors do grupo.
          </EstadoVazio>
        ) : (
          <Grade>
            {listas.companheiros.map((personagem) => (
              <CardPersonagem
                key={personagem.id}
                personagem={personagem}
                somenteLeitura
                carregando={trocandoPara === personagem.id}
                aberto={ficha?.id === personagem.id}
                aoAbrir={() => abrir(personagem.id)}
              />
            ))}
          </Grade>
        )}
      </Secao>
    </div>
  );
}
