/** Story of David (1 and 2 Samuel), told in six playable chapters. */
import type { Mood } from '../pixel/bust';
import type { Look } from '../pixel/person';
import { DLOOKS } from './looks';
import { heroFace } from '../pixel/heroes';

export type DWho = 'davi' | 'rei' | 'samuel' | 'jesse' | 'eliabe' | 'saul' | 'golias' | 'soldado' | 'abisai' | 'servo' | 'narrator' | 'voz';

export const DSPEAK: Record<DWho, { look: Look; name: string; bg: string; img?: string }> = {
  davi: { look: DLOOKS.davi, name: 'Davi', bg: '#8aa898' },
  rei: { look: DLOOKS.rei, name: 'Rei Davi', bg: '#c8a860', img: heroFace('davi') },
  samuel: { look: DLOOKS.samuel, name: 'Samuel', bg: '#8aa898', img: heroFace('anciao') },
  jesse: { look: DLOOKS.jesse, name: 'Jessé', bg: '#a8b890', img: heroFace('judeu') },
  eliabe: { look: DLOOKS.eliabe, name: 'Eliabe', bg: '#c89878' },
  saul: { look: DLOOKS.saul, name: 'Rei Saul', bg: '#8a6a8a' },
  golias: { look: DLOOKS.golias, name: 'Golias', bg: '#a8785a' },
  soldado: { look: DLOOKS.soldado, name: 'Soldado de Israel', bg: '#8a9aa8', img: heroFace('judeu') },
  abisai: { look: { ...DLOOKS.irmao, robe: '#6a5a3a' }, name: 'Abisai', bg: '#8a9a78', img: heroFace('judeu') },
  servo: { look: DLOOKS.jonatas, name: 'Servo do rei', bg: '#8a98b8', img: heroFace('jovem') },
  narrator: { look: DLOOKS.davi, name: '', bg: '#8aa898' },
  voz: { look: DLOOKS.samuel, name: 'A voz do Senhor', bg: '#f0e0a0' },
};

export interface DLine {
  who: DWho;
  text: string;
  mood?: Mood;
}

export type ChapterId = 'pastor' | 'uncao' | 'harpa' | 'golias' | 'caverna' | 'arca';

export interface Chapter {
  id: ChapterId;
  title: string;
  ref: string;
  intro: DLine[];
  mid?: DLine[];
  outro: DLine[];
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'pastor',
    title: 'O pastor de Belém',
    ref: '1 Samuel 17:34-36',
    intro: [
      { who: 'narrator', text: 'Belém. O filho mais novo de Jessé cuida das ovelhas do pai nos campos.' },
      { who: 'davi', text: 'Vamos, ovelhinhas! O Senhor é o meu pastor, nada me faltará...', mood: 'happy' },
      { who: 'davi', text: 'Ouviram isso? Um rugido! Fiquem perto de mim!', mood: 'stern' },
      { who: 'narrator', text: 'Ande com o direcional. Segure A para girar a funda e solte para atirar na fera mais perto. Proteja o rebanho até o pôr do sol!' },
    ],
    outro: [
      { who: 'davi', text: 'O Senhor me livrou da pata do leão e da pata do urso!', mood: 'happy' },
      { who: 'narrator', text: 'E o rebanho voltou para o aprisco, com o pastorzinho cantando salmos.' },
    ],
  },
  {
    id: 'uncao',
    title: 'A unção',
    ref: '1 Samuel 16:1-13',
    intro: [
      { who: 'samuel', text: 'O Senhor me enviou à casa de Jessé. Um dos teus filhos será o rei de Israel.' },
      { who: 'jesse', text: 'Que honra, profeta! Meus filhos, venham todos!', mood: 'happy' },
      { who: 'voz', text: 'Não atentes para a aparência nem para a altura de Eliabe, porque o tenho rejeitado. Eu procuro um coração humilde, que confia em Deus e cuida dos fracos.' },
      { who: 'narrator', text: 'Você é Samuel. Use ◀ ▶ para escolher um filho, OLHAR O CORAÇÃO para ver como ele é por dentro (os olhares são poucos!) e UNGIR só quando tiver certeza. Pense bem: quem falta?' },
    ],
    outro: [
      { who: 'narrator', text: 'Samuel tomou o chifre do azeite e o ungiu no meio dos irmãos. E o Espírito do Senhor se apoderou de Davi.' },
      { who: 'davi', text: 'Eu... rei? Bom, amanhã cedo ainda tenho que cuidar das ovelhas.', mood: 'happy' },
    ],
  },
  {
    id: 'harpa',
    title: 'A harpa para Saul',
    ref: '1 Samuel 16:14-23',
    intro: [
      { who: 'servo', text: 'O rei Saul está atormentado. Dizem que um rapaz de Belém toca harpa como ninguém.' },
      { who: 'saul', text: 'Toque, rapaz... minha cabeça parece uma tempestade.', mood: 'sad' },
      { who: 'narrator', text: 'Toque cada corda quando a nota chegar na linha dourada. Cada nota certa acalma o rei.' },
    ],
    outro: [
      { who: 'saul', text: '...Que paz. Fica comigo, Davi. Serás o meu escudeiro.', mood: 'happy' },
      { who: 'davi', text: 'Louvado seja o Senhor, que acalma a tempestade.', mood: 'happy' },
    ],
  },
  {
    id: 'golias',
    title: 'Davi contra Golias',
    ref: '1 Samuel 17',
    intro: [
      { who: 'golias', text: 'Escolham um homem para lutar comigo! Há quarenta dias eu desafio Israel!', mood: 'stern' },
      { who: 'soldado', text: 'Ninguém tem coragem... olha o tamanho desse gigante!', mood: 'sad' },
      { who: 'davi', text: 'Quem é esse filisteu para afrontar os exércitos do Deus vivo?', mood: 'stern' },
      { who: 'saul', text: 'Tu és só um rapaz. Leva ao menos a minha armadura.' },
      { who: 'davi', text: 'Não estou acostumado com ela. Vou com a minha funda... e com o Senhor.' },
      { who: 'narrator', text: 'Primeiro, escolha cinco pedras lisas no ribeiro. Cuidado: as ásperas não voam reto e as que têm uma rachadura quebram na funda. A correnteza leva as pedras!' },
    ],
    mid: [
      { who: 'golias', text: 'Sou eu algum cão, para vires a mim com paus? Vem, que darei a tua carne às aves!', mood: 'stern' },
      { who: 'davi', text: 'Tu vens com espada e lança; eu vou a ti em nome do Senhor dos Exércitos!', mood: 'stern' },
      { who: 'narrator', text: 'Segure a FUNDA para girar. Solte com a força no verde e a mira na testa. Atenção: o escudo de bronze defende! Espere ele baixar o escudo para zombar de você.' },
    ],
    outro: [
      { who: 'narrator', text: 'A pedra cravou na testa do filisteu, e ele caiu com o rosto em terra.' },
      { who: 'soldado', text: 'GOLIAS CAIU! Viva Davi!', mood: 'happy' },
      { who: 'davi', text: 'A batalha é do Senhor!', mood: 'happy' },
    ],
  },
  {
    id: 'caverna',
    title: 'A caverna de En-Gedi',
    ref: '1 Samuel 24',
    intro: [
      { who: 'narrator', text: 'Saul, com ciúmes, persegue Davi. Davi e seus homens se escondem no fundo de uma caverna.' },
      { who: 'abisai', text: 'Davi! Saul entrou sozinho na caverna! É a tua chance!', mood: 'stern' },
      { who: 'davi', text: 'Fiquem aqui. Vou chegar perto sem fazer barulho.' },
      { who: 'narrator', text: 'Segure AVANÇAR para chegar perto. Quando Saul se mexer, solte e fique parado. Nas pedrinhas soltas cada passo faz barulho: atravesse quando ele estiver distraído e não demore, ele logo vai embora!' },
    ],
    outro: [
      { who: 'davi', text: 'Ó rei, meu senhor! Vê a orla do teu manto na minha mão. Eu podia ter te matado, e não o fiz.' },
      { who: 'saul', text: 'Tu és mais justo do que eu, Davi... Agora sei que certamente serás rei.', mood: 'sad' },
    ],
  },
  {
    id: 'arca',
    title: 'A arca em Jerusalém',
    ref: '2 Samuel 6:12-15',
    intro: [
      { who: 'narrator', text: 'Davi já é rei. A arca do Senhor sobe para Jerusalém com festa e trombetas!' },
      { who: 'rei', text: 'Hoje eu danço diante do Senhor com todas as minhas forças!', mood: 'happy' },
      { who: 'narrator', text: 'Toque as setas no ritmo da festa quando elas chegarem no círculo!' },
    ],
    outro: [
      { who: 'rei', text: 'O pastorzinho de Belém virou rei. Tudo pela graça do Senhor, o meu pastor.', mood: 'happy' },
      { who: 'narrator', text: 'Fim da história de Davi, o homem segundo o coração de Deus.' },
    ],
  },
];

/** Brothers who pass before Samuel (1 Sm 16:6-11). */
/** What the Lord looks for in the king's heart (1 Sm 16:7; 13:14). */
export const HEART = ['humilde', 'confia em Deus', 'cuida dos fracos'];

/** Brothers before Samuel. Each heart has three traits; none has all of HEART except David's. */
export const BROTHERS: { name: string; look: Look; looks: string; heart: string[] }[] = [
  { name: 'Eliabe', look: DLOOKS.eliabe, looks: 'Alto, forte e bonito. Parece um rei!', heart: ['orgulhoso', 'forte', 'se irrita fácil'] },
  { name: 'Abinadabe', look: { ...DLOOKS.irmao, robe: '#7a6a3a' }, looks: 'Tem voz de comandante.', heart: ['confia em Deus', 'ambicioso', 'corajoso'] },
  { name: 'Samá', look: { ...DLOOKS.irmao, robe: '#4a6a8a' }, looks: 'Parece muito sábio.', heart: ['humilde', 'preguiçoso', 'bom de conversa'] },
  { name: 'Natanael', look: { ...DLOOKS.irmao, robe: '#8a4a5a', hair: '#4a2a14' }, looks: 'Que porte de rei!', heart: ['cuida dos fracos', 'vaidoso', 'trabalhador'] },
  { name: 'Radai', look: { ...DLOOKS.irmao, robe: '#5a7a5a', hair: '#2a1a10' }, looks: 'Forte como um touro.', heart: ['confia em Deus', 'cuida dos fracos', 'invejoso'] },
  { name: 'Ozém', look: { ...DLOOKS.irmao, robe: '#9a7a4a', hair: '#5a3016' }, looks: 'O mais esperto da família, dizem.', heart: ['humilde', 'confia em Deus', 'impaciente'] },
  { name: 'Eliú', look: { ...DLOOKS.irmao, robe: '#6a5a7a' }, looks: 'Ninguém o vence no braço.', heart: ['humilde', 'cuida dos fracos', 'medroso'] },
];
export const DAVID_HEART = ['humilde', 'confia em Deus', 'cuida dos fracos'];

export const LORD = 'O Senhor não vê como vê o homem. O homem vê a aparência, mas o Senhor olha o coração.';

export const GOLIAS_TAUNTS = ['Ha! Um menino com pedrinhas!', 'Vem, pastorzinho!', 'Vou te esmagar!', 'Israel mandou uma criança?'];
