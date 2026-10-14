import { TituloSecao } from "./cabecalho-pagina";

type Beneficio = { nome: string; efeito: string; naFicha: boolean; naRolagem: boolean; escolha?: string };

function Grupo({ titulo, itens }: { titulo: string; itens: Beneficio[] }) {
  if (!itens.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold opacity-70">{titulo}</span>
      <ul className="flex flex-col gap-1.5">
        {itens.map((b, i) => (
          <li key={`${b.nome}-${i}`} className="flex flex-col">
            <span className="text-sm font-semibold">
              {b.nome}
              {b.escolha && <span className="font-normal opacity-60"> · {b.escolha}</span>}
              {(b.naFicha || b.naRolagem) && (
                <span className="font-normal opacity-60">
                  {" · "}
                  {[b.naFicha && "na ficha", b.naRolagem && "nas rolagens"].filter(Boolean).join(" e ")}
                </span>
              )}
            </span>
            {b.efeito && <span className="text-xs opacity-60">{b.efeito}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "O que isto te dá": os bônus que uma base ou um negócio passam ao
 * personagem aberto, na divisão que os dois módulos usam — o que entra
 * sozinho, o que a mesa precisa lembrar e o que não vale para ele agora.
 */
export default function ListaBeneficios({
  titulo,
  automaticos,
  lembretes,
  bloqueados,
  aviso
}: {
  titulo: string;
  automaticos: Beneficio[];
  lembretes: Beneficio[];
  bloqueados: { nome: string; motivo: string }[];
  aviso?: string | null;
}) {
  const vazio = !automaticos.length && !lembretes.length && !bloqueados.length;
  return (
    <div className="flex flex-col gap-3">
      <TituloSecao>{titulo}</TituloSecao>
      {aviso && <span className="text-xs text-red-700 dark:text-red-400">{aviso}</span>}
      <Grupo titulo="Aplicado sozinho" itens={automaticos} />
      <Grupo titulo="Para lembrar na mesa" itens={lembretes} />
      {bloqueados.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold opacity-70">Não vale para você agora</span>
          <ul className="flex flex-col gap-1">
            {bloqueados.map((b, i) => (
              <li key={`${b.nome}-${i}`} className="text-sm">
                {b.nome} {b.motivo && <span className="text-xs opacity-60">· {b.motivo}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {vazio && <span className="text-sm opacity-60">Nada por enquanto.</span>}
    </div>
  );
}
