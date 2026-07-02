'use client'

import React from 'react'
import LegalLayout, { LegalSection } from './LegalLayout'

const AboutPage: React.FC = () => (
  <LegalLayout eyebrow="Sobre nós" title="Joias do Bairro">
    <LegalSection title="O que é a Joias do Bairro">
      <p>
        Joias do Bairro é um projeto de marketing e conteúdo audiovisual criado
        em torno da cultura do jiujitsu. Fazemos filmmaking de atletas,
        produzimos conteúdo e lançamos roupas em drops exclusivos — peças que
        carregam a identidade das artes marciais e da rua.
      </p>
      <p>
        Não somos uma joalheria. O nome é nosso, a identidade é das tatames.
      </p>
    </LegalSection>

    <LegalSection title="Como funcionam os drops">
      <p>
        Cada coleção é lançada em quantidade limitada, em uma data específica.
        Quando acaba, acabou. Sem reposição garantida.
      </p>
      <p>
        Siga nosso Instagram e YouTube para não perder os próximos lançamentos.
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
            className="text-[#c8102e] hover:underline"
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
            className="text-[#c8102e] hover:underline"
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
            className="text-[#c8102e] hover:underline"
          >
            @joisdobairro
          </a>
        </li>
      </ul>
    </LegalSection>
  </LegalLayout>
)

export default AboutPage
