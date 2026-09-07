/**
 * Validador semantico — `RULES-EN.md` §1–§4, fases 2 a 6.
 *
 * **O principio do erro-raiz governa tudo aqui** (`RULES-EN.md` §3.1): um
 * elemento que produziu `error` fica registrado como *declarado mas invalido* e
 * sai de toda fase **posterior** — nunca da propria. A leitura e **larga**: o
 * elemento sai do pipeline inteiro, nao so das regras que consomem o que foi
 * invalidado. E um elemento invalidado **leva os filhos junto**.
 *
 * `warning` e `info` nunca invalidam nada.
 */

import type {
  ConnectorType, ContextNode, DomainNode, PatternTag, ProgramNode,
  RelationshipNode, SubdomainNode, TaggedPattern,
} from "./ast.js";
import { CATALOGUE } from "./catalogue.js";
import type { Diagnostic, DiagnosticCode, SourceSpan } from "./diagnostics.js";
import { buildSymbolTable, resolve, type SymbolTable } from "./symbolTable.js";

const VALID_SUBDOMAIN_TYPES = new Set(["core", "supporting", "generic"]);
const UPSTREAM_ONLY: ReadonlySet<PatternTag> = new Set<PatternTag>(["OHS", "PL", "S"]);
const DOWNSTREAM_ONLY: ReadonlySet<PatternTag> = new Set<PatternTag>(["ACL", "CF", "C"]);
const MUTUAL_ONLY: ReadonlySet<PatternTag> = new Set<PatternTag>(["SK", "P"]);

/** `BBM` nao e tag de padrao: caracteriza o sistema, nao o contrato (§0.2). */
const isPattern = (tag: PatternTag) => tag !== "BBM";

interface Side {
  readonly name: string;
  readonly tags: TaggedPattern[];
  readonly span: SourceSpan;
  /** Grupo de tags inteiro, colchetes inclusive. Ausente quando o lado nao tem tags. */
  readonly tagGroupSpan?: SourceSpan;
}

/** Lados de uma linha direcional. `<->` e `-x-` nao tem posicao. */
function directionalSides(
  rel: RelationshipNode,
): { upstream: Side; downstream: Side } | undefined {
  const [left, right] = sidesOf(rel);
  if (rel.connector === "-->") return { upstream: left, downstream: right };
  if (rel.connector === "<--") return { upstream: right, downstream: left };
  return undefined;
}

function sidesOf(rel: RelationshipNode): [Side, Side] {
  return [
    {
      name: rel.left, tags: rel.leftTags, span: rel.leftSpan,
      ...(rel.leftTagGroupSpan === undefined ? {} : { tagGroupSpan: rel.leftTagGroupSpan }),
    },
    {
      name: rel.right, tags: rel.rightTags, span: rel.rightSpan,
      ...(rel.rightTagGroupSpan === undefined ? {} : { tagGroupSpan: rel.rightTagGroupSpan }),
    },
  ];
}

const isDirectional = (c: ConnectorType) => c === "-->" || c === "<--";
const hasTag = (side: Side, tag: PatternTag) => side.tags.some((t) => t.tag === tag);
const pairKey = (rel: RelationshipNode) => [rel.left, rel.right].sort().join(" ");

class Validator {
  private readonly diagnostics: Diagnostic[] = [];
  private readonly symbols: SymbolTable;
  /** Contextos que produziram `error` — fora das fases seguintes. */
  private readonly invalidContexts = new Set<string>();
  private readonly invalidRelationships = new Set<RelationshipNode>();
  private readonly invalidSubdomains = new Set<SubdomainNode>();

  constructor(private readonly program: ProgramNode, parserDiagnostics: Diagnostic[]) {
    this.symbols = buildSymbolTable(program);
    this.diagnostics.push(...parserDiagnostics);
    // A fase 1 ja invalidou o que descartou.
    for (const context of program.discarded.contexts) this.invalidContexts.add(context.name);
    for (const subdomain of program.discarded.subdomains) this.invalidate(subdomain);
  }

  private emit(code: DiagnosticCode, span: SourceSpan, data: Record<string, string>): void {
    this.diagnostics.push({ severity: CATALOGUE[code].severity, code, span, data });
  }

  /** Invalidar um subdominio leva os contextos dele junto (§3.1). */
  private invalidate(subdomain: SubdomainNode): void {
    this.invalidSubdomains.add(subdomain);
    for (const context of subdomain.contexts) this.invalidContexts.add(context.name);
  }

  private liveRelationships(): RelationshipNode[] {
    const relationships = this.program.domains[0]?.mapping?.relationships ?? [];
    return relationships.filter((rel) => !this.invalidRelationships.has(rel));
  }

  private liveSubdomains(): SubdomainNode[] {
    const subdomains = this.program.domains[0]?.subdomains ?? [];
    return subdomains.filter((s) => !this.invalidSubdomains.has(s));
  }

  private isExternal(name: string): boolean {
    return resolve(this.symbols, name)?.isExternal ?? false;
  }

  private subdomainTypeOf(name: string): string | undefined {
    if (this.invalidContexts.has(name)) return undefined;
    return resolve(this.symbols, name)?.subdomainType;
  }

  // --- Fase 2 · Declarativa ------------------------------------------------

  /**
   * Passo 0 do `RULES-EN.md` (Resumo para implementacao da AST): verificar que
   * existe exatamente um `Domain`. Devolve `false` quando nao existe — e ai o
   * pipeline **para**.
   */
  private checkDomainCardinality(): boolean {
    const domains = this.program.domains;
    if (domains.length === 1) return true;
    // `TEST_SUITE.md` §4: o segundo `domain` quando ha varios; o arquivo
    // inteiro quando nao ha nenhum.
    const span = domains[1]?.headerSpan ?? this.program.span;
    this.emit("INVALID_DOMAIN_CARDINALITY", span, { count: String(domains.length) });
    return false;
  }

  private phase2(): void {
    const domains = this.program.domains;
    for (const domain of domains) {
      const seen = new Set<string>();
      for (const subdomain of domain.subdomains) {
        if (!VALID_SUBDOMAIN_TYPES.has(subdomain.subdomainType)) {
          this.emit("INVALID_SUBDOMAIN_TYPE", subdomain.subdomainTypeSpan, {
            subdomain: subdomain.name,
            value: subdomain.subdomainType,
          });
          this.invalidate(subdomain);
        }
        if (seen.has(subdomain.name)) {
          this.emit("DUPLICATE_SUBDOMAIN", subdomain.headerSpan, { subdomain: subdomain.name });
          this.invalidate(subdomain);
        }
        seen.add(subdomain.name);
      }
    }

    // Interno e externo compartilham um namespace so (`RULES-EN.md` §1.A),
    // porque `mapping` referencia por identificador nu, sem qualificacao.
    for (const [name, entries] of this.symbols) {
      const valid = entries.filter((e) => e.valid);
      for (const entry of valid.slice(1)) {
        this.emit("DUPLICATE_CONTEXT", entry.node.span, { context: name });
        this.invalidContexts.add(name);
      }
    }
  }

  // --- Fase 3 · Referencial ------------------------------------------------

  private phase3(): void {
    const firstSeen = new Map<string, number>();
    for (const rel of this.liveRelationships()) {
      let failed = false;

      for (const side of sidesOf(rel)) {
        // Declarado-mas-invalido NAO conta como nao declarado (§3.1).
        if (!this.symbols.has(side.name)) {
          this.emit("PHANTOM_REFERENCE", side.span, { context: side.name });
          failed = true;
        }
      }

      if (rel.left === rel.right) {
        this.emit("SELF_RELATIONSHIP", rel.span, { context: rel.left });
        failed = true;
      }

      // Identidade e o par NAO-ORDENADO; conector e tags nao entram nela.
      const first = firstSeen.get(pairKey(rel));
      if (first !== undefined) {
        this.emit("DUPLICATE_RELATIONSHIP", rel.span, {
          left: rel.left,
          right: rel.right,
          firstLine: String(first),
        });
        failed = true;
      } else {
        firstSeen.set(pairKey(rel), rel.span.start.line);
      }

      if (this.isExternal(rel.left) && this.isExternal(rel.right)) {
        this.emit("EXTERNAL_ONLY_RELATIONSHIP", rel.span, { left: rel.left, right: rel.right });
        failed = true;
      }

      if (failed) this.invalidRelationships.add(rel);
    }
  }

  // --- Fase 4 · Relacional -------------------------------------------------

  private phase4(): void {
    for (const rel of this.liveRelationships()) {
      let failed = false;
      const sides = directionalSides(rel);
      const both = sidesOf(rel);
      const allTags = both.flatMap((s) => s.tags);

      if (rel.connector === "-x-") {
        // Qualquer tag de padrao em `-x-`. `[BBM]` e a excecao explicita.
        const patterns = allTags.filter((t) => isPattern(t.tag));
        if (patterns.length > 0) {
          this.emit("SEPARATION_CONFLICT", rel.span, {
            tags: patterns.map((t) => `[${t.tag}]`).join(", "),
          });
          failed = true;
        }
      }

      if (isDirectional(rel.connector) && sides) {
        for (const tag of sides.downstream.tags) {
          if (UPSTREAM_ONLY.has(tag.tag)) {
            this.emit("UPSTREAM_ONLY_TAG_MISPLACED", tag.span, { tag: tag.tag });
            failed = true;
          }
        }
        for (const tag of sides.upstream.tags) {
          if (DOWNSTREAM_ONLY.has(tag.tag)) {
            this.emit("DOWNSTREAM_ONLY_TAG_MISPLACED", tag.span, { tag: tag.tag });
            failed = true;
          }
        }
        for (const tag of allTags) {
          if (MUTUAL_ONLY.has(tag.tag)) {
            this.emit("MUTUAL_TAG_ON_DIRECTIONAL", tag.span, {
              tag: tag.tag,
              connector: rel.connector,
            });
            failed = true;
          }
        }
      }

      if (rel.connector === "<->") {
        for (const tag of allTags) {
          if (UPSTREAM_ONLY.has(tag.tag) || DOWNSTREAM_ONLY.has(tag.tag)) {
            this.emit("POSITIONAL_TAG_ON_MUTUAL", tag.span, { tag: tag.tag });
            failed = true;
          }
        }
        // Inferencia automatica e proibida: `[SK]`/`[P]` sao acordos bilaterais,
        // e escrever os dois lados e o ato de registrar que o outro time assinou.
        for (const tag of MUTUAL_ONLY) {
          const onLeft = hasTag(both[0], tag);
          const onRight = hasTag(both[1], tag);
          if (onLeft === onRight) continue;
          const declared = onLeft ? both[0] : both[1];
          const anchor = declared.tags.find((t) => t.tag === tag);
          if (anchor) {
            this.emit("INCOMPLETE_MUTUAL_TAG", anchor.span, {
              tag,
              declaredSide: onLeft ? "left" : "right",
            });
            failed = true;
          }
        }
      }

      const external = [rel.left, rel.right].find((n) => this.isExternal(n));
      const mutualTag = allTags.find((t) => MUTUAL_ONLY.has(t.tag));
      if (external !== undefined && mutualTag) {
        // Um diagnostico por relacao, nao por tag: o erro e o acordo bilateral
        // com um terceiro, e ele e um so ainda que escrito nos dois lados.
        this.emit("MUTUAL_TAG_WITH_EXTERNAL", rel.span, { tag: mutualTag.tag, external });
        failed = true;
      }

      for (const side of both) {
        // Conflito e sobre a combinacao de tags, entao a ancora e o grupo.
        const anchor = side.tagGroupSpan ?? rel.span;
        if (hasTag(side, "C") && hasTag(side, "S")) {
          this.emit("ROLE_CONFLICT", anchor, { context: side.name });
          failed = true;
        }
        if (hasTag(side, "CF") && hasTag(side, "ACL")) {
          this.emit("PROTECTION_CONFLICT", anchor, { context: side.name });
          failed = true;
        }
      }

      if (failed) this.invalidRelationships.add(rel);
    }
  }

  // --- Fase 5 · Estrategica ------------------------------------------------

  private phase5(domain: DomainNode | undefined): void {
    const live = this.liveRelationships();

    for (const rel of live) {
      const sides = directionalSides(rel);
      const both = sidesOf(rel);

      if (sides) {
        const downstreamType = this.subdomainTypeOf(sides.downstream.name);
        const upstreamType = this.subdomainTypeOf(sides.upstream.name);

        if (downstreamType === "core") {
          // (a) tem precedencia sobre (b), e sai um unico diagnostico por linha.
          const conformist = hasTag(sides.downstream, "CF");
          // (b) nao dispara quando o core ja aplicou o ACL que a regra aconselharia.
          const bbm = hasTag(sides.upstream, "BBM") && !hasTag(sides.downstream, "ACL");
          if (conformist || bbm) {
            this.emit("CONFORMIST_CORE", rel.span, {
              context: sides.downstream.name,
              trigger: conformist ? "conformist" : "bbm",
            });
          }
        }

        if (upstreamType === "generic" && !hasTag(sides.upstream, "OHS")) {
          this.emit("GENERIC_WITHOUT_OHS", rel.span, {
            context: sides.upstream.name,
            subdomain: resolve(this.symbols, sides.upstream.name)?.subdomainName ?? "",
          });
        }

        if (upstreamType === "core" && downstreamType === "generic") {
          this.emit("CORE_UPSTREAM_OF_GENERIC", rel.span, {
            core: sides.upstream.name,
            generic: sides.downstream.name,
          });
        }

        const customer = hasTag(sides.downstream, "C");
        const supplier = hasTag(sides.upstream, "S");
        if (customer !== supplier) {
          this.emit("INCOMPLETE_CUSTOMER_SUPPLIER", rel.span, {
            context: customer ? sides.downstream.name : sides.upstream.name,
            declared: customer ? "C" : "S",
            missing: customer ? "S" : "C",
          });
        }
      }

      if (both.some((s) => hasTag(s, "SK"))) {
        const core = [rel.left, rel.right].find((n) => this.subdomainTypeOf(n) === "core");
        if (core !== undefined) {
          this.emit("CORE_IN_SHARED_KERNEL", rel.span, {
            core,
            other: core === rel.left ? rel.right : rel.left,
          });
        }
      }

      // `[BBM]` sozinho nao documenta contrato: nao e tag de padrao.
      if (rel.connector !== "-x-" && !both.flatMap((s) => s.tags).some((t) => isPattern(t.tag))) {
        this.emit("UNDOCUMENTED_CONTRACT", rel.span, { left: rel.left, right: rel.right });
      }

      for (const side of both) {
        const pl = side.tags.find((t) => t.tag === "PL");
        if (pl && !hasTag(side, "OHS")) {
          this.emit("PL_WITHOUT_OHS", pl.span, { context: side.name });
        }
      }
    }

    // --- agregados ---

    if (domain && !this.liveSubdomains().some((s) => s.subdomainType === "core")) {
      this.emit("DOMAIN_WITHOUT_CORE", domain.headerSpan, { domain: domain.name });
    }

    for (const subdomain of this.liveSubdomains()) {
      if (subdomain.contexts.length === 0) {
        this.emit("EMPTY_SUBDOMAIN", subdomain.headerSpan, { subdomain: subdomain.name });
      }
    }

    // Conta relacoes distintas, nunca linhas (§1.A).
    const sharedKernels = new Set(
      live.filter((r) => sidesOf(r).some((s) => hasTag(s, "SK"))).map(pairKey),
    );
    if (sharedKernels.size >= 3 && domain?.mapping) {
      this.emit("EXCESSIVE_SHARED_KERNEL", domain.mapping.keywordSpan, {
        count: String(sharedKernels.size),
      });
    }

    // Inerte quando nao ha `mapping` nenhum: modelo sem mapa e rascunho, e
    // acusar todo contexto de uma vez seria ruido em vez de sinal.
    if (domain?.mapping) {
      // Uma referencia numa linha invalidada ainda conta como referencia.
      const referenced = new Set(
        domain.mapping.relationships.flatMap((r) => [r.left, r.right]),
      );
      const declared: ContextNode[] = [
        ...this.liveSubdomains().flatMap((s) => s.contexts),
        ...(domain.external?.contexts ?? []),
      ];
      for (const context of declared) {
        if (!referenced.has(context.name) && !this.invalidContexts.has(context.name)) {
          this.emit("UNMAPPED_CONTEXT", context.span, { context: context.name });
        }
      }
    }

    this.inconsistentBbm(live);
  }

  /** Mesmo contexto com `[BBM]` numa relacao e sem em outra. */
  private inconsistentBbm(live: RelationshipNode[]): void {
    const seen = new Map<string, { withBbm: number; without: RelationshipNode[] }>();
    for (const rel of live) {
      for (const side of sidesOf(rel)) {
        const record = seen.get(side.name) ?? { withBbm: 0, without: [] };
        if (hasTag(side, "BBM")) record.withBbm += 1;
        else record.without.push(rel);
        seen.set(side.name, record);
      }
    }
    for (const [name, record] of seen) {
      const anchor = record.without[0];
      if (record.withBbm > 0 && anchor) {
        // Ancora: a primeira linha em que o contexto aparece SEM `[BBM]` — a que
        // o usuario provavelmente esqueceu.
        this.emit("INCONSISTENT_BBM", anchor.span, {
          context: name,
          withBbm: String(record.withBbm),
          withoutBbm: String(record.without.length),
        });
      }
    }
  }

  // --- Fase 6 · Supressao --------------------------------------------------

  private phase6(): Diagnostic[] {
    const emitted = [...this.diagnostics];
    const suppressed = new Set<Diagnostic>();
    const extra: Diagnostic[] = [];

    const malformed = (span: SourceSpan, code: string, reason: string): Diagnostic => ({
      severity: "info",
      code: "MALFORMED_SUPPRESSION",
      span,
      data: { code, reason },
    });

    for (const directive of this.program.suppressions) {
      if (!Object.hasOwn(CATALOGUE, directive.code)) {
        extra.push(malformed(directive.span, directive.code, "unknown-code"));
        continue;
      }
      // Silenciar um `error` faria o diagrama mentir sobre o proprio modelo.
      if (CATALOGUE[directive.code as DiagnosticCode].severity === "error") {
        extra.push(malformed(directive.span, directive.code, "not-suppressible"));
        continue;
      }
      if (directive.justification === "") {
        extra.push(malformed(directive.span, directive.code, "missing-justification"));
        continue;
      }
      // Suprime um code, nao a linha: outras regras na mesma linha continuam.
      const target = emitted.find(
        (d) => d.code === directive.code
          && d.span.start.line === directive.targetLine
          && !suppressed.has(d),
      );
      if (target) {
        suppressed.add(target);
      } else {
        extra.push({
          severity: "info",
          code: "UNUSED_SUPPRESSION",
          span: directive.span,
          data: { code: directive.code },
        });
      }
    }

    return [...emitted.filter((d) => !suppressed.has(d)), ...extra];
  }

  run(): Diagnostic[] {
    // **Passo 0 e terminal.** O `RULES-EN.md` manda reportar e *parar*: sem um
    // domain valido unico nao ha o que percorrer, e tudo que viesse depois
    // seria derivado de um erro — o que a §3.1 proibe. Vale inclusive para a
    // fase 6: num arquivo sem domain, uma diretiva de supressao produziria
    // `UNUSED_SUPPRESSION`, afirmando que a supressao esta obsoleta quando na
    // verdade a regra nunca chegou a ser avaliada.
    if (!this.checkDomainCardinality()) return this.diagnostics;

    this.phase2();
    this.phase3();
    this.phase4();
    this.phase5(this.program.domains[0]);
    return this.phase6();
  }
}

export function validate(program: ProgramNode, parserDiagnostics: Diagnostic[]): Diagnostic[] {
  return new Validator(program, parserDiagnostics).run();
}
