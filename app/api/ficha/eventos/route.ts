import { cookies } from "next/headers";
import { COOKIE_SESSAO, estadosAtuais, inscrever, obterSessao, sessaoExiste } from "../../../lib/foundry-server";
import type { MensagemDoFoundry } from "../../../lib/foundry-types";

export const dynamic = "force-dynamic";

const INTERVALO_PING_MS = 20000;

function linhaSSE(mensagem: MensagemDoFoundry) {
  return `data: ${JSON.stringify(mensagem)}\n\n`;
}

/** Empurra a ficha (e qualquer atualização futura) via Server-Sent Events — uma conexão de longa duração por aba aberta. */
export async function GET() {
  const cookieStore = await cookies();
  const sessaoId = cookieStore.get(COOKIE_SESSAO)?.value;

  // Restaura antes de recusar: o stream reconecta sozinho depois de o
  // processo reiniciar, e sem isto o navegador cairia no login à toa.
  if (!(await obterSessao(sessaoId))) {
    return new Response(null, { status: 401 });
  }

  const codificador = new TextEncoder();
  let cancelarInscricao: () => void = () => {};
  let intervaloPing: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encerrar = () => {
        cancelarInscricao();
        if (intervaloPing) clearInterval(intervaloPing);
        try {
          controller.close();
        } catch {
          // Já fechado (cliente desconectou primeiro) — nada a fazer.
        }
      };

      const enviarEstado = () => {
        // A sessão some do mapa quando o Foundry a invalida (mundo relançado,
        // expirou). Fechar o stream faz o navegador reagir e voltar pro login.
        if (!sessaoExiste(sessaoId)) return encerrar();
        for (const estado of estadosAtuais(sessaoId!)) {
          controller.enqueue(codificador.encode(linhaSSE(estado)));
        }
      };

      enviarEstado();
      cancelarInscricao = inscrever(sessaoId!, enviarEstado);

      // Mantém a conexão viva através de proxies/load balancers que fecham
      // conexões HTTP ociosas (comentário SSE — o cliente ignora linhas ":").
      intervaloPing = setInterval(() => {
        if (!sessaoExiste(sessaoId)) return encerrar();
        controller.enqueue(codificador.encode(": ping\n\n"));
      }, INTERVALO_PING_MS);
    },
    cancel() {
      cancelarInscricao();
      if (intervaloPing) clearInterval(intervaloPing);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
