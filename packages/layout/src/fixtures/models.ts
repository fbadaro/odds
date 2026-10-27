/**
 * Os modelos de amostra (`MODELS`, `BREAKS`, `EXTRA`), copiados literalmente do
 * protótipo v4. São o banco de prova do layout: as propriedades e
 * os goldens são medidos sobre eles.
 */
import type { LayoutContext, LayoutModel, LayoutRelation } from "../types.js";

/** Uma quebra de desenho: substitui campos de uma relação existente. */
export interface Break {
  l: string;
  r: string;
  set: Partial<Pick<LayoutRelation, "lt" | "rt">>;
}

/* ---------------- modelo ---------------- */
/* Os contextos sao os mesmos da v2, com as seis propriedades do GRAMMAR.md
   secao 2 preenchidas. No `external`, so description e technology: pelo
   principio de autoria do RULES secao 0.4, team e maturity de terceiro nao sao
   seus para declarar. */
export const C_SALES: LayoutContext[] = [
  {id:'Cart', title:'Carrinho', type:'"aggregate"',
   description:'"Itens escolhidos antes do fechamento, com reserva temporária"',
   responsibilities:['"Manter itens e quantidades"','"Aplicar cupom"','"Expirar carrinho abandonado"'],
   maturity:'mature', team:'"Vendas Squad"', technology:'"TypeScript, Redis"'},
  {id:'Checkout', title:'Finalização de compra', type:'"process"',
   description:'"Orquestra endereço, frete, pagamento e confirmação do pedido"',
   responsibilities:['"Validar endereço"','"Calcular frete"','"Autorizar pagamento"','"Emitir o pedido"'],
   maturity:'growing', team:'"Vendas Squad"', technology:'"TypeScript, Temporal"'},
  {id:'OrderManagement', title:'Gestão de pedidos', type:'"aggregate"',
   description:'"Ciclo de vida do pedido, da emissão à baixa"',
   responsibilities:['"Manter o estado do pedido"','"Registrar eventos de fulfillment"','"Tratar cancelamento"'],
   maturity:'mature', team:'"Pedidos Squad"', technology:'"Java, PostgreSQL"'},
  {id:'Pricing', title:'Precificação', type:'"policy"',
   description:'"Preço final por item, com promoção, imposto e regra de canal"',
   responsibilities:['"Resolver preço de lista"','"Aplicar promoção vigente"','"Compor imposto"'],
   maturity:'experimental', team:'"Pricing Squad"', technology:'"Kotlin, Redis"'}
];
export const C_DISCOVERY: LayoutContext[] = [
  {id:'Search', title:'Busca', type:'"read-model"',
   description:'"Índice do catálogo, com filtro, ordenação e sinônimo"',
   responsibilities:['"Indexar catálogo"','"Resolver consulta"','"Registrar termo sem resultado"'],
   maturity:'growing', team:'"Discovery Squad"', technology:'"Go, OpenSearch"'},
  {id:'Recommendations', title:'Recomendação', type:'"read-model"',
   description:'"Vitrine derivada de comportamento e catálogo"',
   responsibilities:['"Montar vitrine por perfil"','"Reordenar por afinidade"','"Excluir item indisponível"'],
   maturity:'experimental', team:'"Discovery Squad"', technology:'"Python, Feature Store"'}
];
export const C_FULFILLMENT: LayoutContext[] = [
  {id:'Shipping', title:'Expedição', type:'"process"',
   description:'"Do pedido confirmado à entrega, com rastreio"',
   responsibilities:['"Escolher transportadora"','"Emitir etiqueta"','"Atualizar rastreio"'],
   maturity:'mature', team:'"Logística Squad"', technology:'"Java, Kafka"'},
  {id:'Inventory', title:'Estoque', type:'"aggregate"',
   description:'"Saldo disponível por item e local, com reserva"',
   responsibilities:['"Manter saldo por local"','"Reservar e liberar"','"Registrar divergência"'],
   maturity:'mature', team:'"Logística Squad"', technology:'"Java, PostgreSQL"'},
  {id:'Warehouse', title:'Armazém', type:'"service"',
   description:'"Operação física: separação, conferência e embalagem"',
   responsibilities:['"Roteirizar separação"','"Conferir volume"','"Embalar e despachar"'],
   maturity:'legacy', team:'"Operações"', technology:'"C#, SQL Server"'}
];
export const C_CARE: LayoutContext[] = [
  {id:'Support', title:'Atendimento', type:'"service"',
   description:'"Ticket, histórico do cliente e resposta"',
   responsibilities:['"Abrir e encerrar ticket"','"Consultar histórico do pedido"','"Escalar para a squad dona"'],
   maturity:'growing', team:'"Atendimento"', technology:'"TypeScript, Zendesk API"'},
  {id:'Returns', title:'Devolução', type:'"process"',
   description:'"Logística reversa, da solicitação ao reembolso"',
   responsibilities:['"Autorizar devolução"','"Gerar etiqueta reversa"','"Disparar reembolso"'],
   maturity:'growing', team:'"Atendimento"', technology:'"TypeScript, Temporal"'}
];
export const C_PAYMENTS: LayoutContext[] = [
  {id:'PaymentGateway', title:'Gateway de Pagamentos', type:'"gateway"',
   description:'"Fachada única sobre os provedores de pagamento"',
   responsibilities:['"Autorizar e capturar"','"Tratar webhook do provedor"','"Conciliar transação"'],
   maturity:'mature', team:'"Payments Squad"', technology:'"Node.js, Stripe SDK"'},
  {id:'Invoicing', title:'Faturamento', type:'"service"',
   description:'"Nota fiscal e documento de cobrança"',
   responsibilities:['"Emitir nota"','"Transmitir à SEFAZ"','"Arquivar documento"'],
   maturity:'mature', team:'"Fiscal"', technology:'"Java, SOAP"'}
];
export const C_IDENTITY: LayoutContext[] = [
  {id:'Auth', title:'Identidade', type:'"gateway"',
   description:'"Autenticação, sessão e escopo de acesso"',
   responsibilities:['"Autenticar credencial"','"Emitir e renovar token"','"Resolver escopo"'],
   maturity:'mature', team:'"Plataforma"', technology:'"Go, OIDC"'}
];
export const C_ROUTING: LayoutContext[] = [
  {id:'Routes', title:'Roteirização', type:'"policy"',
   description:'"Rota e janela de entrega por região"',
   responsibilities:['"Calcular rota"','"Respeitar janela"','"Reagendar falha"'],
   maturity:'growing', team:'"Logística Squad"', technology:'"Python, OR-Tools"'}
];
export const C_FLEET: LayoutContext[] = [
  {id:'FleetOps', title:'Frota', type:'"service"',
   description:'"Veículo, motorista e disponibilidade"',
   responsibilities:['"Manter cadastro de frota"','"Alocar motorista"','"Registrar manutenção"'],
   maturity:'legacy', team:'"Operações"', technology:'"C#, SQL Server"'}
];
export const C_CAMPAIGNS: LayoutContext[] = [
  {id:'Campaigns', title:'Campanhas', type:'"aggregate"',
   description:'"Peça, público e vigência de cada campanha"',
   responsibilities:['"Definir público"','"Agendar vigência"','"Medir conversão"'],
   maturity:'growing', team:'"Growth"', technology:'"TypeScript, BigQuery"'},
  {id:'Segments', title:'Segmentos', type:'"read-model"',
   description:'"Coortes derivadas de comportamento de compra"',
   responsibilities:['"Derivar coorte"','"Atualizar por evento"','"Expor para campanha"'],
   maturity:'experimental', team:'"Growth"', technology:'"Python, dbt"'}
];
export const C_COMMS: LayoutContext[] = [
  {id:'Email', title:'E-mail transacional', type:'"service"',
   description:'"Envio, template e status de entrega"',
   responsibilities:['"Renderizar template"','"Enviar e repetir"','"Tratar bounce"'],
   maturity:'mature', team:'"Plataforma"', technology:'"Node.js, SES"'}
];
export const X_STRIPE: LayoutContext = {id:'StripeApi',   description:'"Provedor de pagamentos de terceiros"',
                  technology:'"Stripe REST API"'};
export const X_CORREIOS: LayoutContext = {id:'CorreiosApi', description:'"Cálculo de frete e rastreio do serviço postal"',
                  technology:'"SOAP, Correios"'};
export const X_ERP: LayoutContext = {id:'ERPLegado',   description:'"ERP da holding, fonte do cadastro fiscal"',
                  technology:'"SAP ECC, RFC"'};

/* O [BBM] entra em Warehouse, que e `legacy`, nas duas relacoes dele — declarado
   nas duas para nao disparar INCONSISTENT_BBM. Ele so aparece na vista de fluxo:
   e anotacao de relacao, e a contencao nao tem aresta (PRD secao 4.4). */
export const MODELS: Record<string, LayoutModel> = {
  one: {
    file:'vendas.odds',
    domains:[{
      id:'ECommercePlatform', title:'E-Commerce Platform',
      subdomains:[
        {id:'Sales', type:'core', title:'Vendas',
         description:'"Converter intenção de compra em pedido pago"', owner:'"Diretoria Comercial"', contexts:C_SALES},
        {id:'Discovery', type:'core', title:'Descoberta',
         description:'"Fazer o cliente encontrar o que ainda não sabe que quer"', owner:'"Diretoria Comercial"', contexts:C_DISCOVERY},
        {id:'Fulfillment', type:'supporting', title:'Entrega e estoque',
         description:'"Entregar o que foi vendido, no prazo prometido"', owner:'"Diretoria de Operações"', contexts:C_FULFILLMENT},
        {id:'CustomerCare', type:'supporting', title:'Atendimento',
         description:'"Resolver o que deu errado sem perder o cliente"', owner:'"Gerência de Experiência"', contexts:C_CARE},
        {id:'Payments', type:'generic', title:'Pagamentos',
         description:'"Receber o dinheiro e provar que recebeu"', owner:'"Diretoria Financeira"', contexts:C_PAYMENTS},
        {id:'Identity', type:'generic', title:'Identidade',
         description:'"Saber quem é quem, uma vez, para todo o resto"', owner:'"Plataforma"', contexts:C_IDENTITY}
      ],
      external:[X_STRIPE, X_CORREIOS, X_ERP]
    }],
    mapping:[
      {l:'Cart',            lt:['OHS'], c:'-->', rt:['ACL'], r:'Checkout'},
      {l:'Pricing',         lt:['S'],   c:'-->', rt:['C'],   r:'Checkout'},
      {l:'Checkout',        lt:[],      c:'<--', rt:['OHS','PL'], r:'PaymentGateway'},
      {l:'OrderManagement', lt:['ACL'], c:'<--', rt:[],      r:'Shipping'},
      {l:'Shipping',        lt:['SK'],  c:'<->', rt:['SK'],  r:'Inventory'},
      {l:'Inventory',       lt:['OHS'], c:'-->', rt:['ACL','BBM'], r:'Warehouse'},
      {l:'Recommendations', lt:['ACL'], c:'<--', rt:['OHS'], r:'Search'},
      {l:'Support',         lt:['ACL'], c:'<--', rt:['OHS'], r:'OrderManagement'},
      {l:'Returns',         lt:['ACL'], c:'<--', rt:[],      r:'Shipping'},
      {l:'Invoicing',       lt:['ACL'], c:'<--', rt:['OHS'], r:'PaymentGateway'},
      {l:'Auth',            lt:['OHS'], c:'-->', rt:['CF'],  r:'Support'},
      {l:'PaymentGateway',  lt:['ACL'], c:'<--', rt:[],      r:'StripeApi'},
      {l:'Shipping',        lt:['ACL'], c:'<--', rt:[],      r:'CorreiosApi'},
      {l:'Warehouse',       lt:['BBM'], c:'-x-', rt:[],      r:'ERPLegado'}
    ]
  },
  many: {
    file:'grupo.odds',
    domains:[
      { id:'ECommercePlatform', title:'E-Commerce Platform',
        subdomains:[
          {id:'Sales', type:'core', title:'Vendas', contexts:C_SALES},
          {id:'Discovery', type:'core', title:'Descoberta', contexts:C_DISCOVERY},
          {id:'Payments', type:'generic', title:'Pagamentos',
           description:'"Receber o dinheiro e provar que recebeu"', owner:'"Diretoria Financeira"', contexts:[C_PAYMENTS[0]]}
        ],
        external:[X_STRIPE] },
      { id:'Logistics', title:'Logística',
        subdomains:[
          {id:'Fulfillment', type:'core', title:'Entrega e estoque',
           description:'"Entregar o que foi vendido, no prazo prometido"', owner:'"Diretoria de Operações"', contexts:C_FULFILLMENT},
          {id:'Routing', type:'supporting', title:'Roteirização',
           description:'"Decidir por onde e quando cada entrega passa"', owner:'"Diretoria de Operações"', contexts:C_ROUTING},
          {id:'Fleet', type:'generic', title:'Frota',
           description:'"Ter veículo e motorista disponíveis"', owner:'"Gerência de Frota"', contexts:C_FLEET}
        ],
        external:[X_CORREIOS] },
      { id:'Marketing', title:'Marketing',
        subdomains:[
          {id:'Campaigns', type:'core', title:'Campanhas',
           description:'"Levar a oferta certa a quem tem chance de comprar"', owner:'"Diretoria de Marketing"', contexts:C_CAMPAIGNS},
          {id:'Comms', type:'supporting', title:'Comunicação',
           description:'"Falar com o cliente sem virar spam"', owner:'"Gerência de CRM"', contexts:C_COMMS}
        ],
        external:[X_ERP] }
    ],
    mapping:[
      {l:'Cart',            lt:['OHS'], c:'-->', rt:['ACL'], r:'Checkout'},
      {l:'Pricing',         lt:['S'],   c:'-->', rt:['C'],   r:'Checkout'},
      {l:'Checkout',        lt:[],      c:'<--', rt:['OHS','PL'], r:'PaymentGateway'},
      {l:'Recommendations', lt:['ACL'], c:'<--', rt:['OHS'], r:'Search'},
      {l:'Shipping',        lt:['SK'],  c:'<->', rt:['SK'],  r:'Inventory'},
      {l:'Warehouse',       lt:['ACL','BBM'], c:'<--', rt:[], r:'Inventory'},
      {l:'Routes',          lt:['ACL'], c:'<--', rt:['OHS'], r:'Shipping'},
      {l:'FleetOps',        lt:['ACL'], c:'<--', rt:[],      r:'Routes'},
      {l:'Email',           lt:['ACL'], c:'<--', rt:['OHS'], r:'Campaigns'},
      {l:'Campaigns',       lt:['ACL'], c:'<--', rt:[],      r:'Segments'},
      {l:'PaymentGateway',  lt:['ACL'], c:'<--', rt:[],      r:'StripeApi'},
      {l:'Shipping',        lt:['ACL'], c:'<--', rt:[],      r:'CorreiosApi'},
      {l:'Warehouse',       lt:['BBM'], c:'-x-', rt:[],      r:'ERPLegado'},
      {l:'OrderManagement', lt:['ACL'], c:'<--', rt:['OHS'], r:'Shipping'},
      {l:'Segments',        lt:['ACL'], c:'<--', rt:['OHS'], r:'OrderManagement'}
    ]
  }
};

/* Cinco erros de desenho plausiveis, todos em relacoes que ja existem — o
   conjunto de relacoes nao muda, entao o mapa com erros e o mesmo mapa. */
export const BREAKS: Record<string, Break[]> = {
  one: [
    {l:'Cart',     r:'Checkout',       set:{lt:['ACL'], rt:['OHS']}},
    {l:'Pricing',  r:'Checkout',       set:{rt:[]}},
    {l:'Checkout', r:'PaymentGateway', set:{lt:['CF']}},
    {l:'Returns',  r:'Shipping',       set:{lt:[]}},
    {l:'Auth',     r:'Support',        set:{rt:['CF','ACL']}}
  ]
};
/* O teste que derruba a posicao derivada: se acrescentar UMA relacao remexer
   metade do mapa, a estabilidade que o embaralhar prova e de mentira. */
export const EXTRA: Record<string, LayoutRelation[]> = {
  one: [
    {l:'Returns',   lt:['ACL'], c:'<--', rt:['OHS'], r:'OrderManagement'},
    {l:'Invoicing', lt:['ACL'], c:'<--', rt:['OHS'], r:'OrderManagement'},
    {l:'Auth',      lt:['OHS'], c:'-->', rt:['ACL'], r:'Checkout'}
  ],
  many: [
    {l:'Routes',   lt:['ACL'], c:'<--', rt:['OHS'], r:'Inventory'},
    {l:'Segments', lt:['ACL'], c:'<--', rt:['OHS'], r:'Search'},
    {l:'Email',    lt:['ACL'], c:'<--', rt:['OHS'], r:'OrderManagement'}
  ]
};
