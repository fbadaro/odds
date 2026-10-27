# MESSAGES: Catálogo de mensagens de diagnóstico — ODDS

## 0. Propósito deste documento

Este arquivo é o **catálogo de mensagens** da ODDS: um template de texto por `DiagnosticCode`, em português e inglês lado a lado.

Ele existe porque a mensagem textual **deixou de ser contrato**. Um `Diagnostic` é `severity` + `code` + `span` + `data` (`AST_SCHEMA.md` §1.2) — e nada mais. A frase que o usuário lê é produzida fora do núcleo validador, por uma função de renderização:

```typescript
renderMessage(code: DiagnosticCode, data: Record<string, string>, locale: "pt" | "en"): string
```

Três consequências que motivam a separação:

1. **O núcleo validador não conhece locale.** Parser e Visitor produzem veredito estruturado; PT e EN são decisão de apresentação. Antes, as mensagens moravam em `RULES-EN.md`/`RULES-PT.md` como prosa paralela — inclusive com o *nome do contexto de exemplo* traduzido (`'Payment'` × `'Pagamento'`), o que denunciava que aquilo nunca foi um template com placeholder, e sim dois textos independentes que precisavam ser mantidos em sincronia à mão.
2. **Os golden files asserem `data`, não a frase.** Reformular uma mensagem, corrigir uma vírgula ou revisar a tradução **não quebra teste nenhum** — é um incremento de PATCH da `ODDS Language Version` (`RULES.md` §6).
3. **A parte que mais divergia entre as duas traduções passou a morar num lugar só**, com PT e EN na mesma linha da tabela. Isso *ajuda* a sincronia que o `RULES-EN.md` e o `RULES-PT.md` exigem um do outro, em vez de disputá-la.

**O que a mensagem nunca faz:** repetir a severidade. Nada de `⚠️` embutido no texto, nada de prefixo "Erro:" ou "Aviso:". A severidade é um campo (`AST_SCHEMA.md` §1.1) e o ícone é decisão do painel — texto que carrega severidade fica errado no instante em que uma regra é reclassificada.

---

## 1. Regra de integridade (verificável por script)

> **Todo placeholder `{chave}` que aparece num template precisa existir na lista de chaves de `data` daquele code em `AST_SCHEMA.md` §1.3 — e vice-versa, em ambos os idiomas.**

É por isso que os placeholders são **nomeados**, e não posicionais. A checagem é mecânica, roda sem executar o validador, e pega os dois erros que essa separação poderia introduzir: um template que interpola dado que o diagnóstico não carrega (buraco em runtime), e um dado carregado que nenhuma mensagem usa (indício de regra mal desenhada ou de template desatualizado).

### 1.1 Segunda regra de integridade: `data` não carrega prosa

> **Nenhum valor de `data` pode conter texto de idioma nenhum.** Todo valor é um nome declarado pelo usuário, um token literal da gramática, um número decimal, ou um dos valores fechados de `AST_SCHEMA.md` §1.3. A prosa vive **inteira** no template — as duas colunas desta tabela são o único lugar do sistema onde uma frase existe.

A regra parece redundante com a §0 ("o núcleo validador não conhece locale"), mas não é: ela fecha a porta pela qual o locale voltou na prática. Um `data` como `{ replacement: "`-x-` on its own" }` satisfaz o contrato estrutural (é `Record<string, string>`, o placeholder existe dos dois lados) e ainda assim faz o template PT renderizar *"use `-x-` on its own no lugar"* — meia frase em cada idioma, sem que checagem nenhuma reclame.

O teste prático, para quem for escrever um code novo: **se o valor mudaria ao traduzir a mensagem, ele não pertence a `data`.** Um conjunto de tokens esperados (`SYNTAX_ERROR.expected`) é uma lista de literais da gramática, idêntica nos dois idiomas; a palavra "conector" que a descreve é do template. O mesmo vale para `REMOVED_CONSTRUCT.replacement`, que carrega a construção substituta (`-x-`) e não a instrução de como usá-la.

**Variantes.** Dois codes têm mais de uma mensagem, selecionada por uma chave de `data` declarada explicitamente na coluna *Variante*. Nenhum outro code pode ganhar variantes sem que a chave seletora seja adicionada aqui e seus valores fechados sejam registrados em `AST_SCHEMA.md` §1.3 — variante implícita, escolhida no código da UI, reintroduziria pela porta dos fundos a mensagem como contrato.

---

## 2. Fase 0–1 — sintaxe e estrutura

| Code | Variante | EN | PT |
|---|---|---|---|
| `SYNTAX_ERROR` | — | Unexpected token `{found}`: expected one of {expected}. | Token inesperado `{found}`: esperava um de {expected}. |
| `ORPHAN_CONTEXT` | — | The context `{context}` must belong to a subdomain, or be declared inside the `external` block. | O contexto `{context}` precisa pertencer a um subdomínio, ou ser declarado dentro do bloco `external`. |
| `ORPHAN_SUBDOMAIN` | — | The subdomain `{subdomain}` is declared outside the scope of a `domain`. | O subdomínio `{subdomain}` está declarado fora do escopo de um `domain`. |
| `REMOVED_CONSTRUCT` | — | `{construct}` was removed in ODDS {removedIn} — use `{replacement}` instead. | `{construct}` foi removida na ODDS {removedIn} — use `{replacement}` no lugar. |

---

## 3. Fase 2 — declarativa

| Code | Variante | EN | PT |
|---|---|---|---|
| `INVALID_DOMAIN_CARDINALITY` | — | An ODDS file must declare exactly one `domain`; this one declares {count}. | Um arquivo ODDS deve declarar exatamente um `domain`; este declara {count}. |
| `INVALID_SUBDOMAIN_TYPE` | — | `{value}` is not a valid subdomain type for `{subdomain}`. Use only `core`, `supporting` or `generic`. | `{value}` não é um tipo de subdomínio válido para `{subdomain}`. Use apenas `core`, `supporting` ou `generic`. |
| `DUPLICATE_CONTEXT` | — | The context `{context}` is declared more than once. Context names must be unique across the whole domain, including the `external` block. | O contexto `{context}` foi declarado mais de uma vez. Nomes de contexto devem ser únicos em todo o domain, inclusive no bloco `external`. |
| `DUPLICATE_SUBDOMAIN` | — | The subdomain `{subdomain}` is declared more than once. Subdomain names must be unique within the domain. | O subdomínio `{subdomain}` foi declarado mais de uma vez. Nomes de subdomínio devem ser únicos dentro do domain. |

---

## 4. Fase 3 — referencial

| Code | Variante | EN | PT |
|---|---|---|---|
| `PHANTOM_REFERENCE` | — | The context `{context}`, referenced in the Context Map, was not declared in any subdomain or in the `external` block. | O contexto `{context}`, referenciado no Context Map, não foi declarado em nenhum subdomínio nem no bloco `external`. |
| `SELF_RELATIONSHIP` | — | `{context}` cannot be in a relationship with itself. | `{context}` não pode se relacionar consigo mesmo. |
| `DUPLICATE_RELATIONSHIP` | — | `{left}` and `{right}` are already related on line {firstLine}. A pair of contexts has exactly one relationship — merge the two lines into one. | `{left}` e `{right}` já se relacionam na linha {firstLine}. Um par de contextos tem exatamente uma relação — junte as duas linhas em uma. |
| `EXTERNAL_ONLY_RELATIONSHIP` | — | `{left}` and `{right}` are both external systems. A context map documents *your* integrations; how two third parties talk to each other is not your decision to record. | `{left}` e `{right}` são ambos sistemas externos. Um context map documenta as *suas* integrações; como dois terceiros conversam entre si não é decisão sua a registrar. |

---

## 5. Fase 4 — relacional

| Code | Variante | EN | PT |
|---|---|---|---|
| `UPSTREAM_ONLY_TAG_MISPLACED` | — | `[{tag}]` can only be declared on the Upstream side of the integration — the side that supplies. | `[{tag}]` só pode ser declarada no lado Upstream da integração — o lado que fornece. |
| `DOWNSTREAM_ONLY_TAG_MISPLACED` | — | `[{tag}]` can only be declared on the Downstream side of the integration — the side that consumes. | `[{tag}]` só pode ser declarada no lado Downstream da integração — o lado que consome. |
| `MUTUAL_TAG_ON_DIRECTIONAL` | — | `[{tag}]` describes a mutual dependency and cannot be used with `{connector}`. Change the connector to `<->`. | `[{tag}]` descreve uma dependência mútua e não pode ser usada com `{connector}`. Troque o conector para `<->`. |
| `POSITIONAL_TAG_ON_MUTUAL` | — | `[{tag}]` is defined by an Upstream/Downstream position, and `<->` has neither. | `[{tag}]` é definida por uma posição Upstream/Downstream, e `<->` não tem nenhuma das duas. |
| `INCOMPLETE_MUTUAL_TAG` | `declaredSide: "left"` | `[{tag}]` is a bilateral agreement and must be declared on both sides — it appears only on the left side. | `[{tag}]` é um acordo bilateral e precisa ser declarada nos dois lados — ela aparece só no lado esquerdo. |
| `INCOMPLETE_MUTUAL_TAG` | `declaredSide: "right"` | `[{tag}]` is a bilateral agreement and must be declared on both sides — it appears only on the right side. | `[{tag}]` é um acordo bilateral e precisa ser declarada nos dois lados — ela aparece só no lado direito. |
| `MUTUAL_TAG_WITH_EXTERNAL` | — | `[{tag}]` cannot be used with `{external}`: there is no Shared Kernel or Partnership with a third-party system. | `[{tag}]` não pode ser usada com `{external}`: não existe Shared Kernel nem Partnership com um sistema de terceiros. |
| `SEPARATION_CONFLICT` | — | The `-x-` connector means the absence of integration. Remove the tags {tags}, or change the connector. | O conector `-x-` significa ausência de integração. Remova as tags {tags}, ou troque o conector. |
| `ROLE_CONFLICT` | — | `{context}` cannot be Customer `[C]` and Supplier `[S]` at the same time in the same relationship. | `{context}` não pode ser Customer `[C]` e Supplier `[S]` ao mesmo tempo na mesma relação. |
| `PROTECTION_CONFLICT` | — | `{context}` cannot be a Conformist `[CF]` and have an Anti-Corruption Layer `[ACL]` for the same integration. | `{context}` não pode ser Conformist `[CF]` e ter uma Anti-Corruption Layer `[ACL]` para a mesma integração. |

---

## 6. Fase 5 — estratégica

| Code | Variante | EN | PT |
|---|---|---|---|
| `CONFORMIST_CORE` | `trigger: "conformist"` | Strategic risk: the Core Domain context `{context}` is conforming to another system's model. Consider an `[ACL]` to protect your competitive advantage. | Risco estratégico: o contexto de Core Domain `{context}` está se conformando ao modelo de outro sistema. Considere um `[ACL]` para proteger sua vantagem competitiva. |
| `CONFORMIST_CORE` | `trigger: "bbm"` | Strategic risk: the Core Domain context `{context}` depends on a Big Ball of Mud system. Consider an `[ACL]` to keep the mess from spreading. | Risco estratégico: o contexto de Core Domain `{context}` depende de um sistema Big Ball of Mud. Considere um `[ACL]` para impedir que a bagunça se propague. |
| `GENERIC_WITHOUT_OHS` | — | `{context}` is Upstream and belongs to the generic subdomain `{subdomain}`, but exposes no `[OHS]`. Generic solutions should provide well-defined services; without one, the coupling is hidden. | `{context}` está Upstream e pertence ao subdomínio genérico `{subdomain}`, mas não expõe nenhum `[OHS]`. Soluções genéricas deveriam fornecer serviços bem definidos; sem um, o acoplamento fica escondido. |
| `CORE_UPSTREAM_OF_GENERIC` | — | The Core Domain context `{core}` is Upstream of the generic context `{generic}`. Strategic design points the other way: the core consumes the generic, not the reverse. | O contexto de Core Domain `{core}` está Upstream do contexto genérico `{generic}`. O desenho estratégico aponta na direção oposta: o core consome o genérico, não o contrário. |
| `CORE_IN_SHARED_KERNEL` | — | The Core Domain context `{core}` shares a kernel with `{other}`. A Shared Kernel is physical model coupling — your competitive advantage can no longer evolve on its own. | O contexto de Core Domain `{core}` compartilha um kernel com `{other}`. Um Shared Kernel é acoplamento físico de modelo — sua vantagem competitiva deixa de poder evoluir sozinha. |
| `DOMAIN_WITHOUT_CORE` | — | The domain `{domain}` declares no `core` subdomain. A strategic map should say where the competitive advantage lives. | O domain `{domain}` não declara nenhum subdomínio `core`. Um mapa estratégico deveria dizer onde vive a vantagem competitiva. |
| `INCONSISTENT_BBM` | — | `{context}` carries `[BBM]` on {withBbm} relationship(s) and not on {withoutBbm}. `[BBM]` characterises the system, so it should appear on every relationship that touches it. | `{context}` carrega `[BBM]` em {withBbm} relação(ões) e não carrega em {withoutBbm}. `[BBM]` caracteriza o sistema, então deveria aparecer em toda relação que o toca. |
| `INCOMPLETE_CUSTOMER_SUPPLIER` | — | `{context}` declares `[{declared}]`, but the other side does not declare `[{missing}]`. Customer/Supplier is a bilateral agreement, and half of it documents half a contract. | `{context}` declara `[{declared}]`, mas o outro lado não declara `[{missing}]`. Customer/Supplier é um acordo bilateral, e metade dele documenta meio contrato. |
| `EXCESSIVE_SHARED_KERNEL` | — | This file declares {count} shared kernels. Each one couples two teams physically; use them sparingly. | Este arquivo declara {count} shared kernels. Cada um acopla fisicamente dois times; use com parcimônia. |
| `UNDOCUMENTED_CONTRACT` | — | The integration between `{left}` and `{right}` declares no Context Map pattern. An undeclared relationship hides the real coupling between the teams — add a tag such as `[OHS]`, `[ACL]` or `[CF]`. | A integração entre `{left}` e `{right}` não declara nenhum padrão de Context Map. Uma relação não declarada esconde o acoplamento real entre os times — adicione uma tag como `[OHS]`, `[ACL]` ou `[CF]`. |
| `UNMAPPED_CONTEXT` | — | `{context}` is declared but never appears in the `mapping` block. | `{context}` está declarado mas nunca aparece no bloco `mapping`. |
| `EMPTY_SUBDOMAIN` | — | The subdomain `{subdomain}` declares no context. | O subdomínio `{subdomain}` não declara nenhum contexto. |
| `PL_WITHOUT_OHS` | — | `{context}` declares `[PL]` without `[OHS]` on the same side. A Published Language is usually published *through* an Open-Host Service. | `{context}` declara `[PL]` sem `[OHS]` no mesmo lado. Uma Published Language normalmente é publicada *através de* um Open-Host Service. |

---

## 7. Fase 6 — supressão

| Code | Variante | EN | PT |
|---|---|---|---|
| `MALFORMED_SUPPRESSION` | `reason: "unknown-code"` | `{code}` is not a known diagnostic code, so this directive suppresses nothing. | `{code}` não é um code de diagnóstico conhecido, então esta diretiva não suprime nada. |
| `MALFORMED_SUPPRESSION` | `reason: "missing-justification"` | The suppression of `{code}` has no justification. Write, after the colon, why the rule is being set aside. | A supressão de `{code}` está sem justificativa. Escreva, depois dos dois-pontos, por que a regra está sendo deixada de lado. |
| `MALFORMED_SUPPRESSION` | `reason: "not-suppressible"` | `{code}` is an error and can never be suppressed. An error says the model is incoherent, not that the tool disagrees with you. | `{code}` é um erro e nunca pode ser suprimido. Um erro diz que o modelo está incoerente, não que a ferramenta discorda de você. |
| `UNUSED_SUPPRESSION` | — | `{code}` did not fire on the following line — this suppression can be removed. | `{code}` não disparou na linha seguinte — esta supressão pode ser removida. |

---

## 8. Forma serializada (`messages.json`)

Quando a implementação começar, este catálogo deve ser extraído para um `messages.json` carregado pela UI. As tabelas acima continuam sendo a **fonte de verdade editável**; o JSON é derivado delas, e a checagem da §1 roda sobre o JSON.

```jsonc
{
  "PHANTOM_REFERENCE": {
    "en": "The context `{context}`, referenced in the Context Map, was not declared in any subdomain or in the `external` block.",
    "pt": "O contexto `{context}`, referenciado no Context Map, não foi declarado em nenhum subdomínio nem no bloco `external`."
  },

  // Codes com variante: um nível a mais, chaveado pelo valor da chave seletora,
  // que é declarada em `variantKey`.
  "CONFORMIST_CORE": {
    "variantKey": "trigger",
    "variants": {
      "conformist": { "en": "Strategic risk: …", "pt": "Risco estratégico: …" },
      "bbm":        { "en": "Strategic risk: …", "pt": "Risco estratégico: …" }
    }
  }
}
```

**Comportamento obrigatório em caso de falta:** se um code não tiver template no locale pedido, caia para `en`; se não tiver em `en`, renderize o próprio `code` mais o `data` serializado. Nunca lance exceção e nunca renderize string vazia — uma mensagem faltando é um bug de catálogo, e engolir o diagnóstico inteiro por causa dele esconderia um problema real do modelo do usuário atrás de um problema de tradução.
