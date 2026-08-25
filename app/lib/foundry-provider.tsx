"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type {
  Ficha,
  MensagemDoFoundry,
  MensagemParaFoundry,
  PersonagemDisponivel,
  UsuarioFoundry
} from "./foundry-types";

// Toda a fala com o Foundry (login, socket) acontece no servidor Node deste
// front (ver app/lib/foundry-server.ts e app/api/*) — o navegador só troca
// HTTP normal (mesma origem) e um stream SSE com o NOSSO servidor. Ver
// docs/arquitetura.md.

type Status = "conectando" | "loginNecessario" | "autenticando" | "autenticado" | "erroConexao";

type DescansoOpcoes = Extract<MensagemParaFoundry, { tipo: "descansar" }>["opcoes"];

type FoundryContextValue = {
  status: Status;
  usuarios: UsuarioFoundry[];
  erroLogin: string | null;
  erroServidor: string | null;
  ficha: Ficha | null;
  semPersonagem: PersonagemDisponivel[] | null;
  login: (userId: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  selecionarPersonagem: (actorId: string) => void;
  ajustarPV: (delta: number) => void;
  ajustarPM: (delta: number) => void;
  definirAtual: (recurso: "pv" | "pm", valor: number) => void;
  definirTemporario: (recurso: "pv" | "pm", valor: number) => void;
  alternarEquipado: (itemId: string) => void;
  ajustarDinheiro: (moeda: string, valor: number) => void;
  descansar: (opcoes: DescansoOpcoes) => void;
};

const FoundryContext = createContext<FoundryContextValue | null>(null);

async function buscarUsuarios(): Promise<UsuarioFoundry[]> {
  try {
    const resposta = await fetch("/api/usuarios", { cache: "no-store" });
    const dados = await resposta.json();
    return dados.usuarios ?? [];
  } catch {
    return [];
  }
}

/** Pergunta ao nosso servidor (que por sua vez pergunta ao Foundry) se a sessão ainda vale — nunca do cache. */
async function conferirSessao(): Promise<boolean> {
  const resposta = await fetch("/api/sessao", { cache: "no-store" });
  const dados = await resposta.json();
  return !!dados.autenticado;
}

export function FoundryProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("conectando");
  const [usuarios, setUsuarios] = useState<UsuarioFoundry[]>([]);
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [semPersonagem, setSemPersonagem] = useState<PersonagemDisponivel[] | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const router = useRouter();

  const carregarUsuariosELogin = useCallback(async () => {
    setStatus("loginNecessario");
    setUsuarios(await buscarUsuarios());
  }, []);

  const abrirStream = useCallback(() => {
    eventSourceRef.current?.close();
    const stream = new EventSource("/api/ficha/eventos");
    eventSourceRef.current = stream;

    stream.onopen = () => setStatus("autenticado");

    stream.onmessage = (evento) => {
      let mensagem: MensagemDoFoundry;
      try {
        mensagem = JSON.parse(evento.data);
      } catch {
        return;
      }
      if (mensagem.tipo === "ficha") {
        setFicha(mensagem.ficha);
        setSemPersonagem(null);
        setErroServidor(null);
      } else if (mensagem.tipo === "semPersonagem") {
        setSemPersonagem(mensagem.personagens);
        setFicha(null);
      } else if (mensagem.tipo === "erro") {
        setErroServidor(mensagem.mensagem);
      }
    };

    // EventSource não expõe o status HTTP do erro — em vez de adivinhar,
    // perguntamos de novo pro nosso servidor se a sessão ainda vale (pode ter
    // morrido no Foundry, não só uma falha de rede).
    stream.onerror = () => {
      stream.close();
      conferirSessao()
        .then((autenticado) => {
          if (autenticado) setStatus("erroConexao");
          else {
            setFicha(null);
            setSemPersonagem(null);
            carregarUsuariosELogin();
          }
        })
        .catch(() => setStatus("erroConexao"));
    };
  }, [carregarUsuariosELogin]);

  useEffect(() => {
    (async () => {
      try {
        if (await conferirSessao()) abrirStream();
        else await carregarUsuariosELogin();
      } catch {
        setStatus("erroConexao");
      }
    })();

    return () => {
      eventSourceRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (userId: string, senha: string) => {
      setErroLogin(null);
      setStatus("autenticando");
      try {
        const resposta = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userid: userId, senha })
        });
        const dados = await resposta.json();
        if (!dados.sucesso) {
          setErroLogin(dados.erro ?? "Não foi possível entrar.");
          setStatus("loginNecessario");
          return;
        }
        // Login sempre começa na tela principal, nunca na rota em que o
        // navegador estava antes de deslogar.
        router.replace("/");
        abrirStream();
      } catch {
        setErroLogin("Não foi possível falar com o servidor. Tente novamente.");
        setStatus("loginNecessario");
      }
    },
    [abrirStream, router]
  );

  const logout = useCallback(async () => {
    eventSourceRef.current?.close();
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    setFicha(null);
    setSemPersonagem(null);
    setErroServidor(null);
    setErroLogin(null);
    await carregarUsuariosELogin();
  }, [carregarUsuariosELogin]);

  const enviar = useCallback((mensagem: MensagemParaFoundry) => {
    fetch("/api/ficha/acao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mensagem)
    }).catch(() => {
      setErroServidor("Não foi possível falar com o servidor.");
    });
  }, []);

  const value: FoundryContextValue = {
    status,
    usuarios,
    erroLogin,
    erroServidor,
    ficha,
    semPersonagem,
    login,
    logout,
    selecionarPersonagem: (actorId) => enviar({ tipo: "selecionarPersonagem", actorId }),
    ajustarPV: (delta) => enviar({ tipo: "ajustarPV", delta }),
    ajustarPM: (delta) => enviar({ tipo: "ajustarPM", delta }),
    definirAtual: (recurso, valor) => enviar({ tipo: "definirAtual", recurso, valor }),
    definirTemporario: (recurso, valor) => enviar({ tipo: "definirTemporario", recurso, valor }),
    alternarEquipado: (itemId) => enviar({ tipo: "alternarEquipado", itemId }),
    ajustarDinheiro: (moeda, valor) => enviar({ tipo: "ajustarDinheiro", moeda, valor }),
    descansar: (opcoes) => enviar({ tipo: "descansar", opcoes })
  };

  return <FoundryContext.Provider value={value}>{children}</FoundryContext.Provider>;
}

export function useFoundry() {
  const contexto = useContext(FoundryContext);
  if (!contexto) throw new Error("useFoundry deve ser usado dentro de <FoundryProvider>");
  return contexto;
}
