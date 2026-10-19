/**
 * O ajuste ao vivo do recorte de Pagamentos: o playground abre o modelo incoerente
 * e o botão "Tornar coerente" aplica estes passos, na ordem, na frente da sala.
 *
 * pagamentos.odds é o ponto de chegada (valida limpo). O ponto de partida não é um
 * segundo arquivo: sai daqui, desfazendo os passos de trás para frente, para os dois
 * não poderem divergir. Cada passo troca uma linha inteira (`antes` → `depois`) e
 * apaga exatamente o diagnóstico `code`; o playground.build.mjs confere isso passo a
 * passo contra o validador, e falha se um passo apagar dois, nenhum, ou revelar outro.
 *
 * Erros primeiro: um elemento com erro sai das fases seguintes, e consertá-lo por
 * último faria aparecer aviso novo no meio do ajuste.
 */
export const AJUSTES = [
  {
    code: "PHANTOM_REFERENCE",
    antes: "    PaymentExecution    [OHS]     -->      Ledger",
    depois: "    PaymentExecution    [OHS]     -->      PositionKeeping",
    porque: "O mapa citava Ledger, o nome antigo de PositionKeeping. A relação passa a apontar para o contexto declarado.",
  },
  {
    code: "INCOMPLETE_MUTUAL_TAG",
    antes: "    PositionKeeping     [SK]      <->      CurrentAccount",
    depois: "    PositionKeeping     [SK]      <-> [SK] CurrentAccount",
    porque: "Shared Kernel é dos dois lados ou não é: CurrentAccount declara a parte dela.",
  },
  {
    code: "SEPARATION_CONFLICT",
    antes: "    ACHOperations [ACL] -x-                CardNetwork",
    depois: "    ACHOperations       -x-                CardNetwork",
    porque: "Caminhos separados não têm contrato: uma tag de padrão em -x- se contradiz.",
  },
  {
    code: "UPSTREAM_ONLY_TAG_MISPLACED",
    antes: "    FraudEvaluation     [S]       --> [S]  FraudDiagnosis",
    depois: "    FraudEvaluation     [S]       --> [C]  FraudDiagnosis",
    porque: "[S] é do fornecedor, do lado upstream. Do lado de quem recebe, o par é [C].",
  },
  {
    code: "INCOMPLETE_CUSTOMER_SUPPLIER",
    antes: "    PaymentOrder        [S]       -->      PaymentExecution",
    depois: "    PaymentOrder        [S]       --> [C]  PaymentExecution",
    porque: "Cliente/fornecedor é acordo dos dois lados: a Execução assume o [C].",
  },
  {
    code: "GENERIC_WITHOUT_OHS",
    antes: "    BusinessCalendar              --> [ACL] PaymentOrder",
    depois: "    BusinessCalendar    [OHS]     --> [ACL] PaymentOrder",
    porque: "Um genérico serve a muitos: o Calendário publica um serviço aberto, [OHS].",
  },
  {
    code: "CONFORMIST_CORE",
    antes: "    DICT                [OHS, PL] --> [CF] PaymentInitiation",
    depois: "    DICT                [OHS, PL] --> [ACL] PaymentInitiation",
    porque: "Um core não se conforma ao modelo de fora: a Iniciação traduz o DICT numa camada anticorrupção, [ACL].",
  },
];

/** O texto de partida: os passos desfeitos de trás para frente. */
export function quebrar(coerente) {
  return AJUSTES.slice().reverse().reduce((t, a) => t.replace(a.depois, a.antes), coerente);
}
