import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSAO, registrarAlive, sessaoAtiva } from "../../lib/foundry-server";

export const dynamic = "force-dynamic";

/**
 * Checagem de "já estou logado?" feita a cada carregamento de tela e a cada
 * volta do app ao primeiro plano. Se a sessão em memória se perdeu (o
 * processo reiniciou, ou a recompilação do `next dev` levou o mapa junto),
 * `sessaoAtiva` a reconstrói a partir do cookie, sem pedir senha. Só quando
 * nem o Foundry reconhece mais a sessão o cookie é apagado e o navegador cai
 * no login.
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

/**
 * "Ainda estou aqui", batido pelo navegador a cada 30s enquanto o app está
 * aberto e visível. Parou de bater, a sessão expira e o usuário volta a ficar
 * disponível na tela de login — ver `TEMPO_SEM_ALIVE_MS`.
 *
 * De propósito não valida nada além de existir: é chamado o tempo todo, e
 * quem confere de verdade é o GET aí em cima.
 */
export async function POST() {
  const cookieStore = await cookies();
  registrarAlive(cookieStore.get(COOKIE_SESSAO)?.value);
  return new NextResponse(null, { status: 204 });
}
