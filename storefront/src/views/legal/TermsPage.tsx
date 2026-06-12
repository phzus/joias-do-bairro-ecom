'use client'

import React from 'react'
import { Link } from 'react-router-dom'
import LegalLayout, { LegalSection } from './LegalLayout'

const TermsPage: React.FC = () => (
  <LegalLayout
    eyebrow="Legal"
    title="Termos e Condições"
    updatedAt="junho de 2026"
  >
    <LegalSection title="1. Aceitação dos termos">
      <p>
        Ao acessar, navegar ou realizar uma compra na loja{' '}
        <strong>Joias do Bairro</strong> (<code>joisdobairro.com</code>), você
        declara que leu, entendeu e concorda integralmente com estes Termos e
        Condições, com nossa{' '}
        <Link to="/politica-de-privacidade" className="text-[#e34717] hover:underline">
          Política de Privacidade
        </Link>{' '}
        e com nossa{' '}
        <Link to="/trocas-e-devolucoes" className="text-[#e34717] hover:underline">
          Política de Trocas e Devoluções
        </Link>
        . Caso não concorde, pedimos que não utilize o site.
      </p>
      <p>
        Estes termos são regidos pela{' '}
        <strong>Lei nº 8.078/1990 (Código de Defesa do Consumidor)</strong>,
        pelo <strong>Decreto nº 7.962/2013 (e-commerce)</strong> e pela{' '}
        <strong>Lei nº 13.709/2018 (LGPD)</strong>.
      </p>
    </LegalSection>

    <LegalSection title="2. Sobre a empresa">
      <p>
        A <strong>Joias do Bairro</strong> é um projeto de marketing e conteúdo
        audiovisual com foco em atletas de jiujitsu, que comercializa drops de
        roupas e acessórios. Para esclarecimentos, entre em contato pelo
        Instagram{' '}
        <a
          href="https://instagram.com/joisdobairro"
          target="_blank"
          rel="noreferrer"
          className="text-[#e34717] hover:underline"
        >
          @joisdobairro
        </a>
        .
      </p>
    </LegalSection>

    <LegalSection title="3. Elegibilidade">
      <p>
        Para realizar compras nesta loja, você deve:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Ter pelo menos <strong>18 anos de idade</strong></li>
        <li>
          Fornecer informações verdadeiras, completas e atualizadas no cadastro
          e no checkout
        </li>
        <li>Ser residente no Brasil</li>
      </ul>
      <p>
        Menores de 18 anos somente podem realizar compras com autorização e
        supervisão de seus pais ou responsáveis legais.
      </p>
    </LegalSection>

    <LegalSection title="4. Produtos e disponibilidade">
      <p>
        Todos os nossos produtos são lançados em formato de <strong>drop</strong>{' '}
        — coleções de tempo e quantidade limitados. A disponibilidade é
        atualizada em tempo real no site.
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          As fotos dos produtos são o mais fiel possível às peças reais; pode
          haver pequenas variações de cor por configurações de tela
        </li>
        <li>
          As descrições, tamanhos e composições estão disponíveis na página de
          cada produto
        </li>
        <li>
          Nos casos de divergência de estoque (ex: produto vendido
          simultaneamente por dois clientes), o pedido será cancelado e o valor
          pago integralmente reembolsado
        </li>
        <li>
          Reservamos o direito de descontinuar produtos ou alterar preços a
          qualquer momento, sem aviso prévio, sem afetar pedidos já confirmados
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="5. Preços e pagamento">
      <p>
        Todos os preços são exibidos em <strong>reais (BRL)</strong> e já
        incluem os tributos incidentes sobre os produtos, conforme Art. 6º do
        Decreto nº 7.962/2013.
      </p>
      <p>
        <strong>Formas de pagamento aceitas:</strong>
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Cartão de crédito (Visa, Mastercard, American Express, Elo)</li>
        <li>Cartão de débito</li>
        <li>PIX</li>
        <li>Boleto bancário</li>
      </ul>
      <p>
        Os pagamentos são processados com segurança pela{' '}
        <strong>Stripe</strong> (certificação PCI-DSS). Não armazenamos dados de
        cartão em nossos servidores.
      </p>
      <p>
        Em casos de erro evidente de precificação (preço manifestamente
        incorreto), reservamos o direito de cancelar o pedido e reembolsar
        integralmente o valor pago.
      </p>
    </LegalSection>

    <LegalSection title="6. Frete e prazo de entrega">
      <p>
        O frete é calculado em tempo real durante o checkout, com base no CEP de
        destino e nas dimensões/peso do pedido, via{' '}
        <strong>SuperFrete</strong>. As opções disponíveis (Correios PAC, SEDEX,
        Jadlog, Loggi) e seus respectivos prazos e valores são apresentados antes
        da finalização do pedido.
      </p>
      <p>
        Para mais detalhes, consulte nossa{' '}
        <Link to="/entrega" className="text-[#e34717] hover:underline">
          Política de Envios
        </Link>
        .
      </p>
    </LegalSection>

    <LegalSection title="7. Confirmação e processamento do pedido">
      <p>O pedido passa pelas seguintes etapas:</p>
      <ol className="list-decimal pl-6 space-y-2">
        <li>
          <strong>Pedido realizado:</strong> você recebe um e-mail de confirmação
          com o número do pedido
        </li>
        <li>
          <strong>Pagamento confirmado:</strong> a Stripe notifica a aprovação
          (cartão/PIX imediatos; boleto em até 3 dias úteis)
        </li>
        <li>
          <strong>Preparação:</strong> separamos e embalamos seu pedido em até 2
          dias úteis após a confirmação do pagamento
        </li>
        <li>
          <strong>Postado:</strong> você recebe o código de rastreio por e-mail
        </li>
      </ol>
      <p>
        O contrato de compra e venda se perfaz com a confirmação do pagamento e
        o envio do e-mail de confirmação do pedido.
      </p>
    </LegalSection>

    <LegalSection title="8. Direito de arrependimento">
      <p>
        Conforme o <strong>Art. 49 do Código de Defesa do Consumidor</strong>,
        você tem <strong>7 (sete) dias corridos</strong> a partir do recebimento
        do produto para desistir da compra, sem necessidade de justificativa, com
        devolução integral do valor pago incluindo o frete.
      </p>
      <p>
        Para exercer este direito, entre em contato pelo Instagram{' '}
        <a
          href="https://instagram.com/joisdobairro"
          target="_blank"
          rel="noreferrer"
          className="text-[#e34717] hover:underline"
        >
          @joisdobairro
        </a>{' '}
        ou consulte nossa{' '}
        <Link to="/trocas-e-devolucoes" className="text-[#e34717] hover:underline">
          Política de Trocas e Devoluções
        </Link>
        .
      </p>
    </LegalSection>

    <LegalSection title="9. Garantia legal">
      <p>
        Conforme o <strong>Art. 26 do CDC</strong>, produtos não duráveis têm
        garantia legal de <strong>30 dias</strong> e produtos duráveis de{' '}
        <strong>90 dias</strong> contra defeitos de fabricação, a contar da
        entrega. Defeitos aparentes devem ser comunicados em até 30 dias do
        recebimento.
      </p>
    </LegalSection>

    <LegalSection title="10. Uso do site">
      <p>É proibido:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Usar o site para fins ilegais, fraudulentos ou que prejudiquem
          terceiros
        </li>
        <li>
          Tentar contornar sistemas de segurança, pagamento ou controle de
          estoque
        </li>
        <li>
          Utilizar robôs, scrapers ou meios automatizados para acessar o site
          sem autorização
        </li>
        <li>
          Cadastrar contas falsas, usar dados de terceiros ou realizar compras
          fraudulentas
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="11. Propriedade intelectual">
      <p>
        Todo o conteúdo desta plataforma — incluindo logotipo, fotografias,
        vídeos, textos, designs e identidade visual — é propriedade exclusiva da{' '}
        <strong>Joias do Bairro</strong> e está protegido pela Lei nº
        9.610/1998 (Lei de Direitos Autorais).
      </p>
      <p>
        É vedada qualquer reprodução, distribuição, modificação, publicação ou
        uso comercial sem autorização expressa e por escrito.
      </p>
    </LegalSection>

    <LegalSection title="12. Limitação de responsabilidade">
      <p>A Joias do Bairro não se responsabiliza por:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Atrasos causados por transportadoras, greves, eventos de força maior
          ou situações fora do nosso controle
        </li>
        <li>
          Endereço de entrega incorreto informado pelo comprador
        </li>
        <li>
          Falhas nos sistemas de terceiros (Stripe, Correios, Jadlog etc.)
        </li>
        <li>
          Danos indiretos decorrentes do uso ou impossibilidade de uso do site,
          além dos limites previstos pelo CDC
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="13. Reclamações e resolução de conflitos">
      <p>
        Caso não seja possível resolver sua demanda diretamente conosco pelo
        Instagram{' '}
        <a
          href="https://instagram.com/joisdobairro"
          target="_blank"
          rel="noreferrer"
          className="text-[#e34717] hover:underline"
        >
          @joisdobairro
        </a>
        , você pode recorrer a:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Plataforma Consumidor.gov.br</strong> —{' '}
          <a
            href="https://www.consumidor.gov.br"
            target="_blank"
            rel="noreferrer"
            className="text-[#e34717] hover:underline"
          >
            consumidor.gov.br
          </a>{' '}
          (plataforma oficial do governo federal)
        </li>
        <li>
          <strong>PROCON</strong> do seu município
        </li>
        <li>
          <strong>Juizado Especial Cível (JEC)</strong> — para causas de até 40
          salários mínimos, sem necessidade de advogado
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="14. Alterações dos termos">
      <p>
        Estes termos podem ser atualizados a qualquer momento. A versão vigente
        é sempre a publicada nesta página. Alterações relevantes serão
        comunicadas por e-mail aos usuários cadastrados com antecedência de pelo
        menos 10 dias.
      </p>
    </LegalSection>

    <LegalSection title="15. Legislação e foro">
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil.
        Para dirimir quaisquer controvérsias oriundas deste contrato, fica eleito
        o foro do domicílio do consumidor, conforme Art. 101, I, do Código de
        Defesa do Consumidor, sem prejuízo de outros foros admitidos por lei.
      </p>
    </LegalSection>
  </LegalLayout>
)

export default TermsPage
