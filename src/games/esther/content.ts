/**
 * Ester — a rainha corajosa (book of Esther), in ten playable chapters.
 * Lines marked with `ref` quote or closely follow the biblical text; the
 * narrator's lines marked `game` explain the challenge (gameplay, not Bible).
 * Townspeople, maids and guards in the stages are characters of the game.
 */
import type { SChapter } from '../pixel/StoryMode';
import type { Look } from '../pixel/person';
import type { Explore } from '../platform/explore';
import { bindCast } from '../platform/rig';

export const ELOOKS = {
  ester: { skin: '#e2a272', hair: '#24140e', robe: '#5a6ab8', trim: '#e0b030', head: 'long' } as Look,
  rainha: { skin: '#e2a272', hair: '#24140e', robe: '#6a2a7a', cloak: '#8a1e3a', trim: '#f0c030', head: 'long' } as Look,
  mordecai: { skin: '#d8a070', hair: '#5a5250', robe: '#3a5a8a', trim: '#c8a870', beard: true, head: 'turban', headColor: '#e8e0cc' } as Look,
  mordecaiHonra: { skin: '#d8a070', hair: '#5a5250', robe: '#f0ece0', cloak: '#2a4a9a', trim: '#f0c030', beard: true, head: 'crown', headColor: '#f0c030' } as Look,
  assuero: { skin: '#d49a68', hair: '#1a120a', robe: '#7a2a8a', cloak: '#2a3a8a', trim: '#f0c030', beard: true, head: 'crown' } as Look,
  hama: { skin: '#c8885a', hair: '#0e0a08', robe: '#5a1e1e', trim: '#c8a040', beard: true, head: 'turban', headColor: '#8a1e2a' } as Look,
  hegai: { skin: '#b87a4a', hair: '#1a120a', robe: '#e8dcc4', trim: '#3a8a8a', head: 'bald' } as Look,
  hata: { skin: '#a8703e', hair: '#1a120a', robe: '#d8c8a0', trim: '#2a5ab0', head: 'bald' } as Look,
  serva: { skin: '#d8a070', hair: '#2a1a10', robe: '#c8a868', trim: '#8a4a2a', head: 'veil', headColor: '#e8dcc0' } as Look,
  harbona: { skin: '#b07a48', hair: '#1a120a', robe: '#e0d4b8', trim: '#8a2a5a', head: 'bald' } as Look,
  zeres: { skin: '#c8885a', hair: '#1a120a', robe: '#4a1e2a', trim: '#c8a040', head: 'veil', headColor: '#2a1a24' } as Look,
  escriba: { skin: '#c8885a', hair: '#2a1a10', robe: '#e8e0cc', trim: '#3a6ab8', beard: true, head: 'turban', headColor: '#3a6ab8' } as Look,
  guarda: { skin: '#c8885a', hair: '#1a120a', robe: '#2a5a9a', trim: '#e0b030', beard: true, head: 'helmet', headColor: '#e0b030' } as Look,
  povo: { skin: '#d49a68', hair: '#2a1a10', robe: '#c8a060', trim: '#7a5a30', beard: true, head: 'turban', headColor: '#e8dcc0' } as Look,
};

// Official sprites for the main characters.
bindCast(ELOOKS.ester, 'ester');
bindCast(ELOOKS.rainha, 'esterRainha');
bindCast(ELOOKS.mordecai, 'mordecai');
bindCast(ELOOKS.assuero, 'assuero');
bindCast(ELOOKS.hama, 'hama');
bindCast(ELOOKS.hegai, 'hegai');
bindCast(ELOOKS.guarda, 'persa');
bindCast(ELOOKS.serva, 'serva');

export const ESPEAK: Record<string, { look: Look; name: string; bg: string; img?: string }> = {
  ester: { look: ELOOKS.ester, name: 'Ester (Hadassa)', bg: '#8a9ad8' },
  rainha: { look: ELOOKS.rainha, name: 'Rainha Ester', bg: '#b88ad0' },
  mordecai: { look: ELOOKS.mordecai, name: 'Mordecai', bg: '#8aa8c8' },
  mordecaiHonra: { look: ELOOKS.mordecaiHonra, name: 'Mordecai', bg: '#d8c070' },
  assuero: { look: ELOOKS.assuero, name: 'Rei Assuero', bg: '#c8a0d8' },
  hama: { look: ELOOKS.hama, name: 'Hamã', bg: '#c87a6a' },
  hegai: { look: ELOOKS.hegai, name: 'Hegai, guarda das mulheres', bg: '#a8c8b8' },
  hata: { look: ELOOKS.hata, name: 'Hatá, camareiro do rei', bg: '#b8b8a0' },
  serva: { look: ELOOKS.serva, name: 'Uma serva de Ester', bg: '#d8c0a0' },
  harbona: { look: ELOOKS.harbona, name: 'Harbona, camareiro', bg: '#c8b0b8' },
  zeres: { look: ELOOKS.zeres, name: 'Zeres, mulher de Hamã', bg: '#a88090' },
  escriba: { look: ELOOKS.escriba, name: 'Escriba do rei', bg: '#a8b8d0' },
  povo: { look: ELOOKS.povo, name: 'Povo de Susã', bg: '#c8b070' },
  narrator: { look: ELOOKS.mordecai, name: '', bg: '#c8a878' },
};

export const ECHAPTERS: SChapter[] = [
  {
    id: 'jovem',
    title: 'Uma jovem chamada Ester',
    ref: 'Ester 2:5-7',
    intro: [
      { who: 'narrator', text: 'Na cidadela de Susã morava um judeu chamado Mordecai, da tribo de Benjamim.', ref: 'Ester 2:5' },
      { who: 'narrator', text: 'Ele criava Hadassa, que é Ester, filha de seu tio, pois ela não tinha pai nem mãe.', ref: 'Ester 2:7' },
      { who: 'mordecai', text: 'Hadassa, a casa precisa de algumas coisas do mercado. Aqui está a lista.', mood: 'happy' },
      { who: 'ester', text: 'Pode deixar, Mordecai! Eu conheço cada banca de Susã.', mood: 'happy' },
      { who: 'narrator', text: 'Encontre no mercado cada item da lista. Toque nele quando achar.', game: true },
    ],
    mid: [
      { who: 'ester', text: 'Achei tudo! Mas... o vento rasgou o bilhete que Mordecai me deu para o vizinho.', mood: 'sad' },
      { who: 'narrator', text: 'Monte o bilhete: as bordas rasgadas de dois pedaços vizinhos se encaixam. Toque em dois pedaços para trocá-los de lugar.', game: true },
    ],
    outro: [
      { who: 'mordecai', text: 'Muito bem, minha filha. Tu és atenta e sábia.', mood: 'happy' },
      { who: 'narrator', text: 'Naqueles dias, o rei Assuero mandou reunir as moças de todo o reino na cidadela de Susã, para escolher uma nova rainha.', ref: 'Ester 2:2-4' },
      { who: 'mordecai', text: 'Ester, levaram-te ao palácio. Não contes a ninguém qual é o teu povo nem a tua família.', mood: 'stern', ref: 'Ester 2:10' },
    ],
  },
  {
    id: 'palacio',
    title: 'O palácio do rei',
    ref: 'Ester 2:8-14',
    intro: [
      { who: 'narrator', text: 'Ester foi levada à casa do rei, aos cuidados de Hegai, guarda das mulheres.', ref: 'Ester 2:8' },
      { who: 'hegai', text: 'Que moça agradável! Vou te dar o melhor lugar da casa e sete servas para te acompanhar.', mood: 'happy', ref: 'Ester 2:9' },
      { who: 'hegai', text: 'Mas os jardins são um labirinto. Observa bem o caminho que a serva te mostra até o pavilhão.' },
      { who: 'narrator', text: 'Memorize o caminho que acende e depois refaça-o, do portão até o pavilhão.', game: true },
    ],
    mid: [
      { who: 'narrator', text: 'Cada moça passava doze meses de preparação: seis meses com óleo de mirra e seis com perfumes.', ref: 'Ester 2:12' },
      { who: 'hegai', text: 'Ajuda-me a organizar as prateleiras dos preparativos. Cada coisa tem o seu lugar.' },
      { who: 'narrator', text: 'Leia as pistas e coloque cada item na prateleira certa. Toque num item e depois numa prateleira.', game: true },
    ],
    outro: [
      { who: 'narrator', text: 'E Mordecai passeava todos os dias diante do pátio da casa das mulheres, para saber como Ester estava.', ref: 'Ester 2:11' },
      { who: 'ester', text: 'Ele está lá fora de novo... Que Deus me dê sabedoria aqui dentro.' },
    ],
  },
  {
    id: 'escolha',
    title: 'A escolha do rei',
    ref: 'Ester 2:15-23',
    intro: [
      { who: 'narrator', text: 'Chegou a vez de Ester ir ao rei. Ela não pediu coisa alguma além do que Hegai lhe indicou.', ref: 'Ester 2:15' },
      { who: 'hegai', text: 'No salão do rei, os selos acendem na ordem do cerimonial. Repete a ordem sem errar.' },
      { who: 'narrator', text: 'Observe a sequência dos selos e repita tocando neles. A cada rodada, ela cresce.', game: true },
    ],
    mid: [
      { who: 'assuero', text: 'Entre todas as moças, nenhuma alcançou tanta graça diante de mim.', mood: 'happy', ref: 'Ester 2:17' },
      { who: 'narrator', text: 'O rei pôs a coroa real na cabeça de Ester e a fez rainha. E deu um grande banquete: o banquete de Ester.', ref: 'Ester 2:17-18' },
      { who: 'narrator', text: 'Pouco depois, sentado à porta do rei, Mordecai ouviu dois porteiros, Bigtã e Teres, tramando contra o rei.', ref: 'Ester 2:21' },
      { who: 'mordecai', text: 'Não vi os rostos deles... só ouvi as vozes. Preciso descobrir quem são.', mood: 'stern' },
      { who: 'narrator', text: 'Use o que Mordecai ouviu para descobrir os dois porteiros. Toque neles e depois em Denunciar.', game: true },
    ],
    outro: [
      { who: 'rainha', text: 'Ó rei, Mordecai descobriu uma conspiração contra a tua vida.', ref: 'Ester 2:22' },
      { who: 'narrator', text: 'O caso foi investigado e confirmado. E tudo foi escrito no livro das crônicas, diante do rei.', ref: 'Ester 2:23' },
    ],
  },
  {
    id: 'hama',
    title: 'O plano de Hamã',
    ref: 'Ester 3; 4:1-8',
    intro: [
      { who: 'narrator', text: 'O rei engrandeceu Hamã, filho de Hamedata, e todos os servos se inclinavam diante dele. Mas Mordecai não se inclinava.', ref: 'Ester 3:1-2' },
      { who: 'hama', text: 'Esse judeu não se curva diante de mim? Então todo o povo dele vai pagar.', mood: 'stern', ref: 'Ester 3:6' },
      { who: 'narrator', text: 'Lançaram o Pur, que é a sorte, diante de Hamã, para escolher o dia. Caiu no mês de Adar.', ref: 'Ester 3:7' },
      { who: 'narrator', text: 'O decreto foi selado com o anel do rei. Uma cópia chegou às mãos de Mordecai, escrita com uma cifra.', game: true },
      { who: 'narrator', text: 'Gire a roda da cifra até as palavras fazerem sentido. Depois toque em Decifrei.', game: true },
    ],
    mid: [
      { who: 'narrator', text: 'Mordecai rasgou as vestes e se cobriu de pano de saco e cinza. Havia grande luto entre os judeus.', ref: 'Ester 4:1-3' },
      { who: 'hata', text: 'Rainha, chegaram várias cartas para Mordecai. Uma delas pode ser falsa.' },
      { who: 'narrator', text: 'Ligue cada carta ao remetente pelo selo. Marque a carta falsa: o selo dela tem um detalhe errado.', game: true },
    ],
    outro: [
      { who: 'mordecai', text: 'Hatá, leva esta cópia do decreto a Ester. Que ela entre ao rei e peça pelo seu povo.', mood: 'stern', ref: 'Ester 4:8' },
    ],
  },
  {
    id: 'decisao',
    title: 'Uma decisão difícil',
    ref: 'Ester 4:9-17',
    intro: [
      { who: 'hata', text: 'Rainha, Mordecai está à porta da cidade. Eu levo e trago os recados, mas os guardas vigiam o pátio.' },
      { who: 'narrator', text: 'Planeje o caminho de Hatá até a porta. Cada passo dele também move os guardas: não entre na vista deles.', game: true },
    ],
    mid: [
      { who: 'mordecai', text: 'Diz a Ester: não penses que, por estares no palácio, escaparás mais do que os outros judeus.', mood: 'stern', ref: 'Ester 4:13' },
      { who: 'narrator', text: 'Agora responda como Ester. Pense no que a lei dizia e no que ela decidiu.', game: true },
    ],
    outro: [
      { who: 'rainha', text: 'Vai, ajunta todos os judeus de Susã e jejuai por mim. Eu e as minhas servas também jejuaremos.', ref: 'Ester 4:16' },
      { who: 'rainha', text: 'E assim irei ter com o rei, ainda que não seja segundo a lei. Se perecer, pereci.', mood: 'stern', ref: 'Ester 4:16' },
      { who: 'narrator', text: 'Então Mordecai foi e fez tudo quanto Ester lhe ordenou.', ref: 'Ester 4:17' },
    ],
  },
  {
    id: 'jejum',
    title: 'Três dias de jejum',
    ref: 'Ester 4:16-17',
    intro: [
      { who: 'narrator', text: 'Por três dias e três noites, Ester, suas servas e os judeus de Susã jejuaram.', ref: 'Ester 4:16' },
      { who: 'serva', text: 'Senhora, nós cuidaremos de tudo nestes três dias. Diga-nos a ordem das tarefas.' },
      { who: 'narrator', text: 'Distribua as tarefas pelos três dias, respeitando o que precisa vir antes do quê. Dois por dia.', game: true },
    ],
    mid: [
      { who: 'serva', text: 'À noite acendemos as lamparinas para vigiar em oração. Cada fileira segue um padrão.', mood: 'neutral' },
      { who: 'narrator', text: 'Descubra o padrão de cada fileira e escolha a peça que falta.', game: true },
    ],
    outro: [
      { who: 'rainha', text: 'Amanhã é o terceiro dia. Que o Senhor vá adiante de mim.', mood: 'sad' },
      { who: 'serva', text: 'Estaremos aqui, senhora. Coragem.', mood: 'happy' },
    ],
  },
  {
    id: 'trono',
    title: 'Diante do rei',
    ref: 'Ester 5:1-4',
    intro: [
      { who: 'narrator', text: 'Ao terceiro dia, Ester vestiu-se com as vestes reais e se pôs no pátio interior da casa do rei.', ref: 'Ester 5:1' },
      { who: 'narrator', text: 'Segure o botão para Ester avançar e solte para esperar. Não passe quando as lanças dos guardas se cruzam.', game: true },
    ],
    mid: [
      { who: 'narrator', text: 'O rei viu a rainha Ester no pátio, e ela alcançou graça aos seus olhos. Ele estendeu o cetro de ouro, e Ester tocou a ponta do cetro.', ref: 'Ester 5:2' },
      { who: 'assuero', text: 'Que é que tens, rainha Ester? Qual é o teu pedido? Até metade do reino te será dada.', ref: 'Ester 5:3' },
      { who: 'narrator', text: 'O que Ester responde? Ela agiu com sabedoria e paciência.', game: true },
    ],
    outro: [
      { who: 'assuero', text: 'Chamai Hamã depressa, para que se faça o que Ester disse.', mood: 'happy', ref: 'Ester 5:5' },
    ],
  },
  {
    id: 'banquete',
    title: 'Os banquetes',
    ref: 'Ester 5:4-6:14',
    intro: [
      { who: 'rainha', text: 'O banquete precisa estar perfeito. Cada coisa no seu lugar.', mood: 'stern' },
      { who: 'serva', text: 'Estas são as instruções da rainha para a mesa, senhora.' },
      { who: 'narrator', text: 'Arrume a mesa seguindo todas as instruções. Toque num objeto e depois num lugar da mesa.', game: true },
    ],
    mid: [
      { who: 'narrator', text: 'No banquete, Ester pediu que o rei e Hamã voltassem no dia seguinte. Hamã saiu alegre... até ver Mordecai, que não se levantou.', ref: 'Ester 5:8-9' },
      { who: 'zeres', text: 'Faze uma forca de cinquenta côvados e pede ao rei que nela enforquem Mordecai.', ref: 'Ester 5:14' },
      { who: 'narrator', text: 'Naquela noite, o rei não conseguiu dormir e mandou trazer o livro das crônicas.', ref: 'Ester 6:1' },
      { who: 'escriba', text: 'São muitos rolos, ó rei. Por qual começo?' },
      { who: 'narrator', text: 'Use as pistas para achar o registro certo. Cada rolo aberto conta.', game: true },
    ],
    outro: [
      { who: 'assuero', text: 'Que honra se fez a Mordecai por isso?', ref: 'Ester 6:3' },
      { who: 'escriba', text: 'Coisa nenhuma se lhe fez, ó rei.', ref: 'Ester 6:3' },
      { who: 'narrator', text: 'E o próprio Hamã teve de vestir Mordecai com as vestes reais e conduzi-lo a cavalo pela praça da cidade.', ref: 'Ester 6:10-11' },
      { who: 'mordecaiHonra', text: 'Não é a mim que se deve a glória, mas ao Deus que guarda o seu povo.', mood: 'happy' },
    ],
  },
  {
    id: 'verdade',
    title: 'A verdade é revelada',
    ref: 'Ester 7',
    intro: [
      { who: 'assuero', text: 'Qual é a tua petição, rainha Ester? E se te dará.', ref: 'Ester 7:2' },
      { who: 'narrator', text: 'Este é o momento. Monte o pedido de Ester na ordem em que ela falou. Cuidado: algumas frases não são dela.', game: true },
    ],
    mid: [
      { who: 'rainha', text: 'O adversário e inimigo é este mau Hamã!', mood: 'stern', ref: 'Ester 7:6' },
      { who: 'hama', text: '...!', mood: 'facepalm' },
      { who: 'narrator', text: 'O rei se levantou furioso e foi ao jardim do palácio.', ref: 'Ester 7:7' },
      { who: 'harbona', text: 'Eis que a forca de cinquenta côvados, que Hamã fez para Mordecai, está na casa de Hamã.', ref: 'Ester 7:9' },
      { who: 'narrator', text: 'Ligue cada pessoa ao que ela fez nesta história.', game: true },
    ],
    outro: [
      { who: 'narrator', text: 'Hamã sofreu o castigo que planejou para Mordecai, e o furor do rei se aplacou.', ref: 'Ester 7:10' },
      { who: 'narrator', text: 'O rei deu a Ester a casa de Hamã, e deu a Mordecai o seu anel. Ester contou ao rei o que Mordecai era para ela.', ref: 'Ester 8:1-2' },
    ],
  },
  {
    id: 'salvacao',
    title: 'A salvação do povo',
    ref: 'Ester 8-10',
    intro: [
      { who: 'rainha', text: 'Ó rei, como poderei ver o mal que virá sobre o meu povo?', mood: 'sad', ref: 'Ester 8:6' },
      { who: 'assuero', text: 'Escrevei, em nome do rei, como bem vos parecer, e selai com o anel do rei.', ref: 'Ester 8:8' },
      { who: 'narrator', text: 'O novo decreto permitia aos judeus se reunirem para defender a vida. Foi enviado às 127 províncias, da Índia à Etiópia.', ref: 'Ester 8:9-11' },
      { who: 'narrator', text: 'Trace a rota de cada mensageiro: toque nas cidades vizinhas em sequência. Todas precisam ser alcançadas antes do prazo.', game: true },
    ],
    mid: [
      { who: 'narrator', text: 'Mordecai saiu de diante do rei com vestes reais azuis e brancas, e a cidade de Susã exultou.', ref: 'Ester 8:15' },
      { who: 'narrator', text: 'Os dias de luto viraram dias de festa: os dias de Purim, com presentes uns aos outros e dádivas aos pobres.', ref: 'Ester 9:22' },
      { who: 'narrator', text: 'Encontre as diferenças entre as duas cenas da festa.', game: true },
    ],
    outro: [
      { who: 'mordecaiHonra', text: 'Mordecai foi o segundo depois do rei, procurando o bem do seu povo e falando de paz.', mood: 'happy', ref: 'Ester 10:3' },
      { who: 'rainha', text: 'Eu tive medo. Mas Deus estava conduzindo cada passo, mesmo quando o nome Dele não era dito.', mood: 'happy' },
      { who: 'narrator', text: 'Coragem, fé, sabedoria e responsabilidade: Ester chegou ao reino para um tempo como aquele. Fim da história de Ester.' },
    ],
  },
];

/** Side-view exploration stage before each chapter's challenge. */
export const ESTHER_X: Record<string, Explore> = {
  jovem: {
    theme: 'persia',
    goal: 'Atravesse Susã até o mercado',
    npc: ['Bom dia, Hadassa! O mercado fica do outro lado da cidadela. Cuidado com os guardas da ronda: esconda-se nos arbustos.'],
    cast: 'ester',
    time: 'dawn',
    place: 'Susã, a cidadela',
  },
  palacio: {
    theme: 'garden',
    goal: 'Chegue à casa das mulheres',
    npc: ['Moça, a casa das mulheres fica depois dos jardins. A porta selada abre com os símbolos da tábua de barro.'],
    cast: 'ester',
    time: 'day',
    place: 'Os jardins do palácio',
  },
  escolha: {
    theme: 'susa',
    goal: 'Vá até o salão do rei',
    npc: ['É a tua vez, Ester. O salão do rei fica no fim dos corredores. Ande com calma.'],
    cast: 'ester',
    time: 'sunset',
    place: 'O palácio real de Susã',
  },
  hama: {
    theme: 'persia',
    goal: 'Encontre Mordecai na porta do rei',
    npc: ['Rainha! Todos se curvam quando Hamã passa... menos Mordecai. Ele está na porta do rei.'],
    cast: 'esterRainha',
    time: 'day',
    place: 'A porta do rei',
  },
  decisao: {
    theme: 'garden',
    goal: 'Encontre Hatá no pátio',
    npc: ['Hatá espera no fim do pátio com o recado de Mordecai.'],
    cast: 'esterRainha',
    time: 'sunset',
    place: 'O pátio do palácio',
  },
  jejum: {
    theme: 'susa',
    goal: 'Reúna as servas nos aposentos',
    npc: ['Senhora, as outras servas estão espalhadas pelos corredores. Nós vamos jejuar contigo.'],
    cast: 'esterRainha',
    time: 'night',
    place: 'Os aposentos da rainha',
  },
  trono: {
    theme: 'susa',
    goal: 'Chegue ao pátio interior',
    npc: ['Ninguém entra no pátio interior sem ser chamado... que Deus te guarde, rainha.'],
    cast: 'esterRainha',
    time: 'dawn',
    place: 'O pátio interior',
  },
  banquete: {
    theme: 'garden',
    goal: 'Leve o vinho à casa do banquete',
    npc: ['O vinho do banquete está pronto. A casa do banquete fica junto ao jardim do rei.'],
    cast: 'esterRainha',
    time: 'sunset',
    place: 'A casa do banquete',
  },
  verdade: {
    theme: 'susa',
    goal: 'Vá ao segundo banquete',
    npc: ['O rei e Hamã já estão à mesa. Hoje é o dia, senhora.'],
    cast: 'esterRainha',
    time: 'night',
    place: 'O segundo banquete',
  },
  salvacao: {
    theme: 'persia',
    goal: 'Leve o decreto aos mensageiros',
    npc: ['Os mensageiros estão prontos nos cavalos do rei! Leve o decreto selado até eles.'],
    cast: 'esterRainha',
    time: 'day',
    place: 'Susã em festa',
  },
};

/** Keepsakes collected in each chapter (Ester's chest). */
export const EITEMS: Record<string, { icon: string; name: string; desc: string }> = {
  jovem: { icon: '📜', name: 'Bilhete de Mordecai', desc: 'O bilhete rasgado que você remontou no mercado.' },
  palacio: { icon: '🫙', name: 'Óleo de mirra', desc: 'Seis meses com óleo de mirra e seis com perfumes (Ester 2:12).' },
  escolha: { icon: '👑', name: 'Coroa real', desc: 'O rei pôs a coroa real na cabeça de Ester (Ester 2:17).' },
  hama: { icon: '🎲', name: 'O Pur', desc: 'A sorte lançada por Hamã. Por isso a festa se chama Purim (Ester 9:26).' },
  decisao: { icon: '✉️', name: 'Recado para Mordecai', desc: '“Se perecer, pereci” (Ester 4:16).' },
  jejum: { icon: '🪔', name: 'Lamparina da vigília', desc: 'Três dias e três noites de jejum.' },
  trono: { icon: '🔱', name: 'Cetro de ouro', desc: 'O rei estendeu o cetro, e Ester tocou a ponta (Ester 5:2).' },
  banquete: { icon: '📖', name: 'Livro das crônicas', desc: 'O registro de que Mordecai salvou o rei (Ester 6:2).' },
  verdade: { icon: '💍', name: 'Anel do rei', desc: 'Entregue a Mordecai (Ester 8:2).' },
  salvacao: { icon: '🎉', name: 'Porções de Purim', desc: 'Presentes uns aos outros e dádivas aos pobres (Ester 9:22).' },
};
