'use client'

import React from 'react'
import LegalLayout, { LegalSection } from './LegalLayout'

const ShippingPage: React.FC = () => (
  <LegalLayout
    eyebrow="Atendimento"
    title="Prazos e Envios"
    updatedAt="junho de 2026"
  >
    <LegalSection title="1. Transportadoras e modalidades">
      <p>
        Trabalhamos com as seguintes transportadoras, integradas via{' '}
        <strong>SuperFrete</strong>:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Correios:</strong> PAC (econômico), SEDEX (expresso) e Mini
          Envios (para volumes pequenos)
        </li>
        <li>
          <strong>Jadlog:</strong> .Package e .Com (entrega em endereço ou
          ponto de coleta Jadlog)
        </li>
        <li>
          <strong>Loggi:</strong> disponível em grandes centros urbanos
        </li>
      </ul>
      <p>
        As opções disponíveis para o seu CEP, com valores e prazos cotados em
        tempo real, são exibidas durante o checkout antes da finalização do
        pedido.
      </p>
    </LegalSection>

    <LegalSection title="2. Prazo de postagem">
      <p>
        Após a <strong>confirmação do pagamento</strong>:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Pedidos confirmados até <strong>14h em dias úteis</strong> são postados
          em até 2 dias úteis
        </li>
        <li>
          Pedidos confirmados após 14h ou em fins de semana/feriados são
          processados no próximo dia útil
        </li>
        <li>
          Boleto bancário: o prazo começa após a compensação (até 3 dias úteis
          após o pagamento)
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="3. Prazo de entrega">
      <p>
        O prazo de entrega começa a contar a partir da data de postagem (não da
        data do pedido). Prazos estimados por modalidade:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>SEDEX / Loggi:</strong> 1–3 dias úteis (capitais e regiões
          metropolitanas)
        </li>
        <li>
          <strong>PAC / Jadlog .Package:</strong> 4–10 dias úteis (varia por
          região)
        </li>
        <li>
          <strong>Mini Envios:</strong> 4–8 dias úteis
        </li>
      </ul>
      <p>
        Esses prazos são estimativas das transportadoras. Regiões de difícil
        acesso, períodos de alta demanda (ex: Black Friday) e greves podem
        causar atrasos. Consulte sempre o rastreio para informação atualizada.
      </p>
    </LegalSection>

    <LegalSection title="4. Rastreamento">
      <p>
        Assim que seu pedido for postado, você recebe o{' '}
        <strong>código de rastreio por e-mail</strong>. Você pode acompanhar o
        status em tempo real diretamente na nossa{' '}
        <strong>página de rastreio</strong>, que sincroniza com a transportadora.
      </p>
      <p>
        Caso o código não apareça em até 24h após o e-mail de postagem, entre em
        contato pelo Instagram{' '}
        <a
          href="https://instagram.com/joisdobairro"
          target="_blank"
          rel="noreferrer"
          className="text-[#8b1e2f] hover:underline"
        >
          @joisdobairro
        </a>
        .
      </p>
    </LegalSection>

    <LegalSection title="5. Frete grátis">
      <p>
        Quando disponíveis, promoções de frete grátis são comunicadas pelo
        Instagram{' '}
        <a
          href="https://instagram.com/joisdobairro"
          target="_blank"
          rel="noreferrer"
          className="text-[#8b1e2f] hover:underline"
        >
          @joisdobairro
        </a>{' '}
        e aplicadas automaticamente no carrinho. Fique de olho nos stories e
        posts para não perder.
      </p>
    </LegalSection>

    <LegalSection title="6. Entregas não realizadas">
      <p>
        Se o pedido não puder ser entregue, a transportadora tentará o contato
        ou deixará um aviso. Nesses casos:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Ausência do destinatário:</strong> a transportadora pode fazer
          novas tentativas ou disponibilizar o pacote para retirada em agência —
          consulte o rastreio
        </li>
        <li>
          <strong>Endereço incorreto:</strong> o pedido retorna para nós. O
          reenvio é feito mediante pagamento de um novo frete pelo comprador
        </li>
        <li>
          <strong>Recusa do destinatário:</strong> o pedido retorna; o frete
          original não é reembolsado
        </li>
        <li>
          <strong>Extravio:</strong> se confirmado extravio pela transportadora,
          reenviaremos o produto sem custo adicional ou reembolsaremos
          integralmente
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="7. Embalagem">
      <p>
        Todos os pedidos são embalados para garantir a proteção durante o
        transporte. Ao receber seu pedido, verifique a embalagem antes de
        assinar o recibo. Se houver danos visíveis, recuse o recebimento e entre
        em contato conosco imediatamente.
      </p>
    </LegalSection>
  </LegalLayout>
)

export default ShippingPage
