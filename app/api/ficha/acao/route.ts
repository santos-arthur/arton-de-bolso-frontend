import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSAO, enviarMensagem } from "../../../lib/foundry-server";
import type { MensagemParaFoundry } from "../../../lib/foundry-types";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessaoId = cookieStore.get(COOKIE_SESSAO)?.value;
  if (!sessaoId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const mensagem = (await request.json().catch(() => null)) as MensagemParaFoundry | null;
  if (!mensagem?.tipo) {
    return NextResponse.json({ erro: "Mensagem inválida." }, { status: 400 });
  }

  try {
    enviarMensagem(sessaoId, mensagem);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    return NextResponse.json({ erro: (erro as Error).message }, { status: 409 });
  }
}
