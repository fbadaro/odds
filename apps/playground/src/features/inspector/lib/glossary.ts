/** The bench's TAGS: name and one-line meaning of each tag, as the ficha of a relation shows them. */
export const TAGS: Record<string, [string, string]> = {
  OHS: ["Open-Host Service", "Oferece uma API bem desenhada, para que outros times operem sobre o modelo com confiança."],
  PL: ["Published Language", "Publica um esquema documentado para a troca de dados; costuma andar junto com o OHS."],
  S: ["Supplier", "Fornecedor de um Customer-Supplier: atende às necessidades do downstream, a critério próprio."],
  C: ["Customer", "Cliente de um Customer-Supplier: depende do upstream e negocia o que precisa dele."],
  CF: ["Conformist", "Adota o modelo do upstream como ele é, sem traduzir."],
  ACL: ["Anti-Corruption Layer", "Traduz o modelo do upstream para a própria linguagem, numa camada defensiva."],
  SK: ["Shared Kernel", "Os dois times dividem um modelo pequeno e comum, com dado e comportamento."],
  P: ["Partnership", "Os dois times dependem um do outro a ponto de falharem juntos; coordenam como pares."],
  BBM: ["Big Ball of Mud", "Caracteriza o sistema, não o contrato: um monólito sem desenho intencional. Não é tag de padrão."],
};

/** The bench's FORMS: what each connector means. */
export const FORMS: Record<"-->" | "<--" | "<->" | "-x-", [string, string]> = {
  "-->": ["Upstream / Downstream", "As decisões do upstream afetam o downstream, e não o contrário."],
  "<--": ["Upstream / Downstream", "As decisões do upstream afetam o downstream, e não o contrário."],
  "<->": ["Mutuamente dependentes", "Os dois precisam ser entregues juntos; atraso ou falha num afeta o outro na hora."],
  "-x-": ["Separate Ways", "Nenhum vínculo entre os dois: integrar não valeria o esforço, e cada um resolve sozinho."],
};
