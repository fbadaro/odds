/**
 * AST da linguagem ODDS — derivada 1:1 de `AST_SCHEMA.md` §2–§4.
 *
 * Duas coisas que o esquema decide e que é fácil desfazer sem perceber:
 *
 * - **Contexto externo usa o mesmo `ContextNode`**, sem tipo próprio e sem
 *   flag. A externalidade é dada pela **posição na árvore** — estar dentro de
 *   `ExternalBlockNode` —, que é a representação com uma fonte de verdade só.
 *   Quem consome isso é `SymbolTableEntry.isExternal`, derivado uma única vez.
 * - **`ContextNode.properties` é `undefined`**, não um objeto vazio, quando o
 *   `context` foi declarado sem bloco. É o que deixa o visualizador distinguir
 *   "sem metadados" de "metadados declarados e todos opcionais".
 */

import type { SourceSpan } from "./diagnostics.js";

export interface AstNode {
  readonly span: SourceSpan;
}

/** `AST_SCHEMA.md` §2.1. O interior nunca é validado pelo parser (fase 6 valida). */
export interface SuppressionDirective {
  /** Texto bruto do code nomeado. PODE não existir no catálogo. */
  readonly code: string;
  /** Texto após os dois-pontos. String vazia quando ausente. */
  readonly justification: string;
  /** Sempre a linha imediatamente seguinte à da diretiva. */
  readonly targetLine: number;
  /** Span da diretiva em si, do `//` ao fim da linha. */
  readonly span: SourceSpan;
}

export interface ProgramNode extends AstNode {
  readonly kind: "Program";
  readonly domains: DomainNode[];
  readonly suppressions: SuppressionDirective[];
}

export interface DomainNode extends AstNode {
  readonly kind: "Domain";
  readonly name: string;
  readonly title?: string;
  readonly subdomains: SubdomainNode[];
  readonly external?: ExternalBlockNode;
  readonly mapping?: MappingNode;
}

export type SubdomainType = "core" | "supporting" | "generic";

export interface SubdomainNode extends AstNode {
  readonly kind: "Subdomain";
  /** Valor **bruto**: a gramática aceita qualquer identifier aqui, para que
   *  `INVALID_SUBDOMAIN_TYPE` seja alcançável pelo Visitor. Não trave o parser. */
  readonly subdomainType: string;
  readonly subdomainTypeSpan: SourceSpan;
  readonly name: string;
  readonly title?: string;
  readonly contexts: ContextNode[];
  /** Só o cabeçalho da declaração (`subdomain core Vendas`), sem o bloco.
   *  `TEST_SUITE.md` §4 ancora erro de declaração no trecho da declaração, e um
   *  bloco de três linhas sublinhado inteiro é pior do que o cabeçalho. */
  readonly headerSpan: SourceSpan;
}

/** Bloco `external { }`, único e anônimo. */
export interface ExternalBlockNode extends AstNode {
  readonly kind: "ExternalBlock";
  readonly contexts: ContextNode[];
}

export type MaturityValue = "experimental" | "growing" | "mature" | "legacy";

export interface ContextProperties {
  readonly type?: string;
  readonly description?: string;
  readonly responsibilities?: string[];
  readonly maturity?: MaturityValue;
  readonly team?: string;
  readonly technology?: string;
}

export interface ContextNode extends AstNode {
  readonly kind: "Context";
  readonly name: string;
  readonly nameSpan: SourceSpan;
  readonly title?: string;
  readonly properties?: ContextProperties;
}

export type ConnectorType = "-->" | "<--" | "<->" | "-x-";

export type PatternTag = "OHS" | "PL" | "ACL" | "CF" | "SK" | "C" | "S" | "P" | "BBM";

export const PATTERN_TAGS: readonly PatternTag[] = [
  "OHS", "PL", "ACL", "CF", "SK", "C", "S", "P", "BBM",
];

export interface MappingNode extends AstNode {
  readonly kind: "Mapping";
  readonly relationships: RelationshipNode[];
}

/** Uma tag com o span dela — as regras de posição reportam sobre a tag, não a linha. */
export interface TaggedPattern {
  readonly tag: PatternTag;
  readonly span: SourceSpan;
}

export interface RelationshipNode extends AstNode {
  readonly kind: "Relationship";
  readonly left: string;
  readonly leftSpan: SourceSpan;
  readonly leftTags: TaggedPattern[];
  readonly connector: ConnectorType;
  readonly connectorSpan: SourceSpan;
  readonly rightTags: TaggedPattern[];
  readonly right: string;
  readonly rightSpan: SourceSpan;
}
