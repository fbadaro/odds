/**
 * Tabela de símbolos — `AST_SCHEMA.md` §5. Não faz parte da AST.
 *
 * Duas coisas que ela existe para sustentar:
 *
 * - **`isExternal` é derivado da posição na árvore**, uma única vez. Contexto
 *   externo usa o mesmo `ContextNode` e não tem flag própria; a externalidade
 *   é estar dentro do `ExternalBlockNode`.
 * - **Declaração descartada entra marcada como inválida.** É o que mata a
 *   cascata `ORPHAN_CONTEXT` → `PHANTOM_REFERENCE` (`RULES-EN.md` §3.1).
 */

import type { ContextNode, ProgramNode, SubdomainNode } from "./ast.js";

export interface SymbolTableEntry {
  readonly contextName: string;
  readonly isExternal: boolean;
  readonly subdomainName?: string;
  /** Valor bruto; `INVALID_SUBDOMAIN_TYPE` é quem julga. */
  readonly subdomainType?: string;
  /** `false` para declaração descartada pela recuperação ou invalidada por erro. */
  valid: boolean;
  readonly node: ContextNode;
}

/** Chave = nome do context. Mais de uma entrada indica `DUPLICATE_CONTEXT`. */
export type SymbolTable = Map<string, SymbolTableEntry[]>;

function add(table: SymbolTable, entry: SymbolTableEntry): void {
  const existing = table.get(entry.contextName);
  if (existing) existing.push(entry);
  else table.set(entry.contextName, [entry]);
}

export function buildSymbolTable(program: ProgramNode): SymbolTable {
  const table: SymbolTable = new Map();

  const addSubdomainContexts = (subdomain: SubdomainNode, valid: boolean) => {
    for (const context of subdomain.contexts) {
      add(table, {
        contextName: context.name,
        isExternal: false,
        subdomainName: subdomain.name,
        subdomainType: subdomain.subdomainType,
        valid,
        node: context,
      });
    }
  };

  for (const domain of program.domains) {
    for (const subdomain of domain.subdomains) addSubdomainContexts(subdomain, true);
    for (const context of domain.external?.contexts ?? []) {
      // Namespace único: interno e externo compartilham chave, porque `mapping`
      // referencia por identificador nu, sem qualificação de escopo.
      add(table, { contextName: context.name, isExternal: true, valid: true, node: context });
    }
  }

  // Descartados: presentes e inválidos. Nunca fantasmas.
  for (const context of program.discarded.contexts) {
    add(table, { contextName: context.name, isExternal: false, valid: false, node: context });
  }
  for (const subdomain of program.discarded.subdomains) addSubdomainContexts(subdomain, false);

  return table;
}

/** Um nome declarado — mesmo que inválido — não é referência fantasma. */
export function isDeclared(table: SymbolTable, name: string): boolean {
  return table.has(name);
}

/** A entrada que vale para julgamento: a primeira válida, se houver. */
export function resolve(table: SymbolTable, name: string): SymbolTableEntry | undefined {
  const entries = table.get(name);
  return entries?.find((e) => e.valid) ?? entries?.[0];
}
