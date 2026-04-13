import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface BenefitBlock {
  icon: string;
  title: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface SpecialtyConfig {
  slug: string;
  titulo: string;
  nomeProfissional: string;
  keyword: string;
  descricao: string;
  subtitulo: string;
  beneficios: BenefitBlock[];
  faq: FAQItem[];
}

const SPECIALTIES: Record<string, SpecialtyConfig> = {
  cardiologista: {
    slug: 'cardiologista',
    titulo: 'Site para Cardiologista — Crie em Minutos com IA',
    nomeProfissional: 'Cardiologista',
    keyword: 'site para cardiologista',
    descricao:
      'Crie seu site profissional como cardiologista em minutos com IA. 100% dentro das normas do CFM. Transmita autoridade, apresente seus serviços e facilite o agendamento.',
    subtitulo:
      'Seu site médico pronto em minutos — em conformidade total com as normas éticas do CFM para cardiologistas.',
    beneficios: [
      {
        icon: '🩺',
        title: 'Transmita autoridade clínica antes da primeira consulta',
        description:
          'Pacientes que buscam um cardiologista querem segurança. Um site profissional com sua formação, experiência e áreas de atuação transmite a confiança que eles precisam para marcar a consulta.',
      },
      {
        icon: '🏥',
        title: 'Apresente seus equipamentos e exames disponíveis',
        description:
          'Ecocardiograma, Holter, MAPA, teste ergométrico — informe quais recursos o seu consultório ou clínica oferece. Pacientes pesquisam esses serviços antes de agendar.',
      },
      {
        icon: '📅',
        title: 'Facilite o agendamento com um clique direto no WhatsApp',
        description:
          'O DocPage AI posiciona o botão de contato estrategicamente para que o paciente nunca fique em dúvida sobre como te encontrar. Mais contato, mais consultas.',
      },
    ],
    faq: [
      {
        question: 'Um site para cardiologista precisa ter informações sobre exames?',
        answer:
          'Sim, é altamente recomendado. Pacientes pesquisam no Google por exames específicos como "ecocardiograma particular" ou "Holter em [cidade]". Listar os exames disponíveis aumenta as chances do seu site aparecer nessas buscas e atrair pacientes qualificados.',
      },
      {
        question: 'Como o site ajuda um cardiologista a atrair mais pacientes?',
        answer:
          'O site funciona como seu consultório digital 24 horas. Quando um paciente pesquisa "cardiologista em [sua cidade]", seu site aparece no Google, transmite credibilidade e facilita o primeiro contato. O DocPage AI também otimiza o conteúdo para SEO local automaticamente.',
      },
      {
        question: 'O site de cardiologista segue as normas do CFM?',
        answer:
          'Sim. O DocPage AI foi desenvolvido com foco nas diretrizes éticas do CFM. O conteúdo gerado evita promessas de resultados, ranking de especialistas e qualquer linguagem proibida pela resolução CFM 1974/2011, garantindo total conformidade.',
      },
    ],
  },
  dermatologista: {
    slug: 'dermatologista',
    titulo: 'Site para Dermatologista — Crie em Minutos com IA',
    nomeProfissional: 'Dermatologista',
    keyword: 'site para dermatologista',
    descricao:
      'Crie seu site profissional como dermatologista em minutos com IA. 100% dentro das normas do CFM. Apresente seus procedimentos, transmita confiança e atraia mais pacientes.',
    subtitulo:
      'Apresente seus procedimentos com ética e profissionalismo — em conformidade total com as normas do CFM para dermatologistas.',
    beneficios: [
      {
        icon: '✨',
        title: 'Apresente seus procedimentos de forma ética e profissional',
        description:
          'Tratamentos para acne, manchas, envelhecimento, dermatites e mais — seu site pode listar todos os procedimentos disponíveis de forma clara e dentro das normas do CFM, sem promessas de resultado.',
      },
      {
        icon: '🔬',
        title: 'Diferencie saúde da pele de estética com clareza',
        description:
          'Muitos pacientes não sabem distinguir quando procurar um dermatologista. Seu site educa o visitante sobre quais condições você trata, posicionando você como a referência certa para o problema dele.',
      },
      {
        icon: '📍',
        title: 'Apareça no Google quando pacientes buscam tratamentos perto de você',
        description:
          'O DocPage AI otimiza seu site para buscas como "dermatologista para acne em [cidade]" ou "tratamento de manchas particular". SEO local que atrai pacientes qualificados.',
      },
    ],
    faq: [
      {
        question: 'Posso divulgar procedimentos estéticos no meu site de dermatologista?',
        answer:
          'Sim, com as restrições éticas do CFM. Você pode descrever os procedimentos disponíveis, mas não pode usar fotos de "antes e depois" de pacientes, prometer resultados ou fazer comparações. O DocPage AI gera conteúdo que segue essas diretrizes automaticamente.',
      },
      {
        question: 'Como atrair mais pacientes com meu site de dermatologia?',
        answer:
          'O DocPage AI otimiza seu site para palavras-chave locais como "dermatologista em [sua cidade]" e termos específicos de tratamento. Combinado com um botão de agendamento visível e conteúdo profissional, seu site se torna sua principal fonte de novos pacientes.',
      },
      {
        question: 'Meu site de dermatologista precisa seguir alguma norma específica?',
        answer:
          'Sim. A resolução CFM 1974/2011 regula a publicidade médica. Ela proíbe, entre outras coisas, fotos de "antes e depois" de pacientes, títulos não reconhecidos pelo CFM e promessas de cura. O DocPage AI foi criado com essas restrições incorporadas no processo de geração.',
      },
    ],
  },
  pediatra: {
    slug: 'pediatra',
    titulo: 'Site para Pediatra — Crie em Minutos com IA',
    nomeProfissional: 'Pediatra',
    keyword: 'site para pediatra',
    descricao:
      'Crie seu site profissional como pediatra em minutos com IA. 100% dentro das normas do CFM. Transmita acolhimento para pais e facilite o contato para agendamento.',
    subtitulo:
      'Transmita acolhimento e segurança para pais e responsáveis — um site profissional que gera confiança antes da primeira consulta.',
    beneficios: [
      {
        icon: '👶',
        title: 'Transmita acolhimento e segurança para pais ansiosos',
        description:
          'Pais que buscam um pediatra querem sentir que estão entregando seus filhos a alguém de confiança. Seu site apresenta sua formação, abordagem e valores de forma que transmite esse cuidado desde o primeiro clique.',
      },
      {
        icon: '💬',
        title: 'Destaque sua abordagem humanizada no cuidado com crianças',
        description:
          'Amamentação, desenvolvimento infantil, vacinação, primeiros socorros — posicione seu site como referência de informação para pais, fortalecendo o vínculo antes mesmo da consulta.',
      },
      {
        icon: '📱',
        title: 'WhatsApp sempre visível para o momento que os pais mais precisam',
        description:
          'Pai preocupado à noite, dúvida rápida sobre febre ou vacina — o DocPage AI posiciona seu contato de forma estratégica para que chegar até você seja sempre fácil e imediato.',
      },
    ],
    faq: [
      {
        question: 'O que um site de pediatra precisa ter para atrair pacientes?',
        answer:
          'Um site de pediatra precisa transmitir confiança acima de tudo. Inclua sua formação, áreas de atuação (neonatologia, puericultura, adolescência), convênios atendidos e um contato facilmente visível. O DocPage AI gera toda essa estrutura automaticamente com base nas suas informações.',
      },
      {
        question: 'Como pais encontram pediatras pelo Google?',
        answer:
          'Eles pesquisam termos como "pediatra em [bairro ou cidade]", "pediatra que atende convênio X" ou "pediatra neonatal". O DocPage AI otimiza seu site para essas buscas locais, aumentando suas chances de aparecer quando a família certa está procurando.',
      },
      {
        question: 'Posso divulgar minha especialização em pediatria no site?',
        answer:
          'Sim, desde que a especialização seja reconhecida pelo CFM ou pelas sociedades médicas. Você pode e deve mencionar suas áreas de atuação, como neonatologia ou pediatria do adolescente, pois isso ajuda pais a encontrar o especialista certo para a necessidade do filho.',
      },
    ],
  },
  ortopedista: {
    slug: 'ortopedista',
    titulo: 'Site para Ortopedista — Crie em Minutos com IA',
    nomeProfissional: 'Ortopedista',
    keyword: 'site para ortopedista',
    descricao:
      'Crie seu site profissional como ortopedista em minutos com IA. 100% dentro das normas do CFM. Apresente suas subespecialidades, transmita expertise e atraia mais pacientes.',
    subtitulo:
      'Apresente suas subespecialidades e diferenciais técnicos — um site que posiciona você como referência em ortopedia na sua região.',
    beneficios: [
      {
        icon: '🦴',
        title: 'Apresente suas áreas de atuação com clareza técnica',
        description:
          'Coluna, joelho, quadril, ombro, pé e tornozelo, mão — pacientes buscam ortopedistas por área específica. Seu site deixa claro para qual condição você é a melhor escolha, atraindo os casos mais alinhados ao seu perfil.',
      },
      {
        icon: '⚕️',
        title: 'Mostre experiência em cirurgias e tratamentos conservadores',
        description:
          'Apresente os procedimentos que você realiza, desde fisioterapia dirigida e infiltrações até artroscopia e artroplastia. Pacientes querem saber se você tem experiência com o caso deles antes de marcar.',
      },
      {
        icon: '🏃',
        title: 'Atraia pacientes em dor que precisam de atendimento rápido',
        description:
          'Pacientes ortopédicos muitas vezes buscam atendimento urgente. Um site claro, com contato visível e informações sobre convênios, converte visitas em consultas com muito mais eficiência.',
      },
    ],
    faq: [
      {
        question: 'Devo criar um site para cada subespecialidade de ortopedia?',
        answer:
          'Não é necessário. Um único site bem estruturado com seções dedicadas a cada área de atuação (joelho, coluna, ombro etc.) é mais eficiente. O DocPage AI organiza seu conteúdo de forma que o Google entenda suas especialidades e ranqueie seu site para cada uma delas.',
      },
      {
        question: 'Como um ortopedista pode se destacar no Google local?',
        answer:
          'Combinando um site otimizado para SEO com um perfil completo no Google Meu Negócio. O DocPage AI gera seu site com as palavras-chave corretas (como "ortopedista de joelho em [cidade]") e as metainformações que o Google usa para ranquear resultados locais.',
      },
      {
        question: 'Meu site de ortopedista pode mencionar procedimentos cirúrgicos?',
        answer:
          'Sim. Você pode descrever os procedimentos que realiza de forma informativa, como artroscopia, prótese de quadril ou cirurgia de coluna. O importante é não fazer promessas de resultado ou usar linguagem que induza o paciente — o DocPage AI garante essa conformidade com o CFM.',
      },
    ],
  },
  ginecologista: {
    slug: 'ginecologista',
    titulo: 'Site para Ginecologista — Crie em Minutos com IA',
    nomeProfissional: 'Ginecologista',
    keyword: 'site para ginecologista',
    descricao:
      'Crie seu site profissional como ginecologista em minutos com IA. 100% dentro das normas do CFM. Transmita cuidado e acolhimento para suas pacientes em todas as fases da vida.',
    subtitulo:
      'Um site que transmite cuidado, acolhimento e confiança para suas pacientes — em conformidade total com as normas éticas do CFM.',
    beneficios: [
      {
        icon: '💜',
        title: 'Transmita cuidado e acolhimento para pacientes em todas as fases da vida',
        description:
          'Da adolescência ao climatério, suas pacientes precisam sentir que encontraram uma médica de confiança. Seu site apresenta sua abordagem, valores e especialidades de forma que gera essa conexão antes da primeira consulta.',
      },
      {
        icon: '🤰',
        title: 'Destaque seus serviços: pré-natal, ginecologia geral e climatério',
        description:
          'Pacientes pesquisam por serviços específicos como "pré-natal particular" ou "ginecologista para menopausa". Um site com essas especialidades bem definidas aparece nos momentos certos e para as pacientes certas.',
      },
      {
        icon: '🔒',
        title: 'Construa um espaço digital seguro e confiável para suas pacientes',
        description:
          'Temas ginecológicos são sensíveis. Um site profissional, com linguagem cuidadosa e visual acolhedor, cria um ambiente digital que reflete o respeito e a privacidade que você oferece no consultório.',
      },
    ],
    faq: [
      {
        question: 'O que não pode faltar no site de uma ginecologista?',
        answer:
          'Formação e titulação, áreas de atuação (ginecologia geral, obstetrícia, endocrinologia ginecológica), convênios aceitos e um contato facilmente visível. O DocPage AI estrutura todas essas seções automaticamente com base nas suas informações.',
      },
      {
        question: 'Como pacientes encontram ginecologistas pelo Google?',
        answer:
          'Pesquisas como "ginecologista em [cidade]", "pré-natal particular" ou "ginecologista que aceita plano X" são muito comuns. O DocPage AI otimiza seu site para essas buscas locais, aumentando sua visibilidade para pacientes que precisam dos seus serviços.',
      },
      {
        question: 'Meu site de ginecologia precisa tratar temas sensíveis de forma especial?',
        answer:
          'Sim. A linguagem deve ser acolhedora, clara e não sensacionalista. O conteúdo gerado pelo DocPage AI é calibrado para ser informativo e respeitoso, seguindo as boas práticas éticas do CFM e as expectativas de privacidade das suas pacientes.',
      },
    ],
  },
  oftalmologista: {
    slug: 'oftalmologista',
    titulo: 'Site para Oftalmologista — Crie em Minutos com IA',
    nomeProfissional: 'Oftalmologista',
    keyword: 'site para oftalmologista',
    descricao:
      'Crie seu site profissional como oftalmologista em minutos com IA. 100% dentro das normas do CFM. Apresente exames, cirurgias disponíveis e atraia pacientes de todas as idades.',
    subtitulo:
      'Apresente seus exames, cirurgias e especialidades com profissionalismo — um site que converte visitantes em pacientes agendados.',
    beneficios: [
      {
        icon: '👁️',
        title: 'Apresente exames e cirurgias disponíveis de forma clara',
        description:
          'Catarata, LASIK, glaucoma, retina, estrabismo — informe quais procedimentos e exames seu consultório ou clínica oferece. Pacientes pesquisam por esses serviços antes de escolher onde se consultar.',
      },
      {
        icon: '👴',
        title: 'Atenda da pediatria à terceira idade com um site que reflete isso',
        description:
          'Oftalmologia tem demanda em todas as faixas etárias. Seu site pode destacar essa amplitude de atendimento, posicionando você como a referência completa em saúde ocular para toda a família.',
      },
      {
        icon: '📋',
        title: 'Esclareça convênios aceitos e facilite o agendamento',
        description:
          'Uma das primeiras dúvidas de qualquer paciente é se você aceita o plano dele. O DocPage AI inclui essa informação de forma estratégica, reduzindo o atrito no processo de agendamento.',
      },
    ],
    faq: [
      {
        question: 'Devo mencionar as cirurgias que realizo no meu site de oftalmologia?',
        answer:
          'Sim, absolutamente. Pacientes que precisam de cirurgia de catarata, LASIK ou correção de estrabismo pesquisam ativamente por esses procedimentos. Listá-los no seu site aumenta significativamente sua visibilidade para quem já está pronto para buscar um especialista.',
      },
      {
        question: 'Como um site ajuda um oftalmologista a atrair mais pacientes?',
        answer:
          'Principalmente por SEO local. O DocPage AI otimiza seu site para buscas como "oftalmologista em [cidade]" ou "cirurgia de catarata particular". Quando um paciente pesquisa, seu site aparece nos resultados com informações claras que facilitam o agendamento.',
      },
      {
        question: 'Meu site de oftalmologista precisa seguir as normas do CFM?',
        answer:
          'Sim. As normas do CFM se aplicam a todos os médicos independente da especialidade. O DocPage AI garante que o conteúdo gerado esteja em conformidade com a resolução CFM 1974/2011, sem promessas de resultado, comparações ou linguagem sensacionalista.',
      },
    ],
  },
  psiquiatra: {
    slug: 'psiquiatra',
    titulo: 'Site para Psiquiatra — Crie em Minutos com IA',
    nomeProfissional: 'Psiquiatra',
    keyword: 'site para psiquiatra',
    descricao:
      'Crie seu site profissional como psiquiatra em minutos com IA. 100% dentro das normas do CFM. Transmita acolhimento, ética e confiança antes da primeira consulta.',
    subtitulo:
      'Transmita acolhimento e confiança antes da primeira consulta — um site que reduz barreiras e conecta pacientes ao cuidado que precisam.',
    beneficios: [
      {
        icon: '🧠',
        title: 'Transmita acolhimento e confiança antes da primeira consulta',
        description:
          'Buscar ajuda psiquiátrica exige coragem. Seu site precisa transmitir segurança, sigilo e empatia. O DocPage AI cria uma apresentação digital que reflete exatamente o ambiente acolhedor que você oferece no consultório.',
      },
      {
        icon: '🤝',
        title: 'Reduza o estigma com uma presença digital humanizada',
        description:
          'Uma apresentação profissional e humanizada normaliza a busca por cuidado em saúde mental. Seu site pode ser o primeiro passo para que um paciente decida dar o passo mais difícil: pedir ajuda.',
      },
      {
        icon: '🔐',
        title: 'Demonstre sigilo, ética e escuta ativa desde o primeiro contato',
        description:
          'Pacientes de psiquiatria são especialmente sensíveis à confiança. Um site bem construído que evidencia sua postura ética e o sigilo do tratamento é um diferencial que poucos profissionais exploram.',
      },
    ],
    faq: [
      {
        question: 'Como um psiquiatra pode usar o site para reduzir o estigma da busca por ajuda?',
        answer:
          'Com linguagem acolhedora, clara e desestigmatizante. Seu site pode abordar que transtornos mentais são condições médicas tratáveis, que a consulta é sigilosa e que buscar ajuda é um ato de autocuidado. O DocPage AI estrutura esse conteúdo de forma natural e ética.',
      },
      {
        question: 'Quais informações são essenciais no site de um psiquiatra?',
        answer:
          'Formação e titulação, condições que você trata (depressão, ansiedade, TDAH, bipolaridade, etc.), abordagem terapêutica, modalidade de atendimento (presencial ou online) e contato para agendamento. O DocPage AI organiza tudo isso automaticamente.',
      },
      {
        question: 'Posso oferecer consultas online no meu site de psiquiatria?',
        answer:
          'Sim. A telemedicina é permitida pelo CFM e cada vez mais procurada por pacientes de psiquiatria. Seu site pode destacar essa modalidade, alcançando pacientes em cidades sem especialistas disponíveis ou que preferem a comodidade do atendimento remoto.',
      },
    ],
  },
  neurologista: {
    slug: 'neurologista',
    titulo: 'Site para Neurologista — Crie em Minutos com IA',
    nomeProfissional: 'Neurologista',
    keyword: 'site para neurologista',
    descricao:
      'Crie seu site profissional como neurologista em minutos com IA. 100% dentro das normas do CFM. Transmita expertise para pacientes com condições neurológicas e familiares que buscam referência.',
    subtitulo:
      'Transmita expertise e clareza para pacientes com condições complexas — um site que posiciona você como referência neurológica na sua região.',
    beneficios: [
      {
        icon: '🧬',
        title: 'Transmita expertise para pacientes com condições complexas',
        description:
          'Epilepsia, enxaqueca, Parkinson, Alzheimer, esclerose múltipla — pacientes e familiares que buscam um neurologista já chegam com muita dúvida e ansiedade. Um site que demonstra seu conhecimento e experiência é decisivo para a escolha.',
      },
      {
        icon: '📖',
        title: 'Apresente sua formação e subespecialidades com clareza',
        description:
          'Neurologia infantil, neurologia vascular, distúrbios do movimento, neurologia do sono — apresentar suas áreas de foco ajuda pacientes a encontrar exatamente o especialista que precisam, aumentando a qualidade e a assertividade dos agendamentos.',
      },
      {
        icon: '👨‍👩‍👧',
        title: 'Facilite o primeiro contato de familiares que buscam um especialista',
        description:
          'Em muitos casos, é o familiar do paciente neurológico que faz a pesquisa. Um site com linguagem acessível e contato fácil transforma essa busca angustiante em um agendamento rápido.',
      },
    ],
    faq: [
      {
        question: 'O que colocar no site de um neurologista para atrair os casos certos?',
        answer:
          'Liste as condições que você trata (enxaqueca, epilepsia, Parkinson, demências, etc.) e suas subespecialidades. Isso permite que o Google conecte seu site aos pacientes certos. O DocPage AI estrutura esse conteúdo de forma otimizada para SEO desde a criação.',
      },
      {
        question: 'Como familiares de pacientes neurológicos encontram médicos pelo Google?',
        answer:
          'Pesquisas como "neurologista para Parkinson em [cidade]" ou "especialista em epilepsia" são comuns. O DocPage AI otimiza seu site para essas buscas de cauda longa, que têm menor concorrência e maior intenção de agendamento.',
      },
      {
        question: 'Meu site de neurologia precisa de um glossário médico para pacientes?',
        answer:
          'Não é obrigatório, mas simplificar a linguagem técnica em alguns pontos ajuda muito. O DocPage AI já gera o conteúdo com equilíbrio entre a credibilidade técnica que você precisa e a clareza que o paciente e seus familiares esperam.',
      },
    ],
  },
  endocrinologista: {
    slug: 'endocrinologista',
    titulo: 'Site para Endocrinologista — Crie em Minutos com IA',
    nomeProfissional: 'Endocrinologista',
    keyword: 'site para endocrinologista',
    descricao:
      'Crie seu site profissional como endocrinologista em minutos com IA. 100% dentro das normas do CFM. Atraia pacientes com diabetes, tireoide, obesidade e síndrome metabólica.',
    subtitulo:
      'Atraia pacientes com diabetes, tireoide e síndrome metabólica — posicionando você como especialista de referência na sua região.',
    beneficios: [
      {
        icon: '💊',
        title: 'Atraia pacientes com diabetes, tireoide e obesidade',
        description:
          'Essas são algumas das condições mais pesquisadas no Google por pacientes que precisam de acompanhamento especializado. Um site bem otimizado faz com que você apareça para quem já está buscando o cuidado que você oferece.',
      },
      {
        icon: '🔬',
        title: 'Destaque seu tratamento individualizado e multidisciplinar',
        description:
          'Endocrinologistas trabalham com condições crônicas que exigem acompanhamento de longo prazo. Transmitir sua abordagem personalizada cria um vínculo de confiança desde a primeira visita ao seu site.',
      },
      {
        icon: '📊',
        title: 'Construa credibilidade para um público que pesquisa muito antes de consultar',
        description:
          'Pacientes endocrinológicos costumam pesquisar extensamente antes de marcar consulta. Um site profissional, com informações claras sobre as condições que você trata, converte essa pesquisa em agendamento.',
      },
    ],
    faq: [
      {
        question: 'Quais condições devo destacar no site do meu endocrinologista?',
        answer:
          'As mais pesquisadas são diabetes (tipo 1 e 2), problemas de tireoide (hipotireoidismo, hipertireoidismo, nódulo), obesidade, síndrome dos ovários policísticos (SOP), osteoporose e distúrbios da hipófise. Liste as que você trata para aparecer nas buscas certas.',
      },
      {
        question: 'Como um endocrinologista pode se diferenciar online?',
        answer:
          'Apresentando sua abordagem clínica com clareza, destacando experiência com casos complexos e evidenciando o acompanhamento de longo prazo que você oferece. O DocPage AI cria um site que comunica esses diferenciais de forma objetiva e profissional.',
      },
      {
        question: 'Meu site de endocrinologia precisa estar em conformidade com o CFM?',
        answer:
          'Sim. Endocrinologistas que divulgam tratamentos para emagrecimento ou desempenho precisam ser especialmente cuidadosos com as normas do CFM sobre publicidade médica. O DocPage AI gera conteúdo que equilibra marketing eficaz com total conformidade ética.',
      },
    ],
  },
  nutrologista: {
    slug: 'nutrologista',
    titulo: 'Site para Nutrologista — Crie em Minutos com IA',
    nomeProfissional: 'Nutrologista',
    keyword: 'site para nutrologista',
    descricao:
      'Crie seu site profissional como nutrologista em minutos com IA. 100% dentro das normas do CFM. Diferencie seu trabalho médico, apresente seus serviços e atraia mais pacientes.',
    subtitulo:
      'Diferencie seu trabalho médico da nutrição convencional — um site que posiciona o nutrologista como especialidade médica de referência.',
    beneficios: [
      {
        icon: '🩺',
        title: 'Diferencie seu trabalho médico da nutrição convencional',
        description:
          'Muitos pacientes não sabem a diferença entre nutrólogo e nutricionista. Seu site tem a missão de esclarecer esse posicionamento, apresentando a nutrologia como especialidade médica que integra diagnóstico, prescrição e acompanhamento clínico.',
      },
      {
        icon: '⚡',
        title: 'Apresente seu foco em emagrecimento, performance e saúde metabólica',
        description:
          'Esses são os principais motivos pelos quais pacientes buscam um nutrologista. Um site que comunica claramente sua abordagem nessas áreas atrai exatamente o perfil de paciente que você quer atender.',
      },
      {
        icon: '🔗',
        title: 'Destaque o tratamento integrado: medicamentos, suplementação e acompanhamento',
        description:
          'A possibilidade de prescrição médica é um diferencial único da nutrologia. Comunicar essa vantagem no seu site ajuda pacientes a entenderem por que consultar um nutrologista vai além do que uma consulta convencional oferece.',
      },
    ],
    faq: [
      {
        question: 'Como explicar a diferença entre nutrólogo e nutricionista no meu site?',
        answer:
          'De forma clara e sem depreciar outras profissões. O DocPage AI ajuda a estruturar essa explicação destacando as competências médicas exclusivas do nutrologista, como prescrição de medicamentos e diagnóstico de patologias nutricionais, respeitando as normas éticas do CFM.',
      },
      {
        question: 'Posso anunciar tratamentos para emagrecimento no meu site médico?',
        answer:
          'Sim, com restrições. Você pode descrever que trata obesidade e sobrepeso como condições médicas, mas não pode prometer resultados específicos (como "perca X kg") ou usar fotos de "antes e depois". O DocPage AI gera esse conteúdo dentro dos limites éticos do CFM.',
      },
      {
        question: 'Qual é o diferencial de um site para nutrologista vs outras especialidades?',
        answer:
          'O posicionamento. Enquanto outras especialidades focam em condições específicas, a nutrologia precisa primeiro educar o paciente sobre o que o nutrologista faz. Seu site deve ser tanto educativo quanto persuasivo — e o DocPage AI equilibra exatamente esses dois objetivos.',
      },
    ],
  },
  'cirurgiao-plastico': {
    slug: 'cirurgiao-plastico',
    titulo: 'Site para Cirurgião Plástico — Crie em Minutos com IA',
    nomeProfissional: 'Cirurgião Plástico',
    keyword: 'site para cirurgião plástico',
    descricao:
      'Crie seu site profissional como cirurgião plástico em minutos com IA. 100% dentro das normas do CFM. Transmita segurança técnica e credenciais para pacientes que buscam cirurgias.',
    subtitulo:
      'Transmita credenciais, segurança técnica e ética — um site que diferencia o cirurgião plástico titulado no mercado.',
    beneficios: [
      {
        icon: '🏆',
        title: 'Apresente suas credenciais e titulação de forma destacada',
        description:
          'Especialista pela SBCP, Título de Especialista pelo CFM — pacientes que buscam cirurgia plástica pesquisam ativamente por médicos certificados. Seu site deve apresentar essas credenciais de forma visível e clara, diferenciando você de médicos sem a titulação adequada.',
      },
      {
        icon: '🛡️',
        title: 'Transmita segurança técnica para pacientes que buscam cirurgias',
        description:
          'Cirurgias plásticas envolvem decisões de alto comprometimento emocional e financeiro. Um site profissional que descreve sua experiência, estrutura de atendimento e cuidados pré e pós-operatórios gera a confiança necessária para o paciente dar o próximo passo.',
      },
      {
        icon: '⚖️',
        title: 'Destaque seu compromisso com resultado natural e saúde do paciente',
        description:
          'Num mercado saturado de apelos estéticos, posicionar sua abordagem como focada em saúde, naturalidade e segurança é um poderoso diferencial. O DocPage AI ajuda a comunicar esse posicionamento de forma ética e convincente.',
      },
    ],
    faq: [
      {
        question: 'Posso usar fotos de resultados de cirurgia no meu site médico?',
        answer:
          'Não. A resolução CFM 1974/2011 proíbe expressamente o uso de fotos de "antes e depois" de pacientes em material publicitário médico. O DocPage AI foi desenvolvido com essa restrição incorporada, garantindo que nenhum conteúdo gerado viole essa norma.',
      },
      {
        question: 'Como um cirurgião plástico pode se destacar online sem usar fotos de pacientes?',
        answer:
          'Apresentando credenciais sólidas (SBCP, Residência, Fellowships), descrevendo tecnicamente os procedimentos que realiza, demonstrando sua abordagem segura e natural, e utilizando depoimentos escritos com autorização dos pacientes. O DocPage AI estrutura tudo isso de forma eficaz.',
      },
      {
        question: 'O site de cirurgia plástica precisa mencionar os riscos dos procedimentos?',
        answer:
          'É uma boa prática incluir que riscos são discutidos em consulta, sem detalhar cada complicação possível no site. Isso mostra transparência e responsabilidade, características que os pacientes valorizam ao escolher um cirurgião. O DocPage AI equilibra essa comunicação de forma adequada.',
      },
    ],
  },
  urologista: {
    slug: 'urologista',
    titulo: 'Site para Urologista — Crie em Minutos com IA',
    nomeProfissional: 'Urologista',
    keyword: 'site para urologista',
    descricao:
      'Crie seu site profissional como urologista em minutos com IA. 100% dentro das normas do CFM. Aborde condições sensíveis com profissionalismo e facilite o contato para pacientes.',
    subtitulo:
      'Aborde condições sensíveis com profissionalismo e acessibilidade — um site que incentiva pacientes a buscar o cuidado que precisam.',
    beneficios: [
      {
        icon: '💼',
        title: 'Aborde condições sensíveis com profissionalismo e linguagem acessível',
        description:
          'Próstata, disfunção erétil, incontinência, infertilidade masculina — muitos pacientes evitam buscar ajuda por vergonha. Um site com linguagem profissional, respeitosa e clara reduz essa barreira e facilita o primeiro contato.',
      },
      {
        icon: '🔍',
        title: 'Apresente suas áreas: próstata, fertilidade, incontinência e urologia feminina',
        description:
          'A urologia abrange muito mais do que a maioria das pessoas imagina. Destacar todas as suas áreas de atuação no site aumenta sua visibilidade para condições menos conhecidas e abre novas fontes de pacientes.',
      },
      {
        icon: '📞',
        title: 'Facilite o contato de pacientes que muitas vezes postergam a consulta',
        description:
          'Pacientes urológicos são conhecidos por adiar a consulta. Um site com agendamento fácil, informações sobre privacidade e contato direto reduz o atrito e torna mais fácil dar o primeiro passo.',
      },
    ],
    faq: [
      {
        question: 'Como tratar temas sensíveis como disfunção erétil no site de urologia?',
        answer:
          'Com naturalidade médica, sem sensacionalismo e sem promessas de resultado. Você pode mencionar que trata disfunção erétil como uma condição médica com tratamentos disponíveis, incentivando o paciente a consultar. O DocPage AI calibra essa linguagem para ser profissional e eficaz.',
      },
      {
        question: 'Urologia feminina deve ter destaque especial no site?',
        answer:
          'Sim, principalmente se você atende essa área. Muitas mulheres não sabem que urologistas também tratam incontinência urinária, infecções recorrentes e prolapso pélvico. Destacar isso no seu site abre um mercado que muitos urologistas não exploram.',
      },
      {
        question: 'Meu site de urologia precisa de informações sobre exames preventivos?',
        answer:
          'É um diferencial excelente. Informações sobre PSA, check-up urológico masculino e prevenção do câncer de próstata são muito pesquisadas no Google. Incluir esse conteúdo educativo posiciona seu site como referência e atrai pacientes em fase preventiva.',
      },
    ],
  },
  geriatra: {
    slug: 'geriatra',
    titulo: 'Site para Geriatra — Crie em Minutos com IA',
    nomeProfissional: 'Geriatra',
    keyword: 'site para geriatra',
    descricao:
      'Crie seu site profissional como geriatra em minutos com IA. 100% dentro das normas do CFM. Transmita cuidado integral para pacientes idosos e seus familiares.',
    subtitulo:
      'Transmita cuidado integral para idosos e seus familiares — posicionando você como referência em saúde e qualidade de vida na terceira idade.',
    beneficios: [
      {
        icon: '❤️',
        title: 'Transmita cuidado e atenção para pacientes idosos e seus familiares',
        description:
          'Na maioria das vezes, é o filho ou cuidador que busca um geriatra pelo Google. Seu site precisa transmitir confiança para essa pessoa, comunicando que o idoso estará em boas mãos com um especialista que entende as particularidades do envelhecimento.',
      },
      {
        icon: '🏥',
        title: 'Apresente sua abordagem integral: cognição, mobilidade e polifarmácia',
        description:
          'Avaliação cognitiva, revisão de medicamentos, prevenção de quedas, qualidade de vida — apresentar o escopo completo da geriatria diferencia você do clínico geral e demonstra o valor especializado que sua consulta oferece.',
      },
      {
        icon: '👨‍👩‍👦',
        title: 'Facilite o agendamento para famílias que cuidam de idosos dependentes',
        description:
          'Famílias com idosos dependentes precisam de facilidade no contato, clareza sobre o que esperar da consulta e convênios aceitos. Um site bem estruturado reduz as dúvidas e torna o processo de agendamento menos desgastante.',
      },
    ],
    faq: [
      {
        question: 'Quem geralmente pesquisa um geriatra no Google?',
        answer:
          'Na maioria das vezes, são filhos adultos ou cuidadores que buscam pelo idoso. Sabendo disso, o DocPage AI ajuda a criar um site com linguagem que acolhe também essa audiência, com informações claras sobre o que esperar da consulta geriátrica e como o especialista pode ajudar.',
      },
      {
        question: 'O que diferenciar no site de um geriatra em relação a um clínico geral?',
        answer:
          'O treinamento especializado em envelhecimento, a abordagem da polifarmácia (revisão de múltiplos medicamentos), a avaliação geriátrica ampla (cognitiva, funcional, nutricional) e o cuidado do idoso frágil. O DocPage AI estrutura esses diferenciais de forma clara e acessível.',
      },
      {
        question: 'Como atrair mais pacientes idosos pelo Google?',
        answer:
          'Otimizando para buscas como "geriatra em [cidade]", "médico para idosos" e "avaliação geriátrica". Além disso, como os familiares pesquisam muito pelo celular, o DocPage AI cria sites totalmente responsivos e rápidos no mobile, maximizando as conversões.',
      },
    ],
  },
  otorrinolaringologista: {
    slug: 'otorrinolaringologista',
    titulo: 'Site para Otorrinolaringologista — Crie em Minutos com IA',
    nomeProfissional: 'Otorrinolaringologista',
    keyword: 'site para otorrinolaringologista',
    descricao:
      'Crie seu site profissional como otorrinolaringologista em minutos com IA. 100% dentro das normas do CFM. Apresente seus serviços de ouvido, nariz e garganta para todas as idades.',
    subtitulo:
      'Apresente seus serviços de ouvido, nariz e garganta de forma clara — atraindo pacientes que buscam especialista para sinusite, ronco e perda auditiva.',
    beneficios: [
      {
        icon: '👂',
        title: 'Apresente seus serviços de ouvido, nariz e garganta com clareza',
        description:
          'Sinusite, rinite, amigdalite, otite, zumbido, perda auditiva, desvio de septo — seu site pode listar todas essas condições de forma clara, aparecendo nas buscas dos pacientes que precisam exatamente do que você oferece.',
      },
      {
        icon: '😴',
        title: 'Atraia pacientes com ronco, apneia e distúrbios do sono',
        description:
          'Ronco e apneia do sono são condições muito pesquisadas e com grande demanda por especialistas. Destacar esses tratamentos no seu site abre uma fonte de pacientes qualificados com alta intenção de consultar.',
      },
      {
        icon: '👨‍👩‍👧‍👦',
        title: 'Destaque atendimento para crianças e adultos em todas as idades',
        description:
          'Da amigdalite recorrente na infância ao zumbido e perda auditiva na terceira idade, a otorrinolaringologia atende toda a família. Comunicar essa abrangência no seu site maximiza as oportunidades de agendamento.',
      },
    ],
    faq: [
      {
        question: 'Devo abordar tanto as consultas quanto as cirurgias no meu site de otorrinolaringologia?',
        answer:
          'Sim. Informe sobre as consultas e diagnósticos que você realiza (audiometria, nasofibroscopia, etc.) e também sobre as cirurgias (septoplastia, adenoamigdalectomia, cirurgia endoscópica sinusal). Isso aumenta o espectro de buscas para as quais seu site aparece.',
      },
      {
        question: 'Como aparecer no Google para pacientes com sinusite crônica?',
        answer:
          'Criando conteúdo específico sobre sinusite no seu site, incluindo tratamentos disponíveis, a opção cirúrgica e o diagnóstico diferencial. O DocPage AI estrutura seu site com essas palavras-chave de alta intenção, aumentando sua visibilidade para esse perfil de paciente.',
      },
      {
        question: 'Otorrinolaringologista pode atender crianças ou precisa de pediatra?',
        answer:
          'O otorrinolaringologista pode e frequentemente atende crianças para condições como amigdalite, adenóide, otite e problemas de fala relacionados à audição. Destacar esse atendimento no site atrai pais que buscam especialista específico para os filhos.',
      },
    ],
  },
};

const SLUG_TO_KEY: Record<string, string> = {
  cardiologista: 'cardiologista',
  dermatologista: 'dermatologista',
  pediatra: 'pediatra',
  ortopedista: 'ortopedista',
  ginecologista: 'ginecologista',
  oftalmologista: 'oftalmologista',
  psiquiatra: 'psiquiatra',
  neurologista: 'neurologista',
  endocrinologista: 'endocrinologista',
  nutrologista: 'nutrologista',
  'cirurgiao-plastico': 'cirurgiao-plastico',
  urologista: 'urologista',
  geriatra: 'geriatra',
  otorrinolaringologista: 'otorrinolaringologista',
};

const DocPageLogo = () => (
  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-500 rounded-lg shadow-lg shadow-blue-900/20 flex items-center justify-center">
    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" opacity="0.9" />
      <path d="M8 8 L12 16 M16 8 L12 16 M8 8 L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  </div>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const SpecialtyPage: React.FC = () => {
  const { especialidade } = useParams<{ especialidade: string }>();
  const navigate = useNavigate();

  const key = especialidade ? SLUG_TO_KEY[especialidade] : undefined;
  const specialty = key ? SPECIALTIES[key] : undefined;

  const handleStart = () => {
    navigate('/');
  };

  if (!specialty) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900 px-4">
        <Helmet>
          <title>Especialidade não encontrada | DocPage AI</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <h1 className="text-2xl font-bold mb-4">Especialidade não encontrada</h1>
        <p className="text-slate-600 mb-6">A página que você está buscando não existe.</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const canonicalUrl = `https://docpage.com.br/site-para/${specialty.slug}`;

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: specialty.titulo,
    description: specialty.descricao,
    url: canonicalUrl,
    publisher: {
      '@type': 'Organization',
      name: 'DocPage AI',
      url: 'https://docpage.com.br',
    },
    mainEntity: {
      '@type': 'FAQPage',
      mainEntity: specialty.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  };

  return (
    <>
      <Helmet>
        <title>{specialty.titulo}</title>
        <meta name="description" content={specialty.descricao} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={specialty.titulo} />
        <meta property="og:description" content={specialty.descricao} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schemaOrg)}</script>
      </Helmet>

      <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 text-slate-900 hover:text-blue-600 transition-colors">
              <DocPageLogo />
              <span className="font-bold text-xl tracking-tight">DocPage AI</span>
            </Link>
            <button
              onClick={handleStart}
              className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar meu site grátis
            </button>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1">
          <section className="bg-gradient-to-b from-blue-50 to-white py-14 md:py-20 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Criado com IA em minutos
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
                {specialty.titulo}
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
                {specialty.subtitulo}
              </p>
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/25"
              >
                Criar meu site de {specialty.nomeProfissional} grátis
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <p className="text-sm text-slate-500 mt-3">Sem cartão de crédito · Em conformidade com o CFM</p>
            </div>
          </section>

          {/* Benefícios */}
          <section className="py-14 md:py-20 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">
                Por que {specialty.nomeProfissional}s escolhem o DocPage AI
              </h2>
              <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
                Seu site médico pronto em minutos, com conteúdo profissional gerado por IA e totalmente adaptado à sua especialidade.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {specialty.beneficios.map((beneficio, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all"
                  >
                    <div className="text-3xl mb-4">{beneficio.icon}</div>
                    <h3 className="font-bold text-slate-900 text-lg mb-3 leading-snug">{beneficio.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{beneficio.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Diferenciais DocPage */}
          <section className="bg-blue-600 py-14 md:py-16 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                    Tudo que seu site de {specialty.nomeProfissional} precisa, em um só lugar
                  </h2>
                  <p className="text-blue-100 mb-6 leading-relaxed">
                    O DocPage AI gera automaticamente o conteúdo, o design e as configurações de SEO para que seu site apareça no Google para os pacientes certos.
                  </p>
                  <button
                    onClick={handleStart}
                    className="bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Começar agora — é grátis
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    'Site profissional pronto em minutos com IA',
                    'Conteúdo 100% em conformidade com as normas do CFM',
                    'SEO otimizado para buscas locais da sua especialidade',
                    'Botão de WhatsApp integrado para facilitar agendamentos',
                    'Design responsivo e adaptado para mobile',
                    'Domínio personalizado disponível',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-white text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-14 md:py-20 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">
                Perguntas frequentes
              </h2>
              <p className="text-slate-600 text-center mb-10">
                Tudo o que {specialty.nomeProfissional}s perguntam antes de criar seu site
              </p>
              <div className="space-y-4">
                {specialty.faq.map((item, i) => (
                  <details
                    key={i}
                    className="group border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <summary className="flex justify-between items-center px-6 py-5 cursor-pointer font-semibold text-slate-900 hover:bg-slate-50 transition-colors list-none">
                      <span>{item.question}</span>
                      <svg
                        className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* CTA final */}
          <section className="bg-slate-900 py-14 md:py-20 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Crie seu site de {specialty.nomeProfissional} agora
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Em minutos, você terá um site profissional, otimizado para o Google e em conformidade com o CFM — pronto para atrair novos pacientes.
              </p>
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/40"
              >
                Criar meu site grátis
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <p className="text-slate-600 text-sm mt-3">Sem cartão de crédito · Sem compromisso</p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg" />
                <span className="font-bold text-xl text-white">DocPage AI</span>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                <Link to="/" className="hover:text-white transition-colors">Início</Link>
                <Link to="/termos-de-uso" className="hover:text-white transition-colors">Termos de Uso</Link>
                <Link to="/politica-de-privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-600">
              © {new Date().getFullYear()} DocPage AI. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
