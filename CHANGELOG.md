# CHANGELOG

Registro de mudanças deste repositório, em **dois eixos independentes**.

**Eixo 1 — a `ODDS Language Version`.** É a versão do que um arquivo `.odds` *significa*, definida pelos documentos normativos em conjunto (`GRAMMAR.md` + `RULES-EN.md`/`RULES-PT.md` + `AST_SCHEMA.md`). É ela que viaja no payload da URL compartilhável, e é a única que responde à pergunta que um usuário faz ao reabrir um diagrama antigo: *"esses avisos novos são meus ou da ferramenta?"*.

**Eixo 2 — a versão editorial de cada arquivo.** Cada documento-fonte mantém o próprio esquema, independente dos outros — `GRAMMAR.md` v0.2.0 é histórico de decisão de projeto, não de compatibilidade de arquivo. **Não existe uma versão única do repositório como um todo.**

Misturar os dois eixos perderia os dois: usar a versão do `GRAMMAR.md` como proxy da linguagem, por exemplo, afirmaria compatibilidade inexistente sempre que uma regra nova mudar os diagnósticos de um arquivo válido **sem tocar numa linha da gramática** — que é exatamente o que o catálogo opinativo fez.

Dentro de cada seção, as entradas estão em ordem cronológica (mais antiga primeiro).

---

## ODDS Language Version

Versão atual: **v0.1.0**.

**Regra de incremento — SemVer com o corte na validade do arquivo:**

| Incremento | Quando | Efeito num `.odds` existente |
|---|---|---|
| **MAJOR** | Um arquivo válido deixa de ser válido, ou muda de significado | Ele quebra — os diagnósticos de migração (`REMOVED_CONSTRUCT`) disparam |
| **MINOR** | Só os diagnósticos mudam; o arquivo continua válido | Mesmo desenho, painel diferente |
| **PATCH** | Só texto de mensagem ou tradução (`MESSAGES.md`) | Nada muda para o usuário |

A URL guarda a versão cheia, mas **só divergência de MAJOR** aciona diagnóstico de migração — é isso que mantém o MAJOR raro e significativo. Rejeitado tratar toda mudança de saída como breaking: faria a versão girar a cada regra do catálogo e viraria ruído no campo da URL (e o argumento "linter em CI quebra o build" não se aplica: a ODDS é um playground client-side, sem CLI nem integração de build no escopo). Rejeitado também versionar apenas validade: apagaria justamente a informação que responde à dúvida que corrói a confiança num linter opinativo.

- **v0.1.0** — nascimento da versão de linguagem. Corresponde ao estado dos documentos normativos após a passada de propagação do `GRILLING.md`. Duas quebras de compatibilidade decididas naquela sessão já entram **dentro** desta primeira versão, e não geram migração retroativa, porque não existia usuário nem URL publicada antes dela: a tag `[SW]` deixou de existir e `external` virou palavra reservada. `[SW]` fica registrada como o primeiro (e por ora único) membro da família `REMOVED_CONSTRUCT`, com `removedIn: "0.1.0"` — uma cortesia para rascunhos escritos durante o período pré-versionamento, não uma obrigação de compatibilidade. O primeiro MAJOR relevante será o da v1.0.0.
  - **Correções editoriais posteriores absorvidas nesta mesma versão** (`AST_SCHEMA.md` v0.2.1 · `MESSAGES.md` v0.1.1 · `TEST_SUITE.md` v0.2.1 · `RULES` v0.2.1): a unidade de `column` e a proibição de prosa em `data` mudam o *payload* de dois diagnósticos e o texto de dois templates, o que pela tabela acima seria MINOR + PATCH. Não incrementam porque a v0.1.0 ainda não fechou — ela nasce com o estado propagado do `GRILLING.md`, e estas duas lacunas são do mesmo estado, encontradas na auditoria seguinte. Nenhum arquivo `.odds` muda de validade ou de significado, e não existe URL publicada para divergir. A partir da primeira publicação, a tabela vale sem exceção.

---

## GRAMMAR.md

Fonte de verdade sintática (EBNF) da linguagem ODDS. Versão atual: **v0.2.0**.

- **v0.1.0** — versão inicial, derivada de `RULES-EN.md` v1 e `PRD.md` v1.1.0. Pendências listadas na seção 7 ainda não resolvidas com o time.
- **v0.1.1** — resolvida a pendência do bloco de relacionamentos: renomeado `context_map` → `mapping`; mantida delimitação por chaves `{ }` em vez de indentação ou palavra-chave de fechamento (`end`). Adicionado caso de teste candidato (contexto duplicado em dois subdomains) para a futura suíte de golden files.
- **v0.1.2** — resolvida a pendência de múltiplas tags: adotada a sintaxe de lista em colchete único (`[OHS, PL]`) no lugar de colchetes empilhados (`[OHS][PL]`).
- **v0.1.3** — resolvida a pendência de propriedades de contexto: `attribute_list` (lista de identificadores soltos) substituída por `context_block`, um bloco `{ }` de propriedades chave-valor (`type`, `description`, `responsibilities`, `maturity`, `team`, `technology`). Adicionados `string_literal` e `string_list` à estrutura léxica (seção 1). Duas pendências novas registradas: possível enum futuro para `type`, e suporte a escape de aspas em strings.
- **v0.1.4** — resolvida a pendência de cardinalidade de `domain`: exatamente um `domain` por arquivo `.odds`. Regra registrada como semântica (pertence ao `RULES.md`, ainda não adicionada lá — ação pendente).
- **v0.1.5** — resolvida a pendência de rótulos/display names: adicionada a propriedade `title` (string livre) a `domain`, `subdomain` e `context`, com posição fixa (sempre a primeira declaração do bloco, quando presente). `title` foi extraído como produção própria (`title_decl`), separada de `property_key`, para ser reutilizável nos três níveis sem duplicar regras.
- **v0.1.6** — resolvidas as duas últimas pendências: `type` permanece texto livre permanentemente (decisão consciente, não enum); `string_literal` passou a suportar escape via barra invertida (`\"` e `\\`). **Todas as pendências originais da gramática estão resolvidas nesta versão.**
- **v0.1.7** — fechamento de lacunas identificadas em revisão final: (1) adicionada `reserved_word`, proibindo identificadores que coincidam com palavras-chave da linguagem; (2) estendida a regra de vírgula sobrando (já aplicada a `tag_group`) para `string_list`, por consistência; (3) registrada como ação pendente a formalização da regra de unicidade de nomes de `context` em `RULES.md`, junto da regra de cardinalidade de `domain`.
- **v0.1.8** — corrigida contradição interna sobre `subdomain_type`: a produção passou de enum fechado (`"core" | "supporting" | "generic"`) para `identifier` livre, tornando `INVALID_SUBDOMAIN_TYPE` (RULES §1.B) um code semântico de fato alcançável pelo Visitor, em vez de código morto. Encontrado durante o desenho da suíte de golden files — ver `TEST_SUITE.md`.
- **v0.1.9** — resolvido código morto em `ORPHAN_CONTEXT`/`ORPHAN_SUBDOMAIN`: ao contrário de `subdomain_type`, a gramática **não** foi afrouxada (a hierarquia domain→subdomain→context continua estrutural). Em vez disso, adicionada seção 5.1 exigindo que o parser implemente recuperação de erro para esses dois casos, permitindo que o restante do arquivo ainda seja validado mesmo com um `context`/`subdomain` deslocado. Também encontrado durante o desenho da suíte de golden files.
- **v0.2.0** — passada de propagação do `GRILLING.md` (D3, D4, D6, D8, D10, D17, D18, D20 · F3, F10). Cinco mudanças, três delas quebrando compatibilidade:
  - **`external` vira palavra reservada** e ganha a produção `external_decl` — bloco único e anônimo, posicionado entre os `subdomain_decl` e o `mapping_decl`. O invariante estrutural ("todo `context` dentro de um bloco declarado") é preservado sem exceção nova.
  - **`tag` perde `"SW"`** (10 → 9). Encontrar `SW` num `tag_group` passa a produzir `REMOVED_CONSTRUCT` com recuperação, não `SYNTAX_ERROR` genérico — a produção `removed_tag` existe só para dar ao lexer um alvo reconhecível.
  - **Comentários deixam de ser universalmente descartáveis:** nova produção `suppression_directive`. A estrutura interna da diretiva é deliberadamente *não* parseada, para que uma diretiva quebrada vire `MALFORMED_SUPPRESSION` (`info`) e nunca derrube o parsing do arquivo.
  - **Panic-mode recovery ganha um passo obrigatório:** descartar não é esquecer. A declaração descartada precisa ser registrada como inválida, senão a cascata `ORPHAN_CONTEXT` → `PHANTOM_REFERENCE` reaparece.
  - **A afirmação "erro semântico crítico impede a renderização" foi removida** (seção 5), e o exemplo canônico da seção 4 foi reescrito para produzir zero diagnósticos — ele ensinava tag mal posicionada, vocabulário sobrecarregado (`type: "generic"` dentro de um `subdomain generic`) e um `core` dentro de um Shared Kernel. A seção 7 ("ação pendente fora desta gramática") foi encerrada: as duas regras que ela aguardava existem em `RULES.md` §1.A.

---

## RULES-EN.md / RULES-PT.md

Semântica da linguagem: gatilhos, severidades e escopo de cada regra. Os dois arquivos são traduções paralelas e **versionam juntos**. Versão atual: **v0.2.1**.

- **v0.1.0** — versão inicial, retroativa. Estado dos dois arquivos antes do `GRILLING.md`: as duas tabelas conceituais (Team Relationships, Context Map Patterns), a tabela de Context Properties, 11 erros críticos, 4 avisos de lint, e o resumo para implementação do AST. Não eram versionados na época; o número é atribuído aqui para dar um ponto de partida ao histórico.
- **v0.1.1** — adicionada a seção 3 (Pipeline de Validação: fases, princípio do erro-raiz e ordenação dos diagnósticos). Única exceção à política de propagação do `GRILLING.md`: escrita durante as rodadas, a pedido explícito, por ser aditiva e descrever arquitetura de pipeline em vez de texto de regra.
- **v0.2.0** — passada de propagação do `GRILLING.md`. A maior mudança dos dois arquivos até aqui:
  - **Nova seção 0, o modelo conceitual**, da qual todas as regras passam a ser aplicação: linter opinativo com três severidades; as três categorias de anotação (conector / tag de padrão / caracterização do sistema) e por que `[SW]` pôde sair sem perda; escopo de relação para toda tag, sem exceção, preservando a fronteira "tag = contrato validável / propriedade = documentação"; os dois critérios obrigatórios de admissão de regra nova; e as limitações conhecidas, aceitas e nomeadas.
  - **Matriz normativa tag × conector × lado** (§1.C), com um code por conector para "tag errada aqui", de forma que os codes nunca se sobreponham.
  - **17 regras novas** distribuídas entre §1 e §2 (15 → 32), cada uma com code, severidade, fase, escopo, gatilho e resposta ao princípio da autoria. `UNDOCUMENTED_CONTRACT` e `EXCESSIVE_SHARED_KERNEL` caem para `info` (a segunda com limiar 3+).
  - **As strings de mensagem saem** para o `MESSAGES.md`, junto com o `⚠️` que vinha embutido nelas. Estes arquivos ficam com gatilho, severidade e escopo — o que uma implementação precisa acertar.
  - **Três seções novas:** §4 supressão, §5 erros e renderização (a afirmação "bloqueia a compilação" acabou), §6 versão da linguagem e compatibilidade.
- **v0.2.1** — só correção de contagem, nenhuma mudança de regra. A §0.4 dizia que o catálogo "saltou de 4 para 24 regras" e a §3.1 falava em "duas dúzias de regras da §2"; os números vinham do `GRILLING.md` D24/D18, onde eram estimativas feitas *durante* a sessão, e não foram reconferidos na propagação. Os valores verificados contra o catálogo: **34 regras** no total (os 35 codes de `AST_SCHEMA.md` §1.3 menos `SYNTAX_ERROR`, que não é regra), sendo 20 na §1, **12 na §2** e 2 na §4. A entrada da v0.2.0 acima também dizia "14 regras novas" e foi corrigida para 17.

---

## AST_SCHEMA.md

Contrato de dados (interfaces TypeScript) entre Parser → Visitor → Visualizador. Versão atual: **v0.2.0**.

- **v0.1.0** — versão inicial, derivada de `GRAMMAR.md` v0.1.7 (todas as pendências da gramática já resolvidas nesse ponto). Define `ProgramNode`, `DomainNode`, `SubdomainNode`, `ContextNode`, `MappingNode`, `RelationshipNode`, a tabela de `DiagnosticCode` sincronizada com `RULES.md`, e a estrutura auxiliar `SymbolTable` usada pelo Visitor.
- **v0.1.1** — sincronizado com `GRAMMAR.md` v0.1.8: `SubdomainNode.subdomainType` e `SymbolTableEntry.subdomainType` passaram de `SubdomainType` (union fechada) para `string` (valor bruto do parser), já que a gramática abriu `subdomain_type` para `identifier` livre. Isso torna `INVALID_SUBDOMAIN_TYPE` um code de fato alcançável pelo Visitor, corrigindo uma inconsistência encontrada ao desenhar a suíte de golden files.
- **v0.1.2** — sincronizado com `GRAMMAR.md` v0.1.9: adicionada nota explicando que `ORPHAN_CONTEXT`/`ORPHAN_SUBDOMAIN` são emitidos pelo parser durante recuperação de erro, não pelo Visitor — a gramática permanece estrita, então nenhum campo novo foi adicionado à AST.
- **v0.2.0** — passada de propagação do `GRILLING.md` (D2, D6, D10, D16, D18, D19, D23). Mudança de contrato, não só de conteúdo:
  - **`DiagnosticSeverity` ganha `"info"`** e os quatro codes com sufixo `_WARNING` são renomeados — o `code` nomeia a regra, a severidade vive só no campo `severity`. Sem isso, qualquer regra reclassificada teria um nome que mente sobre ela.
  - **`Diagnostic` perde `message` e ganha `data: Record<string, string>`.** O veredito estruturado é o contrato; a frase é renderização. O caso que forçou a decisão está registrado no próprio arquivo: sem `data`, os dois gatilhos disjuntos de `CONFORMIST_CORE` ficariam distinguíveis apenas por uma coluna acidental de span, e uma implementação que disparasse o gatilho errado passaria nos dois testes.
  - **+19 codes**, cada um com **fase** e **chaves de `data`**, numa tabela normativa única que passa a ser fonte de verdade de severidade padrão, fase e payload ao mesmo tempo. Fase 6 (supressão) criada para os dois codes de diretiva.
  - **`ExternalBlockNode`** em `DomainNode`; `SymbolTableEntry` ganha `isExternal`, subdomínio opcional e `valid` (a marca de *declarado porém inválido* exigida pelo princípio do erro-raiz).
  - **`SuppressionDirective`** em `ProgramNode` — as diretivas precisam sobreviver até o validador.
  - **`PatternTag` 10 → 9**, e `astGenerated` deixa de ser proxy de "renderizável".
- **v0.2.1** — duas lacunas do contrato fechadas antes de o parser existir, encontradas em auditoria mecânica da suíte contra o catálogo:
  - **A unidade de `column` passa a ser normativa: unidades de código UTF-16** (§1, estilo LSP, coerente com o `end` exclusivo que a suíte já usava). Antes os documentos só diziam "1-indexed", o que deixava a escolha entre byte, code point e unidade UTF-16 a cargo de cada implementação. Não é detalhe acadêmico nesta linguagem: `GRAMMAR.md` §1 aceita identificadores acentuados e seis inputs da suíte são PT-BR — a linha 11 de `malformed-suppression-unknown-code` tem 85 unidades UTF-16 e 87 bytes. Nenhum span existente mudou (a suíte não tem caractere fora do BMP, então UTF-16 e code points coincidem nos 44 casos).
  - **Regra de integridade semântica de `data`: nada de prosa** (§1.2). O contrato dizia que a mensagem não é contrato e que o núcleo validador não conhece locale, mas nada impedia que a frase voltasse *dentro* de um valor de `data` — e tinha voltado, em dois codes. Agora §1.3 fixa a forma de `REMOVED_CONSTRUCT.replacement` (token literal da substituta) e de `SYNTAX_ERROR.expected` (lista de tokens separados por `", "`), e o teste geral é "se o valor mudaria ao traduzir a mensagem, ele não pertence a `data`".

---

## MESSAGES.md

Catálogo de mensagens de diagnóstico, PT + EN, com placeholders nomeados. Versão atual: **v0.1.1**.

- **v0.1.0** — artefato novo, criado na passada de propagação do `GRILLING.md` (D16). Recebe as strings que saíram de `RULES-EN.md`/`RULES-PT.md` quando `message` deixou o contrato do `Diagnostic`. 38 templates cobrindo os 35 codes (`CONFORMIST_CORE` e `MALFORMED_SUPPRESSION` declaram variantes explícitas, selecionadas por uma chave de `data`). Traz a regra de integridade verificável por script — todo placeholder precisa existir nas chaves de `data` do code, e vice-versa, nos dois idiomas — e o comportamento obrigatório de fallback, para que um template faltando nunca engula um diagnóstico real.
- **v0.1.1** — fechada a brecha de locale que a §0 prometia e a §1 não checava: **nova §1.1, "`data` não carrega prosa"**. Dois templates absorveram a frase que estava vazando pelo dado — `SYNTAX_ERROR` passa a dizer "expected one of {expected}" / "esperava um de {expected}" sobre uma lista de tokens, e `REMOVED_CONSTRUCT` passa a marcar `` `{replacement}` `` como token. O sintoma era visível só no PT: com `replacement: "`-x-` on its own"`, a mensagem renderizava *"use `-x-` on its own no lugar"*. A checagem de placeholders da §1 não pegava isso, porque a chave existia dos dois lados — daí a regra nova ser semântica e não mecânica.

---

## TEST_SUITE.md

Suíte de golden files (conformidade) para o parser e o validador semântico. Versão atual: **v0.2.1**.

- **v0.1.0** — versão inicial. 18 golden files cobrindo todos os `DiagnosticCode` de `AST_SCHEMA.md` v0.1.2 / `GRAMMAR.md` v0.1.9. Encontradas e corrigidas duas contradições estruturais na gramática durante o processo (ver `GRAMMAR.md` v0.1.8/v0.1.9 acima).
- **v0.1.1** — formalizadas duas classes de lacuna encontradas em auditoria da suíte contra `RULES-EN.md`/`RULES-PT.md`: (1) gatilhos vagos de `GENERIC_WITHOUT_OHS_WARNING` e `EXCESSIVE_SHARED_KERNEL_WARNING` (escopo por relacionamento vs. agregado, limiar numérico) — só mudança de texto em `RULES.md`, nenhum golden file precisou mudar; (2) as tags `[SW]` e `[BBM]` não tinham nenhum golden file — adicionados os casos auxiliares `separation-conflict-sw-directional` e `conformist-core-warning-bbm`. Total de casos: 18 → 20.
- **v0.2.0** — passada de propagação do `GRILLING.md`. Reescrita da suíte inteira: ver a entrada detalhada no próprio `TEST_SUITE.md` §7.
- **v0.2.1** — sincronizada com `AST_SCHEMA.md` v0.2.1 e `MESSAGES.md` v0.1.1. Dois `expected.json` mudaram, ambos por prosa em inglês dentro de `data`: `syntax-error` (`expected` vira a lista de tokens `"-->, <--, <->, -x-"`) e `removed-construct-sw` (`replacement` vira `"-x-"`). A §4 passa a declarar a unidade de `column` (UTF-16), e as duas menções a "24 regras" viraram 34. Nenhum span, nenhuma severidade e nenhum code mudou — os 44 casos continuam cobrindo os 35 codes.

---

## PRD.md

Requisitos de produto. Versão atual: **1.2.0**.

- **1.0.0 / 1.1.0** — versões iniciais, anteriores ao changelog centralizado.
- **1.2.0** — passada de propagação do `GRILLING.md` (D1, D5, D10–D13, D17, D20–D23, D25 · F4). Sistemas externos entram na taxonomia (§4.1) e na sintaxe (§4.2); nova §4.4 fixando o poder expressivo **deliberadamente diferente** das duas vistas; §4.5 passa a nove tags, com `[BBM]` numa categoria própria e uma nota respondendo "cadê o Separate Ways?"; §4.6 reescrita com três severidades e o catálogo completo, e a promessa de que erro **não** impede a visualização; §5.2 ganha a renderização degradada, os marcadores e o diagrama obsoleto; nova §5.5 sobre versão da linguagem e links antigos. O diferencial "linter opinativo" passa a ser afirmado na tabela competitiva (§2.4) em vez de implícito.
