/** Two-player chapters of David and Jonathan (1 Samuel 18-23). */
import type { SLine } from '../../pixel/StoryMode';
import type { Look } from '../../pixel/person';
import { bindCast } from '../../platform/rig';
import { DSPEAK } from '../content';
import type { DuoLevel } from './DuoStage';

export const JONATAS: Look = { skin: '#e2a272', hair: '#3a2214', robe: '#2e6ab0', cloak: '#7a2a3a', trim: '#e0b030', beard: true, head: 'crown', headColor: '#d8a830' };
bindCast(JONATAS, 'jonatas');

export const DUO_SPEAK = {
  ...DSPEAK,
  jonatas: { look: JONATAS, name: 'Jônatas', bg: '#8aa0c8' },
  menino: { look: DSPEAK.davi.look, name: 'O menino', bg: '#c8b890' },
};

export type DuoGame = 'stage1' | 'defense' | 'arrows' | 'stage2';
export interface DuoChapter {
  id: string;
  title: string;
  ref: string;
  game: DuoGame;
  intro: SLine[];
  outro: SLine[];
}

export const DUO_CHAPTERS: DuoChapter[] = [
  {
    id: 'alianca',
    title: 'A aliança',
    ref: '1 Samuel 18:1-4',
    game: 'stage1',
    intro: [
      { who: 'narrator', text: 'Depois da vitória sobre Golias, a alma de Jônatas se ligou à alma de Davi, e Jônatas o amou como à sua própria alma.', ref: '1 Samuel 18:1' },
      { who: 'jonatas', text: 'Davi! Vem comigo até o salão. Quero te dar uma coisa.', mood: 'happy' },
      { who: 'davi', text: 'Vamos, Jônatas! Mas este palácio é cheio de portões...' },
      { who: 'narrator', text: 'Um segura a placa para o outro passar. Muro alto? Suba nos ombros do parceiro. As chaves são da equipe. Os dois precisam chegar à saída.', game: true },
    ],
    outro: [
      { who: 'narrator', text: 'Jônatas e Davi fizeram aliança. Jônatas tirou a capa que vestia e a deu a Davi, com a sua armadura, a espada, o arco e o cinto.', ref: '1 Samuel 18:3-4' },
      { who: 'jonatas', text: 'Somos irmãos de aliança, Davi. Diante do Senhor.', mood: 'happy' },
    ],
  },
  {
    id: 'filisteus',
    title: 'Contra os filisteus',
    ref: '1 Samuel 18:30',
    game: 'defense',
    intro: [
      { who: 'narrator', text: 'Os príncipes dos filisteus saíam à guerra, e Davi se conduzia com mais sabedoria do que todos os servos de Saul.', ref: '1 Samuel 18:30' },
      { who: 'jonatas', text: 'Eu guardo o lado direito com o meu arco. Tu guardas o esquerdo com a tua funda!' },
      { who: 'narrator', text: 'Davi toca nos filisteus da esquerda; Jônatas, nos da direita. Se um lado fica sem defesa, o acampamento cai.', game: true },
    ],
    outro: [
      { who: 'davi', text: 'O acampamento está salvo! Bom tiro, Jônatas.', mood: 'happy' },
      { who: 'narrator', text: 'E o nome de Davi se tornou muito estimado. Mas o coração de Saul se encheu de ciúme.', ref: '1 Samuel 18:30; 18:8-9' },
    ],
  },
  {
    id: 'flechas',
    title: 'Os sinais das flechas',
    ref: '1 Samuel 20',
    game: 'arrows',
    intro: [
      { who: 'davi', text: 'Que fiz eu? Qual é o meu pecado diante de teu pai, para que procure tirar a minha vida?', mood: 'sad', ref: '1 Samuel 20:1' },
      { who: 'jonatas', text: 'Esconde-te junto à pedra de Ezel. Atirarei três flechas. Se eu disser ao menino “as flechas estão aquém de ti”, vem, porque há paz. Se disser “estão além de ti”, vai-te, porque o Senhor te manda ir.', ref: '1 Samuel 20:19-22' },
      { who: 'narrator', text: 'Só Jônatas sabe o que Saul quer; só Davi decide ficar ou fugir. O único recado é onde a flecha cai.', game: true },
    ],
    outro: [
      { who: 'narrator', text: 'Davi se levantou do lado da pedra e se inclinou três vezes. Beijaram-se um ao outro e choraram juntos.', ref: '1 Samuel 20:41' },
      { who: 'jonatas', text: 'Vai em paz. O Senhor seja entre mim e ti, e entre a minha descendência e a tua, para sempre.', mood: 'sad', ref: '1 Samuel 20:42' },
    ],
  },
  {
    id: 'horesa',
    title: 'O encontro em Horesa',
    ref: '1 Samuel 23:15-18',
    game: 'stage2',
    intro: [
      { who: 'narrator', text: 'Davi estava no deserto de Zife, em Horesa, fugindo de Saul.', ref: '1 Samuel 23:15' },
      { who: 'jonatas', text: 'Vou encontrar o meu amigo, custe o que custar.', mood: 'stern' },
      { who: 'narrator', text: 'Atravessem o deserto juntos. Cuidado com os soldados: escondam-se nos arbustos e passem quando estiverem de costas.', game: true },
    ],
    outro: [
      { who: 'jonatas', text: 'Não temas, porque a mão de Saul, meu pai, não te achará. Tu reinarás sobre Israel, e eu serei contigo o segundo.', mood: 'happy', ref: '1 Samuel 23:17' },
      { who: 'narrator', text: 'Jônatas fortaleceu a mão de Davi em Deus. E os dois fizeram aliança perante o Senhor.', ref: '1 Samuel 23:16-18' },
      { who: 'narrator', text: 'Fim do modo dupla: uma amizade fiel, mais forte que o medo.' },
    ],
  },
];

export const STAGE1: DuoLevel = {
  theme: 'palace',
  time: 'sunset',
  goal: 'Cheguem juntos ao salão de Jônatas',
  segs: [
    ['start', 'flat', 'hold', 'check', 'boost', 'check', 'key', 'door', 'exit'],
    ['start', 'flat', 'hold', 'check', 'boost', 'check', 'guard', 'key', 'door', 'exit'],
    ['start', 'steps', 'hold', 'check', 'boost', 'check', 'guard', 'spikes', 'key', 'door', 'exit'],
  ],
};
export const STAGE2: DuoLevel = {
  theme: 'desert',
  time: 'day',
  goal: 'Cheguem juntos a Horesa',
  segs: [
    ['start', 'boost', 'check', 'hold', 'check', 'steps', 'exit'],
    ['start', 'guard', 'boost', 'check', 'hold', 'check', 'spikes', 'key', 'door', 'exit'],
    ['start', 'guard', 'boost', 'check', 'spikes', 'hold', 'check', 'guard', 'key', 'door', 'exit'],
  ],
};
