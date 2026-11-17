/** Characters of the story of David. */
import type { Look } from '../pixel/person';
import { bindCast } from '../platform/rig';

export const DLOOKS = {
  davi: { skin: '#e8a978', hair: '#a8482a', robe: '#c8a66a', trim: '#7a4a2a', head: 'curly' } as Look,
  rei: { skin: '#e2a272', hair: '#b0502a', robe: '#8a7a5a', cloak: '#2a3a5a', trim: '#8a2a2a', beard: true, head: 'crown' } as Look,
  samuel: { skin: '#d8a070', hair: '#e0d8c8', robe: '#e8e0cc', trim: '#6a5a3a', beard: true, head: 'hood', headColor: '#8a7a5a' } as Look,
  jesse: { skin: '#d49660', hair: '#b8b0a0', robe: '#6a5a3a', trim: '#3a2a1a', beard: true, head: 'hair' } as Look,
  eliabe: { skin: '#c88a58', hair: '#2a1a10', robe: '#8a3a2a', trim: '#c8a060', beard: true, head: 'hair' } as Look,
  irmao: { skin: '#d8955c', hair: '#3a2416', robe: '#5a7a4a', trim: '#3a4a2a', beard: true, head: 'hair' } as Look,
  saul: { skin: '#d49058', hair: '#2a1a10', robe: '#8a2a2a', trim: '#e8b830', beard: true, head: 'crown' } as Look,
  golias: { skin: '#b8784a', hair: '#1a120a', robe: '#8a7a5a', trim: '#b89a5a', beard: true, head: 'helmet' } as Look,
  soldado: { skin: '#c88a58', hair: '#2a1a10', robe: '#6a6a5a', trim: '#a88a4a', beard: true, head: 'helmet' } as Look,
  jonatas: { skin: '#dca070', hair: '#4a2a14', robe: '#3a5a8a', trim: '#c8a060', head: 'hair' } as Look,
  sacerdote: { skin: '#d8a070', hair: '#5a4a3a', robe: '#f0e8d8', trim: '#3a6ab8', beard: true, head: 'turban', headColor: '#f4f0e8' } as Look,
};

// Official sprites (platform/rig) for the main characters.
bindCast(DLOOKS.davi, 'davi');
bindCast(DLOOKS.rei, 'daviRei');
bindCast(DLOOKS.soldado, 'soldado');
