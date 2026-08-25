import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSAO, sessaoAtiva } from "../../lib/foundry-server";

export const dynamic = "force-dynamic";

/**
 * Checagem de "já estou logado?" feita a cada carregamento de tela. Pergunta
 * de verdade ao Foundry (ver `sessaoAtiva`) — se a sessão morreu lá, o cookie
 * local é apagado aqui, então o navegador cai direto no login.
 */
export async function GET() {
  const cookieStore = await cookies();
  const sessaoId = cookieStore.get(COOKIE_SESSAO)?.value;

  const autenticado = await sessaoAtiva(sessaoId);
  if (!autenticado && sessaoId) cookieStore.delete(COOKIE_SESSAO);

  return NextResponse.json(
    { autenticado },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
