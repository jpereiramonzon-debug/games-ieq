/** Characters of the story of Peter. */
import { LOOKS, type Look } from '../pixel/person';
import { bindCast } from '../platform/rig';

export const PLOOKS = {
  pedro: LOOKS.peter,
  jesus: LOOKS.jesus,
  andre: { skin: '#c88a5a', hair: '#3a2a1a', robe: '#8a6a3a', trim: '#5a4024', beard: true, head: 'hair' } as Look,
  joao: { skin: '#dca070', hair: '#5a3418', robe: '#a84a3a', trim: '#e8d0a0', head: 'hair' } as Look,
  serva: { skin: '#d49a6a', hair: '#2a1a10', robe: '#8a7a6a', trim: '#5a4a3a', head: 'veil', headColor: '#c8b898' } as Look,
  guarda: { skin: '#c88a58', hair: '#2a1a10', robe: '#6a3a2a', trim: '#c8a060', beard: true, head: 'helmet', headColor: '#a8a8b0' } as Look,
  romano: { skin: '#d8a070', hair: '#2a1a10', robe: '#b83a2a', trim: '#e8c060', head: 'helmet', headColor: '#c8a040' } as Look,
  povo: LOOKS.villager,
};

// Official sprites (platform/rig) for the main characters.
bindCast(PLOOKS.guarda, 'romano');
bindCast(PLOOKS.romano, 'romano');
