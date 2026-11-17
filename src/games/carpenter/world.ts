/**
 * "O Carpinteiro": Jesus as a young carpenter in Nazareth. Map layout, recipes,
 * customer orders and the lines everyone says (Portuguese).
 */
import type { IconId } from '../pixel/icons';
import { LOOKS, type Look } from '../pixel/person';
import type { Mood } from '../pixel/bust';
import type { Tile } from '../quest/map';

export const MW = 40;
export const MH = 26;

/** Points of interest, in tiles. */
export const SPOT = {
  start: [17, 8],
  houseDoor: [17, 6],
  bench: [21, 9],
  woodpile: [13, 8],
  grind: [14, 11],
  jose: [20, 11],
  maria: [26, 8],
  enter: [19, 25],
  yardGate: [19, 13],
  wait: [
    [24, 8],
    [24, 10],
    [23, 12],
  ],
  trees: [
    [2, 2],
    [5, 1],
    [8, 2],
    [11, 3],
    [3, 5],
    [7, 5],
    [10, 6],
    [2, 8],
    [5, 8],
  ],
  rocks: [
    [34, 2],
    [37, 1],
    [38, 5],
    [35, 5],
    [37, 8],
    [34, 8],
  ],
  plots: [
    [27, 9],
    [29, 9],
    [31, 9],
    [27, 11],
    [29, 11],
    [31, 11],
  ],
} as const;

const HOUSES = [
  [15, 2, 5, 5],
  [3, 14, 4, 3],
  [9, 20, 4, 3],
  [25, 14, 5, 3],
  [32, 20, 4, 3],
  [14, 21, 4, 3],
] as const;

export function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: MH }, () => Array<Tile>(MW).fill('"'));
  const set = (x: number, y: number, t: Tile) => {
    if (x >= 0 && y >= 0 && x < MW && y < MH) m[y][x] = t;
  };
  // Quarry in the north-east.
  for (let y = 0; y < 10; y++) for (let x = 33; x < MW; x++) if (x > 33 + Math.sin(y) || y < 9) set(x, y, ':');
  // Workshop yard.
  for (let y = 7; y < 13; y++) for (let x = 12; x < 26; x++) set(x, y, '.');
  // Houses: flat roof with a front wall.
  for (const [hx, hy, w, h] of HOUSES) for (let y = hy; y < hy + h; y++) for (let x = hx; x < hx + w; x++) set(x, y, y === hy + h - 1 ? 'H' : 'R');
  // Paths.
  for (let y = 13; y < MH; y++) set(19, y, ',');
  for (let x = 0; x < MW; x++) set(x, 18, ',');
  for (let x = 25; x <= 33; x++) set(x, 13, ',');
  for (let y = 7; y <= 13; y++) set(33, y, ',');
  // Pond in the south-west.
  for (let y = 21; y < MH; y++) {
    const edge = 3 + Math.round(Math.sin(y) * 0.8);
    for (let x = 0; x <= edge; x++) set(x, y, '~');
    set(edge + 1, y, '=');
  }
  set(23, 20, 'w');
  for (const [x, y] of [
    [11, 13],
    [28, 21],
    [37, 15],
    [7, 11],
  ])
    set(x, y, 'T');
  for (const [x, y] of [
    [8, 13],
    [30, 24],
    [36, 12],
    [22, 15],
    [13, 16],
  ])
    set(x, y, 'b');
  return m;
}

export const LOOK = {
  jesus: { ...LOOKS.jesus, robe: '#e8dcc0', trim: '#8a5a2e', sash: false, cloak: undefined } as Look,
  jose: { skin: '#d8955c', hair: '#8a7a6a', robe: '#8a6a4a', trim: '#4a3020', beard: true, head: 'hair' } as Look,
  maria: { skin: '#e2a874', hair: '#3a2010', robe: '#3e5aa0', trim: '#e8d8b0', head: 'veil', headColor: '#6a8ac8' } as Look,
  sara: { skin: '#e8b07a', hair: '#5a2a10', robe: '#d87a8a', trim: '#f0d0a0', head: 'hair' } as Look,
  raquel: { ...LOOKS.woman, robe: '#a86a3a', headColor: '#e8dcc0' } as Look,
  natanael: { ...LOOKS.villager, robe: '#5a8a6a' } as Look,
  tiago: { skin: '#c88a58', hair: '#3a2a1a', robe: '#a89a5a', trim: '#6a5a2a', beard: true, head: 'turban', headColor: '#c8b890' } as Look,
  eli: { ...LOOKS.elder, robe: '#e8e0d0', trim: '#3a5aa0', head: 'turban', headColor: '#f4f0e8' } as Look,
  ana: { ...LOOKS.woman, robe: '#6a8a5a', headColor: '#d8b878' } as Look,
  simeao: { ...LOOKS.villager, robe: '#d8d0c0', hair: '#c8c0b0', beard: true } as Look,
  zebedeu: { ...LOOKS.peter, robe: '#3a7a8a', hair: '#6a6a6a' } as Look,
  debora: { ...LOOKS.woman, robe: '#4a4250', headColor: '#2a2430' } as Look,
  miriam: { ...LOOKS.woman, robe: '#f0e8d8', headColor: '#ffffff', trim: '#d8a020' } as Look,
};

export type Who = keyof typeof LOOK | 'narrator';

export const NAMES: Record<Who, string> = {
  jesus: 'Jesus',
  jose: 'José',
  maria: 'Maria',
  sara: 'Sara',
  raquel: 'Dona Raquel',
  natanael: 'Natanael',
  tiago: 'Tiago, o lavrador',
  eli: 'Rabi Eli',
  ana: 'Ana, da hospedaria',
  simeao: 'Simeão, o moleiro',
  zebedeu: 'Zebedeu',
  debora: 'Débora',
  miriam: 'Miriam',
  narrator: '',
};

export const BG: Partial<Record<Who, string>> = {
  jose: '#c8a070',
  maria: '#8aaad8',
  sara: '#f0b0b8',
  eli: '#d8d0b0',
  debora: '#9a90a8',
  miriam: '#f0e0a0',
  zebedeu: '#7ab0c0',
};

export interface Line {
  who: Who;
  text: string;
  mood?: Mood;
}

export type ItemId = 'horse' | 'stool' | 'chair' | 'table' | 'yoke' | 'door' | 'manger' | 'mill' | 'boat';
export type Res = 'wood' | 'stone' | 'lily';

export const RECIPES: { id: ItemId; name: string; wood: number; stone: number }[] = [
  { id: 'horse', name: 'Cavalinho', wood: 1, stone: 0 },
  { id: 'stool', name: 'Banquinho', wood: 2, stone: 0 },
  { id: 'chair', name: 'Cadeira', wood: 3, stone: 0 },
  { id: 'yoke', name: 'Jugo de bois', wood: 3, stone: 0 },
  { id: 'table', name: 'Mesa', wood: 4, stone: 0 },
  { id: 'door', name: 'Porta', wood: 5, stone: 0 },
  { id: 'manger', name: 'Manjedoura', wood: 3, stone: 2 },
  { id: 'mill', name: 'Mó de moinho', wood: 1, stone: 4 },
  { id: 'boat', name: 'Barquinho', wood: 7, stone: 0 },
];

export const ITEM_NAME: Record<ItemId | Res, string> = {
  ...(Object.fromEntries(RECIPES.map((r) => [r.id, r.name])) as Record<ItemId, string>),
  wood: 'Madeira',
  stone: 'Pedra',
  lily: 'Lírios',
};

export interface Order {
  id: string;
  who: Who;
  item: ItemId | 'lily';
  qty: number;
  coins: number;
  day: number;
  ask: Line[];
  thanks: Line[];
}

export const ORDERS: Order[] = [
  {
    id: 'sara',
    who: 'sara',
    item: 'horse',
    qty: 1,
    coins: 3,
    day: 1,
    ask: [{ who: 'sara', text: 'Tio Jesus, faz um cavalinho de madeira pra mim? Meu irmão tem um e não me empresta!', mood: 'sad' }],
    thanks: [{ who: 'sara', text: 'É o cavalinho mais lindo do mundo! Vou chamar ele de Trovão!', mood: 'happy' }],
  },
  {
    id: 'raquel',
    who: 'raquel',
    item: 'stool',
    qty: 1,
    coins: 5,
    day: 1,
    ask: [{ who: 'raquel', text: 'Preciso de um banquinho pra ordenhar minha cabra. Ela é brava, viu? Tem que ser firme.' }],
    thanks: [{ who: 'raquel', text: 'Que firmeza! Nem a cabra vai conseguir me derrubar agora.', mood: 'happy' }],
  },
  {
    id: 'natanael',
    who: 'natanael',
    item: 'table',
    qty: 1,
    coins: 9,
    day: 2,
    ask: [{ who: 'natanael', text: 'Vou receber a família inteira no sábado. Preciso de uma mesa grande! Cabe todo mundo?' }],
    thanks: [
      { who: 'natanael', text: 'Agora pode vir quem quiser, tem lugar pra todos!', mood: 'happy' },
      { who: 'jesus', text: 'Um dia vou contar uma história sobre um banquete assim.', mood: 'happy' },
    ],
  },
  {
    id: 'tiago',
    who: 'tiago',
    item: 'yoke',
    qty: 1,
    coins: 7,
    day: 2,
    ask: [{ who: 'tiago', text: 'Meu jugo velho machuca o pescoço dos bois. Faz um novo, bem lixadinho?', mood: 'sad' }],
    thanks: [
      { who: 'jesus', text: 'Pronto: um jugo suave, e o fardo fica leve.', mood: 'happy' },
      { who: 'tiago', text: 'Os bois até sorriram! Nunca vi boi sorrir.', mood: 'happy' },
    ],
  },
  {
    id: 'miriam',
    who: 'miriam',
    item: 'lily',
    qty: 3,
    coins: 6,
    day: 2,
    ask: [{ who: 'miriam', text: 'Vou me casar em Caná! Queria três lírios do campo para enfeitar a festa. Sua horta tem?', mood: 'happy' }],
    thanks: [
      { who: 'jesus', text: 'Olha os lírios do campo: nem Salomão, em toda a sua glória, se vestiu como um deles.', mood: 'happy' },
      { who: 'miriam', text: 'Você vai à festa, né? Dizem que o vinho vai ser ótimo!', mood: 'happy' },
    ],
  },
  {
    id: 'eli',
    who: 'eli',
    item: 'chair',
    qty: 1,
    coins: 6,
    day: 3,
    ask: [{ who: 'eli', text: 'Uma cadeira para a sinagoga, para quem lê as Escrituras. Faça com capricho, rapaz.' }],
    thanks: [{ who: 'eli', text: 'Muito bem feita. Tens mãos de artesão... e às vezes falas como um mestre.', mood: 'happy' }],
  },
  {
    id: 'debora',
    who: 'debora',
    item: 'door',
    qty: 1,
    coins: 8,
    day: 3,
    ask: [{ who: 'debora', text: 'O vento leva a minha porta toda noite. Uma viúva precisa de uma porta que fecha!', mood: 'sad' }],
    thanks: [
      { who: 'debora', text: 'Que porta firme! Deus te abençoe, filho.', mood: 'happy' },
      { who: 'jesus', text: 'Batei, e abrir-se-vos-á. Mas agora só se a senhora quiser abrir!', mood: 'happy' },
    ],
  },
  {
    id: 'ana',
    who: 'ana',
    item: 'manger',
    qty: 1,
    coins: 9,
    day: 3,
    ask: [{ who: 'ana', text: 'A estrebaria da hospedaria precisa de uma manjedoura nova. Nunca se sabe quem vai nascer lá, né?' }],
    thanks: [
      { who: 'ana', text: 'Perfeita! Os animais vão comer como reis.', mood: 'happy' },
      { who: 'jesus', text: '...Tenho um carinho especial por manjedouras.', mood: 'happy' },
    ],
  },
  {
    id: 'simeao',
    who: 'simeao',
    item: 'mill',
    qty: 1,
    coins: 10,
    day: 4,
    ask: [{ who: 'simeao', text: 'A pedra do meu moinho rachou! Sem farinha não tem pão, e sem pão a vila fica brava.', mood: 'sad' }],
    thanks: [
      { who: 'simeao', text: 'Agora sim! Pão pra vila toda!', mood: 'happy' },
      { who: 'jesus', text: 'Eu sou o pão da vida... mas o seu também é muito bom.', mood: 'happy' },
    ],
  },
  {
    id: 'zebedeu',
    who: 'zebedeu',
    item: 'boat',
    qty: 1,
    coins: 12,
    day: 4,
    ask: [{ who: 'zebedeu', text: 'Meus filhos Tiago e João querem um barquinho pra aprender a pescar no lago. Dá pra fazer?' }],
    thanks: [
      { who: 'zebedeu', text: 'Eles vão amar! Um dia ainda vão ser grandes pescadores.', mood: 'happy' },
      { who: 'jesus', text: 'Pescadores, sim... de um tipo diferente.', mood: 'happy' },
    ],
  },
];

export const JOSE: string[] = [
  'Filho, a madeira boa está nas árvores ao noroeste. Machado nelas!',
  'Na bancada, bata o martelo quando a marca passar na parte verde. Prego torto, cliente bravo!',
  'Pedra se tira da pedreira, lá no nordeste.',
  'Meça duas vezes e corte uma. Foi meu pai que me ensinou.',
  'Árvore cortada brota de novo depois de uma noite. Deus é generoso.',
  'Com as moedas, compre melhorias na bancada. Machado afiado poupa braço!',
  'Ferramenta cega cansa o braço. A pedra de amolar fica ao lado da lenha.',
];

export const MARIA: string[] = [
  'Filho, não se esqueça de regar a horta. Os lírios gostam de água fresca.',
  'Quando cansar, venha dormir. É só bater na porta de casa.',
  'Seu pai diz que você já trabalha melhor que ele. Mas não conta pra ele que eu disse!',
  'Guardo todas essas coisas no meu coração, sabia?',
];

export const PASSERS = ['Shalom, Jesus!', 'Bom dia, carpinteiro!', 'Shalom!', 'A paz!'];

export const HAMMER_GOOD = ['Bem pregado!', 'Certeiro!', 'Isso!'];
export const HAMMER_BAD = ['Ai, o dedo!', 'Prego torto...', 'Quase!'];

export const UPGRADES: { id: 'axe' | 'pick' | 'can' | 'seeds'; name: string; desc: string; cost: number; icon: IconId; repeat?: boolean }[] = [
  { id: 'axe', name: 'Machado afiado', desc: 'Árvores caem com 2 golpes.', cost: 8, icon: 'axe' },
  { id: 'pick', name: 'Picareta nova', desc: 'Pedras quebram com 2 golpes.', cost: 8, icon: 'pick' },
  { id: 'can', name: 'Regador grande', desc: 'Rega a fileira inteira de uma vez.', cost: 6, icon: 'can' },
  { id: 'seeds', name: 'Saco de sementes', desc: '+3 sementes de lírio.', cost: 2, icon: 'seed', repeat: true },
];

export const FINALE: Line[] = [
  { who: 'jose', text: 'Filho, todas as encomendas da vila entregues! Já és mestre carpinteiro.', mood: 'happy' },
  { who: 'jesus', text: 'Aprendi com o melhor, pai.', mood: 'happy' },
  { who: 'jose', text: 'Mas sinto que um dia vais construir algo bem maior que mesas e portas...' },
  { who: 'jesus', text: 'Uma casa com muitas moradas. Mas isso fica pra depois. Amanhã tem mais madeira!', mood: 'happy' },
];
