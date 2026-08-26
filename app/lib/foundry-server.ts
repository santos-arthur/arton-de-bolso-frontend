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
  /** Momento em que o último SSE se desligou (null = tem alguém com a tela aberta agora). */
  ociosaDesde: number | null;
};

// Em memória, dura enquanto o processo Node estiver de pé — reinício do
// servidor derruba todo mundo (precisam logar de novo). Suficiente pra essa
// escala; não há necessidade de Redis/DB pra isso hoje.
const sessoes = new Map<string, SessaoServidor>();

/**
 * Logins que já passaram pela checagem de "esse usuário está livre?" mas
 * ainda não viraram sessão no mapa acima. Sem isso, dois toques em "Entrar"
 * quase simultâneos no mesmo usuário passariam os dois pela checagem antes
 * de qualquer um dos dois ser registrado.
 */
const loginsEmAndamento = new Set<string>();

/**
 * Uma sessão sem nenhuma tela aberta por tanto tempo é dada como abandonada.
 * Existe por causa da exclusividade de login: sem isso, fechar o navegador
 * (ou trocar de aparelho) deixaria o usuário "em uso" até o servidor
 * reiniciar, sem ninguém do outro lado para deslogar. Quem está com o app
 * aberto mantém o SSE ligado e nunca é atingido.
 */
const TEMPO_SESSAO_OCIOSA_MS = 15 * 60 * 1000;

const ERRO_USUARIO_EM_USO =
  "Este usuário já está conectado. Saia da outra sessão antes de entrar por aqui.";

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

/** Resposta do `getJoinData` do Foundry — a mesma que alimenta a tela de entrada dele. */
type DadosDeEntrada = {
  users?: Array<{ _id?: string; id?: string; name?: string }>;
  /** Ids de quem o Foundry considera conectado agora (client aberto ou socket autenticado). */
  activeUsers?: string[];
};

/**
 * Lê a tela de entrada do Foundry por uma conexão anônima. Aceita um
 * `sessionId` já criado para o login reaproveitar o mesmo — assim a checagem
 * de "esse usuário está livre?" não deixa uma sessão órfã no Foundry a cada
 * tentativa.
 */
async function lerDadosDeEntrada(sessionId?: string): Promise<DadosDeEntrada> {
  const sessao = sessionId ?? (await criarSessaoAnonima());
  const socket = conectarSocket(sessao);
  try {
    await aguardarSessao(socket);
    return await new Promise<DadosDeEntrada>((resolve) => {
      const tempoLimite = setTimeout(() => resolve({}), TEMPO_LIMITE_MS);
      socket.emit("getJoinData", (resposta: DadosDeEntrada) => {
        clearTimeout(tempoLimite);
        resolve(resposta ?? {});
      });
    });
  } finally {
    socket.disconnect();
  }
}

/**
 * Ids que não podem ser escolhidos no login, de três fontes:
 *   - `activeUsers` do Foundry — quem está com o client aberto;
 *   - sessões vivas deste processo — quem já entrou pelo app (nem todo socket
 *     autenticado conta como "ativo" pro Foundry, então o mapa local não é
 *     redundante);
 *   - logins em andamento — a janela entre a checagem e o registro da sessão.
 *
 * De quebra faz a faxina do mapa: sessão cujo socket caiu não segura mais o
 * usuário — mesma política do `sessaoAtiva`, que já derruba nesse caso.
 */
function usuariosOcupados(ativosNoFoundry: string[] = []): Set<string> {
  const ocupados = new Set(ativosNoFoundry);
  const agora = Date.now();
  for (const [id, sessao] of sessoes) {
    const abandonada = sessao.ociosaDesde !== null && agora - sessao.ociosaDesde > TEMPO_SESSAO_OCIOSA_MS;
    if (!sessao.socket.connected || abandonada) {
      encerrarSessao(id);
      continue;
    }
    ocupados.add(sessao.foundryUserId);
  }
  for (const userId of loginsEmAndamento) ocupados.add(userId);
  return ocupados;
}

/**
 * A tela de login fica reperguntando quem está livre (ver o polling no
 * provider), e cada leitura custa uma sessão + um socket no Foundry. Uma
 * janela curta de cache, somada a compartilhar a leitura já em voo, faz um
 * grupo inteiro esperando na tela de entrada custar o mesmo que um jogador
 * só. Não vale para o login em si, que sempre lê fresco.
 */
const CACHE_ENTRADA_MS = 4000;
let cacheEntrada: { em: number; dados: DadosDeEntrada } | null = null;
let leituraEmVoo: Promise<DadosDeEntrada> | null = null;

function lerDadosDeEntradaComCache(): Promise<DadosDeEntrada> {
  if (cacheEntrada && Date.now() - cacheEntrada.em < CACHE_ENTRADA_MS) {
    return Promise.resolve(cacheEntrada.dados);
  }
  if (leituraEmVoo) return leituraEmVoo;
  leituraEmVoo = lerDadosDeEntrada()
    .then((dados) => {
      cacheEntrada = { em: Date.now(), dados };
      return dados;
    })
    .finally(() => {
      leituraEmVoo = null;
    });
  return leituraEmVoo;
}

export async function listarUsuariosFoundry(): Promise<UsuarioFoundry[]> {
  const dados = await lerDadosDeEntradaComCache();
  const ocupados = usuariosOcupados(dados.activeUsers);
  return (dados.users ?? [])
    .map((u) => {
      const id = u._id ?? u.id ?? "";
      return { id, nome: u.name ?? "", ocupado: ocupados.has(id) };
    })
    .filter((u) => u.id);
}

export async function autenticar(
  userid: string,
  senha: string
): Promise<{ sucesso: true; sessaoId: string } | { sucesso: false; erro: string }> {
  // Barreira local antes de qualquer ida ao Foundry: se já temos sessão viva
  // (ou um login no meio do caminho) para esse usuário, nem vale a viagem.
  if (usuariosOcupados().has(userid)) return { sucesso: false, erro: ERRO_USUARIO_EM_USO };

  let sessionId: string;
  try {
    sessionId = await criarSessaoAnonima();
  } catch (erro) {
    return { sucesso: false, erro: (erro as Error).message };
  }

  // A lista da tela pode estar velha (alguém entrou nos últimos segundos),
  // então a decisão de verdade é tomada aqui, com dados frescos — nunca com
  // o cache que a listagem serve.
  let ativosNoFoundry: string[] = [];
  try {
    ativosNoFoundry = (await lerDadosDeEntrada(sessionId)).activeUsers ?? [];
  } catch (erro) {
    return { sucesso: false, erro: (erro as Error).message };
  }
  if (usuariosOcupados(ativosNoFoundry).has(userid)) {
    return { sucesso: false, erro: ERRO_USUARIO_EM_USO };
  }

  // Daqui até a sessão entrar no mapa, o usuário fica reservado — a checagem
  // acima e este `add` são síncronos, então nenhum outro login se intercala.
  loginsEmAndamento.add(userid);
  try {
    return await concluirLogin(userid, senha, sessionId);
  } finally {
    loginsEmAndamento.delete(userid);
  }
}

/** Segunda metade do login: já sabemos que o usuário está livre, agora é o handshake em si. */
async function concluirLogin(
  userid: string,
  senha: string,
  sessionId: string
): Promise<{ sucesso: true; sessaoId: string } | { sucesso: false; erro: string }> {
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
    ouvintes: new Set(),
    ociosaDesde: Date.now()
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
  sessao.ociosaDesde = null;
  return () => {
    sessao.ouvintes.delete(notificar);
    // Nenhuma tela aberta a partir de agora — começa a contar o abandono.
    if (!sessao.ouvintes.size) sessao.ociosaDesde = Date.now();
  };
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
  // Quem acabou de sair precisa reaparecer livre na próxima listagem, não
  // daqui a alguns segundos.
  cacheEntrada = null;
}
