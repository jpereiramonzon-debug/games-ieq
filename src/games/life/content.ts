/**
 * "Jesus: o caminho" — the life and ministry of Jesus as a story campaign,
 * from the Jordan to the empty tomb. Lines follow the Gospels closely.
 */
import { heroFace } from '../pixel/heroes';
import { LOOKS, type Look } from '../pixel/person';
import type { SChapter } from '../pixel/StoryMode';

export const JLOOKS = {
  jesus: LOOKS.jesus,
  batista: { skin: '#c8885a', hair: '#3a2414', robe: '#8a6a3a', trim: '#5a3a1a', beard: true, head: 'long' } as Look,
  tentador: LOOKS.tempter,
  maria: { skin: '#e2a874', hair: '#2a1a10', robe: '#4a6a9a', trim: '#e8d8b0', head: 'veil', headColor: '#8aaad8' } as Look,
  mestre: { skin: '#d49660', hair: '#5a4a3a', robe: '#7a3a6a', trim: '#e8b830', beard: true, head: 'turban', headColor: '#e8d8a8' } as Look,
  servo: { skin: '#c88a58', hair: '#2a1a10', robe: '#a8946a', trim: '#5a4a2a', head: 'hair' } as Look,
  paralitico: { skin: '#d49a6a', hair: '#4a3a2a', robe: '#9a8a6a', trim: '#6a5a3a', beard: true, head: 'hair' } as Look,
  amigo: { skin: '#c8885a', hair: '#2a1a10', robe: '#6a7a4a', trim: '#3a4a2a', beard: true, head: 'hair' } as Look,
  fariseu: { skin: '#d8a070', hair: '#3a2a1a', robe: '#3a4a7a', trim: '#e8c060', beard: true, head: 'turban', headColor: '#f0e8d8' } as Look,
  pedro: LOOKS.peter,
  joao: { skin: '#dca070', hair: '#5a3418', robe: '#4a6a9a', trim: '#e8d0a0', head: 'hair' } as Look,
  andre: { skin: '#c88a5a', hair: '#3a2a1a', robe: '#4a5a3a', trim: '#a88a5a', beard: true, head: 'hair' } as Look,
  menino: { skin: '#e8b07a', hair: '#3a2416', robe: '#9a7a4a', trim: '#5e4428', head: 'hair' } as Look,
  cego: { skin: '#d49a64', hair: '#5a4a3a', robe: '#8a8070', trim: '#5a5040', beard: true, head: 'hair', bandage: 'eyes' } as Look,
  marta: { skin: '#e0a070', hair: '#3a2010', robe: '#a84a3a', trim: '#e8d0a0', head: 'veil', headColor: '#d8c8a0' } as Look,
  lazaro: { skin: '#d8b08a', hair: '#4a3a2a', robe: '#f0ece0', trim: '#d8d0c0', head: 'hood', headColor: '#f0ece0' } as Look,
  madalena: { skin: '#e2a874', hair: '#6a2a14', robe: '#8a2a3a', trim: '#e8c070', head: 'veil', headColor: '#c86a5a' } as Look,
  anjo: { skin: '#f0d0b0', hair: '#f4e8c0', robe: '#ffffff', trim: '#ffd860', head: 'long' } as Look,
  soldado: { skin: '#d8a070', hair: '#2a1a10', robe: '#b83a2a', trim: '#e8c060', head: 'helmet', headColor: '#c8a040' } as Look,
  malco: { skin: '#c88a58', hair: '#2a1a10', robe: '#6a5a4a', trim: '#4a3a2a', beard: true, head: 'hair' } as Look,
};

export const JSPEAK: Record<string, { look: Look; name: string; bg: string; img?: string }> = {
  jesus: { look: JLOOKS.jesus, name: 'Jesus', bg: '#e0a458', img: heroFace('jesus') },
  batista: { look: JLOOKS.batista, name: 'João Batista', bg: '#c8a070' },
  tentador: { look: JLOOKS.tentador, name: 'Tentador', bg: '#5a4a6a', img: heroFace('tentador') },
  maria: { look: JLOOKS.maria, name: 'Maria', bg: '#8aaad8', img: heroFace('maria') },
  mestre: { look: JLOOKS.mestre, name: 'Mestre-sala', bg: '#b88ac8', img: heroFace('anciao') },
  servo: { look: JLOOKS.servo, name: 'Servo', bg: '#c8b070', img: heroFace('jovem') },
  paralitico: { look: JLOOKS.paralitico, name: 'Paralítico', bg: '#b8a888', img: heroFace('judeu') },
  amigo: { look: JLOOKS.amigo, name: 'Amigos', bg: '#a8b890', img: heroFace('jovem') },
  fariseu: { look: JLOOKS.fariseu, name: 'Fariseu', bg: '#8a9ab8', img: heroFace('judeu') },
  pedro: { look: JLOOKS.pedro, name: 'Pedro', bg: '#7aa8d8', img: heroFace('pedro') },
  joao: { look: JLOOKS.joao, name: 'João', bg: '#d8a890', img: heroFace('joao') },
  andre: { look: JLOOKS.andre, name: 'André', bg: '#a8b890', img: heroFace('andre') },
  menino: { look: JLOOKS.menino, name: 'Menino', bg: '#d8c070' },
  cego: { look: JLOOKS.cego, name: 'O cego', bg: '#b8a888' },
  marta: { look: JLOOKS.marta, name: 'Marta', bg: '#d89880' },
  lazaro: { look: JLOOKS.lazaro, name: 'Lázaro', bg: '#d8d0c0' },
  madalena: { look: JLOOKS.madalena, name: 'Maria Madalena', bg: '#c88a7a' },
  anjo: { look: JLOOKS.anjo, name: 'Anjo', bg: '#f0e0a0' },
  malco: { look: JLOOKS.malco, name: 'Malco', bg: '#a89a88', img: heroFace('judeu') },
  voz: { look: JLOOKS.jesus, name: 'Voz do céu', bg: '#f0e0a0' },
  narrator: { look: JLOOKS.jesus, name: '', bg: '#a8b890' },
};

export const JCHAPTERS: SChapter[] = [
  {
    id: 'batismo',
    title: 'O batismo no Jordão',
    ref: 'Mateus 3:13-17',
    intro: [
      { who: 'narrator', text: 'Às margens do Jordão, uma multidão desce às águas para ser batizada por João.' },
      { who: 'batista', text: 'Arrependei-vos, porque é chegado o Reino dos céus! Preparai o caminho do Senhor!' },
      { who: 'narrator', text: 'Leve Jesus até João, no meio do rio. O povo anda de um lado para o outro: esbarrar faz você voltar um pouco. Encontre as brechas!' },
    ],
    outro: [
      { who: 'batista', text: 'Eu é que preciso ser batizado por ti, e tu vens a mim?' },
      { who: 'jesus', text: 'Deixa por agora, porque assim nos convém cumprir toda a justiça.' },
      { who: 'voz', text: 'Este é o meu Filho amado, em quem me comprazo.' },
    ],
  },
  {
    id: 'deserto',
    title: 'Quarenta dias no deserto',
    ref: 'Mateus 4:1-11',
    intro: [
      { who: 'narrator', text: 'Jesus foi levado pelo Espírito ao deserto. Quarenta dias de jejum, sol de dia e frio de noite.' },
      { who: 'narrator', text: 'Primeiro, resista: busque sombra de dia e o abrigo das pedras à noite, e ore para manter o espírito firme.' },
    ],
    mid: [
      { who: 'tentador', text: 'Estás fraco... Se és Filho de Deus, ouve o que tenho a oferecer.', mood: 'stern' },
      { who: 'jesus', text: 'Está escrito.' },
      { who: 'narrator', text: 'As tentações voam até Jesus. Toque na Palavra certa para cada uma: PÃO → “Nem só de pão”, ALTURA → “Não tentarás”, GLÓRIA → “Só a Deus adorarás”.' },
    ],
    outro: [
      { who: 'jesus', text: 'Retira-te, Satanás! Ao Senhor teu Deus adorarás, e só a ele servirás.', mood: 'stern' },
      { who: 'narrator', text: 'Então o diabo o deixou, e anjos vieram e o serviram.' },
    ],
  },
  {
    id: 'cana',
    title: 'O vinho de Caná',
    ref: 'João 2:1-11',
    intro: [
      { who: 'maria', text: 'Eles não têm mais vinho.' },
      { who: 'jesus', text: 'Mulher, que tenho eu contigo? Ainda não é chegada a minha hora.' },
      { who: 'maria', text: 'Fazei tudo quanto ele vos disser.', mood: 'happy' },
      { who: 'jesus', text: 'Enchei de água essas talhas.' },
      { who: 'narrator', text: 'Puzzle: só há dois cântaros (de 5 e de 3 medidas) e o poço. Cada talha precisa receber EXATAMENTE a medida marcada. Encha, despeje, passe de um cântaro ao outro... e pense!' },
    ],
    outro: [
      { who: 'mestre', text: 'Todo homem serve primeiro o vinho bom... mas tu guardaste o bom vinho até agora!', mood: 'happy' },
      { who: 'narrator', text: 'Este foi o primeiro dos sinais de Jesus, e os seus discípulos creram nele.' },
    ],
  },
  {
    id: 'paralitico',
    title: 'Pelo telhado',
    ref: 'Marcos 2:1-12',
    intro: [
      { who: 'narrator', text: 'Em Cafarnaum, a casa está tão cheia que ninguém passa nem pela porta.' },
      { who: 'amigo', text: 'Não vamos desistir! Vamos subir no telhado e descer a maca pela abertura!' },
      { who: 'narrator', text: 'Puzzle: deslize as cargas, barris e telhas para abrir caminho. Cada peça só anda na direção em que está deitada. Leve a MACA até a abertura.' },
    ],
    outro: [
      { who: 'jesus', text: 'Filho, os teus pecados estão perdoados.' },
      { who: 'fariseu', text: 'Quem pode perdoar pecados, senão Deus?', mood: 'stern' },
      { who: 'jesus', text: 'Para que saibais que o Filho do Homem tem poder: levanta-te, toma a tua cama e anda!' },
      { who: 'paralitico', text: 'Eu ando! Glória a Deus!', mood: 'happy' },
    ],
  },
  {
    id: 'monte',
    title: 'O Sermão do Monte',
    ref: 'Mateus 5-7; 13',
    intro: [
      { who: 'narrator', text: 'Vendo a multidão, Jesus subiu ao monte, sentou-se e começou a ensinar.' },
      { who: 'narrator', text: 'Primeiro desafio: as Bem-aventuranças se embaralharam! Ligue cada começo ao seu final. Cada erro custa fé.' },
    ],
    mid: [
      { who: 'jesus', text: 'Eis que o semeador saiu a semear...' },
      { who: 'narrator', text: 'Agora, viva a parábola: mova o semeador e solte sementes só na BOA TERRA. Pedras, espinhos e pássaros desperdiçam a semente.' },
    ],
    outro: [
      { who: 'jesus', text: 'O que foi semeado em boa terra é o que ouve a palavra e a compreende, e dá fruto: cem, sessenta, trinta por um.' },
      { who: 'narrator', text: 'E as multidões se maravilhavam da sua doutrina.' },
    ],
  },
  {
    id: 'paes',
    title: 'Cinco pães e dois peixes',
    ref: 'João 6:1-14; Lucas 9:14',
    intro: [
      { who: 'andre', text: 'Está aqui um rapaz que tem cinco pães de cevada e dois peixinhos. Mas que é isto para tantos?' },
      { who: 'jesus', text: 'Mandai assentar o povo em grupos de cinquenta.' },
      { who: 'narrator', text: 'Jesus abençoa os cestos. Toque num discípulo com cesto cheio e depois num grupo com fome. A fome aumenta sem parar: priorize os grupos mais fracos!' },
    ],
    outro: [
      { who: 'jesus', text: 'Recolhei os pedaços que sobraram, para que nada se perca.' },
      { who: 'pedro', text: 'Doze cestos cheios! Cinco mil homens comeram, fora mulheres e crianças!', mood: 'happy' },
    ],
  },
  {
    id: 'tempestade',
    title: 'A tempestade acalmada',
    ref: 'Marcos 4:35-41',
    intro: [
      { who: 'narrator', text: 'Ao entardecer, atravessam o mar. Jesus adormece na popa, sobre um travesseiro. Então vem uma grande tempestade.' },
      { who: 'pedro', text: 'Mestre, não te importa que pereçamos?!', mood: 'sad' },
      { who: 'narrator', text: 'Gire o barco para enfrentar cada onda de frente (a seta mostra de onde ela vem). Onda de lado enche o barco de água!' },
    ],
    outro: [
      { who: 'jesus', text: 'Cala-te, aquieta-te!' },
      { who: 'narrator', text: 'O vento se aquietou e houve grande bonança.' },
      { who: 'joao', text: 'Quem é este, que até o vento e o mar lhe obedecem?' },
    ],
  },
  {
    id: 'cego',
    title: 'O cego de nascença',
    ref: 'João 9:1-11',
    intro: [
      { who: 'jesus', text: 'Enquanto estou no mundo, sou a luz do mundo.' },
      { who: 'narrator', text: 'Jesus cuspiu na terra, fez lodo e o pôs nos olhos do cego.' },
      { who: 'jesus', text: 'Vai, lava-te no tanque de Siloé.' },
      { who: 'narrator', text: 'Puzzle: o cego não vê o caminho. Monte a sequência de passos (↑ ↓ ← →) e toque GUIAR: ele seguirá tudo à risca. Desvie das paredes, das bancas e da água funda.' },
    ],
    outro: [
      { who: 'cego', text: 'Fui, lavei-me e vejo! Uma coisa sei: eu era cego, e agora vejo!', mood: 'happy' },
      { who: 'fariseu', text: 'Nós sabemos que esse homem é pecador...', mood: 'stern' },
      { who: 'cego', text: 'Se ele não fosse de Deus, nada poderia fazer!' },
    ],
  },
  {
    id: 'lazaro',
    title: 'Lázaro, vem para fora!',
    ref: 'João 11:1-44',
    intro: [
      { who: 'marta', text: 'Senhor, se estivesses aqui, meu irmão não teria morrido.', mood: 'sad' },
      { who: 'jesus', text: 'Eu sou a ressurreição e a vida. Quem crê em mim, ainda que morra, viverá. Crês isto?' },
      { who: 'marta', text: 'Sim, Senhor. Creio que tu és o Cristo, o Filho de Deus.' },
      { who: 'jesus', text: 'Tirai a pedra.' },
      { who: 'narrator', text: 'Puzzle: empurre as pedras do jardim até as marcas para abrir o caminho. Cuidado: pedra encostada na parede não sai mais! Use “Desfazer” se errar.' },
    ],
    outro: [
      { who: 'jesus', text: 'Lázaro, vem para fora!' },
      { who: 'lazaro', text: '...Marta? Maria? O que aconteceu?', mood: 'happy' },
      { who: 'jesus', text: 'Desatai-o e deixai-o ir.', mood: 'happy' },
    ],
  },
  {
    id: 'getsemani',
    title: 'Getsêmani',
    ref: 'Mateus 26:36-56; Lucas 22:51',
    intro: [
      { who: 'jesus', text: 'A minha alma está profundamente triste até a morte. Ficai aqui e vigiai comigo.' },
      { who: 'narrator', text: 'Segure ORAR para manter a oração. Os discípulos cochilam: toque neles para acordá-los, mas soltar a oração enfraquece o espírito. Resista até o fim da noite.' },
    ],
    outro: [
      { who: 'jesus', text: 'Pai, se possível, passe de mim este cálice. Todavia, não seja como eu quero, mas como tu queres.' },
      { who: 'narrator', text: 'Judas chegou com uma multidão armada. Pedro puxou a espada e feriu Malco, servo do sumo sacerdote.' },
      { who: 'jesus', text: 'Embainha a tua espada. Todos os que lançam mão da espada à espada morrerão.' },
      { who: 'narrator', text: 'E, tocando a orelha de Malco, o curou.' },
    ],
  },
  {
    id: 'ressurreicao',
    title: 'O túmulo vazio',
    ref: 'Mateus 28; Lucas 24',
    intro: [
      { who: 'narrator', text: 'Jesus foi crucificado, morreu e foi sepultado. No primeiro dia da semana, bem cedo, as mulheres foram ao sepulcro.' },
      { who: 'anjo', text: 'Não temais! Ele não está aqui: ressuscitou, como havia dito!', mood: 'happy' },
      { who: 'anjo', text: 'Ide depressa e dizei aos discípulos!' },
      { who: 'narrator', text: 'Corra com Maria Madalena até os discípulos! Pule as pedras, abaixe sob os toldos e não deixe os guardas te pararem.' },
    ],
    outro: [
      { who: 'madalena', text: 'Eu vi o Senhor! Ele está vivo!', mood: 'happy' },
      { who: 'jesus', text: 'Paz seja convosco. Eis que estou convosco todos os dias, até a consumação dos séculos.', mood: 'happy' },
      { who: 'narrator', text: 'Fim da história. Do Jordão ao túmulo vazio: o caminho de Jesus é o caminho da vida.' },
    ],
  },
];
