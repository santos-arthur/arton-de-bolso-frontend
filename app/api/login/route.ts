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
    maxAge: 60 * 60 * 24 * 7 // 7 dias — a sessão do Foundry em si dura menos (24h), o cookie só guarda a referência
  });

  return NextResponse.json({ sucesso: true });
}
