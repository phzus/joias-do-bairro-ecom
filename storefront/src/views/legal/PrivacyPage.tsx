'use client'

import React from 'react'
import LegalLayout, { LegalSection } from './LegalLayout'

const PrivacyPage: React.FC = () => (
  <LegalLayout
    eyebrow="Legal"
    title="Política de Privacidade"
    updatedAt="junho de 2026"
  >
    <LegalSection title="1. Quem somos">
      <p>
        A <strong>Joias do Bairro</strong> é um projeto brasileiro de marketing,
        conteúdo audiovisual e moda ligado à cultura de artes marciais. Operamos
        o e-commerce em <code>joisdobairro.com</code> para os drops de roupas do
        projeto.
      </p>
      <p>
        Esta Política de Privacidade descreve como coletamos, usamos, armazenamos
        e protegemos seus dados pessoais, em conformidade com a{' '}
        <strong>Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)</strong>{' '}
        e o <strong>Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong>.
      </p>
    </LegalSection>

    <LegalSection title="2. Dados que coletamos">
      <p>Coletamos as seguintes categorias de dados pessoais:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Dados de identificação:</strong> nome completo, CPF, data de
          nascimento
        </li>
        <li>
          <strong>Dados de contato:</strong> e-mail, telefone/WhatsApp
        </li>
        <li>
          <strong>Endereço:</strong> endereço completo de entrega e cobrança
          (incluindo CEP)
        </li>
        <li>
          <strong>Dados de pedido:</strong> histórico de compras, produtos
          adquiridos, valores
        </li>
        <li>
          <strong>Dados de pagamento:</strong> processados exclusivamente pela
          Stripe (PCI-DSS). Não armazenamos dados de cartão em nossos servidores
        </li>
        <li>
          <strong>Dados técnicos:</strong> endereço IP, tipo de navegador,
          sistema operacional, páginas visitadas, tempo de sessão
        </li>
        <li>
          <strong>Dados de comunicação:</strong> mensagens trocadas com nosso
          atendimento via Instagram ou e-mail
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="3. Bases legais para o tratamento (Art. 7 LGPD)">
      <p>
        Tratamos seus dados com fundamento nas seguintes bases legais previstas
        no Art. 7º da LGPD:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Execução de contrato (Art. 7º, V):</strong> para processar seu
          pedido, calcular e coordenar a entrega e emitir nota fiscal
        </li>
        <li>
          <strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> para
          atender às obrigações fiscais, contábeis e tributárias impostas pela
          legislação brasileira
        </li>
        <li>
          <strong>Legítimo interesse (Art. 7º, IX):</strong> para prevenção de
          fraudes, segurança da plataforma e melhoria dos nossos serviços
        </li>
        <li>
          <strong>Consentimento (Art. 7º, I):</strong> para envio de
          comunicações de marketing, novidades e drops — sempre revogável a
          qualquer momento
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="4. Como usamos seus dados">
      <ul className="list-disc pl-6 space-y-2">
        <li>Processar, confirmar e entregar seu pedido</li>
        <li>Emitir nota fiscal e cumprir obrigações fiscais</li>
        <li>Enviar confirmações de compra, atualizações de envio e código de rastreio</li>
        <li>Prestar suporte ao cliente (trocas, devoluções, dúvidas)</li>
        <li>Prevenir fraudes, chargebacks e uso indevido da plataforma</li>
        <li>
          Enviar comunicações sobre novos drops e promoções (somente com
          consentimento, cancelável a qualquer momento)
        </li>
        <li>Cumprir determinações legais e judiciais</li>
      </ul>
    </LegalSection>

    <LegalSection title="5. Compartilhamento de dados">
      <p>
        Não vendemos, alugamos nem comercializamos seus dados pessoais. O
        compartilhamento ocorre somente com os seguintes parceiros, estritamente
        necessários para a prestação do serviço:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Stripe:</strong> processamento seguro de pagamentos (PCI-DSS
          Level 1)
        </li>
        <li>
          <strong>SuperFrete / transportadoras (Correios, Jadlog, Loggi):</strong>{' '}
          cálculo de frete, geração de etiquetas e rastreio de entregas
        </li>
        <li>
          <strong>Vercel:</strong> hospedagem do storefront (infraestrutura de
          nuvem)
        </li>
        <li>
          <strong>Autoridades públicas:</strong> quando exigido por lei, ordem
          judicial ou regulatória
        </li>
      </ul>
      <p>
        Todos os parceiros são contratualmente obrigados a tratar seus dados com
        confidencialidade e em conformidade com a LGPD.
      </p>
    </LegalSection>

    <LegalSection title="6. Transferência internacional de dados">
      <p>
        Alguns de nossos parceiros de infraestrutura (Stripe, Vercel) operam
        servidores fora do Brasil. Essas transferências ocorrem com base em
        cláusulas contratuais que garantem nível de proteção equivalente ao
        exigido pela LGPD, conforme o Art. 33 da Lei nº 13.709/2018.
      </p>
    </LegalSection>

    <LegalSection title="7. Cookies e tecnologias similares">
      <p>Utilizamos cookies para:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Cookies essenciais:</strong> manter sessão ativa, carrinho de
          compras e autenticação. Sem estes, o site não funciona
        </li>
        <li>
          <strong>Cookies de desempenho:</strong> entender como o site é usado
          para melhorias (dados anonimizados)
        </li>
      </ul>
      <p>
        Não utilizamos cookies de terceiros para publicidade comportamental
        direcionada. Você pode configurar seu navegador para bloquear ou excluir
        cookies a qualquer momento, mas isso pode afetar o funcionamento do
        carrinho e da autenticação.
      </p>
    </LegalSection>

    <LegalSection title="8. Segurança dos dados">
      <p>
        Adotamos medidas técnicas e organizacionais para proteger seus dados
        contra acesso não autorizado, perda ou divulgação indevida:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Comunicação criptografada via HTTPS/TLS</li>
        <li>
          Dados de pagamento processados pela Stripe, nunca armazenados em
          nossos servidores
        </li>
        <li>Acesso restrito a dados pessoais por meio de credenciais</li>
        <li>Monitoramento de atividades suspeitas e tentativas de fraude</li>
      </ul>
      <p>
        Em caso de incidente de segurança que possa gerar risco ou dano a você,
        notificaremos a ANPD e os titulares afetados nos prazos previstos pela
        LGPD.
      </p>
    </LegalSection>

    <LegalSection title="9. Retenção de dados">
      <p>Mantemos seus dados pelos seguintes prazos:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Dados de pedido e nota fiscal:</strong> 5 anos (obrigação
          fiscal — Código Tributário Nacional)
        </li>
        <li>
          <strong>Dados de conta ativa:</strong> enquanto a conta estiver ativa
        </li>
        <li>
          <strong>Dados após cancelamento de conta:</strong> anonimizados ou
          excluídos em até 30 dias, salvo obrigação legal de retenção
        </li>
        <li>
          <strong>Dados de comunicações de marketing:</strong> até a revogação
          do consentimento
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="10. Seus direitos (Art. 18 LGPD)">
      <p>
        Como titular de dados pessoais, você tem os seguintes direitos, que
        podem ser exercidos a qualquer momento:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Confirmação e acesso:</strong> saber se tratamos seus dados e
          obter uma cópia
        </li>
        <li>
          <strong>Correção:</strong> corrigir dados incompletos, inexatos ou
          desatualizados
        </li>
        <li>
          <strong>Anonimização, bloqueio ou eliminação:</strong> de dados
          desnecessários ou tratados em desconformidade
        </li>
        <li>
          <strong>Portabilidade:</strong> receber seus dados em formato
          estruturado
        </li>
        <li>
          <strong>Eliminação:</strong> excluir dados tratados com base em
          consentimento
        </li>
        <li>
          <strong>Revogação do consentimento:</strong> cancelar o consentimento
          para marketing a qualquer momento
        </li>
        <li>
          <strong>Oposição:</strong> se opor a tratamentos realizados com base
          em legítimo interesse
        </li>
        <li>
          <strong>Informação sobre compartilhamento:</strong> saber com quem
          compartilhamos seus dados
        </li>
      </ul>
      <p>
        Para exercer qualquer desses direitos, entre em contato pelo Instagram{' '}
        <a
          href="https://instagram.com/joisdobairro"
          target="_blank"
          rel="noreferrer"
          className="text-[#8b1e2f] hover:underline"
        >
          @joisdobairro
        </a>
        . Respondemos em até 15 dias úteis.
      </p>
    </LegalSection>

    <LegalSection title="11. Menores de idade">
      <p>
        Este e-commerce não é destinado a menores de 18 anos. Não coletamos
        intencionalmente dados de menores. Caso identifiquemos dados de um menor
        cadastrado sem autorização dos responsáveis, excluiremos essas
        informações imediatamente.
      </p>
    </LegalSection>

    <LegalSection title="12. Encarregado de dados (DPO)">
      <p>
        O responsável pelo tratamento de dados pessoais na Joias do Bairro pode
        ser contactado pelo Instagram{' '}
        <a
          href="https://instagram.com/joisdobairro"
          target="_blank"
          rel="noreferrer"
          className="text-[#8b1e2f] hover:underline"
        >
          @joisdobairro
        </a>
        . Você também pode registrar reclamações perante a{' '}
        <strong>
          Autoridade Nacional de Proteção de Dados (ANPD) —{' '}
          <a
            href="https://www.gov.br/anpd"
            target="_blank"
            rel="noreferrer"
            className="text-[#8b1e2f] hover:underline"
          >
            www.gov.br/anpd
          </a>
        </strong>
        .
      </p>
    </LegalSection>

    <LegalSection title="13. Alterações nesta política">
      <p>
        Esta política pode ser atualizada para refletir mudanças legais ou
        operacionais. A versão vigente é sempre a publicada nesta página, com a
        data de última atualização indicada no topo. Para mudanças relevantes,
        notificaremos os usuários cadastrados por e-mail.
      </p>
    </LegalSection>
  </LegalLayout>
)

export default PrivacyPage
