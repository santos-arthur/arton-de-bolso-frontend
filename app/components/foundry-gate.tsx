"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useFoundry } from "../lib/foundry-provider";

function TelaCentral({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-olive-300 px-4 text-center text-olive-800 dark:bg-olive-800 dark:text-olive-400">
      {children}
    </div>
  );
}

function FormularioLogin() {
  const { usuarios, erroLogin, login } = useFoundry();
  const [usuarioId, setUsuarioId] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    if (!usuarioId) return;
    setEnviando(true);
    await login(usuarioId, senha);
    setEnviando(false);
  }

  return (
    <TelaCentral>
      <form
        onSubmit={aoSubmeter}
        className="flex w-full max-w-xs flex-col gap-4 rounded-xl border-2 border-red-900 bg-olive-300 p-6 text-left shadow-xl dark:bg-olive-900"
      >
        <h1 className="text-center text-2xl font-bold">Arton de Bolso</h1>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide opacity-70">Personagem/Usuário</span>
          <select
            value={usuarioId}
            onChange={(evento) => setUsuarioId(evento.target.value)}
            required
            className="rounded-lg border-2 border-red-900 bg-transparent px-3 py-2"
          >
            <option value="" disabled>
              Escolha seu usuário
            </option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide opacity-70">Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            className="rounded-lg border-2 border-red-900 bg-transparent px-3 py-2"
          />
        </label>

        {erroLogin && <p className="text-sm font-semibold text-red-900">{erroLogin}</p>}

        <button
          type="submit"
          disabled={enviando || !usuarioId}
          className="rounded-full border-2 border-red-900 bg-red-900 px-4 py-2 text-sm font-semibold text-olive-50 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </TelaCentral>
  );
}

/**
 * Porteiro da *sessão*: decide entre login, erro de conexão e "já pode
 * mostrar o app". Escolher/abrir personagem não é assunto daqui — quem cuida
 * disso é a home (`app/page.tsx`) e o <GateFicha /> nas rotas de ficha.
 */
export default function FoundryGate({ children }: { children: ReactNode }) {
  const { status } = useFoundry();

  if (status === "conectando" || status === "autenticando") {
    return <TelaCentral><p>Conectando ao Foundry...</p></TelaCentral>;
  }

  if (status === "erroConexao") {
    return (
      <TelaCentral>
        <p>Não foi possível conectar ao Foundry.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full border-2 border-red-900 px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5"
        >
          Tentar de novo
        </button>
      </TelaCentral>
    );
  }

  if (status === "loginNecessario") {
    return <FormularioLogin />;
  }

  return <>{children}</>;
}
