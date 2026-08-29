"use client";

import { FaChevronLeft, FaEye, FaPen, FaSpinner, FaTrash } from "react-icons/fa6";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import CabecalhoPagina, { EstadoVazio } from "../../components/cabecalho-pagina";
import EditorAnotacao from "../../components/editor-anotacao";
import FolhaModal from "../../components/folha-modal";
import Prosa from "../../components/prosa";
import { acharAnotacao, useDiarios } from "../../lib/anotacoes";
import { useFoundry } from "../../lib/foundry-provider";

function VoltarParaLista() {
  return (
    <Link
      href="/anotacoes"
      className="flex w-fit flex-row items-center gap-2 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
    >
      <FaChevronLeft aria-hidden="true" className="size-3!" />
      Voltar para as anotações
    </Link>
  );
}

/**
 * Uma anotação: leitura por padrão, edição a um toque — e só no próprio
 * diário. A trava de verdade não está aqui e sim no módulo, que resolve a
 * página dentro do diário de quem pediu; esconder o botão é conveniência,
 * não autorização.
 */
export default function Page() {
  const { paginaId } = useParams<{ paginaId: string }>();
  const { diarios, carregando } = useDiarios();
  const { salvarAnotacao, excluirAnotacao } = useFoundry();
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const achado = acharAnotacao(diarios, paginaId);

  if (carregando) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        <FaSpinner aria-hidden="true" className="size-5! animate-spin opacity-60" />
        <p className="text-sm opacity-60">Carregando anotação...</p>
      </div>
    );
  }

  if (!achado) {
    return (
      <div className="flex flex-col gap-4">
        <CabecalhoPagina titulo="Anotação" />
        <VoltarParaLista />
        <EstadoVazio>Esta anotação não existe mais, ou não é visível para você.</EstadoVazio>
      </div>
    );
  }

  const { diario, anotacao } = achado;

  if (editando) {
    return (
      <div className="flex min-h-[70dvh] flex-col gap-4">
        <CabecalhoPagina titulo="Editar anotação" />

        <EditorAnotacao
          // A chave amarra o formulário à anotação: trocar de página (ou
          // receber outra pelo stream) recomeça o rascunho no texto certo.
          key={anotacao.id}
          tituloInicial={anotacao.titulo}
          conteudoInicial={anotacao.conteudo}
          onSalvar={(titulo, conteudo) => {
            salvarAnotacao(anotacao.id, titulo, conteudo);
            setEditando(false);
          }}
          onCancelar={() => setEditando(false)}
          extra={
            <button
              type="button"
              onClick={() => setConfirmandoExclusao(true)}
              className="flex min-h-11 flex-row items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-800 transition-colors hover:bg-red-800/10 dark:text-red-400"
            >
              <FaTrash aria-hidden="true" className="size-3.5!" />
              Excluir
            </button>
          }
        />

        {confirmandoExclusao && (
          <FolhaModal titulo="Excluir anotação" onFechar={() => setConfirmandoExclusao(false)}>
            <p className="pt-2 text-sm opacity-80">
              &quot;{anotacao.titulo}&quot; será apagada do seu diário. Isso não tem como ser desfeito pelo app.
            </p>
            <div className="flex flex-row flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  excluirAnotacao(anotacao.id);
                  router.push("/anotacoes");
                }}
                className="min-h-11 rounded-xl bg-red-800 px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Excluir
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(false)}
                className="min-h-11 rounded-xl border border-borda px-4 text-sm font-semibold transition-colors hover:bg-foreground/5"
              >
                Cancelar
              </button>
            </div>
          </FolhaModal>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina titulo={anotacao.titulo} />
      <VoltarParaLista />

      <div className="flex flex-row items-center justify-between gap-3">
        {diario.meu ? (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="flex min-h-11 flex-row items-center gap-2 rounded-xl bg-acento px-4 text-sm font-bold text-acento-tinta transition-opacity hover:opacity-90"
          >
            <FaPen aria-hidden="true" className="size-3.5!" />
            Editar
          </button>
        ) : (
          <p className="flex flex-row items-center gap-2 text-sm opacity-60">
            <FaEye aria-hidden="true" className="size-3.5!" />
            Anotação de {diario.nome}
          </p>
        )}
      </div>

      {anotacao.conteudo ? (
        <Prosa
          html={anotacao.conteudo}
          className="break-words rounded-2xl border border-borda bg-superficie-alta p-4 text-sm leading-relaxed"
        />
      ) : (
        <EstadoVazio>Esta anotação está sem texto.</EstadoVazio>
      )}
    </div>
  );
}
