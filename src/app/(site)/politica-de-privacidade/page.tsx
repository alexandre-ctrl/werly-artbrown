import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 leading-relaxed text-ink/90">
      <h1 className="text-4xl">Política de privacidade</h1>
      <p className="mt-2 text-sm text-muted">
        Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2 className="mt-10 text-2xl">1. Quem somos</h2>
      <p className="mt-2">
        A ArtBrown Company organiza casamentos e eventos. Para isso, tratamos dados pessoais de clientes,
        convidados e interessados em nossos serviços.
      </p>

      <h2 className="mt-8 text-2xl">2. Quais dados coletamos</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Pedidos de orçamento: nome, e-mail, telefone e informações sobre o evento.</li>
        <li>Clientes: dados de contato e informações necessárias à organização do evento.</li>
        <li>
          Convidados: nome, telefone, confirmação de presença, acompanhantes, restrições alimentares
          (informadas voluntariamente) e registro de chegada no dia do evento.
        </li>
        <li>Fotos enviadas voluntariamente pelos convidados durante o evento.</li>
      </ul>

      <h2 className="mt-8 text-2xl">3. Para que usamos</h2>
      <p className="mt-2">
        Exclusivamente para a organização do evento: confirmação de presença, planejamento de mesas e
        cardápio, recepção dos convidados e contato com interessados. Não vendemos nem compartilhamos dados
        para fins de publicidade.
      </p>

      <h2 className="mt-8 text-2xl">4. Base legal e consentimento</h2>
      <p className="mt-2">
        Tratamos dados com base na execução do contrato com nossos clientes e no consentimento dos titulares,
        solicitado no formulário de orçamento e na página de confirmação de presença.
      </p>

      <h2 className="mt-8 text-2xl">5. Armazenamento e retenção</h2>
      <p className="mt-2">
        Os dados ficam em infraestrutura de nuvem com controle de acesso por perfil. Dados de convidados são
        excluídos ou anonimizados após a conclusão do evento, no prazo combinado com o cliente.
      </p>

      <h2 className="mt-8 text-2xl">6. Seus direitos</h2>
      <p className="mt-2">
        Você pode solicitar acesso, correção ou exclusão dos seus dados, bem como revogar o consentimento,
        entrando em contato com a ArtBrown Company pelos nossos canais oficiais.
      </p>
    </article>
  );
}
