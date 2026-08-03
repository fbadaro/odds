# AST_SCHEMA: Open Domain Driven Specification (ODDS)

## 0. Propósito deste documento

Este arquivo é o **contrato de dados** entre as três camadas do sistema: Parser → Validador (Visitor) → Visualizador. Define, em TypeScript, a forma exata da Árvore Sintática Abstrata (AST) que o parser produz a partir de um arquivo `.odds` válido sintaticamente (ver `GRAMMAR.md`), e que o Visitor percorre para aplicar as regras semânticas (ver `RULES-EN.md`).

Esta AST corresponde 1:1 à gramática **GRAMMAR.md v0.1.9**. Qualquer mudança na gramática (nova produção, propriedade nova, etc.) deve ser refletida aqui antes de qualquer implementação — os dois arquivos devem andar sempre sincronizados, junto com a suíte de golden files (ver `TEST_SUITE.md`).

**Convenção:** cada nó carrega um campo `span` com a posição de início/fim no arquivo-fonte. Isso é o que viabiliza a navegação clique-a-clique do painel de validação (PRD §5.2 / GH-002) — tanto para erros sintáticos quanto semânticos.

---

## 1. Tipos de suporte (posição e diagnósticos)

```typescript
/** Posição de um caractere no arquivo-fonte (1-indexed, como a maioria dos editores). */
interface Position {
  line: number;
  column: number;
}

/** Um intervalo no arquivo-fonte, do início ao fim de um nó ou token. */
interface SourceSpan {
  start: Position;
  end: Position;
}

/** Toda estrutura da AST carrega sua posição de origem. */
interface AstNode {
  span: SourceSpan;
}
```

```typescript
type DiagnosticSeverity = "error" | "warning";

/**
 * Um problema reportado ao usuário — seja um erro de parsing (sintático)
 * ou um resultado da validação semântica (RULES.md).
 * `code` é um identificador estável, reaproveitado pelos golden files
 * e independente da mensagem textual (que pode ser reformulada sem quebrar testes).
 */
interface Diagnostic {
  severity: DiagnosticSeverity;
  code: DiagnosticCode;
  message: string;
  span: SourceSpan;
}

/**
 * Um erro sintático interrompe totalmente a geração da AST (ver GRAMMAR.md §5).
 * Diagnostics com este code não têm uma AST válida associada.
 */
type SyntaxDiagnosticCode = "SYNTAX_ERROR";

/**
 * Códigos de erro/warning semânticos, um por regra em RULES-EN.md.
 * Mantidos em sincronia manual com as seções 1 e 2 daquele arquivo.
 */
type SemanticDiagnosticCode =
  // Erros Críticos (Seção 1 do RULES.md)
  | "ORPHAN_CONTEXT"
  | "ORPHAN_SUBDOMAIN"
  | "PHANTOM_REFERENCE"
  | "DUPLICATE_CONTEXT"
  | "INVALID_DOMAIN_CARDINALITY"
  | "INVALID_SUBDOMAIN_TYPE"
  | "UPSTREAM_ONLY_TAG_MISPLACED"     // OHS, PL, S no lado Downstream
  | "DOWNSTREAM_ONLY_TAG_MISPLACED"   // ACL, CF, C no lado Upstream
  | "SEPARATION_CONFLICT"             // -x- ou [SW] com tags de integração
  | "ROLE_CONFLICT"                   // [C] e [S] no mesmo lado
  | "PROTECTION_CONFLICT"             // [CF] e [ACL] no mesmo lado
  // Avisos de Lint (Seção 2 do RULES.md)
  | "CONFORMIST_CORE_WARNING"
  | "GENERIC_WITHOUT_OHS_WARNING"
  | "EXCESSIVE_SHARED_KERNEL_WARNING"
  | "UNDOCUMENTED_CONTRACT_WARNING";

type DiagnosticCode = SyntaxDiagnosticCode | SemanticDiagnosticCode;
```

> 📝 Cada `SemanticDiagnosticCode` deve ter pelo menos um golden file de teste associado (ver artefato pendente "suíte de testes golden files"). Esta lista é a fonte de verdade de quais regras do `RULES.md` já têm um `code` estável atribuído — se uma regra nova for adicionada ao `RULES.md`, adicione o code correspondente aqui primeiro.

> ⚠️ **Nota especial sobre `ORPHAN_CONTEXT` e `ORPHAN_SUBDOMAIN`:** apesar de agrupados aqui junto aos demais `SemanticDiagnosticCode` (por afinidade temática com `RULES.md` §1.A), esses dois codes **não** são produzidos pelo Visitor percorrendo uma AST já construída. Eles são emitidos **pelo parser**, durante recuperação de erro (ver `GRAMMAR.md` §5.1) — a gramática continua estrita (um `context` só é sintaticamente válido dentro de um `subdomain`, e vice-versa para `subdomain`/`domain`), então um `context`/`subdomain` deslocado nunca vira um nó real na AST. Diferente de `SYNTAX_ERROR`, porém, esses dois diagnósticos **não interrompem** a geração da AST para o restante do arquivo — o parser descarta a declaração malformada e continua.

---

## 2. Nó raiz

```typescript
/**
 * Nó raiz do parsing de um arquivo .odds.
 * `domains` é um array — não um DomainNode único — porque a cardinalidade
 * "exatamente um domain" é uma regra SEMÂNTICA (INVALID_DOMAIN_CARDINALITY),
 * não sintática. O parser aceita e representa fielmente 0, 1 ou N domains;
 * é o Visitor quem rejeita qualquer valor diferente de 1.
 */
interface ProgramNode extends AstNode {
  kind: "Program";
  domains: DomainNode[];
}
```

---

## 3. Problem Space (domain / subdomain / context)

```typescript
interface DomainNode extends AstNode {
  kind: "Domain";
  name: string;              // identifier
  title?: string;            // title_decl, se declarado
  subdomains: SubdomainNode[];
  mapping?: MappingNode;     // ausente se o domain não declarar relacionamentos
}

type SubdomainType = "core" | "supporting" | "generic";

interface SubdomainNode extends AstNode {
  kind: "Subdomain";
  /**
   * Valor bruto do identifier lido pelo parser (ver GRAMMAR.md v0.1.8: subdomain_type = identifier).
   * PODE ser inválido — o parser não valida contra SubdomainType, só a AST representa o que foi escrito.
   * É o Visitor quem valida este campo contra o union SubdomainType e emite INVALID_SUBDOMAIN_TYPE se não bater.
   */
  subdomainType: string;
  name: string;
  title?: string;
  contexts: ContextNode[];
}

type MaturityValue = "experimental" | "growing" | "mature" | "legacy";

/** Corresponde ao context_block da gramática — todas as chaves são opcionais. */
interface ContextProperties {
  type?: string;
  description?: string;
  responsibilities?: string[];
  maturity?: MaturityValue;
  team?: string;
  technology?: string;
}

interface ContextNode extends AstNode {
  kind: "Context";
  name: string;
  title?: string;
  properties?: ContextProperties;  // ausente se context_block não foi declarado
}
```

**Notas de implementação:**
- `DomainNode.name`, `SubdomainNode.name` e `ContextNode.name` são os identificadores técnicos (usados em `mapping` via `context_ref`) — **não** confundir com `title`, que é só um rótulo de exibição sem função de referência.
- `ContextNode.properties` é `undefined` (não um objeto vazio) quando o `context` foi declarado sem bloco (`context Checkout`, sem `{ }`). Isso permite ao visualizador diferenciar "sem metadados" de "metadados declarados mas todos opcionais".
- A checagem `INVALID_SUBDOMAIN_TYPE` (seção RULES.md §1.B) é responsabilidade exclusiva do Visitor. Desde `GRAMMAR.md` v0.1.8, `subdomain_type` é um `identifier` livre na gramática (não mais um enum fechado de literais) — precisamente para que este code seja alcançável na prática, e não um caminho morto nunca disparado por um parser correto.

---

## 4. Solution Space (mapping / relationships)

```typescript
type ConnectorType = "-->" | "<--" | "<->" | "-x-";

type PatternTag = "OHS" | "PL" | "ACL" | "CF" | "SK" | "C" | "S" | "P" | "SW" | "BBM";

interface MappingNode extends AstNode {
  kind: "Mapping";
  relationships: RelationshipNode[];
}

interface RelationshipNode extends AstNode {
  kind: "Relationship";
  left: string;             // context_ref do lado esquerdo (identifier)
  leftTags: PatternTag[];   // [] se nenhuma tag foi declarada nesse lado
  connector: ConnectorType;
  rightTags: PatternTag[];
  right: string;            // context_ref do lado direito
}
```

**Notas de implementação:**
- `leftTags`/`rightTags` são sempre arrays (possivelmente vazios), nunca `undefined` — simplifica os validadores de `RULES.md` (`UPSTREAM_ONLY_TAG_MISPLACED` etc.), que podem sempre iterar sem checar nulidade primeiro.
- `left` e `right` são apenas o **nome** do contexto referenciado (string), não uma referência direta ao `ContextNode`. A resolução do nome para o nó real (e a checagem `PHANTOM_REFERENCE`/`DUPLICATE_CONTEXT`) é responsabilidade do Visitor, usando a tabela de símbolos construída no Passo 1 (ver `RULES.md`, "Resumo para a Implementação do AST"). A AST em si não pré-resolve essas referências.

---

## 5. Tabela de símbolos (estrutura auxiliar do Visitor)

Não faz parte da AST — é uma estrutura intermediária que o Visitor constrói ao percorrer a árvore (Passo 1 do `RULES.md`), usada para detectar `PHANTOM_REFERENCE` e `DUPLICATE_CONTEXT` antes de processar o `mapping`.

```typescript
interface SymbolTableEntry {
  contextName: string;
  subdomainName: string;
  subdomainType: string;       // valor bruto — ver nota em SubdomainNode.subdomainType
  node: ContextNode;           // referência ao nó original, para reportar span em erros
}

/** Chave = nome do context. Uma chave com mais de uma entrada indica DUPLICATE_CONTEXT. */
type SymbolTable = Map<string, SymbolTableEntry[]>;
```

---

## 6. Exemplo anotado (correspondência texto → AST)

Para o trecho abaixo (mesmo exemplo usado em `GRAMMAR.md` §4, reduzido):

```odds
domain ECommercePlatform {
  title: "E-Commerce Platform"

  subdomain generic Payments {
    context PaymentGateway {
      title: "Gateway de Pagamentos Stripe"
      maturity: mature
    }
  }

  mapping {
    Checkout --> [OHS, PL] PaymentGateway
  }
}
```

A AST resultante (posições omitidas por brevidade):

```typescript
{
  kind: "Program",
  domains: [
    {
      kind: "Domain",
      name: "ECommercePlatform",
      title: "E-Commerce Platform",
      subdomains: [
        {
          kind: "Subdomain",
          subdomainType: "generic",
          name: "Payments",
          contexts: [
            {
              kind: "Context",
              name: "PaymentGateway",
              title: "Gateway de Pagamentos Stripe",
              properties: { maturity: "mature" }
            }
          ]
        }
      ],
      mapping: {
        kind: "Mapping",
        relationships: [
          {
            kind: "Relationship",
            left: "Checkout",
            leftTags: [],
            connector: "-->",
            rightTags: ["OHS", "PL"],
            right: "PaymentGateway"
          }
        ]
      }
    }
  ]
}
```

Note que este exemplo específico **dispararia** `PHANTOM_REFERENCE` num Visitor real (`Checkout` nunca foi declarado em nenhum `subdomain`) — deixado assim de propósito, como lembrete de que a AST em si não valida nada; ela só representa fielmente o que foi escrito.

---

## 7. Evolução futura (Fase 4 — Tactical Design)

Assim como `GRAMMAR.md` §6, este schema precisará ganhar novos tipos de nó quando a Fase 4 começar — não implementar antes disso:

```typescript
// RASCUNHO — não implementar antes da Fase 4
interface AggregateNode extends AstNode {
  kind: "Aggregate";
  name: string;
  entities: EntityNode[];
  valueObjects: ValueObjectNode[];
}
interface EntityNode extends AstNode { kind: "Entity"; name: string; }
interface ValueObjectNode extends AstNode { kind: "ValueObject"; name: string; }

// ContextNode ganharia:
// tactical?: AggregateNode[];
```

---

## Changelog

- **v0.1.0** — versão inicial, derivada de `GRAMMAR.md` v0.1.7 (todas as pendências da gramática já resolvidas nesse ponto). Define `ProgramNode`, `DomainNode`, `SubdomainNode`, `ContextNode`, `MappingNode`, `RelationshipNode`, a tabela de `DiagnosticCode` sincronizada com `RULES.md`, e a estrutura auxiliar `SymbolTable` usada pelo Visitor.
- **v0.1.1** — sincronizado com `GRAMMAR.md` v0.1.8: `SubdomainNode.subdomainType` e `SymbolTableEntry.subdomainType` passaram de `SubdomainType` (union fechada) para `string` (valor bruto do parser), já que a gramática abriu `subdomain_type` para `identifier` livre. Isso torna `INVALID_SUBDOMAIN_TYPE` um code de fato alcançável pelo Visitor, corrigindo uma inconsistência encontrada ao desenhar a suíte de golden files.
- **v0.1.2** — sincronizado com `GRAMMAR.md` v0.1.9: adicionada nota explicando que `ORPHAN_CONTEXT`/`ORPHAN_SUBDOMAIN` são emitidos pelo parser durante recuperação de erro, não pelo Visitor — a gramática permanece estrita, então nenhum campo novo foi adicionado à AST (ao contrário do que se cogitou inicialmente).
