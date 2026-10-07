# AST_SCHEMA: Open Domain Driven Specification (ODDS)

## 0. Propósito deste documento

Este arquivo é o **contrato de dados** entre as três camadas do sistema: Parser → Validador (Visitor) → Visualizador. Define, em TypeScript, a forma exata da Árvore Sintática Abstrata (AST) que o parser produz a partir de um arquivo `.odds` válido sintaticamente (ver `GRAMMAR.md`), e que o Visitor percorre para aplicar as regras semânticas (ver `RULES-EN.md`).

Esta AST corresponde 1:1 à gramática **GRAMMAR.md v0.2.0**. Qualquer mudança na gramática (nova produção, propriedade nova, etc.) deve ser refletida aqui antes de qualquer implementação — os dois arquivos devem andar sempre sincronizados, junto com a suíte de golden files (ver `TEST_SUITE.md`) e com o catálogo de mensagens (`MESSAGES.md`).

**Convenção:** cada nó carrega um campo `span` com a posição de início/fim no arquivo-fonte. Isso é o que viabiliza a navegação clique-a-clique do painel de validação (PRD §5.2 / GH-002) — tanto para erros sintáticos quanto semânticos.

> ⚠️ **A unidade de `column` é normativa: unidades de código UTF-16, 1-indexed, `end` exclusivo.** Isso **não** é detalhe de implementação nesta linguagem em particular: `GRAMMAR.md` §1 aceita explicitamente letras acentuadas em `identifier`, e boa parte do conteúdo escrito em ODDS é PT-BR. Uma linha com `descrição` tem contagens diferentes em bytes UTF-8 e em UTF-16 — se a unidade não estiver fixada, dois parsers conformes produzem spans diferentes para o mesmo arquivo e `TEST_SUITE.md` não consegue asserir nenhum dos dois. UTF-16 foi escolhido por alinhamento com o LSP (o `end` exclusivo já segue a mesma convenção) e com `String.prototype.length` do JavaScript, que é o ambiente-alvo de um produto 100% client-side.

---

## 1. Tipos de suporte (posição e diagnósticos)

```typescript
/**
 * Posição de um caractere no arquivo-fonte (1-indexed, como a maioria dos editores).
 *
 * `column` é contada em **unidades de código UTF-16**, como no Language Server
 * Protocol — não em bytes e não em graphemes. Ver a nota abaixo: a unidade não é
 * detalhe de implementação, porque a gramática aceita identificadores acentuados.
 */
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

### 1.1 Severidade

```typescript
type DiagnosticSeverity = "error" | "warning" | "info";
```

Três níveis, não dois. A separação existe porque a ODDS é um **linter opinativo** (`RULES.md` §0.1): sem um nível próprio para higiene e estilo, toda opinião cairia no mesmo balde de `warning` que o risco estratégico real, e o usuário aprenderia a ignorar o painel inteiro.

| Severidade | Significado | Suprimível? |
|---|---|---|
| `error` | Integridade ou coerência do modelo violada. O elemento é registrado como *declarado porém inválido* e sai das fases seguintes (§1.4). | ❌ nunca |
| `warning` | Violação de um padrão razoavelmente consensual na literatura de DDD. O modelo é coerente; o desenho é arriscado. | ✅ |
| `info` | Higiene de documentação ou opinião de estilo. | ✅ |

> **Consequência de nomenclatura:** nenhum `DiagnosticCode` carrega a severidade no nome. O `code` nomeia a **regra**; a severidade vive **apenas** no campo `severity`. Os quatro codes que traziam o sufixo `_WARNING` foram renomeados (ver `CHANGELOG.md`, AST_SCHEMA.md v0.2.0) — sem isso, qualquer regra reclassificada para `info` teria um nome que mente sobre ela.

### 1.2 O diagnóstico

```typescript
/**
 * Um problema reportado ao usuário — seja um erro de parsing (sintático)
 * ou um resultado da validação semântica (RULES.md).
 *
 * NÃO existe campo `message`. O veredito estruturado é o contrato;
 * a frase em português ou inglês é renderização, produzida fora do núcleo
 * validador por `renderMessage(code, data, locale)` a partir de `MESSAGES.md`.
 */
interface Diagnostic {
  severity: DiagnosticSeverity;
  code: DiagnosticCode;
  /**
   * Os valores que a mensagem interpola, chaveados por nome.
   * É este campo — e não a frase renderizada — que os golden files asserem.
   * As chaves de cada code estão fixadas na tabela de §1.3 e devem casar
   * exatamente com os placeholders do template correspondente em MESSAGES.md.
   */
  data: Record<string, string>;
  span: SourceSpan;
}
```

**Por que `data` existe, e não só `code` + `span`.** Sem ele, dois diagnósticos da mesma regra ficam indistinguíveis. O caso que forçou a decisão é o `CONFORMIST_CORE`, que tem **dois gatilhos disjuntos** — `[CF]` no lado Downstream e `[BBM]` no lado Upstream:

```odds
Checkout [CF] <-- OldBilling      // data: { context: "Checkout", trigger: "conformist" }
Checkout <-- [BBM] OldBilling     // data: { context: "Checkout", trigger: "bbm" }
```

Sem `data`, os dois casos asseriam a mesma `severity`, o mesmo `code` e spans que diferem por uma única coluna acidental — uma implementação que dispare o gatilho errado passaria nos dois testes. Com `data`, eles divergem no campo que importa.

**Regra de integridade mecânica:** todo placeholder de um template em `MESSAGES.md` precisa existir como chave em `data`, e vice-versa. Isso é verificável por script, sem rodar o validador.

**Regra de integridade semântica — `data` não carrega prosa.** Todo valor é um nome declarado pelo usuário, um token literal da gramática, um número decimal em string, ou um dos valores fechados listados em §1.3. **Se o valor mudaria ao traduzir a mensagem, ele não pertence a `data`** — a frase inteira vive no template (`MESSAGES.md` §1.1). Sem essa regra, o locale volta pela porta dos fundos sem que checagem nenhuma reclame: um `replacement: "`-x-` on its own"` é um `Record<string, string>` perfeitamente válido, casa com o placeholder nos dois idiomas, e ainda assim faz o template PT renderizar *"use `-x-` on its own no lugar"*.

### 1.3 Catálogo de codes, com fase e chaves de `data`

```typescript
type DiagnosticCode = SyntaxDiagnosticCode | StructuralDiagnosticCode
                    | SemanticDiagnosticCode | SuppressionDiagnosticCode;

/**
 * Fase 0. Um erro sintático puro interrompe totalmente a geração da AST
 * (ver GRAMMAR.md §5). Diagnostics com este code não têm AST associada.
 */
type SyntaxDiagnosticCode = "SYNTAX_ERROR";

/**
 * Fase 1. Produzidos PELO PARSER durante recuperação de erro (panic-mode),
 * não pelo Visitor — ver §1.5 e GRAMMAR.md §5.1.
 */
type StructuralDiagnosticCode =
  | "ORPHAN_CONTEXT"
  | "ORPHAN_SUBDOMAIN"
  | "REMOVED_CONSTRUCT";

/** Fases 2 a 5. Produzidos pelo Visitor. Um por regra em RULES-EN.md §1–§2. */
type SemanticDiagnosticCode =
  // Fase 2 — declarativa
  | "INVALID_DOMAIN_CARDINALITY"
  | "INVALID_SUBDOMAIN_TYPE"
  | "DUPLICATE_CONTEXT"
  | "DUPLICATE_SUBDOMAIN"
  // Fase 3 — referencial (identidade e existência das pontas da relação)
  | "PHANTOM_REFERENCE"
  | "SELF_RELATIONSHIP"
  | "DUPLICATE_RELATIONSHIP"
  | "EXTERNAL_ONLY_RELATIONSHIP"
  // Fase 4 — relacional (as tags em si)
  | "UPSTREAM_ONLY_TAG_MISPLACED"
  | "DOWNSTREAM_ONLY_TAG_MISPLACED"
  | "MUTUAL_TAG_ON_DIRECTIONAL"
  | "POSITIONAL_TAG_ON_MUTUAL"
  | "INCOMPLETE_MUTUAL_TAG"
  | "MUTUAL_TAG_WITH_EXTERNAL"
  | "SEPARATION_CONFLICT"
  | "ROLE_CONFLICT"
  | "PROTECTION_CONFLICT"
  // Fase 5 — estratégica (juízo sobre o desenho)
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
  | "PL_WITHOUT_OHS";

/** Fase 6 — a passada de supressão sobre o array já emitido. */
type SuppressionDiagnosticCode =
  | "MALFORMED_SUPPRESSION"
  | "UNUSED_SUPPRESSION";
```

A tabela abaixo é **normativa** e é a fonte de verdade de três coisas ao mesmo tempo: severidade padrão, fase (exigida por `RULES.md` §3.2 — um code sem fase não tem posição definida no array e não pode ser testado) e as chaves de `data`.

| Code | Fase | Severidade | Chaves de `data` |
|---|:---:|---|---|
| `SYNTAX_ERROR` | 0 | `error` | `found`, `expected` |
| `ORPHAN_CONTEXT` | 1 | `error` | `context` |
| `ORPHAN_SUBDOMAIN` | 1 | `error` | `subdomain` |
| `REMOVED_CONSTRUCT` | 1 | `error` | `construct`, `removedIn`, `replacement` |
| `INVALID_DOMAIN_CARDINALITY` | 2 | `error` | `count` |
| `INVALID_SUBDOMAIN_TYPE` | 2 | `error` | `subdomain`, `value` |
| `DUPLICATE_CONTEXT` | 2 | `error` | `context` |
| `DUPLICATE_SUBDOMAIN` | 2 | `error` | `subdomain` |
| `PHANTOM_REFERENCE` | 3 | `error` | `context` |
| `SELF_RELATIONSHIP` | 3 | `error` | `context` |
| `DUPLICATE_RELATIONSHIP` | 3 | `error` | `left`, `right`, `firstLine` |
| `EXTERNAL_ONLY_RELATIONSHIP` | 3 | `error` | `left`, `right` |
| `UPSTREAM_ONLY_TAG_MISPLACED` | 4 | `error` | `tag` |
| `DOWNSTREAM_ONLY_TAG_MISPLACED` | 4 | `error` | `tag` |
| `MUTUAL_TAG_ON_DIRECTIONAL` | 4 | `error` | `tag`, `connector` |
| `POSITIONAL_TAG_ON_MUTUAL` | 4 | `error` | `tag` |
| `INCOMPLETE_MUTUAL_TAG` | 4 | `error` | `tag`, `declaredSide` |
| `MUTUAL_TAG_WITH_EXTERNAL` | 4 | `error` | `tag`, `external` |
| `SEPARATION_CONFLICT` | 4 | `error` | `tags` |
| `ROLE_CONFLICT` | 4 | `error` | `context` |
| `PROTECTION_CONFLICT` | 4 | `error` | `context` |
| `CONFORMIST_CORE` | 5 | `warning` | `context`, `trigger` |
| `GENERIC_WITHOUT_OHS` | 5 | `warning` | `context`, `subdomain` |
| `CORE_UPSTREAM_OF_GENERIC` | 5 | `warning` | `core`, `generic` |
| `CORE_IN_SHARED_KERNEL` | 5 | `warning` | `core`, `other` |
| `DOMAIN_WITHOUT_CORE` | 5 | `warning` | `domain` |
| `INCONSISTENT_BBM` | 5 | `warning` | `context`, `withBbm`, `withoutBbm` |
| `INCOMPLETE_CUSTOMER_SUPPLIER` | 5 | `warning` | `context`, `declared`, `missing` |
| `EXCESSIVE_SHARED_KERNEL` | 5 | `info` | `count` |
| `UNDOCUMENTED_CONTRACT` | 5 | `info` | `left`, `right` |
| `UNMAPPED_CONTEXT` | 5 | `info` | `context` |
| `EMPTY_SUBDOMAIN` | 5 | `info` | `subdomain` |
| `PL_WITHOUT_OHS` | 5 | `info` | `context` |
| `MALFORMED_SUPPRESSION` | 6 | `info` | `code`, `reason` |
| `UNUSED_SUPPRESSION` | 6 | `info` | `code` |

**Valores fechados de `data` que não são nomes livres** — asseridos literalmente pelos golden files:

- `CONFORMIST_CORE.trigger`: `"conformist"` (o lado Downstream `core` carrega `[CF]`) ou `"bbm"` (o lado Upstream carrega `[BBM]`).
- `INCOMPLETE_MUTUAL_TAG.declaredSide` e `INCOMPLETE_CUSTOMER_SUPPLIER` (`declared`/`missing`): `"left"`/`"right"` para o lado; `"C"`/`"S"` para a tag.
- `MALFORMED_SUPPRESSION.reason`: `"unknown-code"` (o code nomeado não existe neste catálogo), `"missing-justification"` (a diretiva não traz `: <justificativa>`) ou `"not-suppressible"` (o code nomeado tem severidade `error`, que por D3 nunca é suprimível).
- `REMOVED_CONSTRUCT.removedIn`: a `ODDS Language Version` em que a construção deixou de existir (ver `CHANGELOG.md`).
- `REMOVED_CONSTRUCT.construct` e `REMOVED_CONSTRUCT.replacement`: **tokens literais da linguagem**, sem prosa em volta e sem crases — a construção removida como se escreve (`[SW]`) e a que ocupa seu lugar (`-x-`). A instrução de *como* usar a substituta é do template, não do dado.
- `SYNTAX_ERROR.expected`: a **lista de tokens literais** aceitos naquela posição, separados por `", "` (ex.: `"-->, <--, <->, -x-"`). Nunca uma descrição em prosa da categoria esperada — a palavra "conector" que nomeia o conjunto vive no template. Um conjunto aberto é esperado aqui: ao contrário dos demais valores fechados desta lista, `expected` varia com a posição do parser, e por isso é a lista que é normativa, não os seus membros.
- Chaves numéricas (`count`, `withBbm`, `withoutBbm`, `firstLine`) são **strings decimais** — `data` é `Record<string, string>`, sem exceção. Isso mantém o campo trivialmente serializável no golden file e no payload da URL.

> 📝 Cada code desta tabela deve ter pelo menos um golden file associado (`TEST_SUITE.md`). Esta lista é a fonte de verdade de quais regras do `RULES.md` já têm um `code` estável — **uma regra nova entra aqui primeiro**, com fase e chaves de `data`, antes de ser escrita no `RULES.md` ou ganhar template em `MESSAGES.md`.

### 1.4 Princípio do erro-raiz (leitura larga)

Um elemento que produziu um diagnóstico de severidade **`error`** é registrado como *declarado porém inválido* e **sai do pipeline inteiro** a partir da fase seguinte — nenhuma regra posterior o enxerga. `warning` e `info` nunca invalidam nada. A regra normativa completa, com o racional, está em `RULES.md` §3.1.

Duas obrigações que isso impõe a esta AST, e que são a razão de os campos existirem:

1. `SymbolTableEntry.valid` (§5) — uma declaração descartada pelo panic-mode ainda **entra** na tabela de símbolos, marcada como inválida. É isso que mata a cascata `ORPHAN_CONTEXT` → `PHANTOM_REFERENCE` (o contexto *foi* declarado, só que no lugar errado) e o que permite ao renderizador desenhar o nó fantasma pontilhado em vez de nada.
2. `astGenerated` **deixou de ser proxy de "renderizável"**. Desde D17 a renderização degrada por elemento: a AST parcial sempre desenha o que for desenhável, e o elemento problemático aparece marcado. `astGenerated: false` significa apenas *"não existe árvore"* — ou seja, `SYNTAX_ERROR` puro —, não *"nada será exibido"*.

### 1.5 Quem produz o quê

| Produtor | Codes |
|---|---|
| **Lexer/Parser**, abortando | `SYNTAX_ERROR` |
| **Parser**, via panic-mode recovery (AST parcial sobrevive) | `ORPHAN_CONTEXT`, `ORPHAN_SUBDOMAIN`, `REMOVED_CONSTRUCT` |
| **Visitor**, percorrendo a AST | todo `SemanticDiagnosticCode` |
| **Passada de supressão**, sobre o array já emitido | `MALFORMED_SUPPRESSION`, `UNUSED_SUPPRESSION` |

> ⚠️ **Nota sobre os codes estruturais.** Apesar de agrupados no `RULES.md` §1.A junto aos demais erros críticos (afinidade temática: são todos "Validações de Escopo e Hierarquia"), esses três **não** são produzidos pelo Visitor percorrendo uma AST já construída. A gramática continua estrita — um `context` só é sintaticamente válido dentro de um `subdomain` ou de um bloco `external`, e um `subdomain` só dentro de um `domain` —, então um `context`/`subdomain` deslocado nunca vira um nó real na AST. Diferente de `SYNTAX_ERROR`, porém, esses diagnósticos **não interrompem** a geração da AST para o restante do arquivo: o parser descarta a declaração malformada, **registra-a como inválida** (§1.4) e continua.

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
  /**
   * Diretivas de supressão encontradas no arquivo, na ordem de ocorrência.
   * Vive na raiz, e não pendurada nos nós, porque uma diretiva se refere a uma
   * LINHA (a seguinte), não a um nó — e a linha alvo pode não ter nó nenhum
   * (ex.: suprimir uma regra agregada ancorada na abertura do `mapping`).
   */
  suppressions: SuppressionDirective[];
}
```

### 2.1 Diretivas de supressão

```typescript
/**
 * Uma diretiva `// odds-disable-next-line <CODE>: <justificativa>`.
 * Ver GRAMMAR.md §1 (produção `suppression_directive`) e RULES.md §4.
 *
 * Consequência estrutural: comentários deixaram de ser sintaticamente
 * insignificantes. O lexer NÃO pode mais descartar todos os comentários antes
 * do parser — os que começam com o prefixo `odds-disable-next-line` precisam
 * sobreviver até a passada de supressão.
 */
interface SuppressionDirective {
  /** Texto bruto do code nomeado. PODE não existir no catálogo — quem valida é a fase 6. */
  code: string;
  /** Texto após os dois-pontos. String vazia quando ausente (⇒ MALFORMED_SUPPRESSION). */
  justification: string;
  /** Linha à qual a diretiva se aplica: sempre a linha imediatamente seguinte à sua. */
  targetLine: number;
  /** Span da diretiva em si (do `//` ao fim da linha), usado para reportar sobre ela. */
  span: SourceSpan;
}
```

---

## 3. Problem Space (domain / subdomain / context / external)

```typescript
interface DomainNode extends AstNode {
  kind: "Domain";
  name: string;              // identifier
  title?: string;            // title_decl, se declarado
  subdomains: SubdomainNode[];
  /** Bloco `external { }`, único e anônimo. Ausente se não declarado. */
  external?: ExternalBlockNode;
  mapping?: MappingNode;     // ausente se o domain não declarar relacionamentos
}

type SubdomainType = "core" | "supporting" | "generic";

interface SubdomainNode extends AstNode {
  kind: "Subdomain";
  /**
   * Valor bruto do identifier lido pelo parser (ver GRAMMAR.md: subdomain_type = identifier).
   * PODE ser inválido — o parser não valida contra SubdomainType, só a AST representa o que foi escrito.
   * É o Visitor quem valida este campo contra o union SubdomainType e emite INVALID_SUBDOMAIN_TYPE se não bater.
   */
  subdomainType: string;
  name: string;
  title?: string;
  /** Por que o subdomínio existe — prosa de negócio (GRAMMAR.md §2, ADR-0008). Ausente se não declarado. */
  description?: string;
  /** Quem responde pelo subdomínio — texto livre, nunca referência validada (ADR-0008). Ausente se não declarado. */
  owner?: string;
  contexts: ContextNode[];
}

/**
 * O bloco `external { }` — sistemas de terceiros que você NÃO controla.
 * Único e anônimo por domain, posicionado entre os subdomains e o mapping.
 * Sem nome próprio de propósito: um rótulo de grupo sem semântica viraria
 * classificação improvisada ("external Legacy", "external Critical") que a
 * ferramenta não sabe validar, recriando por outro caminho a taxonomia que
 * `core`/`supporting`/`generic` deliberadamente não estende a terceiros.
 */
interface ExternalBlockNode extends AstNode {
  kind: "ExternalBlock";
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
- `SubdomainNode.description` e `SubdomainNode.owner` ficam **direto no nó**, e não num objeto `properties` como no `ContextNode`. O `context` tem seis chaves e a distinção "bloco declarado mas vazio" importa para o visualizador; o subdomínio sempre tem bloco (`{ }` é obrigatório na produção), então um objeto intermediário não diferenciaria nada. Os dois campos são `undefined` quando não declarados, nunca string vazia. Como toda propriedade, **nenhum dos dois alimenta o gatilho de regra alguma** (`RULES.md` §0.3).
- A checagem `INVALID_SUBDOMAIN_TYPE` é responsabilidade exclusiva do Visitor. `subdomain_type` é um `identifier` livre na gramática (não um enum fechado de literais) — precisamente para que este code seja alcançável na prática, e não um caminho morto nunca disparado por um parser correto.
- **Contexto externo usa o mesmo `ContextNode`**, sem tipo próprio e sem flag: a externalidade é dada pela **posição na árvore** (estar dentro de `ExternalBlockNode`), que é a representação com uma fonte de verdade só. O que o Visitor e o renderizador consomem é `SymbolTableEntry.isExternal` (§5), derivado dessa posição uma única vez.
- **Contexto externo aceita as seis propriedades**, sem restrição. `responsibilities` e `team` são semanticamente estranhos num sistema que não é seu, mas continuam permitidos: propriedades são **documentação, nunca normativas** (`RULES.md` §0.3), e criar a primeira propriedade proibida abriria justamente a fronteira que a linguagem preserva de propósito. A estranheza é anotada no `RULES.md`, não policiada pelo validador.

---

## 4. Solution Space (mapping / relationships)

```typescript
type ConnectorType = "-->" | "<--" | "<->" | "-x-";

/**
 * NOVE tags. `SW` foi removida da linguagem: `-x-` passou a significar
 * Free / Separate Ways por si só (ver RULES.md §0.2). Escrever `[SW]` hoje
 * produz REMOVED_CONSTRUCT, não SYNTAX_ERROR genérico.
 *
 * Atenção: `BBM` está nesta lista por conveniência de parsing (a forma
 * sintática é a mesma), mas NÃO é uma tag de padrão — é a terceira categoria
 * de anotação, a caracterização do sistema. Ver RULES.md §0.2.
 */
type PatternTag = "OHS" | "PL" | "ACL" | "CF" | "SK" | "C" | "S" | "P" | "BBM";

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
- `left` e `right` são apenas o **nome** do contexto referenciado (string), não uma referência direta ao `ContextNode`. A resolução do nome para o nó real (e as checagens `PHANTOM_REFERENCE`/`DUPLICATE_CONTEXT`) é responsabilidade do Visitor, usando a tabela de símbolos construída no Passo 1. A AST em si não pré-resolve essas referências.
- **Uma linha = uma aresta.** A identidade de uma relação é o **par não-ordenado** `{left, right}` (`RULES.md` §1.A): qualquer segunda linha para o mesmo par é `DUPLICATE_RELATIONSHIP`, independentemente de conector ou tags. O renderizador nunca precisa mesclar linhas nem eleger uma vencedora entre tags conflitantes — num par duplicado, **a primeira ocorrência é a que desenha**.

---

## 5. Tabela de símbolos (estrutura auxiliar do Visitor)

Não faz parte da AST — é uma estrutura intermediária que o Visitor constrói ao percorrer a árvore (Passo 1 do `RULES.md`), usada para detectar `PHANTOM_REFERENCE`, `DUPLICATE_CONTEXT` e `UNMAPPED_CONTEXT`, e para responder "este contexto é externo?" às regras que dependem do princípio da autoria (`RULES.md` §0.4).

```typescript
interface SymbolTableEntry {
  contextName: string;
  /** true quando o contexto foi declarado dentro do bloco `external { }`. */
  isExternal: boolean;
  /** undefined para contexto externo — ele não pertence a subdomínio nenhum. */
  subdomainName?: string;
  /** undefined para contexto externo. Valor bruto — ver nota em SubdomainNode.subdomainType. */
  subdomainType?: string;
  /**
   * false quando a declaração já produziu um `error` (ex.: descartada pelo
   * panic-mode como ORPHAN_CONTEXT, ou segunda ocorrência de DUPLICATE_CONTEXT).
   * A entrada existe mesmo assim: é ela que impede a cascata de diagnósticos
   * derivados (§1.4) e permite ao renderizador desenhar o nó marcado.
   */
  valid: boolean;
  node: ContextNode;           // referência ao nó original, para reportar span em erros
}

/** Chave = nome do context. Uma chave com mais de uma entrada indica DUPLICATE_CONTEXT. */
type SymbolTable = Map<string, SymbolTableEntry[]>;
```

**Espaço de nomes único, interno e externo juntos.** `mapping` referencia contexto por identificador simples (`context_ref = identifier`, sem qualificação de escopo), logo não existe `Payments.Stripe`. A consequência é direta e obrigatória: `DUPLICATE_CONTEXT` vale **entre** um contexto interno e um externo de mesmo nome, exatamente como valeria entre dois internos.

---

## 6. Exemplo anotado (correspondência texto → AST)

```odds
domain ECommercePlatform {
  title: "E-Commerce Platform"

  subdomain generic Payments {
    context PaymentGateway {
      title: "Gateway de Pagamentos"
      maturity: mature
    }
  }

  external {
    context Stripe {
      description: "Provedor de pagamentos de terceiros"
    }
  }

  mapping {
    // odds-disable-next-line UNDOCUMENTED_CONTRACT: contrato ainda em negociação com o fornecedor
    PaymentGateway --> Stripe
  }
}
```

A AST resultante (posições omitidas por brevidade):

```typescript
{
  kind: "Program",
  suppressions: [
    {
      code: "UNDOCUMENTED_CONTRACT",
      justification: "contrato ainda em negociação com o fornecedor",
      targetLine: 19
    }
  ],
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
              title: "Gateway de Pagamentos",
              properties: { maturity: "mature" }
            }
          ]
        }
      ],
      external: {
        kind: "ExternalBlock",
        contexts: [
          {
            kind: "Context",
            name: "Stripe",
            properties: { description: "Provedor de pagamentos de terceiros" }
          }
        ]
      },
      mapping: {
        kind: "Mapping",
        relationships: [
          {
            kind: "Relationship",
            left: "PaymentGateway",
            leftTags: [],
            connector: "-->",
            rightTags: [],
            right: "Stripe"
          }
        ]
      }
    }
  ]
}
```

A tabela de símbolos derivada deste arquivo tem duas entradas — `PaymentGateway` (`isExternal: false`, `subdomainType: "generic"`) e `Stripe` (`isExternal: true`, sem subdomínio), ambas com `valid: true`.

Note que este arquivo **não** fica silencioso por causa da supressão. A linha 19 viola duas regras: `UNDOCUMENTED_CONTRACT` (nenhuma tag em nenhum dos lados) e `GENERIC_WITHOUT_OHS` (o Upstream `PaymentGateway` pertence a um subdomínio `generic` e não declara `[OHS]`). A diretiva nomeia apenas a primeira, então **só ela** é removida — a segunda é reportada normalmente. Deixado assim de propósito: a supressão é **por code**, nunca por linha inteira.

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

Histórico de versões centralizado em [`CHANGELOG.md`](./CHANGELOG.md) (seção `## AST_SCHEMA.md`). Versão atual: **v0.3.0**. Qualquer alteração a este arquivo deve ganhar uma entrada nova lá, não aqui.
