export type CategoriaProduto = 'mobilidade' | 'higiene' | 'conforto' | 'seguranca';

export interface Produto {
  id: string;
  nome: string;
  categoria: CategoriaProduto;
  descricao: string;
  preco: number;
  imagem: string;
}

export const produtos: Produto[] = [
  {
    id: 'prod-1',
    nome: 'Andador Articulado',
    categoria: 'mobilidade',
    descricao: 'Com rodas e assento',
    preco: 289.9,
    imagem: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&h=400&fit=crop',
  },
  {
    id: 'prod-2',
    nome: 'Cadeira de Rodas',
    categoria: 'mobilidade',
    descricao: 'Dobrável e confortável',
    preco: 1249.0,
    imagem: 'https://images.unsplash.com/photo-1593491205049-7f032d28cf5c?w=400&h=400&fit=crop',
  },
  {
    id: 'prod-3',
    nome: 'Fralda Geriátrica',
    categoria: 'higiene',
    descricao: 'Pacote com 20 unidades',
    preco: 54.9,
    imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop',
  },
  {
    id: 'prod-4',
    nome: 'Sabonete Líquido',
    categoria: 'higiene',
    descricao: 'Hidratante e suave',
    preco: 24.9,
    imagem: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400&h=400&fit=crop',
  },
  {
    id: 'prod-5',
    nome: 'Poltrona Reclinável',
    categoria: 'conforto',
    descricao: 'Massageadora com controle',
    preco: 1890.0,
    imagem: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=400&fit=crop',
  },
  {
    id: 'prod-6',
    nome: 'Travesseiro Ortopédico',
    categoria: 'conforto',
    descricao: 'Viscoelástico',
    preco: 149.9,
    imagem: 'https://images.unsplash.com/photo-1631049035182-249067d7618e?w=400&h=400&fit=crop',
  },
  {
    id: 'prod-7',
    nome: 'Barra de Apoio',
    categoria: 'seguranca',
    descricao: 'Para banheiro',
    preco: 89.9,
    imagem: 'https://images.unsplash.com/photo-1620735692151-26a7e0788598?w=400&h=400&fit=crop',
  },
  {
    id: 'prod-8',
    nome: 'Sensor de Queda',
    categoria: 'seguranca',
    descricao: 'Alerta automático',
    preco: 299.0,
    imagem: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=400&fit=crop',
  },
];
