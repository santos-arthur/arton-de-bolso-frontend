"use client";

import { faEye, faSpinner, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { EstadoVazio } from "./components/cabecalho-pagina";
import { useFoundry, usePersonagens } from "./lib/foundry-provider";
import type { PersonagemDisponivel } from "./lib/foundry-types";

function Secao({ titulo, descricao, children }: { titulo: string; descricao: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col">
        <h2 className="text-lg font-bold uppercase tracking-wide opacity-70">{titulo}</h2>
        <p className="text-sm opacity-60">{descricao}</p>
      </div>
      {children}
    </section>
  );
}

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
  const subtitulo = [personagem.raca, personagem.classes].filter(Boolean).join(" • ");

  return (
    <button
      type="button"
      onClick={aoAbrir}
      disabled={carregando}
      aria-current={aberto ? "true" : undefined}
      className={`flex flex-row items-center gap-3 rounded-xl border-2 border-red-900 p-3 text-left transition-colors disabled:opacity-60 ${
        aberto
          ? "bg-red-900/10 ring-2 ring-red-900 ring-offset-2 ring-offset-olive-300 dark:bg-red-900/25 dark:ring-offset-olive-800"
          : "bg-olive-400/60 hover:bg-black/5 dark:bg-olive-900/60 dark:hover:bg-white/5"
      }`}
    >
      {personagem.img ? (
        <div
          role="img"
          aria-hidden="true"
          className="size-16 shrink-0 rounded-lg border-2 border-red-900 bg-cover bg-center"
          style={{ backgroundImage: `url(${personagem.img})` }}
        />
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border-2 border-red-900">
          <FontAwesomeIcon icon={faUser} className="size-7!" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-row items-center gap-2">
          <span className="truncate text-xl font-bold">{personagem.nome}</span>
          {somenteLeitura && (
            <FontAwesomeIcon icon={faEye} className="size-3.5! shrink-0 opacity-60" title="Somente leitura" />
          )}
        </div>
        {subtitulo && <span className="truncate text-sm opacity-70">{subtitulo}</span>}
        <div className="flex flex-row flex-wrap items-center gap-x-3 text-sm font-semibold opacity-70">
          {personagem.nivel !== null && <span>Nível {personagem.nivel}</span>}
          {aberto && <span className="text-red-900 dark:text-red-400">Aberto agora</span>}
        </div>
      </div>

      {carregando && <FontAwesomeIcon icon={faSpinner} className="size-5! shrink-0 animate-spin" />}
    </button>
  );
}

function Grade({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">{children}</div>;
}

/** Depois disso, esperar em silêncio vira "travou" — a home passa a explicar o que pode estar faltando. */
const LIMITE_ESPERA_MS = 8000;

export default function Home() {
  const { selecionarPersonagem, trocandoPara, ficha, recarregarPersonagens } = useFoundry();
  const { listas, carregando } = usePersonagens();
  const [demorou, setDemorou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const router = useRouter();

  // As listas vêm do client do mestre, não do nosso servidor: se ele estiver
  // fechado (ou com o módulo desatualizado), ninguém responde e o spinner
  // ficaria girando pra sempre sem dizer o motivo.
  useEffect(() => {
    if (!carregando) return;
    const id = setTimeout(() => setDemorou(true), LIMITE_ESPERA_MS);
    return () => clearTimeout(id);
  }, [carregando, tentativa]);

  // A ficha chega pelo stream, não pela resposta do clique: pedimos ao relay
  // e navegamos na hora — o <FoundryGate> segura a tela em "carregando" até a
  // ficha nova aparecer.
  function abrir(id: string) {
    if (ficha?.id === id) {
      router.push("/detalhes");
      return;
    }
    selecionarPersonagem(id);
    router.push("/detalhes");
  }

  if (carregando) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center text-olive-800 dark:text-olive-400">
        <FontAwesomeIcon icon={faSpinner} className="size-6! animate-spin" />
        <p className="text-sm opacity-70">Carregando seus personagens...</p>
        {demorou && (
          <>
            <p className="max-w-sm text-sm opacity-70">
              O Foundry não respondeu. A lista vem do client do <strong>mestre</strong> — confira se ele está com o
              jogo aberto e com o módulo Arton de Bolso ativo.
            </p>
            <button
              type="button"
              onClick={() => {
                setDemorou(false);
                setTentativa((n) => n + 1);
                recarregarPersonagens();
              }}
              className="rounded-full border-2 border-red-900 px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              Tentar de novo
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-6 text-olive-800 dark:text-olive-400">
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
