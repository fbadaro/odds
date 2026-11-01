import { Dialog } from "../../../components/ui/Dialog";
import { usePlayground, type CreateTarget } from "../../../stores/playground";
import { ContextForm, DomainForm, RelationshipForm, SubdomainForm } from "./Forms";

const TITLES: Record<CreateTarget["kind"], string> = {
  domain: "Novo domínio",
  subdomain: "Novo subdomínio",
  context: "Novo context",
  relationship: "Nova relação",
};

/**
 * The form of whatever is being created, over the map. It inserts a snippet
 * into the text and nothing else (ADR-0026); it opens only on a tree of the
 * current text, so a syntax error typed meanwhile shows instead of the form.
 */
export function CreateDialog() {
  const creating = usePlayground((s) => s.creating);
  const ast = usePlayground((s) => s.analysis.ast);
  const close = usePlayground((s) => s.closeCreate);
  if (!creating) return null;

  const d = creating.kind === "domain" ? null : (ast?.domains[creating.domain] ?? null);
  const description =
    creating.kind === "context" ? (
      <>
        em <b>{creating.parent ?? "external"}</b>, no fim do bloco
      </>
    ) : creating.kind === "subdomain" ? (
      <>
        em <b>{d?.name}</b>, depois do último subdomínio
      </>
    ) : creating.kind === "relationship" ? (
      <>
        no fim do <b>mapping</b>
      </>
    ) : (
      "O domínio é a raiz do arquivo: um por design."
    );

  let body;
  if (!ast) body = <p>O texto tem um erro de sintaxe. Corrija-o para criar.</p>;
  else if (creating.kind === "domain") body = <DomainForm />;
  else if (!d) body = <p>Esse domínio não está mais no texto.</p>;
  else if (creating.kind === "subdomain") body = <SubdomainForm domain={d} index={creating.domain} />;
  else if (creating.kind === "context") body = <ContextForm domain={d} index={creating.domain} parent={creating.parent} />;
  else body = <RelationshipForm domain={d} index={creating.domain} left={creating.left ?? ""} />;

  return (
    <Dialog open onOpenChange={(o) => !o && close()} title={TITLES[creating.kind]} description={description} feature="create-dialog">
      {body}
    </Dialog>
  );
}
