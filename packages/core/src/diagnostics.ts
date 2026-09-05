/**
 * Contrato de diagnósticos — derivado 1:1 de `AST_SCHEMA.md` §1.
 *
 * Duas invariantes deste arquivo, ambas normativas:
 *
 * 1. Um `Diagnostic` carrega `severity` + `code` + `span` + `data`, e **nunca**
 *    `message`. A frase é renderizada em `@odds/messages`, a partir do
 *    `MESSAGES.md`. Ver ADR-0004: o core não depende daquele pacote, então a
 *    proibição é estrutural e não depende de disciplina.
 * 2. `data` é `Record<string, string>` de **valores**, não de prosa: sem locale,
 *    sem emoji, sem palavra de severidade. `MESSAGES.md` §1.1 é quem manda.
 */

/**
 * Posição no arquivo-fonte, **1-indexed**.
 *
 * `column` é contada em **unidades de código UTF-16** — não em bytes e não em
 * graphemes. A unidade é normativa (`AST_SCHEMA.md` §1) porque a gramática
 * aceita identificadores acentuados: `descrição` tem contagens diferentes em
 * UTF-8 e UTF-16, e sem a unidade fixada dois parsers conformes produziriam
 * spans diferentes para o mesmo arquivo.
 */
export interface Position {
  readonly line: number;
  readonly column: number;
}

/** Intervalo no arquivo-fonte. `end` é **exclusivo**. */
export interface SourceSpan {
  readonly start: Position;
  readonly end: Position;
}

/**
 * As três severidades. Nenhuma delas bloqueia a renderização: o diagrama
 * degrada por elemento (`RULES-EN.md` §5). Severidade é um campo, nunca parte
 * do nome do code.
 */
export type Severity = "error" | "warning" | "info";

/**
 * Catálogo normativo de codes — `AST_SCHEMA.md` §1.3, 35 no total.
 *
 * A ordem aqui é a da tabela daquele documento e não tem significado: a ordem
 * de emissão é outra coisa, fixada em `RULES-EN.md` §3.3.
 */
export type DiagnosticCode =
  | "SYNTAX_ERROR"
  | "ORPHAN_CONTEXT"
  | "ORPHAN_SUBDOMAIN"
  | "REMOVED_CONSTRUCT"
  | "INVALID_DOMAIN_CARDINALITY"
  | "INVALID_SUBDOMAIN_TYPE"
  | "DUPLICATE_CONTEXT"
  | "DUPLICATE_SUBDOMAIN"
  | "PHANTOM_REFERENCE"
  | "SELF_RELATIONSHIP"
  | "DUPLICATE_RELATIONSHIP"
  | "EXTERNAL_ONLY_RELATIONSHIP"
  | "UPSTREAM_ONLY_TAG_MISPLACED"
  | "DOWNSTREAM_ONLY_TAG_MISPLACED"
  | "MUTUAL_TAG_ON_DIRECTIONAL"
  | "POSITIONAL_TAG_ON_MUTUAL"
  | "INCOMPLETE_MUTUAL_TAG"
  | "MUTUAL_TAG_WITH_EXTERNAL"
  | "SEPARATION_CONFLICT"
  | "ROLE_CONFLICT"
  | "PROTECTION_CONFLICT"
  | "CONFORMIST_CORE"
  | "GENERIC_WITHOUT_OHS"
  | "CORE_UPSTREAM_OF_GENERIC"
  | "CORE_IN_SHARED_KERNEL"
  | "DOMAIN_WITHOUT_CORE"
  | "INCONSISTENT_BBM"
  | "INCOMPLETE_CUSTOMER_SUPPLIER"
  | "EXCESSIVE_SHARED_KERNEL"
  | "UNDOCUMENTED_CONTRACT"
  | "UNMAPPED_CONTEXT"
  | "EMPTY_SUBDOMAIN"
  | "PL_WITHOUT_OHS"
  | "MALFORMED_SUPPRESSION"
  | "UNUSED_SUPPRESSION";

/** Um diagnóstico. Note a ausência deliberada de `message`. */
export interface Diagnostic {
  readonly severity: Severity;
  readonly code: DiagnosticCode;
  readonly span: SourceSpan;
  readonly data: Readonly<Record<string, string>>;
}
