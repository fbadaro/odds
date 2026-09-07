/**
 * Regressões do pipeline de validação.
 *
 * Como o `parser.test.ts`, este arquivo existe porque os 44 golden files não
 * alcançam o que ele cobre: cada caso da suíte isola **um** problema num
 * arquivo no mais bem formado possível. O controle de fluxo entre fases — o que
 * para, o que sobrevive, o que é derivado — só aparece quando dois problemas
 * coexistem, e a suíte nunca os combina.
 */

import { describe, expect, it } from "vitest";

import { parseAndValidate } from "../src/parseAndValidate.js";

const codes = (source: string) => parseAndValidate(source).diagnostics.map((d) => d.code);

describe("Passo 0 é terminal (RULES-EN.md, resumo para implementação da AST)", () => {
  // "Verify the Program node contains exactly one Domain node. If not, report
  // INVALID_DOMAIN_CARDINALITY and STOP: there is no single valid domain to
  // traverse." Tudo que viesse depois seria derivado de um erro, o que a §3.1
  // proíbe.

  it("para o pipeline quando há mais de um domain, mesmo com outros problemas", () => {
    expect(codes(`domain A {
  subdomain invalido S {
    context X
  }
  subdomain core C {
    context X
  }
  mapping {
    X --> X
  }
}

domain B {
  subdomain core D {
    context Y
  }
}`)).toEqual(["INVALID_DOMAIN_CARDINALITY"]);
  });

  it("não acusa supressão obsoleta num arquivo sem domain", () => {
    // `UNUSED_SUPPRESSION` aqui seria falso: a regra não deixou de disparar por
    // estar obsoleta, e sim porque o arquivo nunca chegou a ser percorrido.
    expect(codes(`// odds-disable-next-line UNDOCUMENTED_CONTRACT: em negociação
// nenhum domain declarado neste arquivo`)).toEqual(["INVALID_DOMAIN_CARDINALITY"]);
  });

  it("preserva o que a fase 1 já havia emitido", () => {
    // A fase 1 roda no parser e precede a 2 — o diagnóstico dela não é
    // derivado da cardinalidade, é anterior a ela.
    expect(codes(`subdomain core S {
  context A
}`)).toEqual(["ORPHAN_SUBDOMAIN", "INVALID_DOMAIN_CARDINALITY"]);
  });

  it("segue avaliando normalmente quando há exatamente um domain", () => {
    expect(codes(`domain A {
  subdomain invalido S {
    context X
  }
}`)).toContain("INVALID_SUBDOMAIN_TYPE");
  });
});

describe("princípio do erro-raiz entre fases (RULES-EN.md §3.1)", () => {
  it("um subdomínio invalidado leva os contextos dele junto", () => {
    // `X` está num subdomínio com tipo inválido, então sai do pipeline: não
    // pode gerar UNMAPPED_CONTEXT nem alimentar regra estratégica.
    const emitted = codes(`domain A {
  subdomain invalido S {
    context X
  }
  subdomain core C {
    context Y
    context Z
  }
  mapping {
    Y [OHS] --> Z
  }
}`);
    expect(emitted).toContain("INVALID_SUBDOMAIN_TYPE");
    expect(emitted).not.toContain("UNMAPPED_CONTEXT");
  });

  it("um contexto descartado pela recuperação não vira referência fantasma", () => {
    // Descartar não é esquecer: o contexto *foi* declarado, só que no lugar
    // errado. Um erro do usuário, um diagnóstico.
    const emitted = codes(`domain A {
  context Orphan
  subdomain core C {
    context Y
  }
  mapping {
    Y [OHS] --> Orphan
  }
}`);
    expect(emitted).toContain("ORPHAN_CONTEXT");
    expect(emitted).not.toContain("PHANTOM_REFERENCE");
  });
});
