# GRAMMAR: Open Domain Driven Specification (ODDS)

## 0. Propósito deste documento

Este arquivo é a **fonte de verdade sintática** da linguagem ODDS. Enquanto `RULES-EN.md` / `RULES-PT.md` descrevem o *significado* (semântica de DDD) e `PRD.md` descreve o *produto*, este documento descreve a *forma* — ou seja, o que é uma frase válida em ODDS, independentemente do que ela significa.

Ele existe para eliminar ambiguidade na hora de gerar o parser (à mão ou via IA): qualquer implementação do parser deve derivar estritamente desta gramática. Se o parser e este documento divergirem, um dos dois está errado e precisa ser corrigido — nunca resolva a divergência silenciosamente no código.

Notação: EBNF no estilo ISO/W3C.
- `=` define uma regra
- `,` sequência (concatenação)
- `|` alternativa
- `[ x ]` opcional (0 ou 1)
- `{ x }` repetição (0 ou mais)
- `( x )` agrupamento
- `"texto"` terminal literal
- `?texto?` descrição em prosa de um conjunto de caracteres (special sequence)

---

## 1. Estrutura léxica (tokens)

```ebnf
letter        = ? Unicode letter, incluindo acentuação PT-BR (á-ü, ç, etc.) ? ;
digit         = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;

identifier    = letter , { letter | digit | "_" } , ?e não deve coincidir exatamente com nenhuma reserved_word? ;

reserved_word = "domain" | "subdomain" | "context" | "mapping" | "external"
              | "core" | "supporting" | "generic"
              | "title" | "type" | "description" | "responsibilities" | "maturity" | "team" | "technology"
              | "owner"
              | "experimental" | "growing" | "mature" | "legacy" ;

line_comment  = "//" , { ?qualquer caractere exceto newline? } , newline ;
block_comment = "/*" , { ?qualquer caractere? } , "*/" ;
comment       = line_comment | block_comment ;

(* Um comentário de linha cujo primeiro token é o prefixo `odds-disable-next-line`
   NÃO é um comentário comum: é uma diretiva de supressão, e precisa sobreviver
   ao lexer. Ver a regra léxica correspondente abaixo e RULES.md §4. *)
suppression_directive = "//" , { " " | "\t" } , "odds-disable-next-line" ,
                        { ?qualquer caractere exceto newline? } , newline ;

whitespace    = " " | "\t" | "\r" | "\n" ;
newline       = "\n" | "\r\n" ;

string_literal  = '"' , { string_char } , '"' ;
string_char     = escape_sequence | ?qualquer caractere exceto '"', '\' ou newline? ;
escape_sequence = "\" , ( '"' | "\" ) ;
```

**Regras léxicas gerais:**
- Whitespace é insignificante sintaticamente (pode aparecer entre quaisquer dois tokens) e deve ser descartado pelo lexer antes de chegar ao parser — exceto para fins de rastreamento de linha/coluna (necessário para o painel de validação interativo, ver PRD §5.2 / GH-002).
- ⚠️ **Comentários não são mais totalmente descartáveis.** A regra anterior ("comentários são insignificantes e devem ser descartados pelo lexer") vale para `block_comment` e para todo `line_comment` **comum**, mas deixou de valer para o subconjunto que carrega diretiva. Um comentário de linha cujo primeiro token, após o `//`, é `odds-disable-next-line` é uma `suppression_directive` e **precisa sobreviver até o validador** (ver `AST_SCHEMA.md` §2.1: `ProgramNode.suppressions`). O lexer decide entre as duas produções olhando **apenas o prefixo** — nada além dele.
- ✅ **Decisão fechada:** a estrutura interna da diretiva (`<CODE>: <justificativa>`) **não** é validada pelo lexer nem pelo parser, e por isso a produção acima aceita qualquer resto de linha. Isso é deliberado: uma diretiva malformada (code inexistente, dois-pontos ausente, justificativa vazia) precisa produzir o diagnóstico `MALFORMED_SUPPRESSION` (`info`) na fase 6, e **nunca** um `SYNTAX_ERROR` — um comentário quebrado não pode derrubar o parsing do arquivo inteiro. Se o prefixo casar, é uma diretiva, mesmo que quebrada; se não casar, é comentário livre e o lexer o descarta como sempre.
- ODDS é **case-sensitive**. `context` ≠ `Context`; nomes de tags são sempre maiúsculas (`OHS`, não `ohs`).
- Identificadores de domínio/subdomínio/contexto **não** podem conter espaços (ex: `PaymentGateway`, não `Payment Gateway`). Nomes compostos usam PascalCase ou snake_case por convenção, mas isso é estilo, não regra sintática.
- ✅ **Decisão fechada:** `string_literal` suporta escape via barra invertida: `\"` produz uma aspa dupla literal dentro da string, e `\\` produz uma barra invertida literal. Nenhuma outra sequência de escape é reconhecida nesta versão (sem `\n`, `\t`, etc. — strings ODDS são de linha única, já que `newline` não é um caractere válido dentro de `string_char`).
- ✅ **Decisão fechada:** `reserved_word` (seção 1) não pode ser usada como `identifier` — ou seja, nenhum `domain`, `subdomain` ou `context` pode se chamar exatamente `domain`, `type`, `mature`, etc. (comparação é case-sensitive: `Type` como identificador é permitido, `type` não é). Isso evita ambiguidade no lexer, que resolve essas palavras como tokens de palavra-chave antes de considerá-las identificadores — sem essa regra, um contexto chamado `context mapping { ... }` quebraria o parser de forma pouco óbvia. As tags (`OHS`, `PL`, `ACL` etc.) e os conectores **não** entram em `reserved_word`, porque nunca aparecem na posição gramatical de um `identifier` (só dentro de colchetes ou como conectores) — não há ambiguidade real a proteger ali.

---

## 2. Estrutura de alto nível (Problem Space)

```ebnf
program         = { domain_decl } ;

domain_decl     = "domain" , identifier , "{" ,
                     [ title_decl ] ,
                     { subdomain_decl } ,
                     [ external_decl ] ,
                     [ mapping_decl ] ,
                   "}" ;

subdomain_decl  = "subdomain" , subdomain_type , identifier , "{" ,
                     [ title_decl ] ,
                     { subdomain_property_decl } ,
                     { context_decl } ,
                   "}" ;

subdomain_type  = identifier ;

external_decl   = "external" , "{" , { context_decl } , "}" ;

title_decl      = "title" , ":" , string_literal ;

subdomain_property_decl = subdomain_property_key , ":" , string_literal ;

subdomain_property_key  = "description" | "owner" ;

context_decl    = "context" , identifier , [ context_block ] ;

context_block   = "{" , [ title_decl ] , { property_decl } , "}" ;

property_decl   = property_key , ":" , property_value ;

property_key    = "type" | "description" | "responsibilities" | "maturity" | "team" | "technology" ;

property_value  = string_literal | string_list | maturity_value ;

string_list     = "[" , string_literal , { "," , string_literal } , "]" ;

maturity_value  = "experimental" | "growing" | "mature" | "legacy" ;
```

**Notas:**
- ✅ **Decisão fechada:** sistemas de terceiros (Stripe, o ERP de outra empresa, um legado que você não controla) são declarados no bloco `external_decl`, **único e anônimo**, posicionado entre os `subdomain_decl` e o `mapping_decl`. Quatro consequências que a produção acima já codifica:
  - **O invariante estrutural é preservado.** Todo `context` continua morando dentro de um bloco declarado, então `ORPHAN_CONTEXT` e a recuperação de erro da seção 5.1 seguem valendo sem exceção nova: um `context` solto direto no `domain` continua órfão.
  - **Sem grupos nomeáveis nem repetíveis** (`external Payments { }` + `external ERP { }`). Um nome de grupo sem semântica vira classificação improvisada ("external Legacy", "external Critical") que a ferramenta não sabe validar — recriando por outro caminho a taxonomia que `core`/`supporting`/`generic` deliberadamente não estende a terceiros. `[ external_decl ]` é opcional e no máximo um por `domain`.
  - **A ordem é fixa** (subdomains → external → mapping) para o arquivo ler como uma narrativa: *seu* domínio primeiro, a fronteira depois, as integrações por último.
  - **Contradição conceitual assumida:** o bloco do que é "externo" fica declarado *dentro* do `domain`, que por definição não o contém. Aceito por pragmatismo — a alternativa (declarar no nível do `program`, irmão do `domain`) colide com `INVALID_DOMAIN_CARDINALITY` e com a premissa "um arquivo = um domain" que sustenta o compartilhamento por URL. A contradição é nomeada em `RULES.md` §0.5 em vez de escondida, e é cancelada na vista de contenção, que desenha o bloco fora da fronteira do domínio.
- ✅ **Decisão fechada:** `domain`, `subdomain` e `context` podem opcionalmente declarar `title: "..."` — um rótulo textual livre para exibição no canvas/diagrama, distinto do identificador técnico (`identifier`) usado para referência (ex: em `mapping`). **Regra fixa de posição:** quando presente, `title` deve ser sempre a **primeira declaração dentro do bloco**, antes de qualquer filho (`subdomain_decl`/`context_decl`) ou, no caso do `context`, antes das demais `property_decl`. Essa é uma decisão deliberada — ao contrário das demais propriedades de `context_block` (que são livres de ordem), `title` funciona como um "cabeçalho" do bloco e o time preferiu essa posição fixa por legibilidade, mesmo custando um pouco de rigidez sintática a mais.
- Note que `title` em `context` **não faz parte** do conjunto `property_key` — foi deliberadamente extraído para uma produção própria (`title_decl`) para poder reutilizar exatamente a mesma regra (e a mesma restrição de posição) nos três níveis (`domain`, `subdomain`, `context`) sem duplicar lógica.
- "No máximo um `title` por bloco" é, como as demais restrições de cardinalidade desta gramática, uma regra **semântica** — sintaticamente `[ title_decl ]` já impede sozinho mais de um `title`, então essa em particular já é garantida pela própria gramática (não precisa de checagem extra no validador).
- ✅ **Decisão fechada:** um arquivo `.odds` contém **exatamente um** `domain`. Sintaticamente a gramática ainda permite `program = { domain_decl }` (zero ou mais), porque a restrição "exatamente um" é uma regra **semântica**, não sintática — ela pertence ao `RULES.md`, não a esta gramática — e já está formalizada lá (§1.A) como `INVALID_DOMAIN_CARDINALITY`, cobrindo tanto zero quanto mais de um `domain`.
- ✅ **Decisão fechada:** `context_decl` agora pode abrir um bloco opcional `context_block` (`{ }`), com propriedades no formato `chave: valor`. Isso resolve a pendência sobre o vocabulário de `attribute_list`, e substitui completamente a produção antiga (`attribute_list = attribute, { attribute }`, que era apenas uma lista de identificadores soltos sem valores associados).
- As seis propriedades definidas — `type`, `description`, `responsibilities`, `maturity`, `team`, `technology` — são as únicas reconhecidas nesta versão. Qualquer outra chave é um erro (sintático, já que `property_key` é um conjunto fechado de literais, não um `identifier` livre).
- `type` e `description` são texto livre (`string_literal`). ✅ **Decisão fechada:** `type` permanece texto livre permanentemente (não vai virar enum fechado como `maturity`) — sem um vocabulário real testado em uso, fechar um enum agora seria especulação, e é mais seguro apertar a regra depois (se necessário) do que afrouxar uma restrição já em uso e quebrar arquivos `.odds` existentes.
- `responsibilities` é a única propriedade que usa `string_list` (uma lista de responsabilidades faz sentido conceitualmente; um contexto raramente tem "uma responsabilidade só" declarada como texto único). Por consistência com `tag_group` (seção 3), uma vírgula sobrando no final (`["a", "b",]`) é um erro sintático explícito, não silenciosamente ignorada.
- `team` e `technology` são **string única de texto livre**, não lista estruturada (ex: `technology: "Node.js, Stripe API"`, tudo dentro de uma string). Ou seja, ao contrário de `responsibilities`, não há parsing estruturado de múltiplos valores aqui — é responsabilidade do autor do `.odds` formatar o texto como quiser dentro da string.
- `maturity` é um **enum fechado**: `experimental | growing | mature | legacy`, escrito sem aspas (é uma palavra reservada, não uma string). Isso é semanticamente diferente de `type`, que é texto livre — o parser deve rejeitar `maturity: "experimental"` (com aspas) como erro sintático, já que os valores do enum não são `string_literal`.
- Todas as propriedades são **opcionais e podem aparecer em qualquer ordem** dentro do `context_block`. A gramática não impõe ordem nem exige um conjunto mínimo — isso mantém o bloco flexível para contextos que só querem documentar uma ou duas propriedades.
- `context_block` é o mesmo ponto de extensão onde, na Fase 4 (Tactical Design), entrarão `aggregate`, `entity` e `value_object` (ver seção 6). A ideia é que `property_decl` e as futuras declarações táticas coexistam dentro do mesmo bloco, distinguidas pela palavra-chave inicial de cada linha.
- ✅ **Decisão fechada (v0.3.0, `ADR-0008`):** `subdomain_decl` aceita **duas** propriedades, num conjunto fechado próprio: `description` (por que o subdomínio existe) e `owner` (quem responde por ele). As duas são `string_literal`, opcionais e livres de ordem entre si, e ficam **depois** do `title_decl` e **antes** do primeiro `context_decl`. Uma propriedade escrita depois de um `context` é erro sintático, porque nenhuma produção a aceita ali.
- O conjunto é **próprio do subdomínio**, não uma liberação das seis chaves do `context_block`. As outras quatro são de espaço de solução e não têm significado neste nível, e `type` colidiria com `subdomain_type`. `description` reutiliza a chave do `context` pela mesma razão que `title_decl` existe: uma palavra para um significado nos dois níveis. A diferença de sentido (escopo de solução num, razão de negócio no outro) vem do nível, não da palavra.
- **Teste de admissão para qualquer chave futura de `subdomain`** (`ADR-0008`): ela só entra se **não puder contradizer** nem a classificação `core | supporting | generic` nem os contextos que o subdomínio contém. Uma chave que pode contradizer o que está declarado ao lado dela vai atrair um diagnóstico, e diagnóstico cujo gatilho é propriedade quebra a fronteira do `RULES.md` §0.2 para todas as propriedades de uma vez. É por isso que `maturity` e `volatility` não entraram.
- `owner` passou a ser **palavra reservada**, como todas as chaves de propriedade. Um `identifier` escrito `owner` (um contexto chamado `owner`, por exemplo) deixou de ser válido, e por isso esta mudança é MAJOR na `ODDS Language Version` (`CHANGELOG.md`). Ele recebe o mesmo `SYNTAX_ERROR` que qualquer outra palavra reservada usada como nome.

**Erros sintáticos cobertos nesta seção** (distintos dos erros semânticos de `RULES.md`):
- `domain` sem identificador → erro de parsing puro.
- ✅ **Decisão fechada (v0.1.8):** `subdomain` com `subdomain_type` fora de `core | supporting | generic` **não** é erro sintático. A gramática aceita qualquer `identifier` na posição de `subdomain_type` (ver produção na seção 2) — a rejeição de valores inválidos (`"Invalid Subdomain Modifiers"`, RULES §1.B, code `INVALID_SUBDOMAIN_TYPE`) é responsabilidade exclusiva do Visitor/validador semântico, que gera uma mensagem amigável apontando os três valores aceitos. Isso resolve uma contradição que existia entre esta gramática (que antes definia `subdomain_type` como enum fechado, tornando o code semântico teoricamente inalcançável) e a intenção original documentada em `RULES.md`. Não trave o parser nessa checagem.

---

## 3. Context Map (Solution Space — relacionamentos)

```ebnf
mapping_decl      = "mapping" , "{" ,
                      { relationship_decl } ,
                    "}" ;

relationship_decl = context_ref , [ tag_group ] , connector , [ tag_group ] , context_ref ;

context_ref       = identifier ;

connector          = "-->" | "<--" | "<->" | "-x-" ;

tag_group          = "[" , tag , { "," , tag } , "]" ;

tag                = "OHS" | "PL" | "ACL" | "CF" | "SK" | "C" | "S" | "P" | "BBM" ;

removed_tag        = "SW" ;   (* removida da linguagem — ver nota abaixo *)
```

**Notas:**
- ✅ **Decisão fechada:** a seção de relacionamentos é um bloco explícito, delimitado por chaves `{ }` (não por indentação nem por palavra-chave de fechamento tipo `end`), e sua palavra-chave é `mapping` (não `context_map`). Isso resolve a pendência #1 do changelog anterior. Motivação registrada na discussão: buscamos uma sintaxe mais próxima do estilo Mermaid (mais enxuta), mas optamos por manter as chaves em vez de indentação significativa, para não introduzir a classe de erros de indentação (tabs/espaços, reindentação ao colar trechos) em troca de um ganho puramente estético. `mapping` foi escolhido no lugar de `context_map` por ser mais curto e mais próximo do vocabulário natural que o time já estava usando nos exemplos.
- ✅ **Decisão fechada:** múltiplas tags do mesmo lado usam **lista separada por vírgula dentro de um único colchete** (`[OHS, PL]`), e não colchetes empilhados (`[OHS][PL]`). Um único colchete com uma tag só (`[OHS]`) é o caso degenerado dessa mesma regra (lista de um elemento), então nenhuma produção extra é necessária para o caso simples. **Atenção para a implementação:** o lexer/parser precisa tratar vírgula e espaços em branco opcionais dentro do colchete (`[OHS,PL]`, `[OHS, PL]` e `[OHS , PL]` devem ser equivalentes), e uma vírgula sobrando no final (`[OHS,]`) deve ser um erro sintático explícito, não silenciosamente ignorado.
- ✅ **Decisão fechada:** são **nove** tags. `SW` foi **removida da linguagem** — o conector `-x-` passou a significar *Free / Separate Ways* por si só (racional completo em `RULES.md` §0.2: conector e tag pertencem a taxonomias diferentes, e Separate Ways é a única célula em que as duas degeneram num ponto). `removed_tag` está registrada na gramática **não** como produção válida, mas para dar ao lexer um alvo reconhecível: encontrar `SW` dentro de um `tag_group` deve produzir o diagnóstico `REMOVED_CONSTRUCT` (`error`, fase 1), com recuperação — descarte a tag, continue parseando —, e **não** um `SYNTAX_ERROR` genérico do tipo "tag desconhecida". Ver seção 5.1 e `RULES.md` §6: toda construção removida ganha diagnóstico dedicado, para que um arquivo antigo (em Git ou numa URL compartilhada) explique ao usuário o que aconteceu em vez de só falhar.
- `tag_group` é **opcional em ambos os lados simultaneamente** — isso é sintaticamente válido (`ContextA --> ContextB`) e semanticamente gera o diagnóstico `UNDOCUMENTED_CONTRACT` (`info`, RULES §2.F), não um erro de parsing.
- A gramática **não** distingue aqui se uma tag está semanticamente correta para aquele lado/conector (ex: `OHS` do lado errado). Isso é 100% responsabilidade da camada de validação semântica (`RULES.md` seções C e D) — a gramática apenas garante que a *forma* `identifier [tags] connector [tags] identifier` seja respeitada.

---

## 4. Exemplo anotado

Este é o exemplo canônico da linguagem, e ele é **deliberadamente limpo**: produz **zero diagnósticos**, incluindo os de `warning` e `info`. É o mesmo arquivo do golden file `valid-baseline` (`TEST_SUITE.md`), e os dois devem ser mantidos idênticos — um exemplo canônico que dispara avisos ensina o vocabulário errado para todo mundo que o copia.

```odds
domain ECommercePlatform {
  title: "E-Commerce Platform"

  subdomain core Sales {
    title: "Vendas"
    description: "Converter intenção de compra em pedido pago"
    owner: "Diretoria Comercial"
    context OrderManagement
    context Checkout {
      description: "Fluxo de finalização de compra"
      maturity: mature
    }
  }

  subdomain supporting Fulfillment {
    context Shipping
    context Inventory
  }

  subdomain generic Payments {
    context PaymentGateway {
      title: "Gateway de Pagamentos"
      type: "gateway"
      description: "Integração com provedores de pagamento"
      responsibilities: ["Processar transações", "Tratar webhooks do provedor"]
      maturity: mature
      team: "Payments Squad"
      technology: "Node.js"
    }
  }

  external {
    context StripeApi {
      description: "Provedor de pagamentos de terceiros"
      technology: "Stripe REST API"
    }
  }

  mapping {
    Checkout        <-- [OHS, PL]  PaymentGateway
    OrderManagement [ACL] <--      Shipping
    Shipping        [SK]  <-> [SK] Inventory
    PaymentGateway  [ACL] <--      StripeApi
    Shipping        -x-            StripeApi
  }
}
```

Correspondência com a AST (ver `AST_SCHEMA.md`):
- `domain ECommercePlatform { ... }` → 1 `DomainNode`, com `title` opcional
- cada `subdomain ... { ... }` → 1 `SubdomainNode` filho, com `subdomainType` bruto (validado pelo Visitor, não pelo parser), e `title`, `description` e `owner` opcionais
- o bloco `external { ... }` → 1 `ExternalBlockNode`, irmão dos subdomains; seus filhos são `ContextNode` comuns — a externalidade é dada pela **posição na árvore**, não por um tipo de nó próprio
- cada `context X` → 1 `ContextNode`, com `title` opcional e um objeto `properties` opcional contendo `type`, `description`, `responsibilities[]`, `maturity`, `team`, `technology` (todos opcionais)
- cada linha dentro de `mapping` → 1 `RelationshipNode`, com `left`, `right`, `connector`, `leftTags[]`, `rightTags[]` e posição (linha/coluna) para navegação clique-a-clique

> 📝 **Por que o exemplo é escrito assim.** Três detalhes não são estéticos, e cada um evita um diagnóstico que a versão anterior deste exemplo disparava:
> - `Checkout <-- [OHS, PL] PaymentGateway` e não `Checkout --> [OHS, PL] PaymentGateway`: com `-->`, o lado direito é o Downstream, e `[OHS]`/`[PL]` são exclusivas de Upstream — a versão antiga deste exemplo estava mal posicionada (`UPSTREAM_ONLY_TAG_MISPLACED`). Invertido o conector, o genérico `PaymentGateway` é o Upstream que publica o serviço, o `core` o consome, e a direção fica de acordo com o DDD estratégico (`CORE_UPSTREAM_OF_GENERIC` não dispara).
> - `type: "gateway"` e não `type: "generic"`: `type` é texto livre com intenção totalmente diferente da classificação de subdomínio. Reaproveitar `generic` ali dentro de um `subdomain generic` ensinava vocabulário sobrecarregado no arquivo que todo mundo copia.
> - O Shared Kernel é entre dois contextos `supporting`, não entre dois `core`: um `core` dentro de um Shared Kernel dispara `CORE_IN_SHARED_KERNEL`.

---

## 5. Erros de parsing puro vs. erros semânticos

É importante manter essa fronteira clara para quem for implementar (humano ou IA), porque os dois tipos de erro têm tratamento diferente na UI (PRD §5.2):

| Categoria | Exemplo | Onde é detectado |
|---|---|---|
| Erro sintático (esta gramática) | `domain { ... }` sem identificador; `mapping` sem `{` de fechamento; conector desconhecido (`==>`) | Parser (fase de parsing, antes de gerar AST válida) |
| Erro semântico (RULES.md) | `context` fora de `subdomain`; `subdomain` com tipo inválido; tag `OHS` do lado Downstream | Visitor/Validador (fase pós-parsing, percorrendo a AST) |

Um erro sintático deve **impedir totalmente** a geração da AST (não há árvore válida para percorrer). Um erro semântico, por outro lado, **não impede nada**: a AST existe, e desde a decisão de renderização degradada (`RULES.md` §5) o diagrama continua sendo desenhado, com o elemento problemático marcado visualmente. Só o `SYNTAX_ERROR` puro congela o último diagrama bom — e mesmo aí o congelamento precisa ficar visível ao usuário.

> ⚠️ **Correção de uma afirmação antiga deste documento.** Versões anteriores diziam que "um erro semântico crítico impede a *renderização*". Isso deixou de valer. O motivo é prático, não filosófico: o PRD promete visualização instantânea durante a digitação, e **todo estado intermediário de um arquivo sendo digitado é um erro de sintaxe** — sob bloqueio estrito, o canvas piscaria vazio a cada tecla.

### 5.1 Exceção obrigatória: recuperação de erro (panic-mode)

Três diagnósticos não se encaixam na dicotomia acima e merecem uma regra própria de implementação: `ORPHAN_CONTEXT`, `ORPHAN_SUBDOMAIN` (`RULES.md` §1.A) e `REMOVED_CONSTRUCT` (`RULES.md` §6).

Estruturalmente, a gramática (seção 2) **permanece estrita**: `context_decl` só é uma produção válida dentro de `subdomain_decl` ou de `external_decl`, e `subdomain_decl` só é válido dentro de `domain_decl`. Isso é deliberado — a hierarquia Domain → Subdomain → Context é garantida pela própria forma da linguagem, não apenas por convenção ou checagem posterior, e a chegada do bloco `external` não abriu exceção nenhuma nisso: um `context` solto direto num `domain` continua sem corresponder a produção alguma. Um `subdomain` solto fora de qualquer `domain`, idem.

Isso normalmente significaria `SYNTAX_ERROR` puro (parser aborta, nenhuma AST é gerada — ver tabela acima). Só que, diferente de outros erros sintáticos genéricos (ex: conector desconhecido, chave não fechada), estes casos têm um diagnóstico próprio e uma mensagem amigável já definidos (`RULES.md` §1.A, `MESSAGES.md`) e representam erros comuns o bastante para merecerem tratamento especial. O mesmo raciocínio vale para `[SW]`: escrever uma tag que existiu numa versão anterior da linguagem é um erro previsível, e falhar com "tag desconhecida" desperdiça a única chance de explicar o que aconteceu.

✅ **Decisão fechada:** uma implementação em conformidade **deve** usar recuperação de erro ("panic-mode recovery") especificamente nesses três casos. Ao encontrar um `context` diretamente dentro de um `domain` (fora de qualquer `subdomain` e de `external`), um `subdomain` fora do escopo de qualquer `domain`, ou uma `removed_tag` dentro de um `tag_group`, o parser não deve abortar a geração da AST inteira. Em vez disso, deve:

1. Descartar a construção malformada (consumindo os tokens até um ponto de recuperação seguro — ex: a chave de fechamento correspondente, ou a próxima palavra-chave reconhecida no mesmo nível de aninhamento; no caso da tag removida, apenas a tag).
2. Emitir um `Diagnostic` com o code correspondente — `ORPHAN_CONTEXT`, `ORPHAN_SUBDOMAIN` ou `REMOVED_CONSTRUCT` (ver `AST_SCHEMA.md` §1.3, todos de **fase 1**) — e o `span` exato da construção descartada.
3. **Registrar a declaração descartada como inválida**, em vez de simplesmente esquecê-la (ver abaixo).
4. **Continuar parseando o restante do arquivo normalmente.**

Diferente de um `SYNTAX_ERROR` comum, esses diagnósticos **não impedem** que uma AST (parcial, mas válida para o resto do arquivo) seja gerada — isso é essencial para que o painel de validação (PRD §5.2/GH-002) possa reportar múltiplos problemas de uma vez, em vez de forçar o usuário a corrigir um erro estrutural por vez antes de ver qualquer outro diagnóstico. Note que, por essa razão, esses três codes são produzidos **pelo parser durante a recuperação**, não pelo Visitor semântico — mesmo estando listados junto aos demais erros em `RULES.md` §1.A por organização temática, não por fase de implementação. Ver nota correspondente em `AST_SCHEMA.md` §1.5.

> ⚠️ **O passo 3 é novo e não é opcional: descartar não é esquecer.** Um `context` órfão descartado precisa **entrar na tabela de símbolos marcado como inválido** (`SymbolTableEntry.valid: false`, `AST_SCHEMA.md` §5). Se ele simplesmente desaparecer, toda linha do `mapping` que o referencia passa a emitir `PHANTOM_REFERENCE` — um erro do usuário, dois diagnósticos, e o segundo **falso**: o contexto *foi* declarado, apenas no lugar errado. É o princípio do erro-raiz (`RULES.md` §3.1), e é também o que permite ao renderizador desenhar o nó fantasma marcado em vez de nada.

---

## 6. Evolução futura (Fase 4 — Tactical Design)

Fora de escopo do MVP, mas registrado aqui para não quebrar a gramática retroativamente quando chegar a hora (PRD §4.7 / §9.3, GH-004):

```ebnf
(* RASCUNHO — não implementar antes da Fase 4 *)
context_block   = "{" , { property_decl | tactical_decl } , "}" ;   (* atualiza a regra da seção 2 *)
tactical_decl   = aggregate_decl ;
aggregate_decl  = "aggregate" , identifier , "{" , { entity_decl | value_object_decl } , "}" ;
entity_decl     = "entity" , identifier ;
value_object_decl = "value_object" , identifier ;
```

Como `context_block` já existe desde a v0.1.3 (ver seção 2, propriedades chave-valor), a Fase 4 só precisa **estender** essa regra para aceitar `tactical_decl` como alternativa a `property_decl` dentro do mesmo bloco — não é mais uma mudança estrutural nova, é uma extensão da produção existente. Mantendo a nota aqui para o time de linguagem não esquecer de fazer essa extensão quando chegar a hora, e não recriar um bloco separado por engano.

---

## 7. Pendências para fechar antes da Fase 1 (Parser)

Todas as pendências originais foram resolvidas. Nenhuma pendência em aberto nesta versão da gramática.

### Decisões resolvidas

- ✅ **Palavra-chave e delimitação do bloco de relacionamentos**: bloco explícito `mapping { }`, delimitado por chaves. Ver seção 3 para o racional completo (inspiração no Mermaid, mas mantendo chaves em vez de indentação para evitar erros de indentação).
- ✅ **Sintaxe de múltiplas tags**: lista separada por vírgula em um único colchete (`[OHS, PL]`), não colchetes empilhados. Ver seção 3.
- ✅ **Vocabulário de propriedades de contexto**: bloco chave-valor `context_block` com seis propriedades (`type`, `description`, `responsibilities`, `maturity`, `team`, `technology`); `responsibilities` é lista, `team`/`technology` são string única, `maturity` é enum fechado (`experimental | growing | mature | legacy`). Ver seção 2.
- ✅ **Um `domain` por arquivo**: exatamente um; restrição semântica, formalizada em `RULES.md` §1.A como `INVALID_DOMAIN_CARDINALITY`.
- ✅ **Rótulos/display names**: resolvido com a propriedade `title` (string livre), disponível em `domain`, `subdomain` e `context`, sempre como primeira declaração do bloco quando presente. Ver seção 2.
- ✅ **`type` como enum fechado**: decidido manter texto livre permanentemente. Ver seção 2.
- ✅ **Escape de aspas em `string_literal`**: adicionado suporte a `\"` e `\\`. Ver seção 1.
- ✅ **Palavras reservadas**: `reserved_word` não pode ser usada como `identifier` (case-sensitive). Ver seção 1.
- ✅ **Contradição em `subdomain_type`**: gramática aberta (`identifier`), rejeição de valores fica 100% a cargo do Visitor (code `INVALID_SUBDOMAIN_TYPE`). Ver seção 2. Encontrada durante o desenho da suíte de golden files.
- ✅ **`ORPHAN_CONTEXT`/`ORPHAN_SUBDOMAIN` código morto**: gramática permanece estrita (hierarquia garantida pela forma), mas o parser é obrigado a usar recuperação de erro para esses casos específicos, em vez de abortar a AST inteira. Ver seção 5.1. Também encontrada durante o desenho da suíte de golden files.
- ✅ **Sistemas de terceiros**: bloco `external_decl`, único e anônimo, entre os subdomains e o mapping. Ver seção 2.
- ✅ **Supressão de diagnósticos**: `suppression_directive` na seção 1; comentários deixam de ser universalmente descartáveis, e a validação da diretiva é 100% da fase 6 (nunca `SYNTAX_ERROR`). Ver seção 1 e `RULES.md` §4.
- ✅ **Remoção da tag `SW`**: nove tags; `-x-` carrega Separate Ways sozinho, e `[SW]` produz `REMOVED_CONSTRUCT` com recuperação. Ver seções 3 e 5.1.

### Ação pendente fora desta gramática

Nenhuma. As duas ações que constavam aqui — formalizar "exatamente um `domain` por arquivo" e a unicidade de nomes de `context` — **já foram propagadas** para `RULES-EN.md`/`RULES-PT.md` §1.A, como `INVALID_DOMAIN_CARDINALITY` e `DUPLICATE_CONTEXT`, ambas com golden file próprio. Esta seção existia porque a gramática decidiu duas regras semânticas antes de o `RULES.md` as registrar; a defasagem acabou.

---

## Changelog

Histórico de versões centralizado em [`CHANGELOG.md`](./CHANGELOG.md) (seção `## GRAMMAR.md`). Versão atual: **v0.3.0**. Qualquer alteração a este arquivo deve ganhar uma entrada nova lá, não aqui.
