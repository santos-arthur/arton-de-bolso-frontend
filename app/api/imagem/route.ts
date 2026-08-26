import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSAO, buscarImagemDoFoundry, obterSessao } from "../../lib/foundry-server";

export const dynamic = "force-dynamic";

/** Meia hora: retrato de personagem e ícone de item praticamente não mudam, e no celular cada ida a menos conta. */
const CACHE_S = 1800;

/**
 * Repassa uma imagem do Foundry (retratos, ícones de item, tokens). Existe
 * porque o Foundry fala HTTP puro e o front pode estar em HTTPS — ver
 * `absolutizarImagem`.
 *
 * Exige sessão: o Foundry serve esses arquivos sem pedir login, mas ele pode
 * estar só na rede local enquanto o front está na internet. Sem a checagem,
 * seria uma janela pro conteúdo estático dele.
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  if (!(await obterSessao(cookieStore.get(COOKIE_SESSAO)?.value))) {
    return new NextResponse(null, { status: 401 });
  }

  const caminho = new URL(request.url).searchParams.get("caminho");
  if (!caminho) return new NextResponse(null, { status: 400 });

  let resposta: Response;
  try {
    resposta = await buscarImagemDoFoundry(caminho);
  } catch {
    return new NextResponse(null, { status: 502 });
  }

  const tipo = resposta.headers.get("content-type") ?? "";
  // O Foundry responde 200 com uma página de erro quando o arquivo não
  // existe; sem esta checagem, isso viraria um <img> quebrado silencioso.
  if (!resposta.ok || !tipo.startsWith("image/")) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(resposta.body, {
    headers: {
      "Content-Type": tipo,
      "Cache-Control": `private, max-age=${CACHE_S}`
    }
  });
}
