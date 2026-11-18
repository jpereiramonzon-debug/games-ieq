/** Story of Simon Peter, from the nets to Pentecost. */
import type { SChapter } from '../pixel/StoryMode';
import type { Look } from '../pixel/person';
import { heroFace } from '../pixel/heroes';
import { PLOOKS } from './looks';

export const PSPEAK: Record<string, { look: Look; name: string; bg: string; img?: string }> = {
  pedro: { look: PLOOKS.pedro, name: 'Simão Pedro', bg: '#7aa8d8', img: heroFace('pedro') },
  jesus: { look: PLOOKS.jesus, name: 'Jesus', bg: '#e0a458', img: heroFace('jesus') },
  andre: { look: PLOOKS.andre, name: 'André', bg: '#a8b890', img: heroFace('andre') },
  joao: { look: PLOOKS.joao, name: 'João', bg: '#d8a890', img: heroFace('joao') },
  serva: { look: PLOOKS.serva, name: 'Uma serva', bg: '#b8a888' },
  guarda: { look: PLOOKS.guarda, name: 'Guarda', bg: '#a88a7a', img: heroFace('judeu') },
  cobrador: { look: { ...PLOOKS.povo, robe: '#6a5a8a' }, name: 'Cobrador do imposto', bg: '#a898b8', img: heroFace('judeu') },
  povo: { look: PLOOKS.povo, name: 'Povo', bg: '#c8b070', img: heroFace('jovem') },
  narrator: { look: PLOOKS.pedro, name: '', bg: '#8aa8b8' },
};

export const PCHAPTERS: SChapter[] = [
  {
    id: 'pesca',
    title: 'A pesca maravilhosa',
    ref: 'Lucas 5:1-11',
    intro: [
      { who: 'pedro', text: 'Uma noite inteira no lago e nem um peixinho. André, vamos lavar as redes e dormir.', mood: 'sad' },
      { who: 'jesus', text: 'Simão, leva o barco para o fundo e lança as redes para pescar.' },
      { who: 'pedro', text: 'Mestre, trabalhamos a noite toda e nada pegamos... mas, na tua palavra, lançarei as redes.' },
      { who: 'narrator', text: 'Lance a rede quando o cardume estiver dentro do círculo. Depois puxe tocando rápido!' },
    ],
    outro: [
      { who: 'andre', text: 'As redes estão rasgando! Os barcos vão afundar de tanto peixe!', mood: 'happy' },
      { who: 'pedro', text: 'Senhor, afasta-te de mim, que sou um homem pecador!', mood: 'sad' },
      { who: 'jesus', text: 'Não tenhas medo. De agora em diante serás pescador de homens.', mood: 'happy' },
    ],
  },
  {
    id: 'aguas',
    title: 'Andando sobre as águas',
    ref: 'Mateus 14:22-33',
    intro: [
      { who: 'narrator', text: 'Madrugada no mar. O vento é contrário e as ondas batem no barco. Um vulto vem andando sobre a água!' },
      { who: 'joao', text: 'É um fantasma!', mood: 'sad' },
      { who: 'jesus', text: 'Tende bom ânimo! Sou eu. Não tenhais medo.' },
      { who: 'pedro', text: 'Senhor, se és tu, manda-me ir ter contigo por sobre as águas.' },
      { who: 'jesus', text: 'Vem!' },
      { who: 'narrator', text: 'Segure ANDAR para ir até Jesus. Quando a onda chegar, toque OLHAR PARA JESUS para não perder a fé!' },
    ],
    outro: [
      { who: 'jesus', text: 'Homem de pouca fé, por que duvidaste? Mas vê: chegaste até mim.', mood: 'happy' },
      { who: 'narrator', text: 'Quando subiram ao barco, o vento cessou. E os que estavam no barco adoraram, dizendo: “Verdadeiramente és Filho de Deus!”' },
    ],
  },
  {
    id: 'moeda',
    title: 'A moeda na boca do peixe',
    ref: 'Mateus 17:24-27',
    intro: [
      { who: 'cobrador', text: 'Ei, Pedro! O teu mestre não paga o imposto do templo?' },
      { who: 'jesus', text: 'Vai ao mar, lança o anzol, e o primeiro peixe que subir, abre-lhe a boca: acharás uma moeda. Paga por mim e por ti.' },
      { who: 'pedro', text: 'Uma moeda... dentro de um peixe? Bom, já vi coisa mais estranha com o Mestre!', mood: 'happy' },
      { who: 'narrator', text: 'Segure DESCER para baixar o anzol e solte para parar. Fisgue o peixe que brilha!' },
    ],
    outro: [
      { who: 'pedro', text: 'Achei! Um estáter inteiro na boca do peixe! Dá para o Mestre e para mim.', mood: 'happy' },
      { who: 'cobrador', text: '...Vou fingir que isso é normal.' },
    ],
  },
  {
    id: 'negacao',
    title: 'O galo cantou',
    ref: 'Lucas 22:54-62',
    intro: [
      { who: 'narrator', text: 'Jesus foi preso e levado à casa do sumo sacerdote. Pedro seguiu de longe e se sentou junto ao fogo no pátio.' },
      { who: 'pedro', text: 'Eu disse que iria com ele até a morte... Ninguém pode me reconhecer aqui.', mood: 'sad' },
      { who: 'narrator', text: 'Segure esquerda ou direita para fugir da luz das lamparinas. Mas a noite está fria: longe do fogo o CALOR acaba e Pedro começa a tremer, chamando atenção. Escolha bem a hora de sair e voltar!' },
    ],
    outro: [
      { who: 'narrator', text: 'Enquanto ele ainda falava, o galo cantou. O Senhor, voltando-se, olhou para Pedro.' },
      { who: 'pedro', text: '“Antes que o galo cante, tu me negarás três vezes”... Senhor, perdoa-me.', mood: 'sad' },
      { who: 'narrator', text: 'E Pedro saiu e chorou amargamente. Mas a história dele não termina aqui...' },
    ],
  },
  {
    id: 'amas',
    title: 'Tu me amas?',
    ref: 'João 21:1-19',
    intro: [
      { who: 'pedro', text: 'Vou pescar.', mood: 'sad' },
      { who: 'joao', text: 'Nós vamos contigo.' },
      { who: 'jesus', text: 'Filhos, tendes alguma coisa para comer? Lançai a rede à direita do barco.' },
      { who: 'joao', text: 'É o Senhor!', mood: 'happy' },
      { who: 'narrator', text: 'Puxe a rede tocando rápido: são cento e cinquenta e três peixes grandes!' },
    ],
    outro: [
      { who: 'jesus', text: 'Apascenta as minhas ovelhas. E segue-me.', mood: 'happy' },
      { who: 'pedro', text: 'Três vezes eu te neguei, três vezes tu me perguntaste. Senhor, eu te sigo!', mood: 'happy' },
    ],
  },
  {
    id: 'pentecostes',
    title: 'Pentecostes',
    ref: 'Atos 2:1-41',
    intro: [
      { who: 'narrator', text: 'Cinquenta dias depois da Páscoa, um som como de vento veemente encheu a casa, e línguas como de fogo pousaram sobre eles.' },
      { who: 'povo', text: 'Como os ouvimos falar cada um na nossa própria língua? Partos, medos, elamitas, egípcios, romanos...', mood: 'happy' },
      { who: 'pedro', text: 'Homens israelitas, escutai! Deus ressuscitou este Jesus, e todos nós somos testemunhas!' },
      { who: 'narrator', text: 'Toque cada faixa quando a chama chegar na linha: cada povo ouve na sua própria língua!' },
    ],
    outro: [
      { who: 'povo', text: 'O que faremos, irmãos?' },
      { who: 'pedro', text: 'Arrependei-vos, e cada um de vós seja batizado em nome de Jesus Cristo!', mood: 'happy' },
      { who: 'narrator', text: 'Naquele dia, quase três mil pessoas se juntaram a eles. O pescador de peixes virou pescador de homens. Fim da história de Pedro.' },
    ],
  },
];

export const ACCUSE = [
  { who: 'serva', text: 'Este também estava com ele!' },
  { who: 'guarda', text: 'Tu também és um deles!' },
  { who: 'guarda', text: 'Certamente este também estava com ele, pois é galileu! O sotaque não engana.' },
];
export const DENY = ['Mulher, não o conheço.', 'Homem, não sou.', 'Homem, não sei o que dizes.'];

export const LOVE = [
  {
    q: 'Simão, filho de João, tu me amas mais do que estes?',
    a: 'Sim, Senhor, tu sabes que te amo.',
    wrong: ['Mais do que todos estes! Eu jamais te deixaria!', 'Eu... não sei se ainda mereço falar disso.'],
    r: 'Apascenta os meus cordeiros.',
  },
  {
    q: 'Simão, filho de João, tu me amas?',
    a: 'Sim, Senhor, tu sabes que te amo.',
    wrong: ['Claro! Sou o mais fiel dos teus discípulos.', 'Senhor, eu te neguei. Melhor eu voltar a pescar.'],
    r: 'Pastoreia as minhas ovelhas.',
  },
  {
    q: 'Simão, filho de João, tu me amas?',
    a: 'Senhor, tu sabes tudo; tu sabes que eu te amo!',
    wrong: ['Por que perguntas de novo? Eu já disse que sim!', 'Pergunte ao João, ele é que é o discípulo amado.'],
    r: 'Apascenta as minhas ovelhas.',
  },
];
export const LOVE_FIX = [
  'Pedro, já houve uma noite em que disseste que nunca me deixarias... O amor verdadeiro é humilde.',
  'Eu não te perguntei se mereces. Perguntei se me amas.',
  'Não te compares com os outros. Olha para mim e responde com o coração.',
];
