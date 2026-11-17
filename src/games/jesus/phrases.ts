import type { Lang } from '../../store';

type Lines = Record<Lang, string[]>;

/** What Jesus says when you miss a note. */
export const MISS: Lines = {
  pt: [
    'Só por mim mesmo...',
    'Estuda mais, desviado!',
    'Até o Pedro negou menos notas.',
    'Foi o inimigo ou foi você mesmo?',
    'Ensaio é quinta-feira, viu?',
    'Arrependei-vos... e voltai pro tempo!',
    'Nem com 40 dias de jejum.',
    'Vou orar por esse ritmo.',
    'Tá tocando em línguas, irmão?',
    'O ministro de louvor tá te olhando...',
    'Esse dedo tá desviado.',
    'Mais fé e menos atraso!',
    'Nem as trombetas de Jericó desafinaram tanto.',
    'Volta pra Escola Dominical!',
    'Multipliquei pães, não notas erradas.',
    'Quem nunca errou atire a primeira baqueta.',
    'Essa nota foi pro deserto.',
    'Até o Jonas chegou no tempo certo.',
    'Calma, Davi também começou na harpa.',
    'Precisa de unção nesse dedo.',
    'Andei sobre as águas, mas esse tempo aí...',
    'Vigiai e tocai!',
  ],
  en: [
    'Only by my grace...',
    'Go practice, backslider!',
    'Even Peter denied fewer notes.',
    'Was that the enemy, or just you?',
    'Rehearsal is on Thursday, you know.',
    'Repent... and get back on the beat!',
    'Not even after 40 days of fasting.',
    "I'll pray for that rhythm.",
    'Playing in tongues, brother?',
    'The worship leader is watching you...',
    'That finger has backslidden.',
    'More faith, less lag!',
    "Not even Jericho's trumpets were this off.",
    'Back to Sunday school!',
    'I multiplied loaves, not wrong notes.',
    'Let the one who never missed throw the first drumstick.',
    'That note wandered into the desert.',
    'Even Jonah showed up on time.',
    'Relax, David started on the harp too.',
    'That finger needs an anointing.',
    'I walked on water, but that timing...',
    'Watch and play!',
  ],
  es: [
    'Solo por mi gracia...',
    '¡Estudia más, descarriado!',
    'Hasta Pedro negó menos notas.',
    '¿Fue el enemigo o fuiste tú?',
    'El ensayo es el jueves, ¿eh?',
    '¡Arrepentíos... y volved al tiempo!',
    'Ni con 40 días de ayuno.',
    'Voy a orar por ese ritmo.',
    '¿Tocando en lenguas, hermano?',
    'El director de alabanza te está mirando...',
    'Ese dedo se descarrió.',
    '¡Más fe y menos atraso!',
    'Ni las trompetas de Jericó desafinaron tanto.',
    '¡Vuelve a la escuela dominical!',
    'Multipliqué panes, no notas falsas.',
    'El que nunca falló, que tire la primera baqueta.',
    'Esa nota se fue al desierto.',
    'Hasta Jonás llegó a tiempo.',
    'Tranquilo, David también empezó con el arpa.',
    'Ese dedo necesita unción.',
    'Caminé sobre el agua, pero ese tiempo...',
    '¡Velad y tocad!',
  ],
};

/** Tapping a lane when there is nothing to play. */
export const EARLY: Lines = {
  pt: ['Calma, irmão, ainda não!', 'Tocou no vácuo!', 'Adiantado igual culto de domingo.', 'Ansiedade é falta de oração.'],
  en: ['Easy, brother, not yet!', 'You hit thin air!', 'Early like Sunday service.', 'Patience is a virtue!'],
  es: ['¡Calma, hermano, todavía no!', '¡Tocaste el aire!', 'Adelantado como culto de domingo.', '¡La paciencia es virtud!'],
};

/** Coach lines for the other games, by what went wrong. */
export const MEMORY: Lines = {
  pt: ['Esqueceu? Nem o Faraó esqueceu tão rápido.', 'Memória de peixe... e olha que eu multipliquei peixes!', 'Lembra da mulher de Ló? Olhou pra trás e se perdeu também.', 'Guardai no coração... e na memória!', 'Até o copeiro do Faraó lembrou de José, uma hora.'],
  en: ["Forgot already? Not even Pharaoh forgot that fast.", 'Goldfish memory... and I multiplied fish!', "Remember Lot's wife? She looked back and got lost too.", 'Treasure it in your heart... and your memory!', "Even Pharaoh's cupbearer remembered Joseph eventually."],
  es: ['¿Olvidaste? Ni el Faraón olvidó tan rápido.', 'Memoria de pez... ¡y yo multipliqué peces!', '¿Recuerdas a la mujer de Lot? Miró atrás y se perdió también.', '¡Guardadlo en el corazón... y en la memoria!', 'Hasta el copero del Faraón se acordó de José, al final.'],
};
export const EAR: Lines = {
  pt: ['Tem ouvidos e não ouve!', 'Quem tem ouvidos, ouça!', 'Desafinou feito o galo do Pedro.', 'Até Samuel ouviu na terceira vez. Tenta de novo!', 'Essa nota é de outro louvor, irmão.'],
  en: ['Having ears, you do not hear!', 'Whoever has ears, let them hear!', "Off like Peter's rooster.", 'Even Samuel heard on the third call. Try again!', "That note belongs to another hymn, brother."],
  es: ['¡Tienen oídos y no oyen!', '¡El que tenga oídos, oiga!', 'Desafinaste como el gallo de Pedro.', 'Hasta Samuel oyó a la tercera. ¡Otra vez!', 'Esa nota es de otro himno, hermano.'],
};
export const TIME: Lines = {
  pt: ['Tá adiantado igual pregador com fome.', 'Atrasou mais que culto de domingo.', 'Todo tempo tem seu propósito... esse não era o seu.', 'Eclesiastes 3: há tempo pra tudo, menos pra isso.', 'O relógio do céu não atrasa, irmão.'],
  en: ['Rushing like a hungry preacher.', 'Later than the Sunday service.', 'To everything there is a season... this was not yours.', 'Ecclesiastes 3: a time for everything, except that.', "Heaven's clock doesn't lag, brother."],
  es: ['Adelantado como predicador con hambre.', 'Más atrasado que el culto del domingo.', 'Todo tiene su tiempo... y ese no era el tuyo.', 'Eclesiastés 3: hay tiempo para todo, menos para eso.', 'El reloj del cielo no se atrasa, hermano.'],
};
export const RUN: Lines = {
  pt: [
    'Caiu? Levanta e anda!',
    'Tropeçou justo na pedra de tropeço.',
    'Cuidado com a serpente, igual lá no Éden.',
    'Até a jumenta de Balaão viu esse obstáculo.',
    'Pula, irmão, que nem Davi dançando diante da arca!',
    'Corre que nem Elias na frente da carruagem!',
    'Nem a pedra do sepulcro me segurou. Bora de novo!',
    'O caminho é estreito, irmão. Atenção!',
  ],
  en: [
    'Fell down? Rise and walk!',
    'Tripped right on the stumbling stone.',
    'Watch the serpent, just like in Eden.',
    "Even Balaam's donkey saw that one coming.",
    'Jump, brother, like David dancing before the ark!',
    'Run like Elijah ahead of the chariot!',
    "Not even the tomb's stone held me back. Again!",
    'The way is narrow, brother. Pay attention!',
  ],
  es: [
    '¿Te caíste? ¡Levántate y anda!',
    'Tropezaste justo en la piedra de tropiezo.',
    'Cuidado con la serpiente, como en el Edén.',
    'Hasta la burra de Balaam vio ese obstáculo.',
    '¡Salta, hermano, como David danzando ante el arca!',
    '¡Corre como Elías delante del carro!',
    'Ni la piedra del sepulcro me detuvo. ¡Otra vez!',
    'El camino es angosto, hermano. ¡Atención!',
  ],
};

export const HELLO: Record<Lang, string> = {
  pt: 'Tô de olho, hein? Bora!',
  en: "I'm watching, okay? Let's go!",
  es: 'Te estoy mirando, ¿eh? ¡Vamos!',
};

/** Letting go of a hold note too early. */
export const DROP: Lines = {
  pt: ['Segura, irmão!', 'Soltou igual a fé de Tomé.', 'Não solta, que a unção tá descendo!', 'Perseverai até o fim!', 'Quem perseverar até o fim será salvo.'],
  en: ['Hold on, brother!', 'Let go like doubting Thomas.', "Don't let go, the anointing is coming!", 'Persevere to the end!', 'Whoever endures to the end shall be saved.'],
  es: ['¡Aguanta, hermano!', 'Soltaste como la fe de Tomás.', '¡No sueltes, que la unción está bajando!', '¡Perseverad hasta el fin!', 'El que persevere hasta el fin será salvo.'],
};

/** Combo milestones. */
export const PRAISE: Lines = {
  pt: ['Aleluia!', 'Glória!', 'Tá ungido!', 'Varão de Deus!', 'Que unção, irmão!', 'O céu tá dançando!', 'Davi ficaria orgulhoso!', 'Isso é avivamento!'],
  en: ['Hallelujah!', 'Glory!', 'Anointed!', 'Mighty man of God!', 'What an anointing!', 'Heaven is dancing!', 'David would be proud!', 'This is revival!'],
  es: ['¡Aleluya!', '¡Gloria!', '¡Estás ungido!', '¡Varón de Dios!', '¡Qué unción, hermano!', '¡El cielo está bailando!', '¡David estaría orgulloso!', '¡Esto es avivamiento!'],
};

export const START: Record<Lang, string> = {
  pt: 'Bora louvar! Acompanha comigo.',
  en: "Let's worship! Follow my lead.",
  es: '¡Vamos a alabar! Sígueme.',
};

export const FAILED: Record<Lang, string> = {
  pt: 'Vai orar e volta mais tarde.',
  en: 'Go pray and come back later.',
  es: 'Ve a orar y vuelve más tarde.',
};

/** Rank shown at the end, from accuracy. */
export function rank(lang: Lang, accuracy: number): string {
  const names: Record<Lang, string[]> = {
    pt: ['Levita de Ouro', 'Ministro de Louvor', 'Músico do Coral', 'Aprendiz do Ensaio', 'Ainda no Banco da Igreja'],
    en: ['Golden Levite', 'Worship Leader', 'Choir Musician', 'Rehearsal Rookie', 'Still in the Pews'],
    es: ['Levita de Oro', 'Ministro de Alabanza', 'Músico del Coro', 'Aprendiz del Ensayo', 'Todavía en el Banco'],
  };
  const i = accuracy >= 95 ? 0 : accuracy >= 80 ? 1 : accuracy >= 60 ? 2 : accuracy >= 35 ? 3 : 4;
  return names[lang][i];
}

/** Random line that is not the same as the previous one. */
export function pick(list: string[], last: string | null): string {
  if (list.length < 2) return list[0];
  let s = last;
  while (s === last) s = list[Math.floor(Math.random() * list.length)];
  return s!;
}
