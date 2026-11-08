/**
 * Conteúdo editável do site institucional.
 * Substitua os textos e imagens de exemplo pelos reais da ArtBrown.
 * Imagens do portfólio: coloque arquivos em /public/portfolio e informe o caminho em `image`.
 */
export const services = [
  {
    title: "Assessoria completa",
    description:
      "Acompanhamos cada etapa, do primeiro sonho ao último convidado: planejamento, orçamento, fornecedores e cronograma.",
  },
  {
    title: "Assessoria do dia",
    description:
      "Para quem já organizou tudo: assumimos a coordenação nos dias que antecedem o evento e no grande dia.",
  },
  {
    title: "Cerimonial",
    description:
      "Condução da cerimônia e da recepção com equipe dedicada, roteiro afinado e atenção a cada detalhe.",
  },
  {
    title: "Gestão de convidados",
    description:
      "Lista de convidados, confirmação de presença online, mapa de mesas e portaria com recepção digital.",
  },
  {
    title: "Fotos ao vivo no telão",
    description: "QR Code nas mesas para os convidados enviarem fotos que aparecem em tempo real no telão.",
  },
  {
    title: "Outros eventos",
    description: "Aniversários, 15 anos, bodas e eventos corporativos com a mesma elegância e cuidado.",
  },
];

export const portfolio: { title: string; place: string; image?: string }[] = [
  { title: "Ana & Pedro", place: "Jardim romântico — São Paulo" },
  { title: "Marina & Lucas", place: "Pé na areia — Ilhabela" },
  { title: "Beatriz & Rafael", place: "Clássico — Campinas" },
  { title: "Júlia 15 anos", place: "Festa debutante — São Paulo" },
  { title: "Carla & Tiago", place: "Rústico chique — Atibaia" },
  { title: "Bodas de Prata", place: "Família Oliveira — Santos" },
];

export const testimonials = [
  {
    name: "Ana & Pedro",
    text: "A ArtBrown cuidou de tudo com tanto carinho que só precisamos aproveitar. Os convidados elogiam até hoje!",
  },
  {
    name: "Marina & Lucas",
    text: "Organização impecável. A confirmação de presença pelo link facilitou demais a nossa vida.",
  },
  {
    name: "Família Oliveira",
    text: "Profissionalismo e sensibilidade do começo ao fim. Recomendamos de olhos fechados.",
  },
];
