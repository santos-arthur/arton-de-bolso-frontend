"use client";

import { FaChevronLeft } from "react-icons/fa6";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CabecalhoPagina from "../../components/cabecalho-pagina";
import EditorAnotacao from "../../components/editor-anotacao";
import { useFoundry } from "../../lib/foundry-provider";

/**
 * Anotação nova. Ela só existe no Foundry depois do "Criar" — escrever
 * primeiro e gravar uma vez só evita uma página vazia sobrando na lista de
 * todo mundo quando o jogador desiste no meio.
 */
export default function Page() {
  const { criarAnotacao } = useFoundry();
  const router = useRouter();

  return (
    <div className="flex min-h-[70dvh] flex-col gap-4">
      <CabecalhoPagina titulo="Nova anotação" />

      <Link
        href="/anotacoes"
        className="flex w-fit flex-row items-center gap-2 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
      >
        <FaChevronLeft aria-hidden="true" className="size-3!" />
        Voltar para as anotações
      </Link>

      <EditorAnotacao
        rotuloSalvar="Criar"
        onSalvar={(titulo, texto) => {
          criarAnotacao(titulo, texto);
          // Volta para a lista sem esperar: a anotação aparece lá assim que o
          // relay confirmar, e um erro do Foundry vira a faixa vermelha do
          // topo, visível de qualquer tela.
          router.push("/anotacoes");
        }}
        onCancelar={() => router.push("/anotacoes")}
      />
    </div>
  );
}
