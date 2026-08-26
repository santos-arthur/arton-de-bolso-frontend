import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSAO, enviarMensagem, obterSessao } from "../../../lib/foundry-server";
import type { MensagemParaFoundry } from "../../../lib/foundry-types";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessao = await obterSessao(cookieStore.get(COOKIE_SESSAO)?.value);
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const mensagem = (await request.json().catch(() => null)) as MensagemParaFoundry | null;
  if (!mensagem?.tipo) {
    return NextResponse.json({ erro: "Mensagem inválida." }, { status: 400 });
  }

  try {
    enviarMensagem(sessao.id, mensagem);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    return NextResponse.json({ erro: (erro as Error).message }, { status: 409 });
  }
}
