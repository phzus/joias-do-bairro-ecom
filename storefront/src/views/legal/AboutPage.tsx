'use client'

import React from 'react'
import LegalLayout, { LegalSection } from './LegalLayout'

const AboutPage: React.FC = () => (
  <LegalLayout eyebrow="Sobre nós" title="Joias do Bairro">
    <LegalSection title="Quem somos">
      <p>
        A Joias do Bairro nasceu para trazer joalheria de qualidade perto de
        você. Cada peça é pensada com cuidado, combinando design com acessibilidade
        — sem abrir mão do acabamento.
      </p>
      <p>
        Trabalhamos com peças de tiragem cuidadosa, processo artesanal e atenção
        aos detalhes. O que você usa carrega a nossa identidade.
      </p>
    </LegalSection>

    <LegalSection title="Como operamos">
      <p>
        Somos uma marca independente. Trabalhamos com fornecedores brasileiros,
        cortando intermediários. Cada compra aqui apoia diretamente a produção e
        a evolução da nossa coleção.
      </p>
    </LegalSection>

    <LegalSection title="Onde nos encontrar">
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Instagram:{' '}
          <a
            href="https://instagram.com/joisdobairro"
            target="_blank"
            rel="noreferrer"
            className="text-[#e34717] hover:underline"
          >
            @joisdobairro
          </a>
        </li>
        <li>
          YouTube:{' '}
          <a
            href="https://youtube.com/@joisdobairro"
            target="_blank"
            rel="noreferrer"
            className="text-[#e34717] hover:underline"
          >
            @joisdobairro
          </a>
        </li>
        <li>
          TikTok:{' '}
          <a
            href="https://tiktok.com/@joisdobairro"
            target="_blank"
            rel="noreferrer"
            className="text-[#e34717] hover:underline"
          >
            @joisdobairro
          </a>
        </li>
      </ul>
    </LegalSection>
  </LegalLayout>
)

export default AboutPage
