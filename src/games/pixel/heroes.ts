/** Painted hero portraits (in public/heroes): full card art and a square face crop. */
const base = import.meta.env.BASE_URL;
export type Hero = 'jesus' | 'davi' | 'sansao' | 'pedro' | 'noe' | 'tentador' | 'esposa' | 'joao' | 'andre' | 'maria' | 'jovem' | 'anciao' | 'judeu' | 'jose' | 'jose-servo' | 'jose-gov' | 'ester';
export const heroCard = (h: Hero) => `${base}heroes/${h}.webp`;
export const heroFace = (h: Hero) => `${base}heroes/${h}-face.webp`;
