/** Characters of the story of Samson (Judges 13-16). */
import type { Look } from '../pixel/person';
import { bindCast } from '../platform/rig';

export const SLOOKS = {
  sansao: { skin: '#d08a5a', hair: '#4a2a14', robe: '#3e5a3a', trim: '#6a4424', beard: true, head: 'braids', bare: true } as Look,
  careca: { skin: '#d08860', hair: '#3a2010', robe: '#6a5a4a', trim: '#4a3a2a', beard: true, head: 'bald', bare: true } as Look,
  dalila: { skin: '#e2a874', hair: '#1a1010', robe: '#7a2a6a', trim: '#e8b830', head: 'long' } as Look,
  filisteu: { skin: '#c8885a', hair: '#2a1a10', robe: '#a83a2a', trim: '#e0c070', beard: false, head: 'helmet', headColor: '#c8b070' } as Look,
  chefe: { skin: '#c07a4a', hair: '#1a120a', robe: '#6a2a3a', trim: '#e8b830', beard: true, head: 'helmet', headColor: '#d8a040' } as Look,
  manoa: { skin: '#d49660', hair: '#b8b0a0', robe: '#6a7a5a', trim: '#3a2a1a', beard: true, head: 'hair' } as Look,
  anjo: { skin: '#f0d0b0', hair: '#f4e8c0', robe: '#ffffff', trim: '#ffd860', head: 'long' } as Look,
  menino: { skin: '#e2a874', hair: '#3a2010', robe: '#9a8a6a', trim: '#5a4a2a', head: 'hair' } as Look,
  judeu: { skin: '#cc8a58', hair: '#2a1a10', robe: '#5a6a7a', trim: '#3a4a5a', beard: true, head: 'hair' } as Look,
};

// Official sprites (platform/rig) for the main characters.
bindCast(SLOOKS.sansao, 'sansao');
bindCast(SLOOKS.filisteu, 'soldado');
