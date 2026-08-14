# RULES: Semântica da linguagem ODDS (Português)

> Este arquivo é a tradução paralela de `RULES-EN.md`. **Toda edição aqui precisa ser espelhada lá, na mesma passada.** O `GRAMMAR.md` é dono da *forma* de um arquivo `.odds` válido; este arquivo é dono do *significado*.
>
> **As strings de mensagem não moram mais aqui.** Um diagnóstico é `severity` + `code` + `span` + `data` (`AST_SCHEMA.md` §1.2); a frase exibida ao usuário é renderizada a partir do `MESSAGES.md`, que mantém PT e EN lado a lado. Este arquivo define **gatilhos, severidades e escopo** — que é o que uma implementação precisa acertar.
>
> *Nota de tradução: as descrições das duas tabelas conceituais (Team Relationships e Context Map Patterns) seguem em inglês, espelhando o conteúdo de `RULES-EN.md` (fonte de verdade); a tradução integral desses dois blocos de texto continua sendo um item pendente separado.*

---

## 0. O modelo conceitual

As seções 1 e 2 são uma lista de regras. Esta seção é o modelo de onde essas regras saem — leia primeiro, porque toda regra abaixo é aplicação de algo dito aqui, e toda regra *futura* precisa responder à §0.4 antes de ser escrita.

### 0.1 A ODDS é um linter opinativo

A ODDS não é uma notação neutra. Além de checar integridade estrutural, a ferramenta **emite juízo sobre a qualidade do desenho estratégico** — é esse o diferencial frente a ferramentas de desenho e a outros mapeadores de contexto baseados em texto, e ele fica afirmado aqui em vez de implícito.

Um linter opinativo que é ignorado é pior do que nenhum linter, então a opinião é estratificada em três níveis de severidade:

| Severidade | Significado | Bloqueia a renderização? | Suprimível? |
|---|---|:---:|:---:|
| `error` | Integridade ou coerência do modelo violada. O elemento é registrado como *declarado porém inválido* e sai do pipeline (§3.1). | Não — ver §5 | ❌ nunca |
| `warning` | Um padrão razoavelmente consensual na literatura de DDD está sendo violado. O modelo é coerente; o desenho é arriscado. | Não | ✅ |
| `info` | Higiene de documentação ou opinião de estilo. | Não | ✅ |

A severidade de uma regra é propriedade da regra, registrada em `AST_SCHEMA.md` §1.3. Ela **não** está codificada no nome do code e **não** está codificada no texto da mensagem — uma implementação jamais deve interpretar um nome ou uma string para descobrir a gravidade de algo.

### 0.2 As três categorias de anotação

Uma linha de relacionamento carrega anotações de três naturezas diferentes. Elas são independentes, respondem a perguntas diferentes, e confundi-las é a origem de quase toda a ambiguidade que esta linguagem tinha antes de isso ser escrito:

| Categoria | Onde vive na sintaxe | O que responde |
|---|---|---|
| **Team Relationship** | o **conector** (`-->`, `<--`, `<->`, `-x-`) | Qual é a *forma* da dependência entre os dois times? |
| **Context Map Pattern** | a **tag** (`[OHS]`, `[ACL]`, `[SK]`, …) | Qual *solução* foi aplicada na fronteira, dada aquela forma? |
| **Caracterização do sistema** | `[BBM]`, ocupante único | Que *tipo de sistema* é este? |

Os dois primeiros eixos são independentes em todas as combinações — você escolhe a forma da dependência e, separadamente, o padrão aplicado sobre ela. **Separate Ways é a única célula em que os dois eixos degeneram num ponto só:** é o padrão cuja aplicação é justamente a *ausência* de integração, o que o torna indistinguível da forma de dependência "Free". Não há solução a escolher sobre uma não-dependência.

Por essa razão, e só por ela, a ODDS carrega Separate Ways no **conector** e não tem tag `[SW]`. `-x-` sozinho significa *Free / Separate Ways*. Uma tag que só pode ser redundante ou errada carrega zero bits: com `[SW]` na linguagem, `A -x- B`, `A [SW] -x- B`, `A -x- [SW] B` e `A [SW] -x- [SW] B` eram quatro grafias de um significado só, enquanto `A [SW] --> B` era um erro que existia apenas porque a tag existia. Nada se perdeu com a remoção — na prática, toda linha `-x-` que alguém se dá ao trabalho de escrever *é* uma decisão deliberada de não integrar. O nome do padrão DDD sobrevive onde importa: na legenda do diagrama e na tabela de padrões abaixo, não como token.

`[BBM]` é a terceira categoria porque falha no teste das outras duas: não descreve uma solução aplicada sobre uma dependência e não renomeia a dependência — ele **caracteriza o sistema** de uma das pontas. É por isso que `[BBM]` é a única anotação **sem regra de posição e sem regra de conflito**: é legítima em qualquer conector e em qualquer lado (§1.C). Restringi-la a linhas direcionais converteria a limitação de uma *regra* em limitação da *linguagem*, e tornaria inexprimíveis duas afirmações legítimas: *"aquele ERP é um pântano e por isso decidimos não integrar"* (`-x-`) e *"nós alimentamos o pântano de um terceiro"* (`[BBM]` no Downstream).

**Critério para qualquer anotação futura:** ela descreve uma solução aplicada sobre uma dependência, apenas renomeia a dependência, ou caracteriza um sistema? A primeira é tag; a segunda é conector e não pode virar tag; a terceira acompanha o `[BBM]`.

### 0.3 Uma tag qualifica uma relação, nunca um contexto

**Toda tag tem escopo de relação, sem exceção.** Uma tag qualifica *um lado de uma relação específica*, não o contexto como um todo. `A` pode legitimamente ser `[CF]` com `X` e `[ACL]` com `Y` — são duas integrações diferentes e duas decisões diferentes.

Isso vale também para `[BBM]`, mesmo que `[BBM]` descreva o sistema em vez do contrato. Mantê-lo como tag preserva uma fronteira barata de explicar e que vale mais do que a conveniência que custa:

> **tag = contrato validável · propriedade = documentação**

É essa fronteira que responde, sem esforço adicional, por que `maturity: legacy` não dispara nada e por que `team` é texto livre sem consequência (ver Propriedades de Contexto abaixo). Transformar `[BBM]` em propriedade de contexto faria dela a primeira propriedade normativa, e a promessa *"preencha `team` sem medo de ser julgado por isso"* morreria junto.

**O custo aceito, registrado como limitação conhecida:** `[BBM]` precisa ser repetida em toda linha que toca aquele sistema, e um contexto pode carregar `[BBM]` numa linha e não em outra. A regra `INCONSISTENT_BBM` (§2) existe para fechar esse furo sem tocar na fronteira — ela opera sobre tags, não sobre propriedades.

### 0.4 Dois critérios de admissão para toda regra nova

O catálogo saltou de 4 para 24 regras numa única passada de desenho, num produto que valida a cada tecla. Sem um freio explícito, um arquivo de 30 linhas vira oito diagnósticos e o usuário aprende a ignorar o painel inteiro. **Os dois critérios abaixo são obrigatórios para qualquer regra acrescentada daqui em diante**, e cada regra da §2 registra sua resposta ao primeiro.

**1. Princípio da autoria — a regra pressupõe controle sobre o sistema?**
Isenta-se o que pressupõe autoria; mantém-se o que descreve *a decisão de integração do próprio autor*. Você não desenha a API de um terceiro, então uma regra exigindo que ele publique um Open-Host Service é ruído inacionável. Mas *como você integra* com ele é decisão inteiramente sua, e é exatamente o que o mapa deveria documentar — mais ainda com um terceiro, não menos.

> 📝 **Achado registrado durante a propagação.** Com contextos externos de primeira classe (§0.5), a aplicação-bandeira deste princípio virou *estrutural* em vez de exceção nomeada: um contexto externo não pertence a subdomínio nenhum, logo não tem tipo de subdomínio, logo `GENERIC_WITHOUT_OHS` e as regras `CORE_*` não conseguem disparar contra ele — nenhuma cláusula de isenção é necessária. Nem por isso o princípio ficou redundante: ele segue sendo o teste de admissão de toda regra nova, e é o que mantém `UNDOCUMENTED_CONTRACT` e as regras de tag valendo para contextos externos em vez de liberá-los junto.

**2. Critério da correção distinta — a regra tem um conserto próprio?**
Se o conserto de X é idêntico ao de Y, X e Y são a mesma regra e devem ser fundidas. Sua primeira aplicação foi o rebaixamento de `EXCESSIVE_SHARED_KERNEL`: com `CORE_IN_SHARED_KERNEL` no catálogo, a regra agregada passou a sugerir um conserto que outra regra já sugeria, para os casos perigosos; o que sobrou ("dois shared kernels entre subdomínios de apoio") não é alarmante, então ela caiu para `info` com limiar maior.

### 0.5 Limitações conhecidas, deliberadamente aceitas

São escolhas, não descuidos. Ficam escritas para que ninguém precise redescobri-las trombando nelas.

1. **Um Bounded Context pertence a exatamente um Subdomínio.** No DDD real, espaço do problema e espaço da solução se relacionam n:m — um contexto pode atender dois subdomínios. A ODDS mantém 1:1 deliberadamente: n:m destruiria a vista de contenção aninhada que o produto exige, e essa é a mesma simplificação que ferramentas comparáveis fazem.
2. **Um arquivo, um `domain`.** Mapas que cruzam múltiplos domínios são impossíveis por construção. É isso que torna coerente a premissa "um arquivo = uma URL compartilhável".
3. **Sistemas de terceiros são cidadãos de primeira classe, via o bloco `external { }`** — não é mais preciso mentir que a Stripe ou o ERP de outra empresa é um contexto de um subdomínio *seu*. **Contradição assumida:** o bloco `external` é declarado *dentro* do `domain { }`, que por definição não o contém. Ele está aninhado ali por razões sintáticas (preserva o invariante de que todo `context` vive dentro de um bloco declarado, e a premissa "um arquivo = um domain"). A contradição é nomeada em vez de escondida — e é cancelada no único lugar onde o usuário a perceberia: a vista de contenção desenha o bloco externo **fora** da fronteira do domínio, encostado nela (§5).
4. **`[BBM]` precisa ser repetida em toda linha** que toca aquele sistema (§0.3), mitigado por `INCONSISTENT_BBM`.
5. **As duas vistas têm poderes expressivos diferentes, deliberadamente.** `[BBM]` é anotação *de uma relação*, e a vista de contenção não tem linhas — então um sistema-pântano aparece lá como qualquer outro contexto. Derivar a marca no nó (marcar um contexto que carregue `[BBM]` em *qualquer* relação) foi rejeitado: construiria uma inferência visual sobre dado que a própria `INCONSISTENT_BBM` admite poder ser contraditório, fazendo o desenho afirmar mais do que o texto. As duas vistas respondem perguntas diferentes — *"como isto está organizado?"* e *"como isto se integra?"* — e risco de integração é, por definição, pergunta da segunda.

---

## 🧠 Relacionamentos de Equipe (Team Relationships)

Estes três relacionamentos descrevem a *forma* da dependência entre duas equipes ou bounded contexts, e mapeiam diretamente para os conectores da ODDS (`-->`, `<--`, `<->`, `-x-`).

| Relationship | Description |
|---|---|
| Mutually Dependent | Two teams or bounded contexts are mutually dependent when their software artifacts need to be delivered together to succeed. Failure or a timeline shift in one immediately impacts the other. A lot of coordination and communication is required (see Partnership pattern). Expressed with the `<->` connector. |
| Upstream / Downstream | The upstream team's decisions affect the downstream team, but not the other way around — the upstream team may succeed independently of the downstream team's fate. The downstream team's needs can be addressed in a variety of ways, with a wide range of consequences (see Conformist, Customer-Supplier, and Anti-Corruption Layer patterns). Expressed with `-->` (left side is Upstream) or `<--` (right side is Upstream). |
| Free | No organizational or technical link of any kind exists between the two contexts; changes in one do not influence the success or failure of the other. Expressed with the `-x-` connector — que, pela §0.2, também carrega o padrão Separate Ways. |

---

## 🧠 Padrões de Context Map (Context Map Patterns)

Estes nove padrões descrevem a *solução* técnica e social aplicada sobre um Relacionamento de Equipe — o contrato ou estratégia de proteção específica escolhida na fronteira. A última coluna é como a ODDS expressa cada um, e é aplicação direta da §0.2.

| Pattern | Como a ODDS expressa | Description |
|---|---|---|
| Partnership | `[P]`, nos dois lados de um `<->` | Two teams have a mutual dependency on each other's context to the extent that if either fails, both will fail. The contexts are peers, meaning that there is no ceremony required between expressing needs and receiving due functionality. The winners are those who best coordinate and cooperate. Partnerships can be slower and more difficult due to the complexity of integrated models and schedules. |
| Shared Kernel | `[SK]`, nos dois lados de um `<->` | Two or more teams share a small, common model, that is blended with their own specialized model. This requires agreement, and is often best used for system-wide standards, such as monetary or others. Note that this is not just a data schema (see Published Language), but a model with both data and behavior (object types). Caution is warranted against overuse or imagining that a reusable library fits the bill. The artifact is a shared, small, model. |
| Customer-Supplier | `[C]` no Downstream + `[S]` no Upstream | A team has a dependency on another team's Bounded Context, but the teams are not peers. Rather, the dependent is downstream from the upstream dependency. This makes the downstream team subject to the availability of schema and functionality that meets their specific needs. Addressing special needs is left to the discretion of the upstream team, which may impact the downstream team's timeline and capabilities. |
| Conformist | `[CF]`, só no Downstream | A downstream team must conform to an upstream model. This dependency is might be a desired choice, but is often determined by the complexity of the upstream model and downstream team's capacity and capabilities. Of course, any changes to the upstream model can/will have an impact on the downstream team, depending on their usage surface area. |
| Separate Ways | **o conector `-x-`** — sem tag (§0.2) | A team could potentially integrate with another model, but might decide that the benefit doesn't match the effort required, so the team decides to create their own one-off solution. Care must be taken with respect to DRY, or Don't Repeat Yourself. Note that DRY means "Don't Repeat Knowledge," not "Don't Repeat Code." Knowledge silos are problematic because repetition of captured knowledge in a business software context might cause deviation in one or more repeating models. When DRY as in knowledge is a certain factor, consider integration instead. |
| Anti-Corruption Layer | `[ACL]`, só no Downstream | A downstream team has both the capacity and capabilities to take a highly defensive posture in consuming upstream model. The upstream model is often complex and poorly designed, but the downstream model can still benefit by translating even clean models to their own language. The downstream creates a set of translation components that render the upstream model to a specific design that adheres to their own model design. |
| Open-Host Service | `[OHS]`, só no Upstream | A model has a well-designed API that enables one or more other teams to confidently and reliably perform operations. The consumed API is not automatically in an upstream position, which means that the majority of the previous and following relationships apply. That is, any consuming team can find themselves in a variety of circumstances, which will determine how the model behind the API is used. See also Published Language. |
| Published Language | `[PL]`, só no Upstream | A set of well-designed schema specifications—possibly considered a single specification—are provided for data exchange between Bounded Contexts. A Published Language is often paired with and Open-Host Service. A specific schema set can be an standard of the following proportions: international, national, industry, inter-business, intra-business, and context/model/team. |
| Big Ball of Mud | `[BBM]` — **não é tag de padrão**; terceira categoria (§0.2) | Systems are often implemented in monoliths without any intentional design and architecture, and have been long subjected to expedient change. There are generally no efforts or even recognition of the complex problems that will be at play, even quite early in the software life cycle, and thus are left to chance. Technical debt rises continually and is seldom paid. The tangle that ensues is often compared to a large, muddy, amorphous blob, or otherwise, a brown field of software. In time nearly zero changes can be made without regression, which cause system releases to stagnate. |

> **Nota sobre Customer/Supplier:** a literatura clássica de DDD descreve o padrão como um só, aplicado à relação inteira. A ODDS deliberadamente o divide em duas tags independentes e conscientes de posição (`[C]` e `[S]`), para que cada lado possa ser validado sozinho. É uma extensão intencional, não uma reprodução da literatura — e é por isso que declarar apenas uma das duas é `warning` (`INCOMPLETE_CUSTOMER_SUPPLIER`) e não `error`: "eu sou o Customer desta integração" é uma afirmação unilateral coerente, apenas mal documentada. Compare com `[SK]`/`[P]`, que são a *mesma* tag repetida, onde meia declaração é uma afirmação malformada de um fato único — e portanto `error` (`INCOMPLETE_MUTUAL_TAG`).

---

## 🧠 Propriedades de Contexto (Metadados)

Além da declaração estrutural (`context Nome { ... }`), um Bounded Context — e, nos níveis externos, um `domain` ou `subdomain` — pode carregar metadados descritivos. Esses metadados são **informativos**: documentam intenção para humanos e ferramentas, mas não participam de nenhuma validação de Team Relationship ou Context Map Pattern descrita acima. A sintaxe formal dessas propriedades está no `GRAMMAR.md`; esta seção documenta seu significado pretendido.

| Propriedade | Disponível em | Propósito |
|---|---|---|
| `title` | `domain`, `subdomain`, `context` | Rótulo de exibição legível para humanos, distinto do identificador técnico usado para referenciar o elemento em outros lugares (ex: no `mapping`). Destinado à renderização no canvas/diagrama. |
| `type` | `context` | Classificação em texto livre da natureza do contexto (ex: "serviço", "sistema legado", "gateway"). Deliberadamente aberto, sem taxonomia fechada — não existe uma lista fixa de valores válidos. **Não** reutilize aqui o vocabulário de subdomínio (`core`/`supporting`/`generic`): são eixos diferentes, e `type: "generic"` dentro de um `subdomain generic` ensina ao leitor um vocabulário sobrecarregado. |
| `description` | `context` | Explicação em texto livre do propósito e papel do contexto. |
| `responsibilities` | `context` | Uma lista das responsabilidades de negócio ou técnicas atribuídas a este contexto. |
| `maturity` | `context` | Estágio de maturidade do ciclo de vida do contexto. Um de: `experimental`, `growing`, `mature`, `legacy`. |
| `team` | `context` | O time responsável pelo contexto, em texto livre. |
| `technology` | `context` | A stack de tecnologia usada para implementar o contexto, em texto livre. |

**Nenhuma dessas propriedades dispara qualquer diagnóstico por si só, e nenhuma jamais alimenta o gatilho de uma regra.** Esta é a fronteira enunciada na §0.3, e é uma promessa ao usuário: preencha `team` e `technology` sem medo de que a ferramenta comece a julgá-lo por isso. Duas consequências que vale explicitar:

- `maturity: legacy` **não** implica `[BBM]` e não dispara nenhuma regra da §2. São conceitos independentes — um documenta estágio de ciclo de vida, o outro caracteriza um sistema numa integração — e misturá-los seria uma decisão de modelagem que a ferramenta não deve tomar silenciosamente em nome do usuário.
- Duas regras propostas para o catálogo da §2 são, portanto, **inexprimíveis e foram descartadas**: "dois contextos do mesmo `team` numa relação Customer/Supplier" e "`maturity: experimental` num subdomínio `core`". A promessa acima vale mais do que essas duas regras.

Um contexto declarado dentro do bloco `external { }` aceita essas mesmas seis propriedades. `responsibilities` e `team` são semanticamente estranhos para um sistema que não é seu — mas seguem permitidos, porque a alternativa seria criar a primeira propriedade proibida e reabrir justamente a fronteira que esta seção existe para proteger.

---

## 🧠 Validações Semânticas (AST Analysis & Architecture Rules)

As validações abaixo são o que faz da ODDS um validador de arquitetura em vez de uma ferramenta de desenho. Estão divididas por severidade: **erros** (§1), que dizem que o modelo é incoerente, e **regras de desenho** (§2), que dizem que o modelo é coerente mas o desenho é questionável.

Cada regra declara: seu `code`, sua severidade, seu **escopo** (por relacionamento, por declaração ou arquivo inteiro), seu **gatilho** e sua resposta ao princípio da autoria (§0.4), no campo **Externo?**. O texto de mensagem de cada code está no `MESSAGES.md`; as chaves de `data` que cada um precisa carregar estão em `AST_SCHEMA.md` §1.3.

---

### 1. Erros (severidade `error`)

Estas regras garantem a integridade do modelo e a coerência básica do mapa de contexto. Elas **não** bloqueiam a renderização — ver §5.

#### A. Escopo, hierarquia e identidade

* **Contexto Órfão** — `ORPHAN_CONTEXT` · fase 1 · Externo? n/a
  * *Gatilho:* um `context` declarado fora de um `subdomain` e fora do bloco `external { }`.
  * *Nota:* detectado pelo **parser**, via recuperação de erro, não pelo Visitor — ver `GRAMMAR.md` §5.1. A gramática permanece estrita (um `context` só é sintaticamente válido dentro de um `subdomain` ou dentro de `external`). A declaração descartada mesmo assim é **registrada como inválida** na tabela de símbolos, e é isso que impede a cascata para `PHANTOM_REFERENCE` (§3.1).

* **Subdomínio Órfão** — `ORPHAN_SUBDOMAIN` · fase 1 · Externo? n/a
  * *Gatilho:* um `subdomain` declarado fora do escopo de um `domain`.
  * *Nota:* mesmo mecanismo de recuperação do parser descrito acima.

* **Construção Removida** — `REMOVED_CONSTRUCT` · fase 1 · Externo? n/a
  * *Gatilho:* o arquivo usa uma construção que existia numa `ODDS Language Version` anterior e não existe mais — hoje, a tag `[SW]`.
  * *Nota:* existe para que reabrir um arquivo antigo ou uma URL antiga produza *"`[SW]` foi removida na ODDS 0.1.0 — use `-x-` sozinho"* em vez de um `SYNTAX_ERROR` genérico que não explica nada. Mesmo mecanismo de recuperação do parser: a construção removida é descartada e o parsing continua. Ver §6.

* **Referência Fantasma no Context Map** — `PHANTOM_REFERENCE` · fase 3 · Externo? ✅ vale
  * *Gatilho:* uma linha do `mapping` referencia um contexto que nunca foi declarado — nem em `subdomain` nem no bloco `external`.
  * *Nota:* integridade referencial não tem exceção. Um contexto registrado como *declarado porém inválido* **não** conta como não declarado para esta regra (§3.1).

* **Declaração Duplicada de Contexto** — `DUPLICATE_CONTEXT` · fase 2 · Externo? ✅ vale
  * *Gatilho:* o mesmo nome de `context` declarado mais de uma vez em qualquer lugar do `domain`.
  * *Nota de escopo:* contextos internos e externos **compartilham um espaço de nomes só**, porque `mapping` referencia contexto por identificador simples, sem qualificação de escopo. Um contexto chamado `Stripe` dentro de um subdomínio e outro dentro de `external { }` é duplicata, exatamente como dois internos seriam.
  * *Convenção de span:* a **segunda** ocorrência — a que causa o problema.

* **Declaração Duplicada de Subdomínio** — `DUPLICATE_SUBDOMAIN` · fase 2 · Externo? n/a
  * *Gatilho:* dois blocos `subdomain` com o mesmo nome no arquivo, independentemente do tipo de cada um.
  * *Convenção de span:* a segunda ocorrência.

* **Cardinalidade Inválida de Domain** — `INVALID_DOMAIN_CARDINALITY` · fase 2 · Externo? n/a
  * *Gatilho:* o arquivo declara zero `domain`, ou mais de um. Exatamente um é obrigatório.
  * *Convenção de span:* o segundo `domain` quando há vários; o arquivo inteiro quando não há nenhum.

* **Auto-relação** — `SELF_RELATIONSHIP` · fase 3 · Externo? ✅ vale
  * *Gatilho:* os dois lados da relação nomeiam o mesmo contexto (`A --> A`).

* **Relação Duplicada** — `DUPLICATE_RELATIONSHIP` · fase 3 · Externo? ✅ vale
  * *Escopo:* a identidade de uma relação é o **par não-ordenado** `{esquerda, direita}`. Conector e tags *não* fazem parte da identidade.
  * *Gatilho:* uma segunda linha para um par já relacionado. Esta regra única cobre deliberadamente as três formas, sem taxonomia de tipo de duplicata:

    | Forma | Exemplo |
    |---|---|
    | Redundante | `A --> B` + `B <-- A` |
    | Contraditória | `A --> B` + `A -x- B` |
    | Split de tags | `A [OHS] --> B` + `A [S] --> B` |

  * *Por que um code e não três:* separá-los exigiria uma relação de equivalência semântica sobre conector+tags que ninguém acerta nas bordas (`[OHS]` é "a mesma relação" que `[OHS, PL]`?), e o prêmio seria uma diferença de severidade numa linha que o usuário vai apagar de qualquer forma. Também não é escolha arbitrária de identidade: pela §0.2 o conector carrega *a forma da dependência entre dois times*, e um par de contextos tem exatamente uma forma por vez, então uma segunda linha nunca é informação nova. O par é **não-ordenado** porque `A --> B` + `B --> A` é uma dependência mútua mal escrita (deveria ser `<->`) que uma identidade ordenada deixaria passar.
  * *Convenção de span:* a segunda ocorrência. **A primeira ocorrência é a que desenha** (§5).
  * *Consequência para regras agregadas:* regras que contam ocorrências no arquivo (`EXCESSIVE_SHARED_KERNEL`) contam **relações distintas, não linhas** — sem essa cláusula, um `A [SK] <-> B` colado duas vezes estouraria o limiar sozinho.

* **Relação só entre Externos** — `EXTERNAL_ONLY_RELATIONSHIP` · fase 3 · Externo? por definição
  * *Gatilho:* os dois lados da relação são contextos declarados no bloco `external { }`.
  * *Por que é erro:* um context map é o mapa das **suas** integrações. Como a Stripe conversa com o SAP de um terceiro não é decisão sua, não é acionável, e não pode ser validado por nenhuma regra de padrão — o princípio da autoria (§0.4) aplicado à própria relação. Permitir transformaria o `.odds` num diagrama de sistemas genérico, que é precisamente o que a ODDS não é.

#### B. Validações de tipagem estrita

* **Tipo de Subdomínio Inválido** — `INVALID_SUBDOMAIN_TYPE` · fase 2 · Externo? n/a
  * *Gatilho:* o identificador após a palavra `subdomain` é qualquer coisa diferente de `core`, `supporting` ou `generic`.
  * *Nota:* o `GRAMMAR.md` aceita deliberadamente um `identifier` livre nessa posição, para que esta checagem seja de fato alcançável pelo Visitor em vez de código morto atrás de uma rejeição do parser. `core`/`supporting`/`generic` classificam a importância estratégica de uma parte do *seu próprio* negócio — que é exatamente por que um sistema de terceiro não recebe um deles, e mora em `external { }`.

#### C. Posição de tag e compatibilidade com o conector

A validação de tag tem **duas dimensões independentes**. Uma tag pode falhar em uma, na outra, ou nas duas:

1. **Compatibilidade com o conector** — esta tag pode sequer aparecer neste tipo de linha?
2. **Compatibilidade com o lado** — dada uma linha direcional, a tag está do lado que pode legitimamente carregá-la?

A matriz abaixo é **normativa**. Ela é derivada do mapeamento de cada Team Relationship para os padrões que lhe são aplicáveis: Mutually Dependent → Partnership, Shared Kernel; Upstream/Downstream → Customer/Supplier, Open-Host Service (frequentemente com Published Language), Conformist, Anti-Corruption Layer; Free → Separate Ways, que pela §0.2 *é* o conector.

| Tag | `-->` / `<--` | `<->` | `-x-` |
|---|---|---|---|
| `OHS` | ✅ só no lado Upstream | ❌ | ❌ |
| `PL` | ✅ só no lado Upstream | ❌ | ❌ |
| `S` | ✅ só no lado Upstream | ❌ | ❌ |
| `C` | ✅ só no lado Downstream | ❌ | ❌ |
| `CF` | ✅ só no lado Downstream | ❌ | ❌ |
| `ACL` | ✅ só no lado Downstream | ❌ | ❌ |
| `SK` | ❌ | ✅ obrigatória nos **dois** lados | ❌ |
| `P` | ❌ | ✅ obrigatória nos **dois** lados | ❌ |
| `BBM` | ✅ qualquer lado | ✅ qualquer lado | ✅ qualquer lado |

Cada conector tem exatamente um code para "tag errada aqui", então os codes nunca se sobrepõem e uma implementação nunca precisa escolher entre eles:

* **Tag exclusiva de Upstream mal posicionada** — `UPSTREAM_ONLY_TAG_MISPLACED` · fase 4 · Externo? ✅ vale
  * *Gatilho:* `[OHS]`, `[PL]` ou `[S]` no lado Downstream de uma linha `-->`/`<--`.
  * *Exemplo inválido:* `ContextA --> [OHS] ContextB` — o `-->` faz de B o Downstream, mas OHS é padrão de Upstream.

* **Tag exclusiva de Downstream mal posicionada** — `DOWNSTREAM_ONLY_TAG_MISPLACED` · fase 4 · Externo? ✅ vale
  * *Gatilho:* `[ACL]`, `[CF]` ou `[C]` no lado Upstream de uma linha `-->`/`<--`.

* **Tag mútua em conector direcional** — `MUTUAL_TAG_ON_DIRECTIONAL` · fase 4 · Externo? ✅ vale
  * *Gatilho:* `[SK]` ou `[P]` numa linha `-->` ou `<--`, em qualquer lado.
  * *Racional:* Shared Kernel e Partnership descrevem uma dependência *mútua*. Declarar um deles sobre uma dependência assimétrica é erro de categoria, não de posição.

* **Tag posicional em conector mútuo** — `POSITIONAL_TAG_ON_MUTUAL` · fase 4 · Externo? ✅ vale
  * *Gatilho:* qualquer uma de `[OHS]`, `[PL]`, `[S]`, `[C]`, `[CF]`, `[ACL]` numa linha `<->`, em qualquer lado.
  * *Racional:* essas seis tags são definidas por uma posição Upstream/Downstream, e `<->` não tem nenhuma das duas.

* **Tag mútua incompleta** — `INCOMPLETE_MUTUAL_TAG` · fase 4 · Externo? ✅ vale
  * *Gatilho:* `[SK]` ou `[P]` declarada em apenas um lado de uma linha `<->`.
  * *Racional:* **a inferência automática é proibida.** Uma versão anterior deste documento permitia ao parser "inferir a tag para o outro lado"; um *pode* na especificação faz duas implementações igualmente conformes produzirem saídas diferentes, e a inferência silenciosa faz o arquivo `.odds` e o diagrama renderizado discordarem — numa ferramenta de Architecture as Code o texto é a fonte de verdade, não um esboço a ser completado pela ferramenta. Além disso, Shared Kernel e Partnership são **acordos bilaterais**: escrever os dois lados é o próprio ato de registrar que a outra equipe também assinou embaixo.

* **Tag mútua com contexto externo** — `MUTUAL_TAG_WITH_EXTERNAL` · fase 4 · Externo? por definição
  * *Gatilho:* `[SK]` ou `[P]` numa relação em que qualquer um dos lados é um contexto externo.
  * *Racional:* não existe Shared Kernel nem Partnership com um terceiro — são acordos bilaterais entre times que você tem. Mesma família de `EXTERNAL_ONLY_RELATIONSHIP`: erro de categoria, não juízo sobre o desenho.

#### D. Conflito e exclusividade

* **Conflito de Separação** — `SEPARATION_CONFLICT` · fase 4 · Externo? ✅ vale
  * *Gatilho:* **qualquer** tag de padrão numa linha `-x-`. `-x-` significa ausência de integração, então não há fronteira em que um padrão possa ser aplicado.
  * *Exceção explícita:* `[BBM]` é permitida em `-x-` e **não** dispara esta regra. Ela não é tag de padrão, e sim caracterização do sistema (§0.2), e *"aquele ERP é um pântano e por isso decidimos não integrar"* é uma das informações mais valiosas que um mapa pode registrar.
  * *Exemplo inválido:* `ContextA [OHS] -x- [ACL] ContextB`.
  * *Nota:* esta regra tinha um segundo ramo, para `[SW]` combinado com conector direcional. Ele desapareceu junto com a tag (§0.2), colapsando a regra numa linha só e eliminando a necessidade de enumerar quais tags contam como "indicativo de integração".

* **Conflito de Papel** — `ROLE_CONFLICT` · fase 4 · Externo? ✅ vale
  * *Gatilho:* `[C]` e `[S]` no mesmo lado da mesma relação.
  * *Nota:* este gatilho é estruturalmente garantido de coocorrer com um erro de posição, já que `C` é exclusiva de Downstream e `S` é exclusiva de Upstream — qualquer que seja o lado compartilhado, uma das duas está no lado errado. Os dois diagnósticos são esperados; estão na mesma fase, então os dois são reportados (§3.2).

* **Conflito de Proteção** — `PROTECTION_CONFLICT` · fase 4 · Externo? ✅ vale
  * *Gatilho:* `[CF]` e `[ACL]` no mesmo lado da mesma relação. Um contexto não pode simultaneamente aceitar o modelo do Upstream por inteiro e traduzi-lo defensivamente para a mesma integração.

---

### 2. Regras de desenho (severidades `warning` e `info`)

Estas não dizem que o modelo está quebrado; dizem que o desenho merece um segundo olhar. A severidade separa *"um padrão razoavelmente consensual de DDD está sendo violado"* (`warning`) de *"higiene de documentação"* (`info`), para que o contador que o usuário olha de relance continue significando alguma coisa. Todas são suprimíveis (§4), que é o que transforma *"a ferramenta discorda de mim"* em *"eu registrei que discordo da ferramenta"* — documentação arquitetural legítima.

#### E. Risco estratégico (`warning`)

* **Core Conformista** — `CONFORMIST_CORE` · `warning` · fase 5 · Externo? ✅ vale
  * *Escopo:* por relacionamento; apenas linhas direcionais (`-->`/`<--`) em que um contexto de subdomínio `core` está do lado Downstream.
  * *Gatilho:* qualquer uma das condições vale — **(a)** o lado Downstream (o contexto `core`) carrega `[CF]`, ou **(b)** o lado Upstream carrega `[BBM]`. Avaliadas independentemente; se as duas valem na mesma linha, emita um **único** diagnóstico, com `data.trigger` registrando qual condição disparou (`"conformist"` tem precedência sobre `"bbm"` quando ambas valem).
  * *Exceção:* a condição **(b) não dispara quando o lado Downstream `core` já carrega `[ACL]`**. O propósito inteiro da regra é aconselhar uma Anti-Corruption Layer; insistir num conserto que o autor já aplicou é exatamente o ruído que o critério da correção distinta (§0.4) existe para evitar. A condição (a) não precisa da mesma exceção — `[CF]` e `[ACL]` no mesmo lado já é `PROTECTION_CONFLICT`.
  * *Por que o externo importa aqui:* um ERP de terceiro é o Big Ball of Mud clássico, então este é o cenário-alvo da regra, não uma exceção a ela.

* **Genérico Upstream sem OHS** — `GENERIC_WITHOUT_OHS` · `warning` · fase 5 · Externo? ❌ não consegue disparar
  * *Escopo:* por relacionamento; apenas linhas direcionais. Não se aplica a `<->` nem a `-x-`, onde `[OHS]` não é tag válida de qualquer forma.
  * *Gatilho:* o contexto do lado Upstream pertence a um subdomínio `generic` e não carrega `[OHS]` nesse lado.
  * *Nota sobre externo:* um contexto externo não tem tipo de subdomínio, então o gatilho não pode ser satisfeito contra ele — a isenção que o princípio da autoria exige é estrutural (§0.4), não uma cláusula.

* **Core Upstream de um Genérico** — `CORE_UPSTREAM_OF_GENERIC` · `warning` · fase 5 · Externo? ❌ não consegue disparar
  * *Escopo:* por relacionamento; apenas linhas direcionais.
  * *Gatilho:* um contexto de subdomínio `core` está Upstream de um contexto de subdomínio `generic`.
  * *Racional:* o DDD estratégico aponta na direção oposta — o core consome o genérico; um genérico (de prateleira, commodity) se conformando ao seu core é sinal de que ou a classificação ou a dependência está errada.

* **Core dentro de um Shared Kernel** — `CORE_IN_SHARED_KERNEL` · `warning` · fase 5 · Externo? ❌ não consegue disparar
  * *Escopo:* por relacionamento.
  * *Gatilho:* um contexto de subdomínio `core` participa de uma relação que carrega `[SK]`.
  * *Racional:* um Shared Kernel é acoplamento físico de modelo. Colocar sua vantagem competitiva dentro de um significa que outro time não pode mais ser alterado sem alterá-la.
  * *Nota sobre externo:* `[SK]` com contexto externo já é erro (`MUTUAL_TAG_WITH_EXTERNAL`), o que remove a linha das fases seguintes — então esta regra nunca vê um caso desses.

* **Domínio sem Core** — `DOMAIN_WITHOUT_CORE` · `warning` · fase 5 · Externo? n/a
  * *Escopo:* arquivo inteiro, uma vez.
  * *Gatilho:* nenhum `subdomain core` declarado em lugar nenhum do arquivo.
  * *Racional:* um mapa estratégico sem core domain não respondeu à única pergunta que o desenho estratégico existe para responder — onde está sua vantagem competitiva.
  * *Convenção de span:* a linha de declaração do `domain`.

* **BBM Inconsistente** — `INCONSISTENT_BBM` · `warning` · fase 5 · Externo? ✅ vale
  * *Escopo:* arquivo inteiro, por contexto.
  * *Gatilho:* o mesmo contexto carrega `[BBM]` em pelo menos uma relação e não carrega em pelo menos outra.
  * *Racional:* esta regra é a mitigação do custo aceito na §0.3. Fecha o furo sem tocar na fronteira tag/propriedade, porque opera apenas sobre tags.
  * *Convenção de span:* a primeira linha de relacionamento em que o contexto aparece **sem** `[BBM]` — a linha que o usuário provavelmente esqueceu.

* **Customer/Supplier Incompleto** — `INCOMPLETE_CUSTOMER_SUPPLIER` · `warning` · fase 5 · Externo? ✅ vale
  * *Escopo:* por relacionamento; apenas linhas direcionais.
  * *Gatilho:* `[C]` no lado Downstream sem `[S]` no lado Upstream, ou o inverso.
  * *Racional:* Customer/Supplier é um acordo bilateral, e meia declaração documenta meio contrato. É `warning` e não `error` — diferente de `INCOMPLETE_MUTUAL_TAG` — porque `[C]` e `[S]` são duas tags *distintas* com significado independente (ver a nota sob a tabela de padrões), então uma delas sozinha é uma afirmação unilateral coerente, apenas mal documentada.

#### F. Higiene (`info`)

* **Excesso de Shared Kernel** — `EXCESSIVE_SHARED_KERNEL` · `info` · fase 5 · Externo? n/a
  * *Escopo:* arquivo inteiro (agregado) — avaliado uma vez por arquivo, não uma vez por relacionamento.
  * *Gatilho:* o arquivo contém **três ou mais** relações distintas carregando `[SK]`. Conta relações distintas, nunca linhas (§1.A).
  * *Por que `info` e limiar 3:* com `CORE_IN_SHARED_KERNEL` e `MUTUAL_TAG_WITH_EXTERNAL` no catálogo, os shared kernels genuinamente perigosos têm regra dedicada com conserto próprio. O que sobra para a regra agregada — "alguns shared kernels entre subdomínios de apoio" — não é alarmante, e pelo critério da correção distinta (§0.4) ela mal se sustenta.
  * *Convenção de span:* a abertura do bloco `mapping`, como âncora.

* **Contrato de Integração Não Documentado** — `UNDOCUMENTED_CONTRACT` · `info` · fase 5 · Externo? ✅ vale
  * *Escopo:* por relacionamento.
  * *Gatilho:* uma linha `-->`, `<--` ou `<->` sem nenhuma tag de Context Map Pattern em nenhum dos lados. Não dispara em linhas `-x-`, onde a ausência de tag é o sinal esperado. `[BBM]` sozinha também não satisfaz a regra — não é tag de padrão (§0.2), então uma linha que carregue só `[BBM]` continua com o contrato não documentado.
  * *Nota sobre externo:* documentar *como você integra* é responsabilidade sua, e mais importante com um terceiro, não menos.

* **Contexto Não Mapeado** — `UNMAPPED_CONTEXT` · `info` · fase 5 · Externo? ✅ vale
  * *Escopo:* por declaração de contexto.
  * *Gatilho:* um contexto é declarado e nunca referenciado no bloco `mapping`.
  * *Inerte quando não há mapa nenhum:* se o arquivo **não declara bloco `mapping`**, esta regra não dispara para contexto algum. Um modelo em que o mapeamento ainda não começou é um rascunho, e acusar todos os contextos de uma vez é ruído, não sinal.
  * *Referência numa linha inválida ainda conta.* Se um contexto aparece apenas numa linha de relacionamento que outra regra invalidou, ele continua "referenciado" — reportá-lo como não mapeado seria um diagnóstico derivado de um erro, que a §3.1 proíbe.
  * *Nota:* um contexto genuinamente isolado é legítimo, que é exatamente por que isso é `info` e não warning — sinaliza uma omissão provável, não um erro.

* **Subdomínio Vazio** — `EMPTY_SUBDOMAIN` · `info` · fase 5 · Externo? n/a
  * *Gatilho:* um bloco `subdomain` que não declara nenhum `context`.
  * *Nota:* normalmente é rascunho em andamento, daí `info`.

* **Published Language sem Open-Host Service** — `PL_WITHOUT_OHS` · `info` · fase 5 · Externo? ✅ vale
  * *Gatilho:* `[PL]` declarada num lado que não carrega também `[OHS]`.
  * *Nota:* a literatura combina os dois frequentemente, não sempre — uma Published Language pode existir sem um host service. Daí `info`.

---

### 3. Pipeline de Validação: Fases, Princípio do Erro-Raiz e Ordenação dos Diagnósticos

Esta seção é **normativa**. O `TEST_SUITE.md` compara o array de diagnósticos emitidos por igualdade estrutural, então a *ordem* dos diagnósticos faz parte do contrato — não é detalhe de apresentação.

#### 3.1 Princípio do erro-raiz

Um elemento que já produziu um **`error`** é registrado como *declarado porém inválido* e sai de todas as fases **seguintes** — ele não gera diagnósticos derivados. `warning` e `info` nunca invalidam nada.

O caso que motiva o princípio: um `context` declarado fora de um `subdomain` é descartado pelo panic-mode recovery do parser (`GRAMMAR.md` §5.1) e reportado como `ORPHAN_CONTEXT`. Sem o princípio, toda linha do `mapping` que referenciasse aquele contexto emitiria *também* `PHANTOM_REFERENCE` — um erro do usuário, dois diagnósticos, e o segundo falso: o contexto *foi* declarado, apenas no lugar errado. Por isso, declarações descartadas precisam mesmo assim ser registradas na tabela de símbolos, marcadas como inválidas, para que as fases seguintes as reconheçam sem voltar a reportá-las.

A leitura é **larga**: um `error` remove o elemento do pipeline inteiro, não apenas das regras que consomem o que foi invalidado. A leitura estreita obrigaria cada uma das duas dúzias de regras da §2 a declarar de qual invalidação depende — o regime caso a caso que este princípio existe para evitar, fantasiado de arquitetura.

**Um elemento invalidado leva os filhos junto.** Um `subdomain` que produziu um `error` (`INVALID_SUBDOMAIN_TYPE`, `DUPLICATE_SUBDOMAIN`) sai do pipeline junto com os contextos declarados dentro dele, e um bloco `subdomain` descartado leva seus contextos também. Esses contextos continuam registrados como *declarados porém inválidos*, então não viram referências fantasma — mas também não são julgados por conta própria.

Consequência aceita deliberadamente: **o conserto é iterativo.** Uma linha de relacionamento que é ao mesmo tempo duplicata e arriscada do ponto de vista estratégico reporta só a duplicata; o aviso estratégico aparece assim que a duplicata for apagada. Do mesmo modo, não se reporta `DUPLICATE_CONTEXT` entre um órfão descartado e um homônimo válido. Esse é o comportamento padrão de qualquer compilador e, com validação ao vivo, a segunda passada não custa nada ao usuário.

#### 3.2 Fases

Todas as regras de uma **mesma** fase rodam e reportam. A invalidação só vale para as fases posteriores.

| # | Fase | Roda em | Diagnósticos produzidos |
|---|---|---|---|
| 0 | Léxica / Sintática | Parser | `SYNTAX_ERROR` — não há AST, então o pipeline para aqui |
| 1 | Estrutural | Parser (panic-mode recovery) | `ORPHAN_CONTEXT`, `ORPHAN_SUBDOMAIN`, `REMOVED_CONSTRUCT` |
| 2 | Declarativa | Visitor, Passos 0–1 | `INVALID_DOMAIN_CARDINALITY`, `INVALID_SUBDOMAIN_TYPE`, `DUPLICATE_CONTEXT`, `DUPLICATE_SUBDOMAIN` |
| 3 | Referencial | Visitor, Passo 2 — identidade e existência das pontas da relação | `PHANTOM_REFERENCE`, `SELF_RELATIONSHIP`, `DUPLICATE_RELATIONSHIP`, `EXTERNAL_ONLY_RELATIONSHIP` |
| 4 | Relacional | Visitor, Passo 2 — as tags em si | `UPSTREAM_ONLY_TAG_MISPLACED`, `DOWNSTREAM_ONLY_TAG_MISPLACED`, `MUTUAL_TAG_ON_DIRECTIONAL`, `POSITIONAL_TAG_ON_MUTUAL`, `INCOMPLETE_MUTUAL_TAG`, `MUTUAL_TAG_WITH_EXTERNAL`, `SEPARATION_CONFLICT`, `ROLE_CONFLICT`, `PROTECTION_CONFLICT` |
| 5 | Estratégica | Visitor, Passos 2–3 — juízo sobre o desenho | `CONFORMIST_CORE`, `GENERIC_WITHOUT_OHS`, `CORE_UPSTREAM_OF_GENERIC`, `CORE_IN_SHARED_KERNEL`, `DOMAIN_WITHOUT_CORE`, `INCONSISTENT_BBM`, `INCOMPLETE_CUSTOMER_SUPPLIER`, `EXCESSIVE_SHARED_KERNEL`, `UNDOCUMENTED_CONTRACT`, `UNMAPPED_CONTEXT`, `EMPTY_SUBDOMAIN`, `PL_WITHOUT_OHS` |
| 6 | Supressão | Passo 4 — uma passada sobre o array já emitido | `MALFORMED_SUPPRESSION`, `UNUSED_SUPPRESSION` |

**Regra de admissão:** todo `DiagnosticCode` novo precisa receber uma fase no momento em que é adicionado ao `AST_SCHEMA.md` §1. Um code sem fase não tem posição definida no array emitido e, portanto, não pode ser testado.

**Nota sobre a fase 6.** A supressão é uma fase, e não um filtro pregado no final, justamente para que seus dois diagnósticos tenham posição definida no array. Ela roda por último porque `UNUSED_SUPPRESSION` não pode ser conhecida antes de toda regra ter tido sua chance de disparar. Ela nunca invalida nada: remover um `warning` suprimido não pode produzir diagnósticos novos, porque `warning` nunca invalidou nada para começar (§3.1).

#### 3.3 Ordem de emissão

O array de diagnósticos é ordenado pelas chaves abaixo, nesta ordem, até encontrar uma diferença:

1. **Fase**, crescente (§3.2).
2. **`span.start.line`**, crescente.
3. **`span.start.column`**, crescente.
4. **`span.end.column`**, crescente — um span mais estreito (um único token) precede um mais largo que comece na mesma coluna.
5. **`code`**, em ordem alfabética — desempate final, para que a ordem seja total e nenhuma implementação precise adivinhar.

As chaves 2–4 fazem o painel ser lido na ordem do arquivo, coincidindo com a régua do editor, que é o comportamento de todo linter que o público-alvo já usa. A chave 5 existe apenas para tornar a ordem **total**: um desempate definido pela implementação faria duas implementações conformes produzirem arrays diferentes, e o `TEST_SUITE.md` não conseguiria asserir nenhuma das duas.

Rejeitado deliberadamente: uma lista de prioridade entre codes, mantida à mão, dentro de cada fase. Ela teria que ser atualizada a cada regra nova, divergiria do código, e codificaria "qual problema importa mais" — juízo que pertence ao campo `severity`, não à posição no array.

---

### 4. Suprimindo um diagnóstico

Um linter com opiniões e sem escape hatch vira ruído permanente em qualquer modelo do mundo real que contenha uma decisão consciente e defensável contra uma regra. A supressão é o que transforma *"a ferramenta discorda de mim"* em *"eu registrei que discordo da ferramenta, e por quê"* — o que é documentação arquitetural, e exatamente o pitch de Architecture as Code.

**Forma canônica** — apenas de linha, justificativa obrigatória:

```odds
// odds-disable-next-line CONFORMIST_CORE: ERP corporativo, decisão de negócio, custo assumido e documentado
Checkout [CF] <-- CorporateERP
```

As regras:

* **Mora no arquivo, nunca na UI.** Uma supressão precisa viajar no Git, na URL compartilhada e no code review. Se morasse no painel, duas pessoas veriam diagnósticos diferentes para o mesmo desenho.
* **Alcança `warning` e `info`. Nunca `error`.** O escape hatch existe para decisões conscientes contra um *conselho*; silenciar um `PHANTOM_REFERENCE` faria o diagrama mentir sobre o próprio modelo. Nomear um code de severidade `error` numa diretiva é `MALFORMED_SUPPRESSION`, não uma supressão.
* **Granularidade de linha é suficiente, universalmente.** Não existe forma de bloco nem de arquivo. Toda regra — inclusive as agregadas — tem exatamente uma linha-âncora pelas convenções de span da §1/§2 e do `TEST_SUITE.md` §4, então não há nada que uma diretiva de bloco alcançasse e uma de linha não. Supressão de arquivo é também justamente o mecanismo pelo qual linters são derrotados no atacado e em silêncio, e arquivos `.odds` são pequenos demais para precisar disso.
* **Suprime um code, não a linha.** Outras regras que disparem na mesma linha continuam sendo reportadas.
* **A justificativa é obrigatória.** Uma supressão sem motivo é indistinguível de desistência, e seis meses depois ninguém sabe se foi decisão ou cansaço.

Dois diagnósticos mantêm o mecanismo honesto, ambos `info`, ambos fase 6:

* **Supressão Malformada** — `MALFORMED_SUPPRESSION`
  * *Gatilho:* a diretiva nomeia um code que não existe (`data.reason: "unknown-code"`), omite a justificativa (`"missing-justification"`), ou nomeia um code cuja severidade é `error` (`"not-suppressible"`).
  * *Nunca é `SYNTAX_ERROR`.* Um comentário quebrado não pode derrubar o parsing do arquivo.

* **Supressão Obsoleta** — `UNUSED_SUPPRESSION`
  * *Gatilho:* a diretiva está bem formada, mas a regra que ela nomeia não disparou na linha alvo.
  * *Racional:* sem isso, supressões obsoletas se acumulam e a justificativa apodrece junto com o modelo.

**Consequência estrutural:** comentários deixaram de ser sintaticamente insignificantes. O lexer não pode descartar um comentário que comece com o prefixo `odds-disable-next-line` — ele precisa sobreviver até o validador. Ver `GRAMMAR.md` §1.

---

### 5. Erros e renderização

**Um erro crítico não bloqueia o diagrama.** A regra que se enunciava como "erros críticos bloqueiam a compilação" já era falsa dentro deste próprio documento — `ORPHAN_CONTEXT` explicitamente não bloqueava a geração da AST — e contradizia a promessa do produto de visualização instantânea durante a digitação, já que **todo estado intermediário de um arquivo sendo digitado é um erro de sintaxe**. Sob bloqueio estrito, o canvas piscaria vazio a cada tecla.

A regra, portanto, é **degradação por elemento**:

* A AST parcial sempre renderiza o que for renderizável.
* O elemento com problema é desenhado **visivelmente marcado**: aresta tracejada vermelha para relação inválida, nó fantasma pontilhado para referência que não resolve. É para isso que existe `SymbolTableEntry.valid` (§3.1).
* Só um `SYNTAX_ERROR` puro — em que não existe árvore nenhuma — congela o último diagrama bom em vez de apagá-lo. **O diagrama congelado precisa estar marcado como obsoleto**, senão o canvas mente em silêncio sobre o arquivo que afirma mostrar.
* Num par duplicado, **a primeira ocorrência é a que desenha** — coerente com a convenção de span que culpa a segunda.
* **Exportar com erros é permitido, e o export inclui os marcadores.** A imagem exportada é exatamente o que está no canvas; não existe variante "limpa". Um export sem marcadores viraria documentação afirmando um modelo que nunca foi válido.

A vista de contenção desenha o bloco `external { }` **fora** da fronteira do domínio, encostado nela — cancelando a contradição sintática registrada na §0.5 no único lugar em que o usuário a perceberia.

---

### 6. Versão da linguagem e compatibilidade

`GRAMMAR.md`, `AST_SCHEMA.md` e este arquivo carregam cada um sua versão editorial própria, mas o que um `.odds` *significa* é definido pelos três juntos. Esse significado conjunto tem número próprio, a **ODDS Language Version**, mantida no `CHANGELOG.md` e incrementada apenas quando o comportamento observável de um `.odds` muda.

Ela segue SemVer, com o corte na **validade do arquivo**:

| Incremento | Quando | Efeito num `.odds` existente |
|---|---|---|
| **MAJOR** | Um arquivo válido deixa de ser válido, ou muda de significado | Ele quebra — os diagnósticos de migração disparam |
| **MINOR** | Só os diagnósticos mudam; o arquivo continua válido | Mesmo desenho, painel diferente |
| **PATCH** | Só texto de mensagem ou tradução | Nada muda para o usuário |

* **A versão viaja no payload da URL compartilhável, não na linguagem.** Não existe pragma `odds 0.2` no topo do arquivo: o `.odds` é o artefato que alguém cola numa pull request, e um pragma obrigatório cobraria de todo usuário, para sempre, o preço de um problema que só existe na fronteira da URL — onde um campo de versão é grátis, porque a URL é gerada por máquina.
* **Só divergência de MAJOR aciona diagnósticos de migração.** Isso mantém o MAJOR raro e significativo, que é o que faz o `REMOVED_CONSTRUCT` valer alguma coisa.
* **A aplicação nunca migra o texto do usuário automaticamente.** Abrir uma URL antiga carrega o texto como está e deixa o `REMOVED_CONSTRUCT` trabalhar. Migração automática significaria carregar no bundle do navegador, para sempre, código de migração de toda versão passada — peso permanente num produto 100% client-side — e reescrever o texto do usuário é exatamente o que a proibição de inferir `[SK]` recusou (§1.C): em Architecture as Code o texto é a fonte de verdade, não um rascunho que a ferramenta corrige. A versão existe para tornar a mensagem **específica**, não para editar o arquivo.
* **Toda construção removida ganha um diagnóstico dedicado**, nunca um `SYNTAX_ERROR` genérico — ver `REMOVED_CONSTRUCT` (§1.A). É esse mecanismo que de fato resolve o problema do usuário, e ele funciona igual para arquivo em Git e para URL.

---

### Resumo para a Implementação do AST

Ao construir o seu *Visitor* (a função que percorre a árvore gerada pelo Parser), você precisará de uma tabela de símbolos (`AST_SCHEMA.md` §5). Os passos abaixo mapeiam para as fases da §3.2 — rode na ordem, e honre o princípio do erro-raiz entre eles.

1. **Passo 0 — cardinalidade (fase 2).** Verifique se o nó `Program` contém exatamente um nó `Domain`. Se não, reporte `INVALID_DOMAIN_CARDINALITY` e pare: não há um domain válido único para percorrer.
2. **Passo 1 — declarações (fase 2).** Percorra os nós `subdomain` e depois o bloco `external`, registrando cada `context` na tabela de símbolos junto com o tipo do subdomínio pai (`undefined` para contextos externos) e sua marca de validade. Ao registrar, verifique colisões de nome (`DUPLICATE_CONTEXT`, `DUPLICATE_SUBDOMAIN`), valide cada tipo de subdomínio (`INVALID_SUBDOMAIN_TYPE`) e anote subdomínios vazios (`EMPTY_SUBDOMAIN`, fase 5 — coletado aqui, emitido com sua fase).
3. **Passo 2 — relacionamentos.** Percorra o nó `mapping` em duas passagens, na ordem das fases: primeiro resolva identidade e existência das duas pontas (fase 3 — `PHANTOM_REFERENCE`, `SELF_RELATIONSHIP`, `DUPLICATE_RELATIONSHIP`, `EXTERNAL_ONLY_RELATIONSHIP`), descartando as linhas invalidadas; depois valide as tags das linhas sobreviventes contra a matriz da §1.C (fase 4) e, por fim, aplique as regras estratégicas por relacionamento (fase 5).
4. **Passo 3 — regras de arquivo inteiro (fase 5).** Com o mapa todo percorrido, avalie as regras agregadas: `DOMAIN_WITHOUT_CORE`, `UNMAPPED_CONTEXT`, `EXCESSIVE_SHARED_KERNEL` e `INCONSISTENT_BBM`.
5. **Passo 4 — supressão (fase 6).** Aplique as diretivas coletadas em `ProgramNode.suppressions` sobre o array produzido até aqui, emitindo `MALFORMED_SUPPRESSION` e `UNUSED_SUPPRESSION`.

Por fim, ordene o array inteiro pelas chaves da §3.3. A ordem emitida faz parte do contrato.
