# CHANGELOG

Registro de mudanças dos documentos versionados deste repositório. Cada seção abaixo corresponde a **um arquivo-fonte** e mantém o **próprio esquema de versionamento**, independente dos outros — não existe uma versão única do repositório como um todo. `RULES-EN.md`/`RULES-PT.md`, `PRD.md` e demais arquivos não têm changelog próprio ainda; quando (e se) passarem a ser versionados, ganham uma seção aqui.

Dentro de cada seção, as entradas estão em ordem cronológica (mais antiga primeiro), preservando a ordem em que foram originalmente escritas nos próprios arquivos-fonte antes de serem centralizadas aqui.

---

## GRAMMAR.md

Fonte de verdade sintática (EBNF) da linguagem ODDS. Versão atual: **v0.1.9**.

- **v0.1.0** — versão inicial, derivada de `RULES-EN.md` v1 e `PRD.md` v1.1.0. Pendências listadas na seção 7 ainda não resolvidas com o time.
- **v0.1.1** — resolvida a pendência do bloco de relacionamentos: renomeado `context_map` → `mapping`; mantida delimitação por chaves `{ }` em vez de indentação ou palavra-chave de fechamento (`end`). Adicionado caso de teste candidato (contexto duplicado em dois subdomains) para a futura suíte de golden files.
- **v0.1.2** — resolvida a pendência de múltiplas tags: adotada a sintaxe de lista em colchete único (`[OHS, PL]`) no lugar de colchetes empilhados (`[OHS][PL]`).
- **v0.1.3** — resolvida a pendência de propriedades de contexto: `attribute_list` (lista de identificadores soltos) substituída por `context_block`, um bloco `{ }` de propriedades chave-valor (`type`, `description`, `responsibilities`, `maturity`, `team`, `technology`). Adicionados `string_literal` e `string_list` à estrutura léxica (seção 1). Duas pendências novas registradas: possível enum futuro para `type`, e suporte a escape de aspas em strings.
- **v0.1.4** — resolvida a pendência de cardinalidade de `domain`: exatamente um `domain` por arquivo `.odds`. Regra registrada como semântica (pertence ao `RULES.md`, ainda não adicionada lá — ação pendente).
- **v0.1.5** — resolvida a pendência de rótulos/display names: adicionada a propriedade `title` (string livre) a `domain`, `subdomain` e `context`, com posição fixa (sempre a primeira declaração do bloco, quando presente). `title` foi extraído como produção própria (`title_decl`), separada de `property_key`, para ser reutilizável nos três níveis sem duplicar regras.
- **v0.1.6** — resolvidas as duas últimas pendências: `type` permanece texto livre permanentemente (decisão consciente, não enum); `string_literal` passou a suportar escape via barra invertida (`\"` e `\\`). **Todas as pendências originais da gramática estão resolvidas nesta versão.**
- **v0.1.7** — fechamento de lacunas identificadas em revisão final: (1) adicionada `reserved_word`, proibindo identificadores que coincidam com palavras-chave da linguagem; (2) estendida a regra de vírgula sobrando (já aplicada a `tag_group`) para `string_list`, por consistência; (3) registrada como ação pendente a formalização da regra de unicidade de nomes de `context` em `RULES.md`, junto da regra de cardinalidade de `domain`.
- **v0.1.8** — corrigida contradição interna sobre `subdomain_type`: a produção passou de enum fechado (`"core" | "supporting" | "generic"`) para `identifier` livre, tornando `INVALID_SUBDOMAIN_TYPE` (RULES §1.B) um code semântico de fato alcançável pelo Visitor, em vez de código morto. Encontrado durante o desenho da suíte de golden files — ver `TEST_SUITE.md`.
- **v0.1.9** — resolvido código morto em `ORPHAN_CONTEXT`/`ORPHAN_SUBDOMAIN`: ao contrário de `subdomain_type`, a gramática **não** foi afrouxada (a hierarquia domain→subdomain→context continua estrutural). Em vez disso, adicionada seção 5.1 exigindo que o parser implemente recuperação de erro para esses dois casos específicos, permitindo que o restante do arquivo ainda seja validado mesmo com um `context`/`subdomain` deslocado. Também encontrado durante o desenho da suíte de golden files.

---

## AST_SCHEMA.md

Contrato de dados (interfaces TypeScript) entre Parser → Visitor → Visualizador. Versão atual: **v0.1.2**.

- **v0.1.0** — versão inicial, derivada de `GRAMMAR.md` v0.1.7 (todas as pendências da gramática já resolvidas nesse ponto). Define `ProgramNode`, `DomainNode`, `SubdomainNode`, `ContextNode`, `MappingNode`, `RelationshipNode`, a tabela de `DiagnosticCode` sincronizada com `RULES.md`, e a estrutura auxiliar `SymbolTable` usada pelo Visitor.
- **v0.1.1** — sincronizado com `GRAMMAR.md` v0.1.8: `SubdomainNode.subdomainType` e `SymbolTableEntry.subdomainType` passaram de `SubdomainType` (union fechada) para `string` (valor bruto do parser), já que a gramática abriu `subdomain_type` para `identifier` livre. Isso torna `INVALID_SUBDOMAIN_TYPE` um code de fato alcançável pelo Visitor, corrigindo uma inconsistência encontrada ao desenhar a suíte de golden files.
- **v0.1.2** — sincronizado com `GRAMMAR.md` v0.1.9: adicionada nota explicando que `ORPHAN_CONTEXT`/`ORPHAN_SUBDOMAIN` são emitidos pelo parser durante recuperação de erro, não pelo Visitor — a gramática permanece estrita, então nenhum campo novo foi adicionado à AST (ao contrário do que se cogitou inicialmente).

---

## TEST_SUITE.md

Suíte de golden files (conformidade) para o parser e o validador semântico. Versão atual: **v0.1.1**.

- **v0.1.0** — versão inicial. 18 golden files cobrindo todos os `DiagnosticCode` de `AST_SCHEMA.md` v0.1.2 / `GRAMMAR.md` v0.1.9. Encontradas e corrigidas duas contradições estruturais na gramática durante o processo (ver `GRAMMAR.md` v0.1.8/v0.1.9 acima).
- **v0.1.1** — formalizadas duas classes de lacuna encontradas em auditoria da suíte contra `RULES-EN.md`/`RULES-PT.md`: (1) gatilhos vagos de `GENERIC_WITHOUT_OHS_WARNING` e `EXCESSIVE_SHARED_KERNEL_WARNING` (escopo por relacionamento vs. agregado, limiar numérico) — só mudança de texto em `RULES.md`, nenhum golden file precisou mudar; (2) as tags `[SW]` e `[BBM]` não tinham nenhum golden file, e suas regras (`SEPARATION_CONFLICT`, `CONFORMIST_CORE_WARNING`) tinham condições de gatilho não cobertas por teste — adicionados os casos auxiliares `separation-conflict-sw-directional` e `conformist-core-warning-bbm`, com as regras correspondentes formalizadas em `RULES-EN.md`/`RULES-PT.md`. Total de casos: 18 → 20.
