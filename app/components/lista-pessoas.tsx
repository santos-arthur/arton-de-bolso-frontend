import { TituloSecao } from "./cabecalho-pagina";

/** Personagens em fichinhas com retrato — residentes de uma base, frequentadores de um negócio. */
export default function ListaPessoas({
  titulo,
  pessoas
}: {
  titulo: string;
  pessoas: { id: string; nome: string; img: string }[];
}) {
  if (!pessoas.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <TituloSecao>
        {titulo} · {pessoas.length}
      </TituloSecao>
      <ul className="flex flex-row flex-wrap gap-2">
        {pessoas.map((p) => (
          <li
            key={p.id}
            className="flex flex-row items-center gap-2 rounded-full border border-borda py-1 pl-1 pr-3 text-sm"
          >
            {p.img ? (
              <span
                role="img"
                aria-hidden="true"
                className="size-6 shrink-0 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${p.img})` }}
              />
            ) : (
              <span className="size-6 shrink-0 rounded-full border border-borda" />
            )}
            {p.nome}
          </li>
        ))}
      </ul>
    </div>
  );
}
