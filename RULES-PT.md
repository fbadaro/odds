## 🧠 Relacionamentos de Equipe (Team Relationships)

Estes três relacionamentos descrevem a *forma* da dependência entre duas equipes ou bounded contexts, e mapeiam diretamente para os conectores da ODDS (`-->`, `<--`, `<->`, `-x-`).

*Nota de tradução: as descrições abaixo seguem em inglês, espelhando o conteúdo de RULES-EN.md (fonte de verdade); a tradução integral do corpo do texto é um item pendente separado.*

| Relationship | Description |
|---|---|
| Mutually Dependent | Two teams or bounded contexts are mutually dependent when their software artifacts need to be delivered together to succeed. Failure or a timeline shift in one immediately impacts the other. A lot of coordination and communication is required (see Partnership pattern). Expressed with the `<->` connector. |
| Upstream / Downstream | The upstream team's decisions affect the downstream team, but not the other way around — the upstream team may succeed independently of the downstream team's fate. The downstream team's needs can be addressed in a variety of ways, with a wide range of consequences (see Conformist, Customer-Supplier, and Anti-Corruption Layer patterns). Expressed with `-->` (left side is Upstream) or `<--` (right side is Upstream). |
| Free | No organizational or technical link of any kind exists between the two contexts; changes in one do not influence the success or failure of the other. Expressed with the `-x-` connector. |

---

## 🧠 Padrões de Context Map (Context Map Patterns)

Estes nove padrões descrevem a *solução* técnica e social aplicada sobre um Relacionamento de Equipe — o contrato ou estratégia de proteção específica escolhida na fronteira.

| Relationship | Description |
|---|---|
| Partnership | Two teams have a mutual dependency on each other's context to the extent that if either fails, both will fail. The contexts are peers, meaning that there is no ceremony required between expressing needs and receiving due functionality. The winners are those who best coordinate and cooperate. Partnerships can be slower and more difficult due to the complexity of integrated models and schedules. |
| Shared Kernel | Two or more teams share a small, common model, that is blended with their own specialized model. This requires agreement, and is often best used for system-wide standards, such as monetary or others. Note that this is not just a data schema (see Published Language), but a model with both data and behavior (object types). Caution is warranted against overuse or imagining that a reusable library fits the bill. The artifact is a shared, small, model. |
| Customer-Supplier | A team has a dependency on another team's Bounded Context, but the teams are not peers. Rather, the dependent is downstream from the upstream dependency. This makes the downstream team subject to the availability of schema and functionality that meets their specific needs. Addressing special needs is left to the discretion of the upstream team, which may impact the downstream team's timeline and capabilities. |
| Conformist | A downstream team must conform to an upstream model. This dependency is might be a desired choice, but is often determined by the complexity of the upstream model and downstream team's capacity and capabilities. Of course, any changes to the upstream model can/will have an impact on the downstream team, depending on their usage surface area. |
| Separate Ways | A team could potentially integrate with another model, but might decide that the benefit doesn't match the effort required, so the team decides to create their own one-off solution. Care must be taken with respect to DRY, or Don't Repeat Yourself. Note that DRY means "Don't Repeat Knowledge," not "Don't Repeat Code." Knowledge silos are problematic because repetition of captured knowledge in a business software context might cause deviation in one or more repeating models. When DRY as in knowledge is a certain factor, consider integration instead. |
| Anti-Corruption Layer | A downstream team has both the capacity and capabilities to take a highly defensive posture in consuming upstream model. The upstream model is often complex and poorly designed, but the downstream model can still benefit by translating even clean models to their own language. The downstream creates a set of translation components that render the upstream model to a specific design that adheres to their own model design. |
| Open-Host Service | A model has a well-designed API that enables one or more other teams to confidently and reliably perform operations. The consumed API is not automatically in an upstream position, which means that the majority of the previous and following relationships apply. That is, any consuming team can find themselves in a variety of circumstances, which will determine how the model behind the API is used. See also Published Language. |
| Published Language | A set of well-designed schema specifications—possibly considered a single specification—are provided for data exchange between Bounded Contexts. A Published Language is often paired with and Open-Host Service. A specific schema set can be an standard of the following proportions: international, national, industry, inter-business, intra-business, and context/model/team. |
| Big Ball of Mud | Systems are often implemented in monoliths without any intentional design and architecture, and have been long subjected to expedient change. There are generally no efforts or even recognition of the complex problems that will be at play, even quite early in the software life cycle, and thus are left to chance. Technical debt rises continually and is seldom paid. The tangle that ensues is often compared to a large, muddy, amorphous blob, or otherwise, a brown field of software. In time nearly zero changes can be made without regression, which cause system releases to stagnate. |

---

## 🧠 Propriedades de Contexto (Metadados)

Além da declaração estrutural (`context Nome { ... }`), um Bounded Context — e, nos níveis externos, um `domain` ou `subdomain` — pode carregar metadados descritivos. Esses metadados são **informativos**: documentam intenção para humanos e ferramentas, mas não participam de nenhuma validação de Team Relationship ou Context Map Pattern descrita acima. A sintaxe formal dessas propriedades está no `GRAMMAR.md`; esta seção documenta seu significado pretendido.

| Propriedade | Disponível em | Propósito |
|---|---|---|
| `title` | `domain`, `subdomain`, `context` | Rótulo de exibição legível para humanos, distinto do identificador técnico usado para referenciar o elemento em outros lugares (ex: no `mapping`). Destinado à renderização no canvas/diagrama. |
| `type` | `context` | Classificação em texto livre da natureza do contexto (ex: "serviço", "sistema legado", "gateway"). Deliberadamente aberto, sem taxonomia fechada — não existe uma lista fixa de valores válidos. |
| `description` | `context` | Explicação em texto livre do propósito e papel do contexto. |
| `responsibilities` | `context` | Uma lista das responsabilidades de negócio ou técnicas atribuídas a este contexto. |
| `maturity` | `context` | Estágio de maturidade do ciclo de vida do contexto. Um de: `experimental`, `growing`, `mature`, `legacy`. |
| `team` | `context` | O time responsável pelo contexto, em texto livre. |
| `technology` | `context` | A stack de tecnologia usada para implementar o contexto, em texto livre. |

Nenhuma dessas propriedades dispara, por si só, um Erro Crítico ou Aviso de Linting. Em particular, `maturity: legacy` **não** implica automaticamente um padrão `[BBM]` (Big Ball of Mud) nem dispara nenhum aviso da seção 2 abaixo — são conceitos independentes (um documenta estágio de ciclo de vida, o outro documenta um padrão de integração), e misturá-los seria uma decisão de modelagem que a ferramenta não deve tomar silenciosamente em nome do usuário.

---

## 🧠 Validações Semânticas (AST Analysis & Architecture Rules)

Para garantir que o **Open Domain Driven Specification (ODDS)** não seja apenas uma ferramenta de desenho, mas sim um "validador de arquitetura" que ensina e força as boas práticas do DDD, o parser precisará realizar uma análise semântica profunda da Árvore Sintática Abstrata (AST).

Podemos dividir as validações semânticas em duas categorias principais: **Erros Fatais** (que impedem a renderização) e **Avisos de Linting** (que renderizam, mas alertam sobre decisões arquiteturais perigosas).

Abaixo estão todas as validações detalhadas que o seu motor precisará verificar:

---

### 1. Erros Fatais (Bloqueiam a Compilação)

Estas regras garantem a integridade do código e a consistência básica do mapa de contexto.

#### A. Validações de Escopo e Hierarquia (Lexical Scoping)

* **Contexto Órfão:** Um `context` não pode existir solto fora de um `subdomain`.
* *Erro:* `"Um Bounded Context deve obrigatoriamente pertencer a um Subdomínio."*


* **Subdomínio Órfão:** Um `subdomain` não pode existir fora do escopo de um `domain`.
* *Erro:* `"Declaração de subdomínio inválida fora do escopo principal de 'domain'."*


* **Referência Fantasma no Context Map:** O parser deve ler todas as declarações de contextos primeiro. Quando chegar na seção de relacionamentos, deve checar se os contextos citados existem.
* *Erro:* `"O contexto 'Pagamento' referenciado no Context Map não foi declarado em nenhum subdomínio."*

* **Declaração Duplicada de Contexto:** O nome de um `context` deve ser único em todo o `domain`. O mesmo nome não pode ser declarado em dois `subdomain` diferentes (nem duas vezes no mesmo).
* *Erro:* `"O contexto 'PaymentGateway' foi declarado mais de uma vez. Nomes de contexto devem ser únicos dentro do domain."*

* **Cardinalidade Inválida de Domain:** Um arquivo ODDS deve declarar **exatamente um** `domain`. Um arquivo com zero declarações de `domain`, ou com mais de uma, é inválido.
* *Erro:* `"Um arquivo ODDS deve conter exatamente uma declaração de 'domain'."*

#### B. Validações de Tipagem Estrita

* **Modificadores de Subdomínio Inválidos:** A linguagem exige que o usuário classifique o espaço do problema.
* *Regra:* O identificador após a palavra `subdomain` deve ser estritamente `core`, `supporting` ou `generic`.
* *Erro:* `"Tipo de subdomínio desconhecido. Utilize apenas 'core', 'supporting' ou 'generic'."


#### C. Validações de Posição de Tags (Upstream vs Downstream)

Esta é a parte mais inteligente do parser, baseada na direção das setas (`-->` e `<--`).

* **Tags exclusivas de Upstream (Fornecedor):** As tags `[OHS]` (Open Host Service), `[PL]` (Published Language) e `[S]` (Supplier) **só podem** aparecer no lado que está fornecendo a informação.
* *Exemplo Inválido:* `ContextA --> [OHS] ContextB` (O `-->` diz que B é Downstream, mas OHS é padrão de Upstream).
* *Erro:* `"Padrão Inválido: Um Open Host Service (OHS) só pode ser exposto pelo lado Upstream da integração."*


* **Tags exclusivas de Downstream (Consumidor):** As tags `[ACL]` (Anti-Corruption Layer), `[CF]` (Conformist) e `[C]` (Customer) **só podem** aparecer no lado que consome a informação.
* *Erro:* `"Padrão Inválido: Uma Anti-Corruption Layer (ACL) só pode ser aplicada no lado Downstream para proteger seu próprio modelo."*


* **Tags Mútuas Exclusivas:** As tags `[SK]` (Shared Kernel) e `[P]` (Partnership) exigem bidirecionalidade.
* *Regra:* Recomenda-se que usem o conector `<->`. Se declaradas, devem preferencialmente aparecer em ambos os lados ou o parser pode inferir para o outro lado automaticamente.
* *Nota:* A Dependência Mútua em si é expressa apenas pelo conector `<->` — não existe uma tag `[MD]` separada na ODDS.


#### D. Validações de Conflito e Exclusividade

* **Conflito de Separação:** Se o conector `-x-` (Free) ou a tag `[SW]` (Separate Ways) for usada, não pode haver indicativo de integração técnica na mesma linha.
* *Exemplo Inválido:* `ContextA [OHS] -x- [ACL] ContextB`
* *Erro:* `"Conflito Semântico: O relacionamento Separate Ways (-x-) indica ausência de integração. Remova as tags [OHS] e [ACL]."`


* **Conflitos de Papel:** Um contexto não pode ser `[C]` (Customer) e `[S]` (Supplier) simultaneamente na mesma relação.
* **Conflito de Proteção:** Não faz sentido um contexto ser `[CF]` (Conformist - aceita tudo) e ter um `[ACL]` (Anti-Corruption Layer - protege e traduz) para a mesma integração.
* *Erro:* `"Conflito de Padrões: Um contexto não pode ser Conformist e ter uma Anti-Corruption Layer simultaneamente."*

---

### 2. Avisos de "Linting" Arquitetural (Warnings Visuais)

Estas validações não quebram o desenho, mas podem colocar um ícone de alerta (⚠️) no diagrama gerado, ajudando a equipe a notar "cheiros ruins" (code smells) na arquitetura corporativa.

#### E. Avisos de Alinhamento de Negócio (Espaço do Problema)

* **Core Domain se Conformando ou Herdando Lama:** O `core` é a maior vantagem competitiva da empresa. Se ele é refém de sistemas externos, o negócio corre risco.
* *Gatilho:* Um contexto dentro de um `subdomain core` recebendo uma seta com `[CF]` (Conformist) ou se conectando a um sistema com `[BBM]` (Big Ball of Mud).
* *Aviso:* `"⚠️ Risco Estratégico: Um contexto do Core Domain está se conformando ao modelo de outro sistema. Considere utilizar um [ACL] para proteger sua vantagem competitiva."*


* **Core Domain Focado em Infraestrutura/Prateleira:**
* *Gatilho:* Se muitos padrões `generic` começarem a ditar regras (sendo amplamente Upstream sem ACL nos consumidores).
* *Aviso:* `"⚠️ Soluções Genéricas devem idealmente fornecer serviços bem definidos [OHS]. Cuidado com o acoplamento excessivo."*


* **Excesso de Shared Kernel:**
* *Gatilho:* Múltiplos contextos usando `[SK]` na arquitetura.
* *Aviso:* `"⚠️ O uso excessivo de Shared Kernel aumenta drasticamente o acoplamento entre equipes. Utilize com parcimônia."*

* **Contrato de Integração Não Documentado:**
* *Gatilho:* Uma seta de relacionamento (`-->`, `<--` ou `<->`) entre dois contextos sem nenhuma tag de Context Map Pattern (ex.: `[OHS]`, `[ACL]`, `[CF]`, `[PL]`, `[SK]`, `[C]`, `[S]`, `[P]`) declarada em nenhum dos lados. Não dispara em linhas `-x-` (Free), onde a ausência de tag é o sinal esperado.
* *Aviso:* `"⚠️ Contrato Não Documentado: Esta integração não possui nenhum padrão de Context Map explícito. Um relacionamento não declarado esconde o acoplamento real entre equipes. Adicione uma tag (ex.: [OHS], [ACL], [CF]) para tornar o contrato de integração explícito."`

---

### Resumo para a Implementação do AST

Ao construir o seu *Visitor* (a função que percorre a árvore gerada pelo Parser), você precisará de uma estrutura de dados de "Tabela de Símbolos" ou "Dicionário de Contextos".

1. **Passo 0:** Verifique se o nó `Program` contém exatamente um nó `Domain` (Cardinalidade Inválida de Domain). Se não, reporte o erro e pare — não há um domain válido para continuar percorrendo.
2. **Passo 1:** Percorre os nós `subdomain`, registrando em memória o nome de cada `context` e o tipo do subdomínio pai (`core`, `supporting`, `generic`). Ao registrar, verifique colisões de nome (Declaração Duplicada de Contexto) — um nome já presente na tabela de símbolos é um erro.
3. **Passo 2:** Percorre os nós de `relacionamento` (Context Map), cruzando com os dados salvos no Passo 1 para verificar existência, aplicar regras de posição (`-->` / `<--`) e validar os conflitos de Arrays de tags.