import type { ConnectorType, ContextNode, DomainNode, MaturityValue, SubdomainType } from "@odds/core";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "../../../components/button/Button";
import { Collapsible } from "../../../components/ui/Collapsible";
import { DialogActions, DialogClose } from "../../../components/ui/Dialog";
import { Field, FieldGroup } from "../../../components/ui/Field";
import { Select } from "../../../components/ui/Select";
import { Toggle } from "../../../components/ui/Toggle";
import { ToggleGroup } from "../../../components/ui/ToggleGroup";
import { pairKey } from "../../../lib/selection";
import { usePlayground } from "../../../stores/playground";
import { FORMS, TAGS } from "../../inspector/lib/glossary";
import { snippetOf, type CreateRequest } from "../lib/insertion";
import { nameProblem, pairProblem, type Noun } from "../lib/names";
import { allowedTags, pruneTags, toggleTag, type Side, type TagState } from "../lib/tags";
import styles from "./Forms.module.css";

/** `GLOSSARY.md`: the three classifications of a subdomain. */
const TYPES: { value: SubdomainType; label: string; hint: string }[] = [
  { value: "core", label: "core", hint: "O diferencial do negócio" },
  { value: "supporting", label: "supporting", hint: "Necessário, mas não diferencia" },
  { value: "generic", label: "generic", hint: "Um problema já resolvido" },
];
const MATURITIES: MaturityValue[] = ["experimental", "growing", "mature", "legacy"];
const CONNECTORS: ConnectorType[] = ["-->", "<--", "<->", "-x-"];
const TITLE_HINT = "Rótulo livre para o mapa. O nome continua sendo o que o mapping usa.";

const contextsOf = (d: DomainNode): ContextNode[] => [...d.subdomains.flatMap((s) => s.contexts), ...(d.external?.contexts ?? [])];

/** The frame every form shares: the fields, the text it will write, Cancelar and the submit. */
function Frame({ req, submit, onSubmit, children }: { req: CreateRequest | null; submit: string; onSubmit: () => void; children: ReactNode }) {
  const go = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form onSubmit={go} noValidate>
      {children}
      {req && (
        <div className={styles.preview}>
          <span className={styles.previewLabel}>Vai entrar no texto</span>
          <pre aria-label="Vai entrar no texto">{snippetOf(req).join("\n")}</pre>
        </div>
      )}
      <DialogActions>
        <DialogClose>Cancelar</DialogClose>
        <Button type="submit" variant="primary">
          {submit}
        </Button>
      </DialogActions>
    </form>
  );
}

/** The optional fields, folded: every one the grammar accepts is there, one click away. */
function Details({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className={styles.details}>
      <Collapsible.Trigger className={styles.more}>
        <svg className={open ? styles.chevOpen : styles.chev} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M4.5 3l3 3-3 3" />
        </svg>
        mais detalhes
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.panel}>{children}</Collapsible.Panel>
    </Collapsible.Root>
  );
}

/** A name field: its problem shows once something is typed, or after a submit. */
function useName(taken: ReadonlySet<string>, noun: Noun) {
  const [name, setName] = useState("");
  const [tried, setTried] = useState(false);
  const problem = nameProblem(name, taken, noun);
  const shown = tried || name !== "" ? problem : null;
  return { name: name.trim(), field: { value: name, onChange: setName, error: shown }, ok: () => (setTried(true), problem === null) };
}

export function DomainForm() {
  const commit = usePlayground((s) => s.commitCreate);
  const n = useName(new Set(), "domínio");
  const [title, setTitle] = useState("");
  const req: CreateRequest = { kind: "domain", fields: { name: n.name, title } };
  return (
    <Frame req={n.name ? req : null} submit="Criar domínio" onSubmit={() => n.ok() && commit(req)}>
      <Field label="Nome" code autoFocus hint="O identificador do domínio, sem espaços." {...n.field} />
      <Field label="Título" hint={TITLE_HINT} value={title} onChange={setTitle} />
    </Frame>
  );
}

export function SubdomainForm({ domain, index }: { domain: DomainNode; index: number }) {
  const commit = usePlayground((s) => s.commitCreate);
  const n = useName(new Set(domain.subdomains.map((s) => s.name)), "subdomínio");
  const [type, setType] = useState<SubdomainType>(domain.subdomains.some((s) => s.subdomainType === "core") ? "supporting" : "core");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const req: CreateRequest = { kind: "subdomain", domain: index, fields: { type, name: n.name, title, description, owner } };
  return (
    <Frame req={n.name ? req : null} submit="Criar subdomínio" onSubmit={() => n.ok() && commit(req)}>
      <FieldGroup label="Classificação" hint={TYPES.find((t) => t.value === type)!.hint}>
        <ToggleGroup items={TYPES} value={type} onValueChange={setType} className={styles.choices} />
      </FieldGroup>
      <Field label="Nome" code autoFocus {...n.field} />
      <Details>
        <Field label="Título" hint={TITLE_HINT} value={title} onChange={setTitle} />
        <Field label="Descrição" hint="Por que o subdomínio existe." value={description} onChange={setDescription} />
        <Field label="Responsável" hint="Quem responde por ele." value={owner} onChange={setOwner} />
      </Details>
    </Frame>
  );
}

export function ContextForm({ domain, index, parent }: { domain: DomainNode; index: number; parent: string | null }) {
  const commit = usePlayground((s) => s.commitCreate);
  const n = useName(new Set(contextsOf(domain).map((c) => c.name)), "context");
  const [f, setF] = useState({ title: "", type: "", description: "", responsibilities: "", team: "", technology: "" });
  const [maturity, setMaturity] = useState<MaturityValue | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const req: CreateRequest = {
    kind: "context",
    domain: index,
    parent,
    fields: { name: n.name, ...f, responsibilities: f.responsibilities.split("\n"), maturity: maturity ?? undefined },
  };
  return (
    <Frame req={n.name ? req : null} submit="Criar context" onSubmit={() => n.ok() && commit(req)}>
      <Field label="Nome" code autoFocus hint="É por ele que o mapping se refere ao context." {...n.field} />
      <Details>
        <Field label="Título" hint={TITLE_HINT} value={f.title} onChange={set("title")} />
        <Field label="Tipo" hint="Livre: aggregate, process, policy, gateway…" value={f.type} onChange={set("type")} />
        <Field label="Descrição" value={f.description} onChange={set("description")} />
        <Field label="Responsabilidades (uma por linha)" multiline value={f.responsibilities} onChange={set("responsibilities")} />
        <FieldGroup label="Maturidade" hint="Apertar de novo desmarca.">
          <ToggleGroup<MaturityValue> allowEmpty items={MATURITIES.map((m) => ({ value: m, label: m }))} value={maturity} onValueChange={setMaturity} className={styles.choices} />
        </FieldGroup>
        <Field label="Time" value={f.team} onChange={set("team")} />
        <Field label="Tecnologia" value={f.technology} onChange={set("technology")} />
      </Details>
    </Frame>
  );
}

/** What each side of a connector is called, in the form. */
function sideLabels(c: ConnectorType): [string, string] {
  if (c === "-->") return ["Upstream", "Downstream"];
  if (c === "<--") return ["Downstream", "Upstream"];
  return ["Um lado", "Outro lado"];
}

export function RelationshipForm({ domain, index, left: first }: { domain: DomainNode; index: number; left: string }) {
  const commit = usePlayground((s) => s.commitCreate);
  const all = contextsOf(domain);
  const external = new Set(domain.external?.contexts.map((c) => c.name) ?? []);
  const related = new Set((domain.mapping?.relationships ?? []).map((r) => pairKey(r.left, r.right)));
  const items = [
    ...domain.subdomains.flatMap((s) => s.contexts.map((c) => ({ value: c.name, label: c.name, hint: s.name }))),
    ...(domain.external?.contexts ?? []).map((c) => ({ value: c.name, label: c.name, hint: "external" })),
  ];
  const [connector, setConnector] = useState<ConnectorType>("-->");
  const [left, setLeft] = useState(all.some((c) => c.name === first) ? first : "");
  const [right, setRight] = useState("");
  const [tags, setTags] = useState<TagState>({ left: [], right: [] });
  const [tried, setTried] = useState(false);
  const hasExternal = external.has(left) || external.has(right);
  const problem = pairProblem(left, right, related, external);
  const shown = tried || (left !== "" && right !== "") ? problem : null;
  const [leftLabel, rightLabel] = sideLabels(connector);

  const changeConnector = (c: ConnectorType) => {
    setConnector(c);
    setTags((t) => pruneTags(t, c, hasExternal));
  };
  const changeSide = (side: Side) => (v: string) => {
    const l = side === "left" ? v : left;
    const r = side === "right" ? v : right;
    if (side === "left") setLeft(v);
    else setRight(v);
    setTags((t) => pruneTags(t, connector, external.has(l) || external.has(r)));
  };
  const tagGroup = (side: Side, name: string, label: string) => (
    <div className={styles.tags} role="group" aria-label={`Tags de ${name || label}`}>
      {allowedTags(connector, side, hasExternal).map((t) => (
        <Toggle
          key={t}
          className={styles.tag}
          pressed={tags[side].includes(t)}
          onPressedChange={() => setTags((s) => toggleTag(s, connector, side, t))}
          hint={`${TAGS[t]![0]}: ${TAGS[t]![1]}`}
        >
          {t}
        </Toggle>
      ))}
    </div>
  );

  const req: CreateRequest = { kind: "relationship", domain: index, fields: { left, connector, right, leftTags: tags.left, rightTags: tags.right } };
  const submit = () => {
    setTried(true);
    if (problem === null) commit(req);
  };
  return (
    <Frame req={left && right ? req : null} submit="Criar relação" onSubmit={submit}>
      <FieldGroup label="Conector" hint={`${FORMS[connector][0]}: ${FORMS[connector][1]}`}>
        <ToggleGroup items={CONNECTORS.map((c) => ({ value: c, label: c }))} value={connector} onValueChange={changeConnector} className={`${styles.choices} ${styles.mono}`} />
      </FieldGroup>
      <div className={styles.sides}>
        <div>
          <Select label={leftLabel} value={left || null} onValueChange={changeSide("left")} items={items} placeholder="Escolha um context" />
          {tagGroup("left", left, leftLabel)}
        </div>
        <div>
          <Select label={rightLabel} value={right || null} onValueChange={changeSide("right")} items={items} placeholder="Escolha um context" />
          {tagGroup("right", right, rightLabel)}
        </div>
      </div>
      {shown && (
        <p className={styles.problem} role="alert">
          {shown}
        </p>
      )}
    </Frame>
  );
}
