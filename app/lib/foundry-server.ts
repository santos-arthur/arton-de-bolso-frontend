// Código server-only: fala com o Foundry por HTTP/socket.io a partir do
// processo Node do front (nunca do navegador). É por isso que o cookie de
// sessão `SameSite=Strict` + CORS `*` do Foundry deixam de ser um problema —
// não tem navegador nenhum no meio dessa conversa. Ver docs/arquitetura.md.
//
// Nunca importar este arquivo de um componente "use client".

import { randomUUID } from "node:crypto";
import { io, type Socket } from "socket.io-client";
import type {
  Ficha,
  ListaPersonagens,
  MensagemDoFoundry,
  MensagemParaFoundry,
  PersonagemDisponivel,
  UsuarioFoundry
} from "./foundry-types";

const FOUNDRY_URL = process.env.FOUNDRY_URL ?? "http://localhost:30000";
const SOCKET_PATH = process.env.FOUNDRY_SOCKET_PATH ?? "/socket.io";
const MODULE_EVENTO = "module.arton-de-bolso";
const TEMPO_LIMITE_MS = 10000;

/** Nome do cookie da NOSSA sessão (não confundir com o cookie "session" do Foundry, que nunca sai do servidor). */
export const COOKIE_SESSAO = "ab_sessao";

type SessaoServidor = {
  id: string;
  foundryUserId: string;
  socket: Socket;
  ficha: Ficha | null;
  /** Null enquanto o relay ainda não respondeu nada — é o que distingue "sem personagem" de "ainda não sei". */
  personagens: ListaPersonagens | null;
  erro: string | null;
  ouvintes: Set<() => void>;
};

// Em memória, dura enquanto o processo Node estiver de pé — reinício do
// servidor derruba todo mundo (precisam logar de novo). Suficiente pra essa
// escala; não há necessidade de Redis/DB pra isso hoje.
const sessoes = new Map<string, SessaoServidor>();

function lerSetCookie(resposta: Response): string[] {
  // getSetCookie() é a forma correta (Node 18.14+/20+) — get("set-cookie")
  // junta múltiplos headers com vírgula e quebra o parse (datas de Expires
  // têm vírgula). Cai pro get() só se getSetCookie não existir.
  const headers = resposta.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const bruto = resposta.headers.get("set-cookie");
  return bruto ? [bruto] : [];
}

/**
 * O módulo Foundry manda caminhos de imagem relativos (ex:
 * "tokenizer/pc-images/foo.webp") — fazem sentido só dentro da própria
 * origem do Foundry, mas o navegador carrega essa página a partir da nossa
 * origem (front). Sem isso o navegador tentaria buscar a imagem em
 * `<origem-do-front>/tokenizer/...` e quebraria. O Foundry serve arquivos
 * estáticos sem exigir sessão, então expor essas URLs é seguro.
 */
function absolutizarImagem(caminho: string | undefined | null): string {
  if (!caminho) return "";
  if (/^(https?:)?\/\//i.test(caminho)) return caminho;
  return `${FOUNDRY_URL}/${caminho.replace(/^\/+/, "")}`;
}

function absolutizarImagensDaFicha(ficha: Ficha): Ficha {
  return {
    ...ficha,
    img: absolutizarImagem(ficha.img),
    inventario: ficha.inventario.map((grupo) => ({
      ...grupo,
      itens: grupo.itens.map((item) => ({ ...item, img: absolutizarImagem(item.img) }))
    })),
    poderes: ficha.poderes.map((poder) => ({ ...poder, img: absolutizarImagem(poder.img) })),
    magias: ficha.magias.map((magia) => ({ ...magia, img: absolutizarImagem(magia.img) })),
    aprimoramentos: ficha.aprimoramentos.map((a) => ({ ...a, img: absolutizarImagem(a.img) })),
    armas: ficha.armas.map((a) => ({ ...a, img: absolutizarImagem(a.img) })),
    protecoes: ficha.protecoes.map((p) => ({ ...p, img: absolutizarImagem(p.img) }))
  };
}

function absolutizarImagensDosPersonagens(personagens: PersonagemDisponivel[]): PersonagemDisponivel[] {
  return personagens.map((personagem) => ({ ...personagem, img: absolutizarImagem(personagem.img) }));
}

function absolutizarImagensDasListas(listas: ListaPersonagens): ListaPersonagens {
  return {
    meus: absolutizarImagensDosPersonagens(listas.meus),
    companheiros: absolutizarImagensDosPersonagens(listas.companheiros)
  };
}

function extrairValorCookie(cookies: string[], nome: string): string | null {
  for (const linha of cookies) {
    const [par] = linha.split(";");
    const [chave, valor] = par.split("=");
    if (chave?.trim() === nome) return decodeURIComponent((valor ?? "").trim());
  }
  return null;
}

/**
 * `fetch` do Node não tem timeout nenhum por padrão — sem isso, um Foundry
 * inalcançável (porta fechada silenciosamente, problema de NAT/roteador,
 * etc.) trava a promise pra sempre, sem erro nenhum aparecer na tela.
 */
async function buscarComTimeout(url: string, opcoes: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(url, { ...opcoes, signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
  } catch (erro) {
    if (erro instanceof Error && erro.name === "TimeoutError") {
      throw new Error(
        `Não consegui alcançar o Foundry em ${FOUNDRY_URL} (sem resposta em ${TEMPO_LIMITE_MS / 1000}s). ` +
          `Confira se FOUNDRY_URL está certo e se o host é alcançável a partir daqui — se este servidor ` +
          `estiver na mesma rede do Foundry, o roteador pode não suportar "NAT hairpin" pro IP público; tente o IP local.`
      );
    }
    throw new Error(`Não consegui falar com o Foundry em ${FOUNDRY_URL}: ${(erro as Error).message}`);
  }
}

/** Garante uma sessão no Foundry (qualquer rota nomeada fora dos arquivos estáticos cria uma) e devolve o id. */
async function criarSessaoAnonima(): Promise<string> {
  const resposta = await buscarComTimeout(`${FOUNDRY_URL}/join`);
  const sessionId = extrairValorCookie(lerSetCookie(resposta), "session");
  if (!sessionId) throw new Error("O Foundry não retornou uma sessão — confira FOUNDRY_URL.");
  return sessionId;
}

function conectarSocket(sessionId: string): Socket {
  return io(FOUNDRY_URL, {
    path: SOCKET_PATH,
    query: { session: sessionId },
    transports: ["websocket", "polling"]
  });
}

/** Espera o evento "session" que o Foundry manda logo após conectar — {sessionId, userId} (userId nulo se ainda não logado). */
function aguardarSessao(socket: Socket): Promise<{ sessionId: string | null; userId: string | null } | null> {
  return new Promise((resolve, reject) => {
    const tempoLimite = setTimeout(() => reject(new Error("Tempo esgotado conectando ao Foundry.")), TEMPO_LIMITE_MS);
    socket.once("connect_error", (erro) => {
      clearTimeout(tempoLimite);
      reject(erro);
    });
    socket.once("session", (info) => {
      clearTimeout(tempoLimite);
      resolve(info);
    });
  });
}

export async function listarUsuariosFoundry(): Promise<UsuarioFoundry[]> {
  const sessionId = await criarSessaoAnonima();
  const socket = conectarSocket(sessionId);
  try {
    await aguardarSessao(socket);
    const dados = await new Promise<{ users?: Array<{ _id?: string; id?: string; name?: string }> }>((resolve) => {
      socket.emit("getJoinData", resolve);
    });
    return (dados?.users ?? [])
      .map((u) => ({ id: u._id ?? u.id ?? "", nome: u.name ?? "" }))
      .filter((u) => u.id);
  } finally {
    socket.disconnect();
  }
}

export async function autenticar(
  userid: string,
  senha: string
): Promise<{ sucesso: true; sessaoId: string } | { sucesso: false; erro: string }> {
  let sessionId: string;
  try {
    sessionId = await criarSessaoAnonima();
  } catch (erro) {
    return { sucesso: false, erro: (erro as Error).message };
  }

  let respostaLogin: Response;
  try {
    respostaLogin = await buscarComTimeout(`${FOUNDRY_URL}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `session=${sessionId}` },
      body: JSON.stringify({ action: "join", userid, password: senha })
    });
  } catch (erro) {
    return { sucesso: false, erro: (erro as Error).message };
  }
  const dados = await respostaLogin.json().catch(() => null);
  if (dados?.status !== "success") {
    return { sucesso: false, erro: "Usuário ou senha inválidos." };
  }

  const socket = conectarSocket(sessionId);
  let sessaoFoundry: { sessionId: string | null; userId: string | null } | null;
  try {
    sessaoFoundry = await aguardarSessao(socket);
  } catch (erro) {
    socket.disconnect();
    return { sucesso: false, erro: (erro as Error).message };
  }

  if (!sessaoFoundry?.userId) {
    socket.disconnect();
    return { sucesso: false, erro: "O Foundry aceitou o login mas não confirmou o usuário na nova conexão." };
  }

  const sessaoId = randomUUID();
  const sessao: SessaoServidor = {
    id: sessaoId,
    foundryUserId: sessaoFoundry.userId,
    socket,
    ficha: null,
    personagens: null,
    erro: null,
    ouvintes: new Set()
  };
  sessoes.set(sessaoId, sessao);

  socket.on(MODULE_EVENTO, (mensagem: MensagemDoFoundry) => {
    if (mensagem.tipo === "ficha") {
      sessao.ficha = absolutizarImagensDaFicha(mensagem.ficha);
      sessao.erro = null;
    } else if (mensagem.tipo === "semFicha") {
      sessao.ficha = null;
    } else if (mensagem.tipo === "personagens") {
      sessao.personagens = absolutizarImagensDasListas(mensagem);
    } else if (mensagem.tipo === "erro") {
      sessao.erro = mensagem.mensagem;
    }
    sessao.ouvintes.forEach((notificar) => notificar());
  });

  // socket.io reconecta sozinho; a cada reconexão o Foundry reenvia "session".
  // Se voltar anônima (mundo relançado, sessão expirada), a sessão local não
  // vale mais — descarta na hora em vez de esperar a próxima checagem.
  socket.on("session", (info: { userId?: string | null } | null) => {
    if (info?.userId !== sessao.foundryUserId) {
      sessoes.delete(sessaoId);
      socket.disconnect();
      sessao.ouvintes.forEach((notificar) => notificar());
    }
  });

  socket.emit(MODULE_EVENTO, { tipo: "obterFicha" } satisfies MensagemParaFoundry);

  return { sucesso: true, sessaoId };
}

export function sessaoExiste(sessaoId: string | undefined | null): boolean {
  return !!sessaoId && sessoes.has(sessaoId);
}

/**
 * Checagem de verdade: pergunta ao próprio Foundry se esta sessão ainda está
 * logada, em vez de confiar só no `Map` em memória. Um socket ainda no mapa
 * não garante nada — o Foundry pode ter reiniciado, o mundo pode ter sido
 * relançado, ou a sessão (24h) pode ter expirado, e nesses casos a conexão
 * volta como anônima. `getJoinData` devolve o `userId` da sessão (null se
 * não logada), que é exatamente o que precisamos comparar.
 *
 * Se não estiver mais válida, a sessão local é descartada aqui mesmo — o
 * chamador só precisa tratar o `false`.
 */
export async function sessaoAtiva(sessaoId: string | undefined | null): Promise<boolean> {
  if (!sessaoId) return false;
  const sessao = sessoes.get(sessaoId);
  if (!sessao) return false;

  if (!sessao.socket.connected) {
    encerrarSessao(sessaoId);
    return false;
  }

  const dados = await new Promise<{ userId?: string | null } | null>((resolve) => {
    const tempoLimite = setTimeout(() => resolve(null), TEMPO_LIMITE_MS);
    sessao.socket.emit("getJoinData", (resposta: { userId?: string | null }) => {
      clearTimeout(tempoLimite);
      resolve(resposta);
    });
  });

  if (dados?.userId !== sessao.foundryUserId) {
    encerrarSessao(sessaoId);
    return false;
  }

  return true;
}

/**
 * Estado já conhecido da sessão — usado pra remontar a tela inteira assim que
 * o SSE conecta (ou reconecta), sem esperar o próximo push do Foundry. São
 * várias mensagens porque listas e ficha são estados independentes: a home
 * precisa das listas mesmo quando nenhuma ficha está aberta.
 */
export function estadosAtuais(sessaoId: string): MensagemDoFoundry[] {
  const sessao = sessoes.get(sessaoId);
  if (!sessao) return [];

  const mensagens: MensagemDoFoundry[] = [];
  if (sessao.personagens) mensagens.push({ tipo: "personagens", ...sessao.personagens });
  // Só afirma "sem ficha" depois que o relay respondeu ao menos uma vez —
  // antes disso a tela segue em "carregando" em vez de piscar a home vazia.
  if (sessao.ficha) mensagens.push({ tipo: "ficha", ficha: sessao.ficha });
  else if (sessao.personagens) mensagens.push({ tipo: "semFicha" });
  if (sessao.erro) mensagens.push({ tipo: "erro", mensagem: sessao.erro });
  return mensagens;
}

export function inscrever(sessaoId: string, notificar: () => void): () => void {
  const sessao = sessoes.get(sessaoId);
  if (!sessao) return () => {};
  sessao.ouvintes.add(notificar);
  return () => sessao.ouvintes.delete(notificar);
}

export function enviarMensagem(sessaoId: string, mensagem: MensagemParaFoundry) {
  const sessao = sessoes.get(sessaoId);
  if (!sessao) throw new Error("Sessão não encontrada — faça login novamente.");
  sessao.socket.emit(MODULE_EVENTO, mensagem);
}

/** Derruba a conexão com o Foundry e esquece a sessão — usado no logout. */
export function encerrarSessao(sessaoId: string | undefined | null) {
  if (!sessaoId) return;
  const sessao = sessoes.get(sessaoId);
  if (!sessao) return;
  sessao.socket.disconnect();
  sessoes.delete(sessaoId);
}
