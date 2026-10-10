/**
 * A documentação preenchida do marketplace de 50 contextos: as propriedades de
 * contexto (GRAMMAR.md §3) e de subdomínio (ADR-0008) que a ficha da relação mostra.
 *
 * Vinte e dois contextos e seis subdomínios já têm documentação nos modelos da v4,
 * com os mesmos nomes; o build lê de lá, e este arquivo só preenche o resto. Fica
 * fora do colmeia-50.model.mjs de propósito: propriedade não move peça (o build
 * confere), mas o colmeia-50 mede o mapa parado e não precisa dela.
 *
 * Os valores vão sem aspas aqui; o build as põe, como a fonte .odds pede.
 */
export const SUB_DOCS = {
  Marketplace: { description: "Abrir a vitrine para vendedores de fora sem perder o controle", owner: "Diretoria de Marketplace" },
  Logistics: { description: "Levar o pacote do galpão até a porta", owner: "Diretoria de Operações" },
  Marketing: { description: "Trazer o cliente de volta, e trazer um novo", owner: "Diretoria de Marketing" },
  Content: { description: "Texto e imagem que vendem sem um vendedor", owner: "Gerência de Conteúdo" },
  Notifications: { description: "Avisar o cliente pelo canal certo, uma vez", owner: "Plataforma" },
  Analytics: { description: "Transformar evento em decisão", owner: "Diretoria de Dados" },
};

export const CTX_DOCS = {
  Promotions: { title: "Promoções", type: "policy", description: "Regras de desconto, cupom e vigência",
    responsibilities: ["Validar cupom", "Combinar descontos", "Encerrar vigência"], maturity: "growing", team: "Vendas Squad", technology: "Kotlin" },
  Catalog: { title: "Catálogo", type: "aggregate", description: "Produto, variação e atributo, a fonte única do que se vende",
    responsibilities: ["Manter produto", "Publicar variação", "Versionar atributo"], maturity: "mature", team: "Descoberta Squad", technology: "Java, PostgreSQL" },
  Reviews: { title: "Avaliações", description: "Nota e comentário do comprador, com moderação",
    maturity: "growing", team: "Descoberta Squad" },
  SellerOnboarding: { title: "Cadastro de vendedor", type: "process", description: "Aceite, KYC e contrato do vendedor de fora",
    responsibilities: ["Verificar documentos", "Assinar contrato", "Liberar a loja"], maturity: "growing", team: "Marketplace Squad", technology: "TypeScript, Temporal" },
  SellerCatalog: { title: "Catálogo do vendedor", description: "Oferta do vendedor antes de virar produto do catálogo",
    responsibilities: ["Receber oferta", "Casar com produto existente"], maturity: "experimental", team: "Marketplace Squad", technology: "TypeScript" },
  Commissions: { title: "Comissões", type: "policy", description: "Quanto o marketplace retém de cada venda de terceiro",
    maturity: "growing", team: "Marketplace Squad", technology: "Kotlin" },
  SellerPayouts: { title: "Repasses", type: "process", description: "Liquidação do saldo do vendedor, descontada a comissão",
    responsibilities: ["Apurar saldo", "Agendar repasse", "Conciliar com o gateway"], maturity: "experimental", team: "Marketplace Squad", technology: "Kotlin" },
  Disputes: { title: "Disputas", type: "process", description: "Contestação entre comprador e vendedor, até o reembolso ou a recusa",
    maturity: "growing", team: "Atendimento Squad" },
  Chatbot: { title: "Assistente", description: "Primeiro atendimento automático, que escala para o humano",
    maturity: "experimental", team: "Atendimento Squad", technology: "Python, LLM" },
  Carriers: { title: "Transportadoras", type: "service", description: "Cotação e contratação de transportadora por entrega",
    responsibilities: ["Cotar frete", "Emitir etiqueta", "Receber rastreio"], maturity: "mature", team: "Logística Squad", technology: "Go" },
  Loyalty: { title: "Fidelidade", description: "Pontos por compra e resgate",
    maturity: "growing", team: "Growth", technology: "TypeScript" },
  Affiliates: { title: "Afiliados", description: "Link de parceiro e comissão por conversão",
    maturity: "experimental", team: "Growth" },
  CMS: { title: "Gestão de conteúdo", description: "Página, banner e texto editorial", team: "Conteúdo", technology: "Headless CMS" },
  MediaAssets: { title: "Mídia", type: "service", description: "Imagem e vídeo de produto, redimensionados e servidos por CDN",
    maturity: "mature", team: "Conteúdo", technology: "Go, S3, CDN" },
  FraudCheck: { title: "Antifraude", type: "policy", description: "Score de risco de cada transação antes da captura",
    responsibilities: ["Pontuar transação", "Aplicar regra de bloqueio"], maturity: "mature", team: "Payments Squad", technology: "Python" },
  Refunds: { title: "Reembolsos", type: "process", description: "Estorno total ou parcial ao comprador",
    maturity: "growing", team: "Payments Squad", technology: "Node.js" },
  Profiles: { title: "Perfis", type: "aggregate", description: "Dados cadastrais e endereços do cliente",
    maturity: "mature", team: "Plataforma", technology: "Go, PostgreSQL" },
  Consent: { title: "Consentimento", type: "policy", description: "O que o cliente autorizou, por finalidade, com histórico (LGPD)",
    responsibilities: ["Registrar consentimento", "Revogar por finalidade", "Responder auditoria"], maturity: "growing", team: "Plataforma", technology: "Go" },
  SMS: { title: "SMS", type: "service", description: "Envio de SMS transacional", maturity: "mature", team: "Plataforma" },
  Push: { title: "Push", type: "service", description: "Notificação no aplicativo", maturity: "growing", team: "Plataforma", technology: "Firebase" },
  DataLake: { title: "Data lake", description: "Eventos brutos de todo o marketplace, particionados por dia",
    maturity: "mature", team: "Dados", technology: "S3, Iceberg" },
  Reporting: { title: "Relatórios", type: "read-model", description: "Painéis de venda e operação para a diretoria",
    maturity: "mature", team: "Dados", technology: "dbt, Metabase" },
  Experiments: { title: "Experimentos", description: "Teste A/B e o cálculo de significância",
    maturity: "experimental", team: "Dados", technology: "Python" },
  SendGrid: { description: "Envio de e-mail de terceiros", technology: "SendGrid API" },
  TwilioApi: { description: "Envio de SMS de terceiros", technology: "Twilio REST API" },
  GoogleAds: { description: "Compra de mídia paga", technology: "Google Ads API" },
  ClearSaleApi: { description: "Análise de fraude de terceiros", technology: "ClearSale REST API" },
  SegmentCdp: { description: "Coleta de eventos de navegação", technology: "Segment" },
};
