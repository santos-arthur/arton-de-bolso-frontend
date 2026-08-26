import { NextResponse } from "next/server";
import { listarUsuariosFoundry } from "../../lib/foundry-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // `?fresco=1` vem do momento em que o jogador abre a lista no login —
    // ver `listarUsuariosFoundry`. O resto (o polling da tela) aceita a
    // janela de cache.
    const fresco = new URL(request.url).searchParams.get("fresco") === "1";
    const usuarios = await listarUsuariosFoundry(fresco);
    return NextResponse.json({ usuarios });
  } catch (erro) {
    return NextResponse.json({ usuarios: [], erro: (erro as Error).message }, { status: 502 });
  }
}
