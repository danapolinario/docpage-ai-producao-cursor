# Documento executivo de produto — DocPage AI

## 1. Introdução

**Objetivo deste documento**  
Orientar decisões de produto, investimento e go-to-market com uma visão única do que é o DocPage AI, para que está a ser construído e qual o próximo passo esperado.

**Contexto de negócio**  
Profissionais de saúde no Brasil precisam de presença digital credível, mas enfrentam restrições éticas e regulatórias (ex.: orientações do CFM) e, em muitos casos, pouco tempo para produzir sites e textos. O mercado de software e serviços digitais para saúde continua a crescer à medida que a procura por informação e contacto online aumenta.

**Contexto do produto**  
O DocPage AI é um **SaaS especializado** para profissionais de saúde criarem **landing pages e sites** com apoio de **IA** (copy e refinamento de conteúdo), **design configurável**, **preview antes de pagar**, **publicação** e **monetização por subscrição** (integração com fluxo de checkout/planos). O produto enfatiza **conformidade com regras de copy médico** nos prompts de geração de conteúdo (ex.: evitar promessas absolutas, CTAs neutros).

---

## 2. Problema e oportunidade

**Problema**

- Sites genéricos ou feitos por agências são **caros**, **lentos** ou **desalinhados** com o idioma e as regras da medicina no Brasil.
- Construtores “para todos” não trazem **defaults**, **textos** e **guardrails** pensados para **médicos e ética publicitária**.
- Muitos profissionais **não escrevem** copy de conversão nem dominam SEO; perdem pacientes para quem aparece melhor no Google e no WhatsApp.

**Oportunidade**

- Posicionar uma ferramenta **vertical (saúde)** com **IA + templates + compliance assistido** e **modelo experimentar antes de assinar** (mensagem na própria landing: ver resultado antes de publicar e só assinar quando satisfeito).
- Diferenciação por **tempo até ao primeiro resultado**, **qualidade percebida** e **redução de risco regulatório** na comunicação.

---

## 3. Solução e proposta de valor

**O que é**  
Plataforma web em que o utilizador percorre um **funil guiado**: briefing, conteúdo gerado/refinado por IA, upload e tratamento de foto, escolha visual/layout, editor/preview e, por fim, **planos e checkout** (Stripe no ecossistema do projeto).

**Recursos principais**

- **Geração e refinamento de conteúdo** para secções típicas de landing (headline, serviços, sobre, testemunhos, contactos, etc.), com regras de **compliance** no prompt (CFM / linguagem não sensacionalista).
- **Múltiplos layouts / variantes visuais** e personalização de design (paletas, tipografia, visibilidade de secções).
- **Foto profissional** com fluxo de upload e melhoria (IA).
- **Preview** antes da publicação; **painel** e gestão de landing pages; **domínio / publicação** no âmbito da arquitetura da app.
- **Captura de lead** opcional na home (configurável em admin), **autenticação** e retomada de funil.
- **Analytics** (ex.: Google Analytics para produto e para páginas publicadas).

**Proposta de valor**  
“**Site profissional para médicos em minutos**, com IA, **alinhado a normas éticas**, **SEO** e fluxo **experimentar → publicar → subscrever** — sem depender de agência para o primeiro resultado.”

**Por que pode ser superior à concorrência genérica**

- **Vertical saúde + guardrails de copy** embutidos no fluxo de IA.
- **Velocidade** e **custo previsível** (SaaS) vs. projeto feito à medida.
- **Produto completo**: criação, edição, hospedagem do fluxo e pagamento — num só sítio.

---

## 4. Público-alvo

**Primário**

- **Médicos e clínicas** que querem **captar consultas** e **credibilidade** online, com forte uso de **WhatsApp** e pesquisa local.

**Secundário**

- Outros **profissionais de saúde** com necessidade semelhante de landing one-page.
- **Pequenas clínicas** que precisam de uma página “cartão de visita” moderna sem equipa de marketing.

**Menos foco**

- Hospitais grandes com procurement e TI própria (salvo parceria B2B).
- Quem exige apenas blog pesado/CMS enterprise sem o modelo atual do produto.

---

## 5. Análise de mercado e concorrência

**Mercado potencial (enquadramento)**

- **Brasil**: elevado número de profissionais de saúde com maturidade digital heterogénea; **penetração de smartphone** e **Google** como descoberta de prestadores.
- **Regulação**: o cumprimento de normas do **CFM** e legislação de propaganda médica é **filtro** e **barreira** para concorrentes que não invistam em compliance.

*(Inserir: TAM/SAM/SOM, fonte e ano, quando houver estudo interno.)*

**Tipos de concorrência**

| Tipo | Posição típica | Limite vs. DocPage AI |
|------|----------------|------------------------|
| Website builders genéricos | Wix, Squarespace, etc. | Pouca especificidade médica e compliance assistido por defeito. |
| Agências / freelancers | Projetos à medida | Custo e tempo maiores; escala limitada. |
| SaaS verticais médicos | Players regionais | Comparar feature-a-feature, preço e SEO local. |
| Formulário + template simples | Soluções básicas | Menos IA, menos refinamento e menos diferenciação de marca. |

*(Atualizar com nomes, preços e quotas de mercado após desk research.)*

---

## 6. Projeções financeiras

O produto expõe **faixas de preço** na UI de planos (ordem de grandeza **R$ 97–197 / mês** conforme plano e período — ver `components/PricingPage.tsx`). **Orçamento operacional**, **CAC**, **LTV** e **metas de MRR** devem ser mantidos em modelo financeiro interno.

**Quadro sugerido (preencher)**

| Linha | Premissa | Notas |
|--------|-----------|--------|
| Receita recorrente (MRR) | Subscrições ativas × preço médio | Incluir churn e mudanças de plano. |
| COGS | Infra (Supabase, hosting, APIs de IA, Stripe) | Por utilizador ativo ou por LP publicada. |
| CAC | Marketing + vendas / novos clientes | Incluir canais da home e parcerias. |
| Margem bruta | Receita − COGS | Ajustar por fase da empresa. |
| Runway | Caixa / burn mensal | Crítico em fase de investimento. |

**Nota**  
Projeções para investidores devem assentar em **premissas documentadas** (conversão por etapa do funil, churn, ticket médio), não apenas nos preços listados na interface.

---

## 7. Metas e marcos (roadmap)

Capacidades sugeridas pelo código; **datas** são definidas pela equipa.

| Marco | Descrição |
|--------|-----------|
| MVP comercial | Funil home → briefing → IA → visual → preview → planos/checkout → publicação. |
| Confiança e retenção | Retomada de funil, lead capture, dashboard, publicação estável. |
| Crescimento | SEO docpage.com.br, parcerias, conteúdo educativo. |
| Expansão | Novos layouts, idiomas, integrações (CRM, agenda), tier enterprise. |

**Próximos passos operacionais**

- Definir **métricas norte** (ex.: ativação “primeira LP publicada”, conversão checkout, NPS).
- Roadmap trimestral com **owner** por iniciativa.
- Revisão legal periódica dos **textos gerados** e **termos** face a alterações regulatórias.

---

## 8. Chamada para ação (CTA)

**Investidores / comité**  
Aprovar **orçamento** e **prioridades** do próximo ciclo com base nas métricas da secção 6.

**Equipa interna**  
Formalizar **OKRs** alinhados ao funil (lead → trial → subscrição → retenção) e **uma fonte de verdade** para números (BI).

**Parceiros**  
Explorar **co-marketing** com software de saúde que não competem na mesma camada (ex.: agenda, gestão de clínica).

---

## 9. Identidade visual do produto

**Marca e presença**

| Elemento | Valor |
|----------|--------|
| Nome | DocPage AI |
| Entidade (referência legal em SEO) | DocPage AI Tecnologia Ltda. |
| Domínio | https://docpage.com.br |
| Idioma principal | Português (Brasil) |

**Tom de voz**  
Profissional e acessível; ênfase em **ética**, **resultado visível antes de pagar** e **facilidade**, sem promessas clínicas irrealistas.

**Direção visual (UI atual)**

- **Cores:** azuis (`blue-600` e afins), **gradientes** azul → roxo / azul → teal em heroes; **neutros slate** para texto e fundos.
- **CTAs:** frequentemente **slate-900** sobre fundo claro; secções com **cantos arredondados** (`rounded-2xl`, `rounded-full`).
- **Variante alternativa de landing:** marca em **#0A4D8C** (`components/NewSaaSLanding.tsx`).
- **Logótipo (conceito):** ícone com gradiente azul–roxo, motivo tipo rede/página.

**Imagem social**  
Open Graph: `https://docpage.com.br/og-default.png` — validar asset em deploy.

**Boas práticas**

- Documentar **hex** finais e tipografia num brand kit interno (extrair de Tailwind/CSS global).
- Alinhar comunicação externa aos **guardrails** de copy do produto (evitar superlativos e promessas vedadas pela regulação médica).

---

*Documento orientativo. Dados de mercado e financeiros devem ser validados com pesquisa e modelos internos.*
