/** Joseph of Egypt (Genesis 37-45), in seven playable chapters. */
import type { SChapter } from '../pixel/StoryMode';
import { heroFace } from '../pixel/heroes';
import type { Look } from '../pixel/person';
import { bindCast } from '../platform/rig';

export const XLOOKS = {
  jose: { skin: '#d49a68', hair: '#3a2214', robe: '#c8402a', cloak: '#2a6ab8', trim: '#f0c040', sash: true, head: 'hair' } as Look,
  joseServo: { skin: '#b87a4a', hair: '#1a120a', robe: '#e8e0cc', trim: '#7a4a24', sash: true, beard: true, head: 'hair' } as Look,
  joseEgito: { skin: '#b87a4a', hair: '#1a120a', robe: '#f4f0e4', cloak: '#2a5aa8', trim: '#e8b830', head: 'bald' } as Look,
  servo: { skin: '#d49a68', hair: '#2a1a10', robe: '#e8e0c8', trim: '#8a6a3a', head: 'hair' } as Look,
  jaco: { skin: '#d49a6a', hair: '#e8e4dc', robe: '#5a4a6a', trim: '#c8b088', beard: true, head: 'veil', headColor: '#c8b8a0' } as Look,
  ruben: { skin: '#c88a58', hair: '#3a2414', robe: '#6a5a3a', trim: '#a88a5a', beard: true, head: 'hair' } as Look,
  juda: { skin: '#c08050', hair: '#2a1a10', robe: '#8a3a2a', trim: '#d8b070', beard: true, head: 'curly' } as Look,
  simeao: { skin: '#b87a4a', hair: '#1a120a', robe: '#4a5a3a', trim: '#a88a5a', beard: true, head: 'hair' } as Look,
  benjamim: { skin: '#dca070', hair: '#5a3a1e', robe: '#5a8ab8', trim: '#e8d8a8', head: 'hair' } as Look,
  potifar: { skin: '#a8703e', hair: '#1a120a', robe: '#f0ead8', cloak: '#8a2a2a', trim: '#e8b830', head: 'helmet', headColor: '#c8a040' } as Look,
  esposa: { skin: '#b07a48', hair: '#1a120a', robe: '#e8dcc8', trim: '#3a8a8a', head: 'braids' } as Look,
  copeiro: { skin: '#a8703e', hair: '#1a120a', robe: '#d8d0b8', trim: '#3a6ab8', head: 'bald' } as Look,
  padeiro: { skin: '#a8703e', hair: '#1a120a', robe: '#c8b890', trim: '#a85a2a', head: 'bald' } as Look,
  farao: { skin: '#a8703e', hair: '#1a120a', robe: '#f4eee0', cloak: '#2a4a9a', trim: '#e8b830', head: 'crown', headColor: '#e8b830' } as Look,
  mercador: { skin: '#b07a48', hair: '#1a120a', robe: '#a86a3a', trim: '#e8d8a8', beard: true, head: 'turban', headColor: '#e8e0c8' } as Look,
  egipcio: { skin: '#a8703e', hair: '#1a120a', robe: '#e8e0c8', trim: '#3a8a6a', head: 'bald' } as Look,
};

export const XSPEAK: Record<string, { look: Look; name: string; bg: string; img?: string }> = {
  jose: { look: XLOOKS.jose, name: 'José', bg: '#e0b070', img: heroFace('jose') },
  joseServo: { look: XLOOKS.joseServo, name: 'José', bg: '#d8c090', img: heroFace('jose-servo') },
  joseEgito: { look: XLOOKS.joseEgito, name: 'José, governador do Egito', bg: '#d8c070', img: heroFace('jose-gov') },
  jaco: { look: XLOOKS.jaco, name: 'Jacó (Israel)', bg: '#b8a888', img: heroFace('anciao') },
  ruben: { look: XLOOKS.ruben, name: 'Rúben', bg: '#a8b890', img: heroFace('judeu') },
  juda: { look: XLOOKS.juda, name: 'Judá', bg: '#c8a080' },
  simeao: { look: XLOOKS.simeao, name: 'Simeão', bg: '#a8a080' },
  irmaos: { look: XLOOKS.simeao, name: 'Os irmãos', bg: '#a8a080', img: heroFace('judeu') },
  benjamim: { look: XLOOKS.benjamim, name: 'Benjamim', bg: '#8aa8c8', img: heroFace('jovem') },
  mercador: { look: XLOOKS.mercador, name: 'Mercador ismaelita', bg: '#d8b070' },
  potifar: { look: XLOOKS.potifar, name: 'Potifar', bg: '#c89a6a' },
  esposa: { look: XLOOKS.esposa, name: 'A esposa de Potifar', bg: '#c8a8a0' },
  copeiro: { look: XLOOKS.copeiro, name: 'O copeiro', bg: '#a8b8c8' },
  padeiro: { look: XLOOKS.padeiro, name: 'O padeiro', bg: '#c8b090' },
  farao: { look: XLOOKS.farao, name: 'Faraó', bg: '#e0c070' },
  egipcio: { look: XLOOKS.egipcio, name: 'Mordomo', bg: '#c8b890' },
  povo: { look: XLOOKS.mercador, name: 'Povo de Canaã', bg: '#c8b070', img: heroFace('jovem') },
  narrator: { look: XLOOKS.jose, name: '', bg: '#c8a878' },
};

export const XCHAPTERS: SChapter[] = [
  {
    id: 'sonhos',
    title: 'Os sonhos de José',
    ref: 'Gênesis 37:1-11',
    intro: [
      { who: 'narrator', text: 'Jacó amava José mais do que a todos os outros filhos, e lhe fez uma túnica de muitas cores.' },
      { who: 'jose', text: 'Irmãos, ouçam o sonho que eu tive! Estávamos atando feixes no campo... e os feixes de vocês se inclinavam diante do meu!', mood: 'happy' },
      { who: 'simeao', text: 'Ah, é? Você vai reinar sobre nós, é isso?', mood: 'stern' },
      { who: 'narrator', text: 'Toque num feixe para incliná-lo ou levantá-lo. Atenção: os vizinhos também mudam! Deixe todos inclinados diante do feixe de José.' },
    ],
    mid: [
      { who: 'jose', text: 'Tive outro sonho: o sol, a lua e onze estrelas se inclinavam diante de mim!' },
      { who: 'jaco', text: 'Que sonho é esse, filho? Eu, tua mãe e teus irmãos nos curvaremos diante de ti?', mood: 'stern' },
      { who: 'narrator', text: 'Agora no céu: faça o sol, a lua e as estrelas se inclinarem do mesmo jeito.' },
    ],
    outro: [
      { who: 'narrator', text: 'Os irmãos tinham inveja de José, mas o pai guardava essas palavras no coração.' },
      { who: 'jaco', text: 'José, vá a Siquém ver se está tudo bem com teus irmãos e com o rebanho.' },
      { who: 'jose', text: 'Eis-me aqui, pai.', mood: 'happy' },
    ],
  },
  {
    id: 'traicao',
    title: 'A traição dos irmãos',
    ref: 'Gênesis 37:12-36',
    intro: [
      { who: 'simeao', text: 'Lá vem o sonhador! Vamos matá-lo e jogá-lo numa cisterna.', mood: 'stern' },
      { who: 'ruben', text: 'Não! Não derramem sangue. Joguem-no nesta cisterna vazia.', mood: 'sad' },
      { who: 'juda', text: 'Que proveito haverá em matar nosso irmão? Vamos vendê-lo aos ismaelitas.' },
      { who: 'mercador', text: 'Vinte moedas de prata pelo rapaz. Seguimos para o Egito!' },
      { who: 'narrator', text: 'A caravana atravessa o deserto. Planeje o caminho: cada passo gasta água, os oásis enchem os odres. Chegue ao Egito sem a água acabar!' },
    ],
    outro: [
      { who: 'narrator', text: 'Os irmãos mancharam a túnica com sangue de um cabrito e a levaram a Jacó.' },
      { who: 'jaco', text: 'É a túnica do meu filho! Uma fera o devorou...', mood: 'sad' },
      { who: 'narrator', text: 'Mas José estava vivo. No Egito, foi vendido a Potifar, oficial do Faraó. E o Senhor estava com José.' },
    ],
  },
  {
    id: 'potifar',
    title: 'Na casa de Potifar',
    ref: 'Gênesis 39:1-20',
    intro: [
      { who: 'potifar', text: 'Rapaz hebreu, dizem que tudo o que tocas prospera. Põe em ordem o meu depósito.' },
      { who: 'narrator', text: 'Organize o depósito: em cada linha e em cada coluna deve haver um de cada produto. Toque num espaço vazio para trocar o produto.' },
    ],
    mid: [
      { who: 'potifar', text: 'Nunca vi minha casa tão próspera! Tudo o que tenho fica nas tuas mãos.', mood: 'happy' },
      { who: 'narrator', text: 'Mas a esposa de Potifar pôs os olhos em José, dia após dia.' },
      { who: 'esposa', text: 'José... ninguém da casa está aqui. Fica comigo.' },
      { who: 'narrator', text: 'O que José deve fazer? Escolha com sabedoria.' },
    ],
    outro: [
      { who: 'joseServo', text: 'Como faria eu tamanha maldade e pecaria contra Deus?' },
      { who: 'narrator', text: 'Ela mentiu e José foi lançado na prisão do rei. Mas, mesmo ali, o Senhor estava com ele.' },
    ],
  },
  {
    id: 'prisao',
    title: 'A prisão',
    ref: 'Gênesis 39:21-40:23',
    intro: [
      { who: 'narrator', text: 'O carcereiro confiou tudo a José. Um dia, chegaram dois oficiais do Faraó: o copeiro e o padeiro.' },
      { who: 'copeiro', text: 'Tivemos sonhos esta noite e não há quem os interprete.', mood: 'sad' },
      { who: 'joseServo', text: 'Não pertencem a Deus as interpretações? Contem-me os sonhos.' },
      { who: 'narrator', text: 'Primeiro, encontre as pistas escondidas na cela: vire as pedras soltas e use os números para deduzir onde estão.' },
    ],
    mid: [
      { who: 'copeiro', text: 'Eu vi uma videira com três ramos. Ela brotou, deu uvas, e eu as espremi no copo do Faraó.' },
      { who: 'padeiro', text: 'E eu levava três cestos de pão na cabeça, e as aves comiam do cesto de cima.', mood: 'sad' },
      { who: 'narrator', text: 'Ligue cada símbolo do sonho ao seu significado.' },
    ],
    outro: [
      { who: 'narrator', text: 'Três dias depois, aconteceu tudo como José disse: o copeiro voltou a servir o Faraó.' },
      { who: 'joseServo', text: 'Lembra-te de mim quando tudo te correr bem.' },
      { who: 'narrator', text: 'Porém o copeiro esqueceu-se de José... por dois anos inteiros.' },
    ],
  },
  {
    id: 'farao',
    title: 'O sonho do Faraó',
    ref: 'Gênesis 41:1-40',
    intro: [
      { who: 'farao', text: 'Sete vacas gordas saíram do rio, e sete vacas magras as devoraram! E depois sete espigas cheias e sete mirradas...', mood: 'stern' },
      { who: 'copeiro', text: 'Ó Faraó, lembro-me hoje das minhas faltas: há na prisão um jovem hebreu que interpreta sonhos.' },
      { who: 'joseServo', text: 'Isso não está em mim. Deus dará ao Faraó uma resposta de paz.' },
      { who: 'narrator', text: 'Associe cada símbolo do sonho ao que ele significa.' },
    ],
    mid: [
      { who: 'joseServo', text: 'Virão sete anos de grande fartura e depois sete anos de fome. Que se guarde a quinta parte das colheitas nos anos bons.' },
      { who: 'narrator', text: 'Planeje os sete anos de fartura: decida quanto guardar em cada colheita. O povo precisa comer, e o celeiro precisa durar os sete anos de fome!' },
    ],
    outro: [
      { who: 'farao', text: 'Acharíamos um homem como este, em quem há o Espírito de Deus? Tu estarás sobre a minha casa.', mood: 'happy' },
      { who: 'narrator', text: 'José tinha trinta anos quando se apresentou ao Faraó, rei do Egito.' },
    ],
  },
  {
    id: 'governador',
    title: 'Governador do Egito',
    ref: 'Gênesis 41:46-57',
    intro: [
      { who: 'narrator', text: 'Veio a fome sobre toda a terra. E de todas as regiões vinham ao Egito para comprar trigo de José.' },
      { who: 'egipcio', text: 'Senhor governador, caravanas de muitas regiões estão nos portões!' },
      { who: 'joseEgito', text: 'Abram os celeiros. Mas com sabedoria: o trigo tem que dar para todos.' },
      { who: 'narrator', text: 'Escolha de qual celeiro sai cada pedido. Os pedidos da fila estão à mostra: planeje para que nenhum celeiro fique curto!' },
    ],
    outro: [
      { who: 'egipcio', text: 'Todos foram atendidos, senhor! O Egito e as nações têm pão.', mood: 'happy' },
      { who: 'egipcio', text: 'Ah... e chegaram dez homens de Canaã. Dizem ser irmãos.' },
    ],
  },
  {
    id: 'reencontro',
    title: 'O reencontro',
    ref: 'Gênesis 42-45',
    intro: [
      { who: 'irmaos', text: 'Senhor, teus servos são doze irmãos, filhos de um homem em Canaã. O mais novo ficou com o pai, e um já não existe.', mood: 'sad' },
      { who: 'narrator', text: 'Os irmãos não reconheceram José. Ele os pôs à prova e mandou trazer Benjamim.' },
      { who: 'joseEgito', text: 'Ponham os homens à mesa, do mais velho ao mais novo.' },
      { who: 'narrator', text: 'Use as pistas para sentar os irmãos na ordem de nascimento. Toque em dois lugares para trocar.' },
    ],
    mid: [
      { who: 'narrator', text: 'Na volta, o copo de prata de José foi achado no saco de Benjamim!' },
      { who: 'juda', text: 'Fica eu como escravo no lugar do rapaz. Como voltarei ao meu pai sem ele?', mood: 'sad' },
      { who: 'narrator', text: 'José já não conseguia se conter. O que ele diz?' },
    ],
    outro: [
      { who: 'joseEgito', text: 'Eu sou José, vosso irmão! Não vos entristeçais: Deus me enviou adiante de vós para conservar a vida.', mood: 'happy' },
      { who: 'benjamim', text: 'José!', mood: 'happy' },
      { who: 'jaco', text: 'Basta! José, meu filho, ainda vive. Irei e o verei antes de morrer.', mood: 'happy' },
      { who: 'joseEgito', text: 'Vós intentastes o mal contra mim, porém Deus o tornou em bem.', mood: 'happy' },
      { who: 'narrator', text: 'E a família de Israel se reuniu no Egito. Fim da história de José.' },
    ],
  },
];

// Official sprites (platform/rig) for the main characters.
bindCast(XLOOKS.jose, 'jose');
bindCast(XLOOKS.joseServo, 'joseServo');
bindCast(XLOOKS.joseEgito, 'joseGov');
