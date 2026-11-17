/** Exploration stage (theme, goal and what people say) for every saga chapter. */
import type { ThemeId, TimeOfDay } from './level';
import type { CastId } from './rig';

export interface Explore {
  theme: ThemeId;
  goal: string;
  npc?: string[];
  /** Hero sprite for this chapter (when it differs from the saga's). */
  cast?: CastId;
  time?: TimeOfDay;
  /** Location shown in the cinematic transition. */
  place?: string;
}
type X = Record<string, Explore>;

export const DAVID_X: X = {
  pastor: {
    theme: 'village',
    goal: 'Leve Davi até o pasto',
    npc: ['Davi, as ovelhas já foram para os montes. Cuidado com os buracos no caminho!'],
    time: 'dawn',
    place: 'Campos de Belém',
  },
  uncao: { theme: 'village', goal: 'Volte para casa em Belém', npc: ['Teu pai Jessé te chama! Chegou um profeta à cidade.'], time: 'day', place: 'Belém de Judá' },
  harpa: {
    theme: 'palace',
    goal: 'Chegue à sala do rei Saul',
    npc: ['O rei está atormentado. Dizem que só a harpa do filho de Jessé o acalma. Ache a chave da sala!'],
    time: 'sunset',
    place: 'Palácio de Saul, Gibeá',
  },
  golias: {
    theme: 'desert',
    goal: 'Leve pão aos irmãos no vale de Elá',
    npc: ['Teus irmãos estão na frente da batalha. Ande depressa, o gigante grita todos os dias!'],
    time: 'day',
    place: 'Vale de Elá',
  },
  caverna: {
    theme: 'cave',
    goal: 'Esconda-se no fundo da caverna',
    npc: ['Saul está chegando com três mil homens. Vá para dentro da caverna, sem fazer barulho!'],
    time: 'night',
    place: 'Caverna de En-Gedi',
  },
  arca: {
    theme: 'temple',
    cast: 'daviRei',
    goal: 'Prepare o caminho da arca',
    npc: ['Abra as portas! O rei vai trazer a arca para Jerusalém com música e alegria.'],
    time: 'day',
    place: 'Jerusalém',
  },
};

export const SAMSON_X: X = {
  leao: {
    theme: 'village',
    goal: 'Desça até as vinhas de Timna',
    npc: ['Sansão, os pais vão a Timna. Vá pelas vinhas... dizem que tem um leão por lá.'],
    time: 'day',
    place: 'Vinhas de Timna',
  },
  raposas: {
    theme: 'night',
    goal: 'Chegue aos campos dos filisteus',
    npc: ['As raposas estão no fim do caminho. Ache as tochas e as chaves dos currais.'],
    time: 'night',
    place: 'Campos dos filisteus',
  },
  queixada: { theme: 'desert', goal: 'Chegue a Leí', npc: ['Os filisteus te esperam em Leí. Que o Espírito do Senhor te dê forças!'], time: 'sunset', place: 'Leí' },
  gaza: {
    theme: 'night',
    goal: 'Saia da cidade de Gaza à meia-noite',
    npc: ['Psiu! Eles trancaram os portões e esperam o amanhecer. Ache a saída antes disso.'],
    time: 'night',
    place: 'Gaza, à meia-noite',
  },
  dalila: {
    theme: 'palace',
    goal: 'Atravesse a casa de Dalila',
    npc: ['Os príncipes filisteus deram prata a Dalila. Fique atento, Sansão.'],
    time: 'sunset',
    place: 'Vale de Soreque',
  },
  dagom: {
    theme: 'temple',
    goal: 'Chegue às colunas do templo',
    npc: ['Um menino te guia pela mão. Segure firme e suba até as colunas do meio.'],
    time: 'day',
    place: 'Templo de Dagom',
  },
};

export const PETER_X: X = {
  pesca: {
    theme: 'shore',
    goal: 'Chegue ao barco na beira do lago',
    npc: ['Simão! Uma multidão segue o Mestre de Nazaré pela praia. Ele vai pedir teu barco!'],
    time: 'dawn',
    place: 'Mar da Galileia',
  },
  aguas: {
    theme: 'night',
    goal: 'Desça até o barco no cais',
    npc: ['O Mestre mandou atravessar antes dele. O vento está forte esta noite!'],
    time: 'storm',
    place: 'No meio do mar',
  },
  moeda: { theme: 'village', goal: 'Vá de Cafarnaum até o mar', npc: ['O cobrador do imposto anda perguntando pelo teu mestre...'], time: 'day', place: 'Cafarnaum' },
  negacao: {
    theme: 'palace',
    goal: 'Entre no pátio do sumo sacerdote',
    npc: ['A porta do pátio só abre com a chave do porteiro. Ande com cuidado.'],
    time: 'night',
    place: 'Pátio do sumo sacerdote',
  },
  amas: { theme: 'shore', goal: 'Volte à praia ao amanhecer', npc: ['Tem uma fogueira acesa na praia e alguém assando peixe...'], time: 'dawn', place: 'Praia da Galileia' },
  pentecostes: {
    theme: 'temple',
    goal: 'Desça do cenáculo até a multidão',
    npc: ['Gente de todas as nações está lá fora no templo. Desça e fale com eles!'],
    time: 'day',
    place: 'Jerusalém, Pentecostes',
  },
};

export const NOAH_X: X = {
  arca: { theme: 'village', goal: 'Junte as tábuas de gôfer', npc: ['Noé, a madeira boa está depois do vale. Pegue a chave do depósito!'], time: 'day', place: 'A terra de Noé' },
  animais: {
    theme: 'village',
    goal: 'Abra caminho até a porta da arca',
    npc: ['Os animais estão chegando! Abra as cercas com a alavanca.'],
    time: 'sunset',
    place: 'Diante da arca',
  },
  diluvio: { theme: 'night', goal: 'Suba ao andar mais alto da arca', npc: ['A água está subindo! Leve todos para o terceiro andar.'], time: 'storm', place: 'O dilúvio' },
  pomba: { theme: 'cave', goal: 'Chegue à janela no alto da arca', npc: ['A janela fica lá em cima. Leve a pomba com cuidado.'], time: 'night', place: 'Dentro da arca' },
  arcoiris: {
    theme: 'shore',
    goal: 'Desça os montes de Ararate',
    npc: ['A terra secou! Vamos descer o monte e oferecer um altar ao Senhor.'],
    time: 'dawn',
    place: 'Montes de Ararate',
  },
};

export const LIFE_X: X = {
  batismo: { theme: 'desert', goal: 'Chegue ao rio Jordão', npc: ['João batiza no Jordão. Siga a multidão até o rio.'], time: 'dawn', place: 'Rio Jordão' },
  deserto: {
    theme: 'desert',
    goal: 'Atravesse o deserto da Judeia',
    npc: ['O deserto é seco e perigoso. Lembre: nem só de pão viverá o homem.'],
    time: 'day',
    place: 'Deserto da Judeia',
  },
  cana: { theme: 'village', goal: 'Chegue à festa de casamento', npc: ['Há um casamento em Caná! A família da noiva te espera.'], time: 'sunset', place: 'Caná da Galileia' },
  paralitico: { theme: 'village', goal: 'Chegue à casa em Cafarnaum', npc: ['A casa está cheia! Uns homens trazem um amigo numa maca...'], time: 'day', place: 'Cafarnaum' },
  monte: { theme: 'shore', goal: 'Suba ao monte junto ao mar', npc: ['A multidão quer ouvir o Mestre no monte. Suba até lá!'], time: 'day', place: 'O monte junto ao mar' },
  paes: { theme: 'shore', goal: 'Encontre o menino dos pães', npc: ['Um menino tem cinco pães e dois peixes. Ele está lá adiante.'], time: 'sunset', place: 'Betsaida' },
  tempestade: { theme: 'night', goal: 'Embarque no barco', npc: ['Vamos para o outro lado do mar. A noite está chegando.'], time: 'storm', place: 'Mar da Galileia' },
  cego: {
    theme: 'temple',
    goal: 'Encontre o cego junto ao templo',
    npc: ['Um homem cego de nascença pede esmolas perto do templo.'],
    time: 'day',
    place: 'Jerusalém, junto ao templo',
  },
  lazaro: { theme: 'village', goal: 'Chegue a Betânia', npc: ['Senhor, Lázaro, teu amigo, está doente! Marta e Maria te esperam.'], time: 'day', place: 'Betânia' },
  getsemani: { theme: 'night', goal: 'Suba ao jardim do Getsêmani', npc: ['Vigiai e orai. A noite no monte das Oliveiras é longa.'], time: 'night', place: 'Jardim do Getsêmani' },
  ressurreicao: { theme: 'cave', goal: 'Chegue ao túmulo de madrugada', npc: ['Quem nos removerá a pedra da entrada do túmulo?'], time: 'dawn', place: 'O sepulcro no jardim' },
};

export const JOSEPH_X: X = {
  sonhos: {
    theme: 'village',
    goal: 'Chegue ao campo dos feixes',
    npc: ['José, teus irmãos estão atando feixes no campo. Leve a túnica nova para eles verem!'],
    time: 'day',
    place: 'Hebrom, terra de Canaã',
  },
  traicao: {
    theme: 'desert',
    goal: 'Fuja da cisterna e alcance a caravana',
    npc: ['Psiu, rapaz! A cisterna é funda. Suba pela escada e siga para o leste: lá passa a caravana.'],
    time: 'sunset',
    place: 'Dotã e o deserto',
  },
  potifar: {
    theme: 'egypt',
    goal: 'Encontre o depósito de Potifar',
    npc: ['Bem-vindo à casa de Potifar. A chave do depósito está guardada no alto da casa.'],
    cast: 'joseServo',
    time: 'day',
    place: 'Casa de Potifar, Egito',
  },
  prisao: {
    theme: 'cave',
    goal: 'Atravesse a prisão do rei',
    npc: ['O carcereiro confia em ti, hebreu. Leva a lamparina e visita as celas do fundo.'],
    cast: 'joseServo',
    time: 'night',
    place: 'A prisão do rei',
  },
  farao: {
    theme: 'palace',
    goal: 'Chegue ao salão do Faraó',
    npc: ['Depressa! O Faraó mandou te buscar. Fizeram a barba e trocaram tuas roupas.'],
    cast: 'joseServo',
    time: 'day',
    place: 'Palácio do Faraó',
  },
  governador: {
    theme: 'egypt',
    goal: 'Inspecione os celeiros',
    npc: ['Senhor governador, os celeiros ficam do outro lado do palácio. Use a alavanca dos portões.'],
    cast: 'joseGov',
    time: 'day',
    place: 'Os celeiros do Egito',
  },
  reencontro: {
    theme: 'palace',
    goal: 'Vá ao salão do banquete',
    npc: ['Os homens de Canaã esperam no salão. O mais novo... parece contigo, senhor.'],
    cast: 'joseGov',
    time: 'sunset',
    place: 'O palácio de José',
  },
};
