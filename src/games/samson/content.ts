/** Story of Samson (Judges 13-16), told in six playable chapters. */
import type { SChapter } from '../pixel/StoryMode';
import type { Look } from '../pixel/person';
import { SLOOKS } from './looks';
import { heroFace } from '../pixel/heroes';

export const SSPEAK: Record<string, { look: Look; name: string; bg: string; img?: string }> = {
  sansao: { look: SLOOKS.sansao, name: 'Sansão', bg: '#c8a070', img: heroFace('sansao') },
  cego: { look: SLOOKS.careca, name: 'Sansão', bg: '#8a8a7a' },
  dalila: { look: SLOOKS.dalila, name: 'Dalila', bg: '#b88ab8' },
  filisteu: { look: SLOOKS.filisteu, name: 'Filisteu', bg: '#c88a6a' },
  chefe: { look: SLOOKS.chefe, name: 'Chefe filisteu', bg: '#a86a5a' },
  judeu: { look: SLOOKS.judeu, name: 'Homem de Judá', bg: '#8a9aa8', img: heroFace('judeu') },
  menino: { look: SLOOKS.menino, name: 'O menino guia', bg: '#a8b890' },
  narrator: { look: SLOOKS.sansao, name: '', bg: '#a8b890' },
};

export const SCHAPTERS: SChapter[] = [
  {
    id: 'leao',
    title: 'O leão de Timna',
    ref: 'Juízes 14:5-9',
    intro: [
      { who: 'narrator', text: 'Sansão, consagrado a Deus desde o ventre da mãe, desce a Timna pelas vinhas.' },
      { who: 'sansao', text: 'Quanta uva! Mas eu sou nazireu: nem uma uvinha pra mim.', mood: 'happy' },
      { who: 'narrator', text: 'De repente, um leão novo sai rugindo do meio das vinhas!' },
      { who: 'sansao', text: 'Senhor, dá-me força!', mood: 'stern' },
      { who: 'narrator', text: 'Quando o leão se agachar com o "!", toque ESQUIVAR. Quando ele cair tonto, toque GOLPE sem parar!' },
    ],
    outro: [
      { who: 'narrator', text: 'O Espírito do Senhor se apossou dele, e ele despedaçou o leão sem nada nas mãos.' },
      { who: 'sansao', text: 'Dias depois voltei ali: um enxame de abelhas e mel dentro do leão! Do forte saiu doçura.', mood: 'happy' },
    ],
  },
  {
    id: 'raposas',
    title: 'As raposas e as tochas',
    ref: 'Juízes 15:1-8',
    intro: [
      { who: 'narrator', text: 'Os filisteus enganaram Sansão e deram a esposa dele a outro homem.' },
      { who: 'sansao', text: 'Agora sim vou dar trabalho a eles!', mood: 'stern' },
      { who: 'narrator', text: 'Apanhe as raposas no campo. Elas fogem quando você chega perto: use a ARRANCADA para alcançá-las!' },
    ],
    outro: [
      { who: 'narrator', text: 'Ele amarrou tochas nas caudas e soltou as raposas nas plantações dos filisteus.' },
      { who: 'filisteu', text: 'O trigo! As vinhas! As oliveiras! Tudo queimado!', mood: 'sad' },
    ],
  },
  {
    id: 'queixada',
    title: 'Mil homens com uma queixada',
    ref: 'Juízes 15:9-19',
    intro: [
      { who: 'judeu', text: 'Sansão, os filisteus estão em cima de nós por tua causa! Temos de te entregar amarrado.', mood: 'sad' },
      { who: 'sansao', text: 'Podem amarrar. Só não me matem vocês mesmos.' },
      { who: 'chefe', text: 'Pegamos o valentão! Amarrado com duas cordas novas!', mood: 'happy' },
      { who: 'narrator', text: 'Então o Espírito do Senhor veio sobre Sansão, e as cordas viraram linho queimado!' },
      { who: 'narrator', text: 'Toque rápido para romper as cordas e pegue a queixada no chão. Ataque com GOLPE (o 3º golpe seguido é o mais forte). Os escudeiros só caem com o 3º golpe ou com o PODER; os arqueiros atiram de longe: saia da linha vermelha ou rebata a flecha!' },
    ],
    outro: [
      { who: 'sansao', text: 'Com uma queixada de jumento, montões e montões! Com uma queixada de jumento feri mil homens!', mood: 'happy' },
      { who: 'sansao', text: 'Mas agora... estou morrendo de sede.', mood: 'sad' },
      { who: 'narrator', text: 'Deus abriu a rocha em Leí, e dela brotou água. Ele bebeu, e as forças voltaram.' },
    ],
  },
  {
    id: 'gaza',
    title: 'Os portões de Gaza',
    ref: 'Juízes 16:1-3',
    intro: [
      { who: 'chefe', text: 'Ele está dentro de Gaza! Fechem as portas. De manhã cedo nós o matamos.', mood: 'stern' },
      { who: 'sansao', text: 'À meia-noite eu saio... e levo a porta comigo.', mood: 'happy' },
      { who: 'narrator', text: 'Segure SUBIR para carregar os portões morro acima. Use ◀ e ▶ para não deixar tombar. Chegue antes do amanhecer!' },
    ],
    outro: [
      { who: 'narrator', text: 'Ele arrancou as portas, as colunas e a tranca, e as levou até o alto do monte em frente a Hebrom.' },
      { who: 'chefe', text: '...Alguém viu o portão da cidade?', mood: 'sad' },
    ],
  },
  {
    id: 'dalila',
    title: 'Sansão e Dalila',
    ref: 'Juízes 16:4-21',
    intro: [
      { who: 'narrator', text: 'No vale de Soreque, Sansão se apaixonou por Dalila. Os chefes filisteus ofereceram muita prata a ela.' },
      { who: 'dalila', text: 'Sansão, querido... de onde vem a tua grande força?', mood: 'happy' },
      { who: 'narrator', text: 'Escolha as respostas. Quando gritarem "Os filisteus vêm sobre ti!", toque rápido para se soltar.' },
    ],
    outro: [
      { who: 'narrator', text: 'Os filisteus o prenderam, furaram-lhe os olhos e o puseram para girar o moinho na prisão.' },
      { who: 'cego', text: '...Mas o meu cabelo começou a crescer de novo.', mood: 'sad' },
    ],
  },
  {
    id: 'dagom',
    title: 'O templo de Dagom',
    ref: 'Juízes 16:23-31',
    intro: [
      { who: 'chefe', text: 'Nosso deus Dagom entregou Sansão nas nossas mãos! Tragam-no aqui para nos divertir!', mood: 'happy' },
      { who: 'menino', text: 'Vem, Sansão. Eu te levo pela mão.' },
      { who: 'cego', text: 'Deixa-me tocar nas colunas que sustentam a casa, para eu me encostar nelas.' },
      { who: 'narrator', text: 'Primeiro, ore: toque quando a luz encostar no círculo. Depois empurre as colunas alternando ◀ e ▶ bem rápido!' },
    ],
    outro: [
      { who: 'narrator', text: 'A casa desabou sobre os chefes e sobre todo o povo que estava nela.' },
      { who: 'narrator', text: 'Fim da história de Sansão. A força dele nunca esteve no cabelo: vinha do Senhor.' },
    ],
  },
];

export const LIES = [
  { q: 'Sansão, querido... de onde vem a tua grande força?', options: ['Sete cordas de arco frescas, que nunca secaram.', 'Uma dieta de mel de leão.', 'Eu durmo oito horas por noite.'] },
  { q: 'Tu zombaste de mim! Diz a verdade: como podes ser amarrado?', options: ['Com cordas novas, que nunca foram usadas.', 'Com fio dental de camelo.', 'Com um abraço bem apertado.'] },
  { q: 'Até agora só mentiste! Conta logo o teu segredo...', options: ['Tecendo as sete tranças do meu cabelo no tear.', 'Fazendo cócegas no meu pé.', 'Me pedindo com jeitinho.'] },
];

export const BIND = ['Ela o amarrou com sete cordas de arco frescas...', 'Ela o amarrou com cordas novas...', 'Ela teceu as sete tranças dele no tear e prendeu com uma estaca...'];
export const FREE = ['Hahaha! Arrebentei como fio queimado no fogo!', 'Essas cordas? Parecem linha de costura!', 'Arranquei a estaca e o tear junto! Bom dia!'];
