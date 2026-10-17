/**
 * Parser da linguagem ODDS — `GRAMMAR.md` §2–§3.
 *
 * **Como a recuperação de erro da `GRAMMAR.md` §5.1 é implementada.**
 * A spec obriga panic-mode recovery em exatamente três situações
 * (`ORPHAN_CONTEXT`, `ORPHAN_SUBDOMAIN`, `REMOVED_CONSTRUCT`): descartar a
 * construção, emitir o diagnóstico, **registrá-la como inválida** e continuar.
 * O `ADR-0002` nomeou como risco principal a recuperação genérica do
 * Chevrotain disparar primeiro e produzir um span diferente do esperado.
 *
 * A saída adotada evita a disputa em vez de arbitrá-la: as três situações são
 * **produções explícitas da gramática de implementação**, e o diagnóstico é
 * emitido por nós. A gramática da *linguagem* continua estrita — um `context`
 * solto num `domain` segue sendo erro —, mas o parser reconhece a forma errada
 * para poder explicá-la, em vez de falhar genericamente. É o que a §5.1 pede,
 * e nenhum recuperador do Chevrotain participa.
 *
 * Usa `EmbeddedActionsParser`: constrói a AST direto, sem camada CST → AST. O
 * `ADR-0002` listou essa camada como custo da escolha do toolkit; ela deixa de
 * existir justamente porque a recuperação não depende do CST.
 */

import { EmbeddedActionsParser, type IToken } from "chevrotain";

import type {
  ContextNode, ContextProperties, DomainNode, ExternalBlockNode, MappingNode,
  MaturityValue, PatternTag, ProgramNode, RelationshipNode, SubdomainNode,
  SuppressionDirective, TaggedPattern,
} from "./ast.js";
import { PATTERN_TAGS } from "./ast.js";
import type { Diagnostic, DiagnosticCode, Severity, SourceSpan } from "./diagnostics.js";
import * as t from "./lexer.js";
import { spanOf } from "./lexer.js";

const REMOVED_TAG = "SW";
const MATURITY_VALUES = ["experimental", "growing", "mature", "legacy"] as const;

function spanBetween(start: SourceSpan, end: SourceSpan): SourceSpan {
  return { start: start.start, end: end.end };
}

/** `GRAMMAR.md` §1: só `\"` e `\\` são escapes. */
function unquote(token: IToken): string {
  return token.image.slice(1, -1).replace(/\\(["\\])/g, "$1");
}

export class OddsParser extends EmbeddedActionsParser {
  readonly diagnostics: Diagnostic[] = [];
  /** Declarações descartadas pela recuperação da `GRAMMAR.md` §5.1 — §1.4 exige
   *  que sobrevivam como inválidas em vez de sumirem. */
  readonly discarded: { contexts: ContextNode[]; subdomains: SubdomainNode[] } = {
    contexts: [],
    subdomains: [],
  };

  constructor() {
    super(t.allTokens, { recoveryEnabled: false });
    this.performSelfAnalysis();
  }

  reset(): void {
    super.reset();
    this.diagnostics.length = 0;
    this.discarded.contexts.length = 0;
    this.discarded.subdomains.length = 0;
  }

  /** O diagnóstico é construído por thunk: na fase de gravação da gramática os
   *  tokens são dummies, e avaliar `span`/`data` ali produziria lixo (ou uma
   *  exceção). `ACTION` não roda durante a gravação — é o que torna isso seguro. */
  private report(build: () => Diagnostic): void {
    this.ACTION(() => {
      this.diagnostics.push(build());
    });
  }

  // --- program ------------------------------------------------------------

  public program = this.RULE("program", (): ProgramNode => {
    const domains: DomainNode[] = [];
    let span: SourceSpan | undefined;
    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            const domain = this.SUBRULE(this.domainDecl);
            this.ACTION(() => {
              domains.push(domain);
              span = span ? spanBetween(span, domain.span) : domain.span;
            });
          },
        },
        {
          // `GRAMMAR.md` §5.1: subdomain fora de qualquer domain. Descartado da
          // árvore, registrado como diagnóstico, parsing continua.
          ALT: () => {
            const orphan = this.SUBRULE(this.subdomainDecl);
            this.ACTION(() => this.discarded.subdomains.push(orphan));
            this.report(() => ({
              severity: "error",
              code: "ORPHAN_SUBDOMAIN",
              span: orphan.headerSpan,
              data: { subdomain: orphan.name },
            }));
          },
        },
      ]);
    });
    return {
      kind: "Program",
      domains,
      suppressions: [],
      discarded: { contexts: [], subdomains: [] },
      span: span ?? { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } },
    };
  });

  // --- domain -------------------------------------------------------------

  private domainDecl = this.RULE("domainDecl", (): DomainNode => {
    const open = this.CONSUME(t.reservedTokens.domain);
    const name = this.CONSUME(t.Identifier);
    this.CONSUME(t.LBrace);
    let title: string | undefined;
    this.OPTION(() => { title = this.SUBRULE(this.titleDecl); });

    const subdomains: SubdomainNode[] = [];
    let external: ExternalBlockNode | undefined;
    let mapping: MappingNode | undefined;

    // A ordem da `GRAMMAR.md` §2 e **fixa** — subdomains, depois `external`,
    // depois `mapping` — e os dois ultimos sao opcionais e **no maximo um por
    // domain**. Um `MANY`/`OR` unico sobre os tres aceitaria qualquer ordem e
    // repeticao, com a segunda ocorrencia sobrescrevendo a primeira em
    // silencio: arquivo invalido parseando como valido, e bloco perdido da AST.
    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            const sub = this.SUBRULE(this.subdomainDecl);
            this.ACTION(() => subdomains.push(sub));
          },
        },
        {
          // `GRAMMAR.md` §5.1: context solto direto no domain. Unica tolerancia
          // desta producao, e ela fica na posicao onde o erro de fato acontece
          // — quem esquece o `subdomain` escreve o `context` entre os outros.
          ALT: () => {
            const orphan = this.SUBRULE(this.contextDecl);
            this.ACTION(() => this.discarded.contexts.push(orphan));
            this.report(() => ({
              severity: "error",
              code: "ORPHAN_CONTEXT",
              span: orphan.span,
              data: { context: orphan.name },
            }));
          },
        },
      ]);
    });
    this.OPTION2(() => {
      const block = this.SUBRULE(this.externalDecl);
      this.ACTION(() => { external = block; });
    });
    this.OPTION3(() => {
      const map = this.SUBRULE(this.mappingDecl);
      this.ACTION(() => { mapping = map; });
    });

    const close = this.CONSUME(t.RBrace);
    return {
      kind: "Domain",
      name: name.image,
      ...(title === undefined ? {} : { title }),
      subdomains,
      ...(external === undefined ? {} : { external }),
      ...(mapping === undefined ? {} : { mapping }),
      headerSpan: spanBetween(spanOf(open), spanOf(name)),
      span: spanBetween(spanOf(open), spanOf(close)),
    };
  });

  private titleDecl = this.RULE("titleDecl", (): string => {
    this.CONSUME(t.reservedTokens.title);
    this.CONSUME(t.Colon);
    const value = this.CONSUME(t.StringLiteral);
    return this.ACTION(() => unquote(value));
  });

  // --- subdomain ----------------------------------------------------------

  private subdomainDecl = this.RULE("subdomainDecl", (): SubdomainNode => {
    const open = this.CONSUME(t.reservedTokens.subdomain);
    // `GRAMMAR.md` §2: subdomain_type é identifier LIVRE, não enum fechado —
    // é o que torna INVALID_SUBDOMAIN_TYPE alcançável pelo Visitor. Os três
    // valores válidos são palavras reservadas e por isso vêm como tokens
    // próprios; qualquer outro nome chega como Identifier.
    const type = this.OR([
      { ALT: () => this.CONSUME(t.reservedTokens.core) },
      { ALT: () => this.CONSUME(t.reservedTokens.supporting) },
      { ALT: () => this.CONSUME(t.reservedTokens.generic) },
      { ALT: () => this.CONSUME1(t.Identifier) },
    ]);
    const name = this.CONSUME2(t.Identifier);
    this.CONSUME(t.LBrace);
    let title: string | undefined;
    this.OPTION(() => { title = this.SUBRULE(this.titleDecl); });
    // `GRAMMAR.md` §2 (`ADR-0008`): description e owner, livres de ordem entre
    // si, depois do title e antes do primeiro context.
    const properties: { description?: string; owner?: string } = {};
    this.MANY(() => {
      const property = this.SUBRULE(this.subdomainPropertyDecl);
      this.ACTION(() => { properties[property[0]] = property[1]; });
    });
    const contexts: ContextNode[] = [];
    this.MANY2(() => {
      const context = this.SUBRULE(this.contextDecl);
      this.ACTION(() => contexts.push(context));
    });
    const close = this.CONSUME(t.RBrace);
    return {
      kind: "Subdomain",
      subdomainType: type.image,
      subdomainTypeSpan: spanOf(type),
      name: name.image,
      ...(title === undefined ? {} : { title }),
      ...properties,
      contexts,
      headerSpan: spanBetween(spanOf(open), spanOf(name)),
      span: spanBetween(spanOf(open), spanOf(close)),
    };
  });

  private subdomainPropertyDecl = this.RULE("subdomainPropertyDecl", (): ["description" | "owner", string] => {
    const key = this.OR([
      { ALT: () => this.CONSUME(t.reservedTokens.description) },
      { ALT: () => this.CONSUME(t.reservedTokens.owner) },
    ]);
    this.CONSUME(t.Colon);
    const value = this.CONSUME(t.StringLiteral);
    return this.ACTION(() => [key.image as "description" | "owner", unquote(value)]);
  });

  private externalDecl = this.RULE("externalDecl", (): ExternalBlockNode => {
    const open = this.CONSUME(t.reservedTokens.external);
    this.CONSUME(t.LBrace);
    const contexts: ContextNode[] = [];
    this.MANY(() => {
      const context = this.SUBRULE(this.contextDecl);
      this.ACTION(() => contexts.push(context));
    });
    const close = this.CONSUME(t.RBrace);
    return {
      kind: "ExternalBlock",
      contexts,
      span: spanBetween(spanOf(open), spanOf(close)),
    };
  });

  // --- context ------------------------------------------------------------

  private contextDecl = this.RULE("contextDecl", (): ContextNode => {
    const open = this.CONSUME(t.reservedTokens.context);
    const name = this.CONSUME(t.Identifier);
    let title: string | undefined;
    let properties: ContextProperties | undefined;
    let end: SourceSpan | undefined;
    this.OPTION(() => {
      this.CONSUME(t.LBrace);
      this.OPTION2(() => { title = this.SUBRULE(this.titleDecl); });
      const collected: Record<string, unknown> = {};
      this.MANY(() => {
        const property = this.SUBRULE(this.propertyDecl);
        this.ACTION(() => { collected[property[0]] = property[1]; });
      });
      const close = this.CONSUME(t.RBrace);
      this.ACTION(() => {
        // `AST_SCHEMA.md` §3: properties é undefined quando não há bloco, mas um
        // bloco vazio produz um objeto vazio — a distinção é intencional.
        properties = collected as ContextProperties;
        end = spanOf(close);
      });
    });
    return {
      kind: "Context",
      name: name.image,
      nameSpan: spanOf(name),
      ...(title === undefined ? {} : { title }),
      ...(properties === undefined ? {} : { properties }),
      span: spanBetween(spanOf(open), end ?? spanOf(name)),
    };
  });

  private propertyDecl = this.RULE("propertyDecl", (): [string, unknown] => {
    const key = this.OR([
      { ALT: () => this.CONSUME(t.reservedTokens.type) },
      { ALT: () => this.CONSUME(t.reservedTokens.description) },
      { ALT: () => this.CONSUME(t.reservedTokens.responsibilities) },
      { ALT: () => this.CONSUME(t.reservedTokens.maturity) },
      { ALT: () => this.CONSUME(t.reservedTokens.team) },
      { ALT: () => this.CONSUME(t.reservedTokens.technology) },
    ]);
    this.CONSUME(t.Colon);
    const value = this.OR2([
      {
        ALT: () => {
          const literal = this.CONSUME(t.StringLiteral);
          return this.ACTION(() => unquote(literal));
        },
      },
      { ALT: () => this.SUBRULE(this.stringList) },
      { ALT: () => this.SUBRULE(this.maturityValue) },
    ]);
    return this.ACTION(() => [key.image, value] as [string, unknown]);
  });

  private stringList = this.RULE("stringList", (): string[] => {
    const values: string[] = [];
    this.CONSUME(t.LBracket);
    // `GRAMMAR.md` §2: vírgula sobrando no fim é erro sintático explícito.
    this.AT_LEAST_ONE_SEP({
      SEP: t.Comma,
      DEF: () => {
        const item = this.CONSUME(t.StringLiteral);
        this.ACTION(() => values.push(unquote(item)));
      },
    });
    this.CONSUME(t.RBracket);
    return values;
  });

  private maturityValue = this.RULE("maturityValue", (): MaturityValue => {
    // Enum fechado, sem aspas: `maturity: "mature"` é erro sintático.
    const token = this.OR(
      MATURITY_VALUES.map((value) => ({
        ALT: () => this.CONSUME(t.reservedTokens[value]),
      })),
    );
    return this.ACTION(() => token.image as MaturityValue);
  });

  // --- mapping ------------------------------------------------------------

  private mappingDecl = this.RULE("mappingDecl", (): MappingNode => {
    const open = this.CONSUME(t.reservedTokens.mapping);
    this.CONSUME(t.LBrace);
    const relationships: RelationshipNode[] = [];
    this.MANY(() => {
      const relationship = this.SUBRULE(this.relationshipDecl);
      this.ACTION(() => relationships.push(relationship));
    });
    const close = this.CONSUME(t.RBrace);
    return {
      kind: "Mapping",
      relationships,
      keywordSpan: spanOf(open),
      span: spanBetween(spanOf(open), spanOf(close)),
    };
  });

  private relationshipDecl = this.RULE("relationshipDecl", (): RelationshipNode => {
    const left = this.CONSUME(t.Identifier);
    let leftTags: TaggedPattern[] = [];
    let leftTagGroupSpan: SourceSpan | undefined;
    this.OPTION(() => {
      const group = this.SUBRULE(this.tagGroup);
      this.ACTION(() => { leftTags = group.tags; leftTagGroupSpan = group.span; });
    });
    const connector = this.OR([
      { ALT: () => this.CONSUME(t.UpstreamConnector) },
      { ALT: () => this.CONSUME(t.DownstreamConnector) },
      { ALT: () => this.CONSUME(t.MutualConnector) },
      { ALT: () => this.CONSUME(t.SeparateConnector) },
    ]);
    let rightTags: TaggedPattern[] = [];
    let rightTagGroupSpan: SourceSpan | undefined;
    this.OPTION2(() => {
      const group = this.SUBRULE2(this.tagGroup);
      this.ACTION(() => { rightTags = group.tags; rightTagGroupSpan = group.span; });
    });
    const right = this.CONSUME2(t.Identifier);
    return {
      kind: "Relationship",
      left: left.image,
      leftSpan: spanOf(left),
      leftTags,
      ...(leftTagGroupSpan === undefined ? {} : { leftTagGroupSpan }),
      connector: connector.image as RelationshipNode["connector"],
      connectorSpan: spanOf(connector),
      rightTags,
      ...(rightTagGroupSpan === undefined ? {} : { rightTagGroupSpan }),
      right: right.image,
      rightSpan: spanOf(right),
      span: spanBetween(spanOf(left), spanOf(right)),
    };
  });

  private tagGroup = this.RULE("tagGroup", (): { tags: TaggedPattern[]; span: SourceSpan } => {
    const tags: TaggedPattern[] = [];
    const open = this.CONSUME(t.LBracket);
    this.AT_LEAST_ONE_SEP({
      SEP: t.Comma,
      DEF: () => {
        const token = this.CONSUME(t.Identifier);
        this.ACTION(() => {
          const image = token.image;
          if (image === REMOVED_TAG) {
            // `GRAMMAR.md` §5.1 + `RULES-EN.md` §6: construção removida ganha
            // diagnóstico dedicado e recuperação — a tag é descartada, a
            // relação sobrevive e é avaliada normalmente pelas fases seguintes.
            this.diagnostics.push({
              severity: "error",
              code: "REMOVED_CONSTRUCT",
              span: spanOf(token),
              data: { construct: `[${REMOVED_TAG}]`, removedIn: "0.1.0", replacement: "-x-" },
            });
            return;
          }
          if ((PATTERN_TAGS as readonly string[]).includes(image)) {
            tags.push({ tag: image as PatternTag, span: spanOf(token) });
            return;
          }
          // `GRAMMAR.md` §3: `tag` e um conjunto fechado de nove literais, entao
          // um nome desconhecido e erro sintatico puro. O template de
          // `SYNTAX_ERROR` interpola `found` **e** `expected`; emitir so o
          // primeiro deixaria `{expected}` cru na frase renderizada.
          this.diagnostics.push({
            severity: "error",
            code: "SYNTAX_ERROR",
            span: spanOf(token),
            data: { found: image, expected: PATTERN_TAGS.join(", ") },
          });
        });
      },
    });
    const close = this.CONSUME(t.RBracket);
    return { tags, span: spanBetween(spanOf(open), spanOf(close)) };
  });
}

/** `AST_SCHEMA.md` §2.1: a diretiva é reconhecida pelo prefixo; o interior nunca
 *  é validado aqui — `MALFORMED_SUPPRESSION` é fase 6. */
export function parseSuppressions(directives: IToken[]): SuppressionDirective[] {
  return directives.map((token) => {
    const body = token.image.replace(/^\/\/[ \t]*odds-disable-next-line/, "").trim();
    const separator = body.indexOf(":");
    const code = (separator === -1 ? body : body.slice(0, separator)).trim();
    const justification = separator === -1 ? "" : body.slice(separator + 1).trim();
    return { code, justification, targetLine: token.startLine! + 1, span: spanOf(token) };
  });
}
