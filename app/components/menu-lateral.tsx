"use client";

import {
  FaBars,
  FaEye,
  FaGear,
  FaHouse,
  FaRightFromBracket,
  FaUser,
  FaXmark
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Logo from "./logo";
import { ITENS_NAV } from "./navegacao";
import { useFoundry, usePersonagens } from "../lib/foundry-provider";
import type { PersonagemDisponivel } from "../lib/foundry-types";

/**
 * Navegação única do app: trocar de personagem, seções da ficha,
 * configurações e sair. Não existe barra superior.
 *
 * A forma muda com a tela, porque a largura vale muito mais no celular:
 *   < 768px  barra no rodapé (uma coluna de 56px comeria 14% de um iPhone 12)
 *   >= 768px rail vertical de ícones
 *   >= 1280px rail expandido, com rótulos
 *
 * O que não cabe em nenhum dos dois modos compactos — a lista de personagens
 * — fica atrás do botão de menu, que abre o mesmo painel nos dois casos.
 */

function LinhaPersonagem({
  personagem,
  somenteLeitura,
  aberto,
  onClick
}: {
  personagem: PersonagemDisponivel;
  somenteLeitura: boolean;
  aberto: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-row items-center gap-3 rounded-xl border p-2 text-left transition-colors ${
        aberto ? "border-acento bg-acento/10" : "border-transparent hover:bg-foreground/5"
      }`}
    >
      {personagem.img ? (
        <span
          role="img"
          aria-hidden="true"
          className="size-9 shrink-0 rounded-lg bg-cover bg-center"
          style={{ backgroundImage: `url(${personagem.img})` }}
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-borda">
          <FaUser aria-hidden="true" className="size-3.5!" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-row items-center gap-1.5">
          <span className="min-w-0 truncate text-sm font-bold">{personagem.nome}</span>
          {somenteLeitura && <FaEye aria-hidden="true" className="size-2.5! shrink-0 opacity-40" />}
        </span>
        {personagem.nivel !== null && (
          <span className="numero text-[11px] opacity-55">Nível {personagem.nivel}</span>
        )}
      </span>
    </button>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="px-2 text-[10px] font-bold uppercase tracking-wider opacity-45">{titulo}</span>
      {children}
    </div>
  );
}

function AcaoPainel({
  Icone,
  rotulo,
  href,
  onClick,
  ativo = false
}: {
  // Maiúsculo porque um nome solto e minúsculo em JSX vira tag HTML —
  // `item.icone` escapa disso por ser acesso a propriedade.
  Icone: IconType;
  rotulo: string;
  href?: string;
  onClick?: () => void;
  ativo?: boolean;
}) {
  const classe = `flex min-h-11 w-full flex-row items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
    ativo ? "bg-acento text-white" : "hover:bg-foreground/5"
  }`;
  const conteudo = (
    <>
      <Icone aria-hidden="true" className="size-4! shrink-0 opacity-70" />
      <span className="truncate">{rotulo}</span>
    </>
  );
  return href ? (
    <Link href={href} onClick={onClick} className={classe}>
      {conteudo}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={classe}>
      {conteudo}
    </button>
  );
}

export default function MenuLateral() {
  const { ficha, logout, selecionarPersonagem } = useFoundry();
  const { listas } = usePersonagens();
  const pathname = usePathname();
  const router = useRouter();
  const [painelAberto, setPainelAberto] = useState(false);

  useEffect(() => {
    if (!painelAberto) return;
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setPainelAberto(false);
    }
    document.addEventListener("keydown", aoTeclar);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = anterior;
    };
  }, [painelAberto]);

  function abrirPersonagem(id: string) {
    setPainelAberto(false);
    if (ficha?.id !== id) selecionarPersonagem(id);
    router.push("/detalhes");
  }

  const secoes = ficha ? ITENS_NAV : [];
  const semPersonagens = listas.meus.length === 0 && listas.companheiros.length === 0;

  return (
    <>
      {/* ---------- Celular: barra no rodapé ---------- */}
      <nav
        aria-label="Navegação principal"
        className="area-segura-baixo fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-superficie/95 backdrop-blur-md md:hidden"
      >
        <ul className="flex h-16 flex-row items-stretch">
          {secoes.map((item) => {
            const ativo = pathname === item.href;
            return (
              <li key={item.href} className="min-w-0 flex-1">
                <Link
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex h-full flex-col items-center justify-center gap-1 px-0.5 text-[9px] font-bold transition-colors ${
                    ativo ? "text-acento" : "text-foreground/55"
                  }`}
                >
                  <span
                    className={`flex h-8 w-full max-w-10 items-center justify-center rounded-lg transition-colors ${
                      ativo ? "bg-acento/15" : ""
                    }`}
                  >
                    <item.icone aria-hidden="true" className="size-4!" />
                  </span>
                  <span className="w-full truncate text-center">{item.curto}</span>
                </Link>
              </li>
            );
          })}

          {/* Sem ficha aberta a barra não tem seções: Início ganha espaço. */}
          {secoes.length === 0 && (
            <li className="min-w-0 flex-1">
              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[9px] font-bold ${
                  pathname === "/" ? "text-acento" : "text-foreground/55"
                }`}
              >
                <FaHouse aria-hidden="true" className="size-4!" />
                Início
              </Link>
            </li>
          )}

          <li className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setPainelAberto(true)}
              aria-haspopup="dialog"
              className="flex h-full w-full flex-col items-center justify-center gap-1 text-[9px] font-bold text-foreground/55"
            >
              <span className="flex h-8 w-full max-w-10 items-center justify-center">
                <FaBars aria-hidden="true" className="size-4!" />
              </span>
              <span className="w-full truncate text-center">Menu</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* ---------- Tablet e desktop: rail vertical ---------- */}
      <nav
        aria-label="Navegação principal"
        className="sticky top-0 z-40 hidden h-dvh w-16 shrink-0 flex-col gap-1 overflow-y-auto border-r border-borda bg-superficie px-2.5 py-3 md:flex xl:w-64 xl:px-3"
      >
        <Link
          href="/"
          title="Arton de Bolso"
          className="flex min-h-11 flex-row items-center justify-center gap-2 rounded-xl px-2 transition-colors hover:bg-foreground/5 xl:justify-start"
        >
          <Logo className="size-6 shrink-0 text-acento" />
          <span className="hidden truncate font-display text-base font-bold xl:inline">Arton de Bolso</span>
        </Link>

        <button
          type="button"
          onClick={() => setPainelAberto(true)}
          title={ficha ? `Trocar personagem (${ficha.nome})` : "Escolher personagem"}
          aria-haspopup="dialog"
          className="mt-1 flex min-h-12 flex-row items-center gap-2.5 rounded-xl border border-borda px-2 transition-colors hover:bg-foreground/5 xl:px-2.5"
        >
          {ficha?.img ? (
            <span
              role="img"
              aria-hidden="true"
              className="size-8 shrink-0 rounded-lg bg-cover bg-center"
              style={{ backgroundImage: `url(${ficha.img})` }}
            />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-borda">
              {ficha ? <FaUser aria-hidden="true" className="size-3.5!" /> : <FaBars aria-hidden="true" className="size-3.5!" />}
            </span>
          )}
          <span className="hidden min-w-0 flex-1 flex-col items-start xl:flex">
            <span className="w-full truncate text-left text-sm font-bold">{ficha?.nome ?? "Escolher"}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-50">Trocar</span>
          </span>
        </button>

        {secoes.length > 0 && (
          <div className="mt-2 flex flex-col gap-1 border-t border-borda pt-2">
            {secoes.map((item) => {
              const ativo = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.rotulo}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex min-h-11 w-full flex-row items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors xl:justify-start ${
                    ativo ? "bg-acento text-white" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <item.icone aria-hidden="true" className="size-4! shrink-0" />
                  <span className="hidden truncate xl:inline">{item.rotulo}</span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-1 border-t border-borda pt-2">
          {[
            { icone: FaHouse, rotulo: "Início", href: "/" },
            { icone: FaGear, rotulo: "Configurações", href: "/configuracoes" }
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.rotulo}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`flex min-h-11 w-full flex-row items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors xl:justify-start ${
                pathname === item.href
                  ? "bg-acento text-white"
                  : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <item.icone aria-hidden="true" className="size-4! shrink-0" />
              <span className="hidden truncate xl:inline">{item.rotulo}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => logout()}
            title="Sair"
            className="flex min-h-11 w-full flex-row items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground xl:justify-start"
          >
            <FaRightFromBracket aria-hidden="true" className="size-4! shrink-0" />
            <span className="hidden truncate xl:inline">Sair</span>
          </button>
        </div>
      </nav>

      {/* ---------- Painel: personagens e ações ----------
          Sobe do rodapé no celular (perto do polegar, que acabou de tocar a
          barra) e desliza da esquerda a partir do tablet, ao lado do rail. */}
      {painelAberto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-start"
          onClick={() => setPainelAberto(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onClick={(evento) => evento.stopPropagation()}
            className="area-segura-baixo relative flex max-h-[88dvh] w-full flex-col gap-3 overflow-y-auto rounded-t-2xl border-borda bg-superficie p-3 shadow-2xl sm:h-dvh sm:max-h-none sm:w-80 sm:max-w-[85vw] sm:rounded-none sm:border-r"
          >
            <div className="mx-auto h-1 w-10 shrink-0 rounded-full bg-foreground/20 sm:hidden" />

            <div className="flex flex-row items-center justify-between gap-2 px-1">
              <h2 className="font-display text-lg font-bold">Menu</h2>
              <button
                type="button"
                onClick={() => setPainelAberto(false)}
                aria-label="Fechar"
                className="rounded-full p-2 transition-colors hover:bg-foreground/5"
              >
                <FaXmark aria-hidden="true" className="size-4!" />
              </button>
            </div>

            {semPersonagens ? (
              <p className="px-2 text-sm opacity-60">
                Nenhum personagem encontrado. Peça ao mestre para configurar a posse (Ownership) do seu Actor.
              </p>
            ) : (
              <>
                {listas.meus.length > 0 && (
                  <Grupo titulo="Meus personagens">
                    {listas.meus.map((p) => (
                      <LinhaPersonagem
                        key={p.id}
                        personagem={p}
                        somenteLeitura={false}
                        aberto={ficha?.id === p.id}
                        onClick={() => abrirPersonagem(p.id)}
                      />
                    ))}
                  </Grupo>
                )}
                {listas.companheiros.length > 0 && (
                  <Grupo titulo="Companheiros">
                    {listas.companheiros.map((p) => (
                      <LinhaPersonagem
                        key={p.id}
                        personagem={p}
                        somenteLeitura
                        aberto={ficha?.id === p.id}
                        onClick={() => abrirPersonagem(p.id)}
                      />
                    ))}
                  </Grupo>
                )}
              </>
            )}

            {/* No celular estas ações não estão em lugar nenhum além daqui. */}
            <div className="mt-auto flex flex-col gap-1 border-t border-borda pt-2">
              <AcaoPainel
                Icone={FaHouse}
                rotulo="Início"
                href="/"
                ativo={pathname === "/"}
                onClick={() => setPainelAberto(false)}
              />
              <AcaoPainel
                Icone={FaGear}
                rotulo="Configurações"
                href="/configuracoes"
                ativo={pathname === "/configuracoes"}
                onClick={() => setPainelAberto(false)}
              />
              <AcaoPainel
                Icone={FaRightFromBracket}
                rotulo="Sair"
                onClick={() => {
                  setPainelAberto(false);
                  logout();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
