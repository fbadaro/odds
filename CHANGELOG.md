# CHANGELOG

A **ODDS Language Version** é a versão do que um arquivo `.odds` *significa*, definida pelos documentos normativos em conjunto (`GRAMMAR.md` + `RULES-EN.md`/`RULES-PT.md` + `AST_SCHEMA.md`). Ela viaja no payload da URL compartilhável e responde à pergunta de quem reabre um mapa antigo: *"esses avisos novos são meus ou da ferramenta?"*. O resto do histórico está no git.

Um passe que muda o que um `.odds` significa acrescenta aqui uma entrada curta; a C17 de `npm run check:spec` cobra isso. As entradas estão em ordem cronológica (mais antiga primeiro).

---

## ODDS Language Version

Versão atual: **v1.0.2**.

**Regra de incremento — SemVer com o corte na validade do arquivo** (`RULES-EN.md` §6):

| Incremento | Quando | Efeito num `.odds` existente |
|---|---|---|
| **MAJOR** | Um arquivo válido deixa de ser válido, ou muda de significado | Ele quebra — os diagnósticos de migração (`REMOVED_CONSTRUCT`) disparam |
| **MINOR** | Só os diagnósticos mudam; o arquivo continua válido | Mesmo desenho, painel diferente |
| **PATCH** | Só texto de mensagem ou tradução (`MESSAGES.md`) | Nada muda para o usuário |

A URL guarda a versão cheia, mas **só divergência de MAJOR** aciona diagnóstico de migração — é isso que mantém o MAJOR raro e significativo.

- **v0.1.0** — nascimento da versão de linguagem. Duas quebras decididas antes dela entram **dentro** desta primeira versão, sem migração retroativa, porque não existia usuário nem URL publicada: a tag `[SW]` deixou de existir e `external` virou palavra reservada. `[SW]` é o primeiro membro da família `REMOVED_CONSTRUCT`, com `removedIn: "0.1.0"` — uma cortesia para rascunhos do período pré-versionamento. Correções posteriores da mesma auditoria (a unidade de `column` e a proibição de prosa em `data`) foram absorvidas nesta versão, porque ela ainda não tinha fechado; a partir da primeira publicação, a tabela vale sem exceção.
- **v1.0.0** — `subdomain` ganha duas propriedades, `description` e `owner` (`ADR-0008`), e `owner` passa a ser **palavra reservada**. É MAJOR pela tabela: um arquivo que declare um nome `owner` deixa de ser válido. Tratar `owner` como palavra contextual, que manteria a mudança em MINOR, foi recusado, para que toda chave de propriedade continue reservada. **Sem diagnóstico de migração dedicado**, de propósito: o `RULES-EN.md` §6 dá diagnóstico próprio a construto **removido**, e aqui nada foi removido. Um nome `owner` recebe o mesmo `SYNTAX_ERROR` que as outras palavras reservadas usadas como nome.
- **v1.0.1** — PATCH: só texto de mensagem. O template em português de `INCOMPLETE_MUTUAL_TAG` interpolava `declaredSide` como palavra e renderizava *"ela aparece só no lado right"*. O code passa a ter duas variantes selecionadas por `declaredSide`, como `CONFORMIST_CORE` já fazia com `trigger`. Nenhum `data`, span, severidade ou golden file muda.
- **v1.0.2** — PATCH: só texto de mensagem. `EXTERNAL_ONLY_RELATIONSHIP` passa a dizer *external contexts* / *contextos externos* em vez de *external systems* / *sistemas externos*, o termo do `GLOSSARY.md`. Nenhum `data`, span, severidade ou golden file muda.
