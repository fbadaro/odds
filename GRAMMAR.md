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

reserved_word = "domain" | "subdomain" | "context" | "mapping"
              | "core" | "supporting" | "generic"
              | "title" | "type" | "description" | "responsibilities" | "maturity" | "team" | "technology"
              | "experimental" | "growing" | "mature" | "legacy" ;

line_comment  = "//" , { ?qualquer caractere exceto newline? } , newline ;
block_comment = "/*" , { ?qualquer caractere? } , "*/" ;
comment       = line_comment | block_comment ;

whitespace    = " " | "\t" | "\r" | "\n" ;
newline       = "\n" | "\r\n" ;

string_literal  = '"' , { string_char } , '"' ;
string_char     = escape_sequence | ?qualquer caractere exceto '"', '\' ou newline? ;
escape_sequence = "\" , ( '"' | "\" ) ;
```

**Regras léxicas gerais:**
- Whitespace e comentários são insignificantes sintaticamente (podem aparecer entre quaisquer dois tokens) e devem ser descartados pelo lexer antes de chegar ao parser — exceto para fins de rastreamento de linha/coluna (necessário para o painel de validação interativo, ver PRD §5.2 / GH-002).
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
                     [ mapping_decl ] ,
                   "}" ;

subdomain_decl  = "subdomain" , subdomain_type , identifier , "{" ,
                     [ title_decl ] ,
                     { context_decl } ,
                   "}" ;

subdomain_type  = "core" | "supporting" | "generic" ;

title_decl      = "title" , ":" , string_literal ;

context_decl    = "context" , identifier , [ context_block ] ;

context_block   = "{" , [ title_decl ] , { property_decl } , "}" ;

property_decl   = property_key , ":" , property_value ;

property_key    = "type" | "description" | "responsibilities" | "maturity" | "team" | "technology" ;

property_value  = string_literal | string_list | maturity_value ;

string_list     = "[" , string_literal , { "," , string_literal } , "]" ;

maturity_value  = "experimental" | "growing" | "mature" | "legacy" ;
```

**Notas:**
- ✅ **Decisão fechada:** `domain`, `subdomain` e `context` podem opcionalmente declarar `title: "..."` — um rótulo textual livre para exibição no canvas/diagrama, distinto do identificador técnico (`identifier`) usado para referência (ex: em `mapping`). **Regra fixa de posição:** quando presente, `title` deve ser sempre a **primeira declaração dentro do bloco**, antes de qualquer filho (`subdomain_decl`/`context_decl`) ou, no caso do `context`, antes das demais `property_decl`. Essa é uma decisão deliberada — ao contrário das demais propriedades de `context_block` (que são livres de ordem), `title` funciona como um "cabeçalho" do bloco e o time preferiu essa posição fixa por legibilidade, mesmo custando um pouco de rigidez sintática a mais.
- Note que `title` em `context` **não faz parte** do conjunto `property_key` — foi deliberadamente extraído para uma produção própria (`title_decl`) para poder reutilizar exatamente a mesma regra (e a mesma restrição de posição) nos três níveis (`domain`, `subdomain`, `context`) sem duplicar lógica.
- "No máximo um `title` por bloco" é, como as demais restrições de cardinalidade desta gramática, uma regra **semântica** — sintaticamente `[ title_decl ]` já impede sozinho mais de um `title`, então essa em particular já é garantida pela própria gramática (não precisa de checagem extra no validador).
- ✅ **Decisão fechada:** um arquivo `.odds` contém **exatamente um** `domain`. Sintaticamente a gramática ainda permite `program = { domain_decl }` (zero ou mais), porque a restrição "exatamente um" é uma regra **semântica**, não sintática — ela pertence ao `RULES.md` (validação de tipo "Multiple Domains Declared" ou similar), não a esta gramática. **Ação pendente:** adicionar essa regra explicitamente em `RULES-EN.md`/`RULES-PT.md` como um novo erro crítico (arquivo com zero ou mais de um `domain` declarado) — ainda não foi feito, só está decidido aqui.
- ✅ **Decisão fechada:** `context_decl` agora pode abrir um bloco opcional `context_block` (`{ }`), com propriedades no formato `chave: valor`. Isso resolve a pendência sobre o vocabulário de `attribute_list`, e substitui completamente a produção antiga (`attribute_list = attribute, { attribute }`, que era apenas uma lista de identificadores soltos sem valores associados).
- As seis propriedades definidas — `type`, `description`, `responsibilities`, `maturity`, `team`, `technology` — são as únicas reconhecidas nesta versão. Qualquer outra chave é um erro (sintático, já que `property_key` é um conjunto fechado de literais, não um `identifier` livre).
- `type` e `description` são texto livre (`string_literal`). ✅ **Decisão fechada:** `type` permanece texto livre permanentemente (não vai virar enum fechado como `maturity`) — sem um vocabulário real testado em uso, fechar um enum agora seria especulação, e é mais seguro apertar a regra depois (se necessário) do que afrouxar uma restrição já em uso e quebrar arquivos `.odds` existentes.
- `responsibilities` é a única propriedade que usa `string_list` (uma lista de responsabilidades faz sentido conceitualmente; um contexto raramente tem "uma responsabilidade só" declarada como texto único). Por consistência com `tag_group` (seção 3), uma vírgula sobrando no final (`["a", "b",]`) é um erro sintático explícito, não silenciosamente ignorada.
- `team` e `technology` são **string única de texto livre**, não lista estruturada (ex: `technology: "Node.js, Stripe API"`, tudo dentro de uma string). Ou seja, ao contrário de `responsibilities`, não há parsing estruturado de múltiplos valores aqui — é responsabilidade do autor do `.odds` formatar o texto como quiser dentro da string.
- `maturity` é um **enum fechado**: `experimental | growing | mature | legacy`, escrito sem aspas (é uma palavra reservada, não uma string). Isso é semanticamente diferente de `type`, que é texto livre — o parser deve rejeitar `maturity: "experimental"` (com aspas) como erro sintático, já que os valores do enum não são `string_literal`.
- Todas as propriedades são **opcionais e podem aparecer em qualquer ordem** dentro do `context_block`. A gramática não impõe ordem nem exige um conjunto mínimo — isso mantém o bloco flexível para contextos que só querem documentar uma ou duas propriedades.
- `context_block` é o mesmo ponto de extensão onde, na Fase 4 (Tactical Design), entrarão `aggregate`, `entity` e `value_object` (ver seção 6). A ideia é que `property_decl` e as futuras declarações táticas coexistam dentro do mesmo bloco, distinguidas pela palavra-chave inicial de cada linha.

**Erros sintáticos cobertos nesta seção** (distintos dos erros semânticos de `RULES.md`):
- `domain` sem identificador → erro de parsing puro.
- `subdomain` com `subdomain_type` fora de `core | supporting | generic` — **atenção**: tecnicamente o parser aceita qualquer `identifier` aqui e a rejeição de valores inválidos (`"Invalid Subdomain Modifiers"`, RULES §1.B) é uma validação semântica pós-parsing, não uma regra léxica. Mantemos isso como nota para quem for implementar: não trave o parser nessa checagem, deixe para o Visitor/validador gerar o erro com mensagem amigável.

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

tag                = "OHS" | "PL" | "ACL" | "CF" | "SK" | "C" | "S" | "P" | "SW" | "BBM" ;
```

**Notas:**
- ✅ **Decisão fechada:** a seção de relacionamentos é um bloco explícito, delimitado por chaves `{ }` (não por indentação nem por palavra-chave de fechamento tipo `end`), e sua palavra-chave é `mapping` (não `context_map`). Isso resolve a pendência #1 do changelog anterior. Motivação registrada na discussão: buscamos uma sintaxe mais próxima do estilo Mermaid (mais enxuta), mas optamos por manter as chaves em vez de indentação significativa, para não introduzir a classe de erros de indentação (tabs/espaços, reindentação ao colar trechos) em troca de um ganho puramente estético. `mapping` foi escolhido no lugar de `context_map` por ser mais curto e mais próximo do vocabulário natural que o time já estava usando nos exemplos.
- ✅ **Decisão fechada:** múltiplas tags do mesmo lado usam **lista separada por vírgula dentro de um único colchete** (`[OHS, PL]`), e não colchetes empilhados (`[OHS][PL]`). Um único colchete com uma tag só (`[OHS]`) é o caso degenerado dessa mesma regra (lista de um elemento), então nenhuma produção extra é necessária para o caso simples. **Atenção para a implementação:** o lexer/parser precisa tratar vírgula e espaços em branco opcionais dentro do colchete (`[OHS,PL]`, `[OHS, PL]` e `[OHS , PL]` devem ser equivalentes), e uma vírgula sobrando no final (`[OHS,]`) deve ser um erro sintático explícito, não silenciosamente ignorado.
- `tag_group` é **opcional em ambos os lados simultaneamente** — isso é sintaticamente válido (`ContextA --> ContextB`) e semanticamente gera o warning "Undocumented Integration Contract" (RULES §E), não um erro de parsing.
- A gramática **não** distingue aqui se uma tag está semanticamente correta para aquele lado/conector (ex: `OHS` do lado errado). Isso é 100% responsabilidade da camada de validação semântica (`RULES.md` seções C e D) — a gramática apenas garante que a *forma* `identifier [tags] connector [tags] identifier` seja respeitada.

---

## 4. Exemplo anotado

```odds
domain ECommercePlatform {
  title: "E-Commerce Platform"

  subdomain core Sales {
    title: "Vendas"
    context OrderManagement
    context Checkout
  }

  subdomain supporting Fulfillment {
    context Shipping
  }

  subdomain generic Payments {
    context PaymentGateway {
      title: "Gateway de Pagamentos Stripe"
      type: "generic"
      description: "Integração com gateways de pagamento de terceiros"
      responsibilities: ["Processar transações", "Tratar webhooks do provedor"]
      maturity: mature
      team: "Payments Squad"
      technology: "Node.js, Stripe API"
    }
  }

  mapping {
    Checkout           --> [OHS, PL]        PaymentGateway
    OrderManagement   [ACL] <--                          Shipping
    Checkout          [SK]  <->  [SK]                    OrderManagement
    Shipping                     -x-                     PaymentGateway
  }
}
```

Correspondência com a AST (ver `AST_SCHEMA.md`, a ser criado):
- `domain ECommercePlatform { ... }` → 1 `DomainNode`, com `title` opcional
- cada `subdomain ... { ... }` → 1 `SubdomainNode` filho, com `type ∈ {core, supporting, generic}` e `title` opcional
- cada `context X` → 1 `ContextNode` filho do `SubdomainNode` atual, com `title` opcional e um objeto `properties` opcional contendo `type`, `description`, `responsibilities[]`, `maturity`, `team`, `technology` (todos opcionais)
- cada linha dentro de `mapping` → 1 `RelationshipNode`, com `left`, `right`, `connector`, `leftTags[]`, `rightTags[]` e posição (linha/coluna) para navegação clique-a-clique

> 📝 **Caso de teste candidato para a suíte de golden files:** durante a discussão desta gramática, surgiu um exemplo com o mesmo nome de contexto (`PaymentGateway`) declarado em dois `subdomain` diferentes. Isso deve gerar um erro semântico de contexto duplicado — vale registrar como um dos primeiros golden files da Fase 1 (ver artefato pendente "suíte de testes golden files").

---

## 5. Erros de parsing puro vs. erros semânticos

É importante manter essa fronteira clara para quem for implementar (humano ou IA), porque os dois tipos de erro têm tratamento diferente na UI (PRD §5.2):

| Categoria | Exemplo | Onde é detectado |
|---|---|---|
| Erro sintático (esta gramática) | `domain { ... }` sem identificador; `mapping` sem `{` de fechamento; conector desconhecido (`==>`) | Parser (fase de parsing, antes de gerar AST válida) |
| Erro semântico (RULES.md) | `context` fora de `subdomain`; `subdomain` com tipo inválido; tag `OHS` do lado Downstream | Visitor/Validador (fase pós-parsing, percorrendo a AST) |

Um erro sintático deve **impedir totalmente** a geração da AST (não há árvore válida para percorrer). Um erro semântico crítico impede a *renderização*, mas a AST ainda existe e pode ser usada pelo editor para navegação/highlight.

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
- ✅ **Um `domain` por arquivo**: exatamente um, restrição semântica a ser adicionada ao `RULES.md` (ainda não feito — ver seção 2).
- ✅ **Rótulos/display names**: resolvido com a propriedade `title` (string livre), disponível em `domain`, `subdomain` e `context`, sempre como primeira declaração do bloco quando presente. Ver seção 2.
- ✅ **`type` como enum fechado**: decidido manter texto livre permanentemente. Ver seção 2.
- ✅ **Escape de aspas em `string_literal`**: adicionado suporte a `\"` e `\\`. Ver seção 1.
- ✅ **Palavras reservadas**: `reserved_word` não pode ser usada como `identifier` (case-sensitive). Ver seção 1.

### Ação pendente fora desta gramática

Duas decisões registradas aqui ainda precisam ser propagadas para outro artefato:
- A regra "exatamente um `domain` por arquivo" é semântica e deve virar um novo erro crítico em `RULES-EN.md`/`RULES-PT.md`. Ainda não foi escrita lá — só está decidida e documentada nesta gramática.
- Unicidade de nomes de `context` dentro do mesmo `domain` (um mesmo nome não pode aparecer em dois `subdomain` diferentes) — já citada como caso de teste candidato na seção 4, mas ainda não está formalizada como regra em `RULES.md`. Hoje o `RULES.md` só cobre "Phantom Reference" (referência a contexto inexistente); duplicidade de nome é uma regra distinta e ainda não escrita.

---

## Changelog

- **v0.1.0** — versão inicial, derivada de `RULES-EN.md` v1 e `PRD.md` v1.1.0. Pendências listadas na seção 7 ainda não resolvidas com o time.
- **v0.1.1** — resolvida a pendência do bloco de relacionamentos: renomeado `context_map` → `mapping`; mantida delimitação por chaves `{ }` em vez de indentação ou palavra-chave de fechamento (`end`). Adicionado caso de teste candidato (contexto duplicado em dois subdomains) para a futura suíte de golden files.
- **v0.1.2** — resolvida a pendência de múltiplas tags: adotada a sintaxe de lista em colchete único (`[OHS, PL]`) no lugar de colchetes empilhados (`[OHS][PL]`).
- **v0.1.3** — resolvida a pendência de propriedades de contexto: `attribute_list` (lista de identificadores soltos) substituída por `context_block`, um bloco `{ }` de propriedades chave-valor (`type`, `description`, `responsibilities`, `maturity`, `team`, `technology`). Adicionados `string_literal` e `string_list` à estrutura léxica (seção 1). Duas pendências novas registradas: possível enum futuro para `type`, e suporte a escape de aspas em strings.
- **v0.1.4** — resolvida a pendência de cardinalidade de `domain`: exatamente um `domain` por arquivo `.odds`. Regra registrada como semântica (pertence ao `RULES.md`, ainda não adicionada lá — ação pendente).
- **v0.1.5** — resolvida a pendência de rótulos/display names: adicionada a propriedade `title` (string livre) a `domain`, `subdomain` e `context`, com posição fixa (sempre a primeira declaração do bloco, quando presente). `title` foi extraído como produção própria (`title_decl`), separada de `property_key`, para ser reutilizável nos três níveis sem duplicar regras.
- **v0.1.6** — resolvidas as duas últimas pendências: `type` permanece texto livre permanentemente (decisão consciente, não enum); `string_literal` passou a suportar escape via barra invertida (`\"` e `\\`). **Todas as pendências originais da gramática estão resolvidas nesta versão.**
- **v0.1.7** — fechamento de lacunas identificadas em revisão final: (1) adicionada `reserved_word`, proibindo identificadores que coincidam com palavras-chave da linguagem; (2) estendida a regra de vírgula sobrando (já aplicada a `tag_group`) para `string_list`, por consistência; (3) registrada como ação pendente a formalização da regra de unicidade de nomes de `context` em `RULES.md`, junto da regra de cardinalidade de `domain`.
