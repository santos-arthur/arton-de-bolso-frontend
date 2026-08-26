import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { autenticar, COOKIE_SESSAO } from "../../lib/foundry-server";

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  const userid = corpo?.userid;
  const senha = corpo?.senha ?? "";

  if (!userid || typeof userid !== "string") {
    return NextResponse.json({ sucesso: false, erro: "Usuário obrigatório." }, { status: 400 });
  }

  const resultado = await autenticar(userid, senha);
  if (!resultado.sucesso) {
    return NextResponse.json({ sucesso: false, erro: resultado.erro }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESSAO, resultado.sessaoId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // O valor do cookie É o id da sessão no Foundry (httpOnly, nunca chega ao
    // JavaScript da página). É isso que deixa o app voltar logado depois de
    // fechado — ou depois de o nosso processo reiniciar —, já que a sessão de
    // verdade mora lá. Os 7 dias são só o limite do lado de cá: quando as 24h
    // do Foundry vencem, a restauração falha e o cookie é apagado.
    maxAge: 60 * 60 * 24 * 7
  });

  return NextResponse.json({ sucesso: true });
}
