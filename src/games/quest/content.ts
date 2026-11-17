/** Mission texts for "Missões de Jesus" (Portuguese). */
import { LOOKS, type Look } from '../pixel/person';
import { heroFace } from '../pixel/heroes';
import type { Mood } from '../pixel/bust';

export type Who = 'jesus' | 'peter' | 'boy' | 'blind' | 'leper' | 'merchant' | 'crowd' | 'woman' | 'elder' | 'tempter' | 'narrator';

export const SPEAKERS: Record<Who, { look: Look; name: string; bg?: string; img?: string }> = {
  jesus: { look: LOOKS.jesus, name: 'Jesus', img: heroFace('jesus') },
  peter: { look: LOOKS.peter, name: 'Simão Pedro', bg: '#7aa8d8', img: heroFace('pedro') },
  boy: { look: LOOKS.boy, name: 'Menino', bg: '#d8c070' },
  blind: { look: LOOKS.blind, name: 'Bartimeu', bg: '#b8a888' },
  leper: { look: LOOKS.leper, name: 'Leproso', bg: '#a8a090' },
  merchant: { look: LOOKS.merchant, name: 'Cambista', bg: '#b88ac8', img: heroFace('judeu') },
  crowd: { look: LOOKS.villager, name: 'Povo', bg: '#c8b070', img: heroFace('jovem') },
  woman: { look: LOOKS.woman, name: 'Marta', bg: '#d89880' },
  elder: { look: LOOKS.elder, name: 'Ancião', bg: '#a8b890', img: heroFace('anciao') },
  tempter: { look: LOOKS.tempter, name: 'Tentador', bg: '#5a4a6a', img: heroFace('tentador') },
  narrator: { look: LOOKS.jesus, name: '' },
};

export interface Line {
  who: Who;
  text: string;
  mood?: Mood;
}

export const QUESTS = [
  { id: 'call', title: 'Pescadores de homens' },
  { id: 'heal', title: 'Cura na aldeia' },
  { id: 'bread', title: 'Pães e peixes' },
  { id: 'sermon', title: 'O Sermão do Monte' },
  { id: 'temple', title: 'Casa de oração' },
  { id: 'desert', title: 'Tentação no deserto' },
] as const;
export type QuestId = (typeof QUESTS)[number]['id'];

export const L = {
  intro: [
    { who: 'jesus', text: 'A paz! Chegamos a Cafarnaum. Há muito a fazer hoje.', mood: 'happy' },
    { who: 'jesus', text: 'Use as setas para andar e o botão A para falar e agir. O diário (no canto) mostra as missões.' },
  ] as Line[],
  peterCall: [
    { who: 'jesus', text: 'Simão, deixa as redes. Vinde após mim, e eu vos farei pescadores de homens.' },
    { who: 'peter', text: 'Mestre, trabalhamos a noite toda e nada pescamos... mas, na tua palavra, eu vou!', mood: 'happy' },
  ] as Line[],
  peterIdle: ['Pra onde vamos agora, Mestre?', 'Eu te seguiria até sobre as águas! ...Bom, quase.', 'O povo está comentando sobre ti na vila toda.'],
  blind: [
    { who: 'blind', text: 'Filho de Davi, tem misericórdia de mim! Quero voltar a ver!', mood: 'sad' },
    { who: 'jesus', text: 'Vai. A tua fé te salvou.' },
  ] as Line[],
  blindHealed: [{ who: 'blind', text: 'Eu vejo! Eu vejo tudo! Não sei nem como agradecer!', mood: 'happy' }] as Line[],
  leper: [
    { who: 'leper', text: 'Senhor, se quiseres, podes purificar-me.', mood: 'sad' },
    { who: 'jesus', text: 'Quero. Fica limpo!' },
  ] as Line[],
  leperHealed: [{ who: 'leper', text: 'Estou limpo! Vou mostrar ao sacerdote e contar pra todo mundo!', mood: 'happy' }] as Line[],
  healDone: [{ who: 'jesus', text: 'Não é o são que precisa de médico, mas o doente. Que bom dia!', mood: 'happy' }] as Line[],
  boy: [
    { who: 'boy', text: 'Mestre! Eu tenho cinco pães de cevada e dois peixinhos. É pouco... mas é seu!', mood: 'happy' },
    { who: 'jesus', text: 'Nas mãos do Pai, o pouco vira muito. Vamos alimentar o povo que está no monte.' },
  ] as Line[],
  boyAfter: ['Olha quanta gente comendo! E foi do meu lanche!', 'Mestre, sobrou pão! Dá pra fazer mais um milagre de sobremesa?'],
  hungry: ['Mestre, estamos com fome... viemos de longe pra te ouvir.', 'Nossos filhos não comem desde cedo.'],
  feed: { who: 'jesus', text: 'Pai, obrigado por este pão. Tomai e comei!' } as Line,
  fed: ['Nunca comi pão tão bom!', 'E ainda sobrou! Glória!', 'Peixe fresquinho! Quem diria!', 'Que milagre! Tem pra todo mundo!', 'Meu estômago agradece... e minha alma também!'],
  breadDone: [{ who: 'peter', text: 'Mestre, recolhemos os pedaços: doze cestos cheios! Nada se perdeu.', mood: 'happy' }] as Line[],
  sermonStart: [{ who: 'jesus', text: 'Sentai-vos. Hoje vou ensinar-vos sobre o Reino.' }] as Line[],
  sermonQs: [
    {
      q: 'Complete o ensino: “Bem-aventurados os mansos, porque...”',
      options: ['herdarão a terra.', 'ficarão ricos.', 'nunca vão sofrer.'],
    },
    {
      q: 'Na parábola do bom samaritano, o samaritano...',
      options: ['cuidou do homem ferido.', 'passou de largo.', 'chamou os soldados.'],
    },
    {
      q: 'Qual é o maior mandamento?',
      options: ['Amar a Deus de todo o coração.', 'Guardar o sábado.', 'Dar o dízimo em dia.'],
    },
    {
      q: 'Na parábola, o semeador viu a semente dar fruto em qual terreno?',
      options: ['Na boa terra.', 'Entre os espinhos.', 'No meio das pedras.'],
    },
    {
      q: 'O que faz o pastor que perde uma ovelha das cem?',
      options: ['Deixa as noventa e nove e vai buscá-la.', 'Compra outra no mercado.', 'Espera ela voltar sozinha.'],
    },
    {
      q: 'Quantas vezes devemos perdoar o irmão?',
      options: ['Setenta vezes sete.', 'Sete vezes, e chega.', 'Só se ele pedir duas vezes.'],
    },
    {
      q: 'Complete: “Buscai primeiro o Reino de Deus e a sua justiça, e...”',
      options: ['todas essas coisas vos serão acrescentadas.', 'ficareis famosos na Galileia.', 'nunca mais tereis problemas.'],
    },
    {
      q: 'Quem construiu a casa sobre a rocha?',
      options: ['Quem ouve e pratica as palavras de Jesus.', 'Quem tem mais dinheiro.', 'Quem constrói mais rápido.'],
    },
  ],
  crowdYes: ['Amém!', 'Que palavra!', 'Glória a Deus!'],
  crowdNo: ['Hã? Acho que não é bem isso, Mestre...', 'Pode repetir? O povo ficou confuso.', 'Tem certeza, Mestre? Tenta de novo.'],
  sermonDone: [{ who: 'jesus', text: 'Quem ouve estas palavras e as pratica é como quem constrói a casa sobre a rocha.', mood: 'happy' }] as Line[],
  merchant: ['Câmbio honesto! Quase honesto!', 'Pombas pela metade do preço! A outra metade fica comigo.', 'Moeda do templo aqui, irmão! Taxa pequena... grandinha.'],
  templeFirst: [{ who: 'jesus', text: 'Está escrito: a minha casa será chamada casa de oração. Vós a fizestes covil de ladrões!', mood: 'stern' }] as Line[],
  flipped: ['Minhas moedas!', 'Corre que ele tá bravo!', 'Minhas pombas fugiram!', 'Tá bom, tá bom, já vou!'],
  templeDone: [{ who: 'jesus', text: 'Agora sim: casa de oração para todos os povos.', mood: 'happy' }] as Line[],
  tempterIntro: [
    { who: 'tempter', text: 'Quarenta dias sem comer no deserto... estás com fome, não estás?', mood: 'stern' },
    { who: 'jesus', text: 'Não com fome de pão. Vem, que eu te respondo com a Palavra.', mood: 'stern' },
  ] as Line[],
  well: ['Quem beber desta água tornará a ter sede; mas quem beber da água que eu der nunca terá sede.'],
  woman: ['Dizem que o Mestre chegou à vila! Vou preparar comida pra todo mundo!', 'Maria fica sentada ouvindo e eu aqui na cozinha...'],
  elder: ['No meu tempo, o templo era casa de oração. Hoje parece feira.', 'Vai até o monte, Mestre. O povo te espera lá.'],
  allDone: [
    { who: 'jesus', text: 'Todas as missões cumpridas! O Reino de Deus está próximo, e hoje você ajudou a anunciá-lo.', mood: 'happy' },
    { who: 'peter', text: 'Que dia, Mestre! Amanhã tem mais?', mood: 'happy' },
  ] as Line[],
};

/** Battle in the desert (Mt 4:1-11). The first option is the right answer. */
export const TEMPTATIONS = [
  {
    text: 'Se és Filho de Deus, manda que estas pedras se transformem em pães.',
    verses: ['Nem só de pão viverá o homem, mas de toda palavra que sai da boca de Deus.', 'Pedi, e dar-se-vos-á.', 'Bem-aventurados os que têm fome.', 'Eu sou o pão da vida.'],
  },
  {
    text: 'Atira-te do alto do templo. Está escrito que os anjos te guardarão.',
    verses: ['Não tentarás o Senhor teu Deus.', 'Eu sou a luz do mundo.', 'Vinde a mim, os cansados.', 'Aos seus anjos dará ordens a teu respeito.'],
  },
  {
    text: 'Tudo isto te darei, todos os reinos do mundo, se prostrado me adorares.',
    verses: ['Ao Senhor teu Deus adorarás, e só a ele servirás.', 'Amai os vossos inimigos.', 'Dai a César o que é de César.', 'Meu reino não é deste mundo.'],
  },
];

export const BATTLE_WIN: Line[] = [
  { who: 'jesus', text: 'Retira-te, Satanás!', mood: 'stern' },
  { who: 'tempter', text: '...Isto não acabou. Voltarei em tempo oportuno.', mood: 'sad' },
  { who: 'narrator', text: 'Então o diabo o deixou, e anjos vieram e o serviram.' },
];
