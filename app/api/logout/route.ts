import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSAO, encerrarSessao } from "../../lib/foundry-server";

export async function POST() {
  const cookieStore = await cookies();
  const sessaoId = cookieStore.get(COOKIE_SESSAO)?.value;
  encerrarSessao(sessaoId);
  cookieStore.delete(COOKIE_SESSAO);
  return NextResponse.json({ ok: true });
}
