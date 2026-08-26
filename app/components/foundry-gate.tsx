"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import CampoSelect from "./campo-select";
import Logo from "./logo";
import { useFoundry } from "../lib/foundry-provider";

function TelaCentral({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      {children}
    </div>
  );
}

function FormularioLogin() {
  const { usuarios, erroLogin, login, recarregarUsuarios } = useFoundry();
  const [usuarioId, setUsuarioId] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  // A lista se atualiza sozinha enquanto a tela está aberta (ver o polling no
  // provider). Se alguém entrar com o usuário que estava escolhido aqui, a
  // escolha simplesmente deixa de valer — em vez de deixar o botão pronto
  // pra um login que o servidor vai recusar.
  const escolhido = usuarios.find((usuario) => usuario.id === usuarioId && !usuario.ocupado)?.id ?? "";

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    if (!escolhido) return;
    setEnviando(true);
    await login(escolhido, senha);
    setEnviando(false);
  }

  return (
    <TelaCentral>
      <form
        onSubmit={aoSubmeter}
        className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-borda bg-superficie p-6 text-left shadow-xl"
      >
        <div className="flex flex-col items-center gap-2 pb-1">
          <Logo className="size-10 text-acento" />
          <h1 className="font-display text-2xl font-bold">Arton de Bolso</h1>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Usuário</span>
          <CampoSelect
            value={escolhido}
            onChange={(evento) => setUsuarioId(evento.target.value)}
            // Abrir a lista relê quem está livre: entre carregar a tela e
            // escolher um nome pode ter entrado gente. `onPointerDown` chega
            // antes de a lista abrir; `onFocus` cobre quem chega pelo teclado.
            onPointerDown={recarregarUsuarios}
            onFocus={recarregarUsuarios}
            required
          >
            <option value="" disabled>
              Escolha seu usuário
            </option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id} disabled={usuario.ocupado}>
                {usuario.ocupado ? `${usuario.nome} (em uso)` : usuario.nome}
              </option>
            ))}
          </CampoSelect>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            className="min-h-11 rounded-xl border border-borda bg-superficie-alta px-3 text-sm outline-none focus:border-acento"
          />
        </label>

        {erroLogin && <p className="text-sm font-semibold text-red-700 dark:text-red-400">{erroLogin}</p>}

        <button
          type="submit"
          disabled={enviando || !escolhido}
          className="min-h-11 rounded-xl bg-acento px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </TelaCentral>
  );
}

/**
 * Porteiro da *sessão*: login, erro de conexão e "já pode mostrar o app".
 * Escolher personagem é assunto da home e do <GateFicha />.
 */
export default function FoundryGate({ children }: { children: ReactNode }) {
  const { status } = useFoundry();

  if (status === "conectando" || status === "autenticando") {
    return (
      <TelaCentral>
        <Logo className="size-9 animate-pulse text-acento" />
        <p className="text-sm opacity-70">Conectando ao Foundry...</p>
      </TelaCentral>
    );
  }

  if (status === "erroConexao") {
    return (
      <TelaCentral>
        <p className="max-w-sm">Não foi possível conectar ao Foundry.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 rounded-xl border border-borda px-4 text-sm font-semibold transition-colors hover:bg-foreground/5"
        >
          Tentar de novo
        </button>
      </TelaCentral>
    );
  }

  if (status === "loginNecessario") return <FormularioLogin />;

  return <>{children}</>;
}
