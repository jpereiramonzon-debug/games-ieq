/** Story of Noah (Genesis 6-9), in five playable chapters. */
import type { SChapter } from '../pixel/StoryMode';
import { heroFace } from '../pixel/heroes';
import type { Look } from '../pixel/person';
import { bindCast } from '../platform/rig';

export const NLOOKS = {
  noe: { skin: '#c88a60', hair: '#a8a8a4', robe: '#7a6a54', trim: '#c8b088', beard: true, head: 'hair' } as Look,
  sem: { skin: '#cc8e5e', hair: '#3a2a1a', robe: '#5a6a4a', trim: '#c8b088', beard: true, head: 'hair' } as Look,
  cam: { skin: '#a8704a', hair: '#1a120a', robe: '#8a5a3a', trim: '#c8b088', beard: true, head: 'curly' } as Look,
  jafe: { skin: '#dca070', hair: '#6a4024', robe: '#4a5a7a', trim: '#c8b088', beard: true, head: 'hair' } as Look,
  esposa: { skin: '#d49a6a', hair: '#8a8a88', robe: '#6a4a5a', trim: '#c8b088', head: 'veil', headColor: '#c8b8a0' } as Look,
  vizinho: { skin: '#c88a58', hair: '#2a1a10', robe: '#a8823a', trim: '#6a4a24', beard: true, head: 'turban', headColor: '#d8c8a0' } as Look,
};

export const NSPEAK: Record<string, { look: Look; name: string; bg: string; img?: string }> = {
  noe: { look: NLOOKS.noe, name: 'Noé', bg: '#a8b890', img: heroFace('noe') },
  sem: { look: NLOOKS.sem, name: 'Sem', bg: '#a8b890', img: heroFace('jovem') },
  cam: { look: NLOOKS.cam, name: 'Cam', bg: '#c8a080' },
  jafe: { look: NLOOKS.jafe, name: 'Jafé', bg: '#8aa8c8' },
  esposa: { look: NLOOKS.esposa, name: 'Esposa de Noé', bg: '#b8a0a8', img: heroFace('esposa') },
  vizinho: { look: NLOOKS.vizinho, name: 'Vizinho', bg: '#c8b070', img: heroFace('judeu') },
  voz: { look: NLOOKS.noe, name: 'A voz do Senhor', bg: '#f0e0a0' },
  narrator: { look: NLOOKS.noe, name: '', bg: '#a8b890' },
};

export const NCHAPTERS: SChapter[] = [
  {
    id: 'arca',
    title: 'Construindo a arca',
    ref: 'Gênesis 6:9-22',
    intro: [
      { who: 'voz', text: 'Faze para ti uma arca de madeira de gôfer: trezentos côvados de comprido, com três andares, betumada por dentro e por fora.' },
      { who: 'noe', text: 'Uma arca... no meio da terra seca. Está bem, Senhor. Filhos, peguem as ferramentas!' },
      { who: 'vizinho', text: 'Ô Noé! Vai pescar no deserto, é? Hahaha!', mood: 'happy' },
      { who: 'narrator', text: 'Martele cada tábua quando a marca passar no verde. Depois segure para passar o betume e solte na faixa certa.' },
    ],
    outro: [
      { who: 'noe', text: 'Três andares, uma porta ao lado e uma janela no alto. Assim como o Senhor mandou.', mood: 'happy' },
      { who: 'narrator', text: 'E Noé fez tudo conforme o que Deus lhe ordenara.' },
    ],
  },
  {
    id: 'animais',
    title: 'Dois a dois',
    ref: 'Gênesis 7:1-16',
    intro: [
      { who: 'voz', text: 'De todo animal que vive, entrarão contigo na arca dois de cada espécie, macho e fêmea.' },
      { who: 'cam', text: 'Pai, tem bicho chegando de todo lado! Como vamos organizar isso?', mood: 'sad' },
      { who: 'narrator', text: 'Vire as cartas e encontre os pares. Cada par entra na arca!' },
    ],
    outro: [
      { who: 'esposa', text: 'Até as girafas couberam! E o elefante prometeu não pisar em ninguém.', mood: 'happy' },
      { who: 'narrator', text: 'E o Senhor fechou a porta atrás dele.' },
    ],
  },
  {
    id: 'diluvio',
    title: 'O dilúvio',
    ref: 'Gênesis 7:17-24',
    intro: [
      { who: 'narrator', text: 'Romperam-se as fontes do grande abismo, e as janelas do céu se abriram. Choveu quarenta dias e quarenta noites.' },
      { who: 'jafe', text: 'A arca está balançando muito, pai!', mood: 'sad' },
      { who: 'noe', text: 'Segurem firme. O Senhor nos guarda nestas águas.' },
      { who: 'narrator', text: 'Use ◀ e ▶ para equilibrar a arca nas ondas até a chuva passar.' },
    ],
    outro: [{ who: 'narrator', text: 'E Deus se lembrou de Noé e de todos os animais, e fez passar um vento sobre a terra. As águas começaram a baixar.' }],
  },
  {
    id: 'pomba',
    title: 'O corvo e a pomba',
    ref: 'Gênesis 8:6-12',
    intro: [
      { who: 'noe', text: 'O corvo foi e voltou várias vezes. Agora vou soltar a pomba para ver se as águas baixaram.' },
      { who: 'narrator', text: 'Toque para a pomba bater as asas. Desvie das nuvens de chuva e encontre a folha de oliveira!' },
    ],
    outro: [
      { who: 'sem', text: 'Pai, olha! A pomba voltou com uma folha de oliveira no bico!', mood: 'happy' },
      { who: 'noe', text: 'As águas baixaram. Logo vamos pisar em terra outra vez.', mood: 'happy' },
    ],
  },
  {
    id: 'arcoiris',
    title: 'O arco-íris',
    ref: 'Gênesis 8:15-9:17',
    intro: [
      { who: 'narrator', text: 'A arca repousou sobre os montes de Ararate. Noé saiu, edificou um altar e deu graças ao Senhor.' },
      { who: 'voz', text: 'Ponho o meu arco nas nuvens. Ele será o sinal da aliança entre mim e a terra.' },
      { who: 'narrator', text: 'Observe a ordem das cores e repita para pintar o arco-íris no céu.' },
    ],
    outro: [
      { who: 'noe', text: 'Toda vez que o arco aparecer nas nuvens, vamos lembrar da promessa de Deus.', mood: 'happy' },
      { who: 'narrator', text: 'Fim da história de Noé, o homem que andava com Deus.' },
    ],
  },
];

// Official sprites (platform/rig) for the main characters.
bindCast(NLOOKS.noe, 'noe');
