export type CategoriaDica = 'nutricao' | 'exercicios' | 'saudeMental' | 'prevencao';

export interface Dica {
  id: string;
  categoria: CategoriaDica;
  titulo: string;
  subtitulo: string;
  resumo: string;
  conteudo: string[];
  imagem: string;
  tempoLeitura: string;
}

export const dicas: Dica[] = [
  {
    id: 'dica-1',
    categoria: 'nutricao',
    titulo: 'Hidratação é Fundamental',
    subtitulo: 'Beba água ao longo de todo o dia',
    resumo: 'Beba pelo menos 8 copos de água por dia. A hidratação adequada ajuda na digestão e mantém a pele saudável.',
    conteudo: [
      'A hidratação adequada é essencial em qualquer idade, mas ganha ainda mais importância na terceira idade, quando a sensação de sede tende a diminuir naturalmente.',
      'Recomenda-se beber pelo menos 8 copos de água por dia, distribuídos ao longo das refeições e entre elas.',
      'Água de coco, chás sem açúcar e sucos naturais também contam como fontes de hidratação, mas a água pura deve ser a base.',
    ],
    imagem: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&h=400&fit=crop',
    tempoLeitura: '3 min',
  },
  {
    id: 'dica-2',
    categoria: 'nutricao',
    titulo: 'Alimentação Rica em Fibras',
    subtitulo: 'Frutas, verduras e grãos integrais',
    resumo: 'Inclua frutas, verduras e grãos integrais na dieta. As fibras auxiliam o funcionamento intestinal e previnem doenças.',
    conteudo: [
      'As fibras alimentares desempenham papel fundamental na saúde intestinal e na prevenção de doenças cardiovasculares.',
      'Priorize frutas com casca, verduras cruas e grãos integrais como aveia, arroz integral e quinoa.',
      'Combine as fibras com boa hidratação para potencializar seus efeitos no funcionamento do intestino.',
    ],
    imagem: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop',
    tempoLeitura: '4 min',
  },
  {
    id: 'dica-3',
    categoria: 'exercicios',
    titulo: 'Caminhada Diária',
    subtitulo: '30 minutos que fazem a diferença',
    resumo: 'Uma caminhada de 30 minutos por dia fortalece o coração, melhora a circulação e aumenta a disposição.',
    conteudo: [
      'A caminhada é um dos exercícios mais seguros e eficazes para idosos, com baixo impacto nas articulações.',
      'Recomenda-se pelo menos 30 minutos por dia, em ritmo confortável, preferencialmente em local plano e arejado.',
      'Sempre use calçados adequados e, se possível, faça a caminhada acompanhado.',
    ],
    imagem: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop',
    tempoLeitura: '5 min',
  },
  {
    id: 'dica-4',
    categoria: 'exercicios',
    titulo: 'Alongamento Matinal',
    subtitulo: 'Flexibilidade logo ao acordar',
    resumo: 'Fazer alongamentos leves ao acordar melhora a flexibilidade e reduz dores musculares.',
    conteudo: [
      'Os alongamentos matinais preparam o corpo para as atividades do dia e reduzem a rigidez articular.',
      'Movimentos simples de pescoço, ombros, pernas e tornozelos já trazem grandes benefícios.',
      'Faça os movimentos devagar, sem forçar, respirando profundamente durante o alongamento.',
    ],
    imagem: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop',
    tempoLeitura: '3 min',
  },
  {
    id: 'dica-5',
    categoria: 'prevencao',
    titulo: 'Consultas Regulares',
    subtitulo: 'A prevenção é o melhor remédio',
    resumo: 'Mantenha consultas médicas periódicas e exames em dia. A prevenção é o melhor remédio.',
    conteudo: [
      'Consultas médicas regulares permitem identificar precocemente alterações de saúde antes que se tornem graves.',
      'Mantenha um calendário de exames de rotina e leve-o às consultas para acompanhar a evolução dos indicadores.',
      'Não hesite em buscar atendimento diante de qualquer sintoma persistente.',
    ],
    imagem: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop',
    tempoLeitura: '4 min',
  },
  {
    id: 'dica-6',
    categoria: 'prevencao',
    titulo: 'Segurança em Casa',
    subtitulo: 'Prevenindo quedas no ambiente doméstico',
    resumo: 'Instale barras de apoio no banheiro, mantenha boa iluminação e evite tapetes soltos para prevenir quedas.',
    conteudo: [
      'Quedas são uma das principais causas de internação entre idosos, mas grande parte pode ser evitada com pequenas adaptações.',
      'Instale barras de apoio no banheiro, próximo ao vaso sanitário e no box.',
      'Mantenha os ambientes bem iluminados e remova tapetes soltos ou fios espalhados pelo chão.',
    ],
    imagem: 'https://images.unsplash.com/photo-1584622781867-b2a427f453a1?w=600&h=400&fit=crop',
    tempoLeitura: '6 min',
  },
  {
    id: 'dica-7',
    categoria: 'saudeMental',
    titulo: 'Qualidade do Sono',
    subtitulo: '7 a 8 horas de descanso',
    resumo: 'Durma de 7 a 8 horas por noite. Um sono de qualidade é essencial para a saúde física e mental.',
    conteudo: [
      'O sono de qualidade é fundamental para a memória, o humor e a recuperação física.',
      'Mantenha horários regulares para dormir e acordar, mesmo nos fins de semana.',
      'Evite telas e cafeína nas horas que antecedem o sono.',
    ],
    imagem: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&h=400&fit=crop',
    tempoLeitura: '4 min',
  },
  {
    id: 'dica-8',
    categoria: 'saudeMental',
    titulo: 'Socialização e Lazer',
    subtitulo: 'Conexões que fazem bem',
    resumo: 'Mantenha contato com amigos e família. Participe de atividades que tragam alegria e bem-estar.',
    conteudo: [
      'Manter vínculos sociais ativos reduz o risco de depressão e declínio cognitivo na terceira idade.',
      'Participe de grupos, encontros familiares ou atividades comunitárias que tragam prazer.',
      'Ligações e videochamadas também são ótimas formas de manter contato com quem está longe.',
    ],
    imagem: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=400&fit=crop',
    tempoLeitura: '5 min',
  },
  {
    id: 'dica-9',
    categoria: 'saudeMental',
    titulo: 'Exercícios para a Mente',
    subtitulo: 'Mantendo o cérebro ativo',
    resumo: 'Jogos de memória, palavras cruzadas e leitura estimulam o cérebro e mantêm a mente ativa.',
    conteudo: [
      'Assim como o corpo, a mente também precisa de exercícios regulares para se manter ativa.',
      'Jogos de memória, palavras cruzadas, quebra-cabeças e leitura são ótimas opções diárias.',
      'Aprender algo novo, como um idioma ou instrumento, também estimula a neuroplasticidade.',
    ],
    imagem: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&h=400&fit=crop',
    tempoLeitura: '4 min',
  },
  {
    id: 'dica-10',
    categoria: 'prevencao',
    titulo: 'Exposição Solar Saudável',
    subtitulo: 'Vitamina D com segurança',
    resumo: 'Tome sol por 15-20 minutos diariamente, de preferência antes das 10h ou após as 16h, para absorver vitamina D.',
    conteudo: [
      'A vitamina D é essencial para a saúde dos ossos e do sistema imunológico.',
      'Exponha-se ao sol por 15 a 20 minutos diários, preferencialmente antes das 10h ou após as 16h.',
      'Evite os horários de sol mais forte e use protetor solar após o período recomendado de exposição.',
    ],
    imagem: 'https://images.unsplash.com/photo-1502301103665-0b95cc738daf?w=600&h=400&fit=crop',
    tempoLeitura: '3 min',
  },
];
