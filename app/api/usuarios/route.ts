import { NextResponse } from "next/server";
import { listarUsuariosFoundry } from "../../lib/foundry-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const usuarios = await listarUsuariosFoundry();
    return NextResponse.json({ usuarios });
  } catch (erro) {
    return NextResponse.json({ usuarios: [], erro: (erro as Error).message }, { status: 502 });
  }
}
