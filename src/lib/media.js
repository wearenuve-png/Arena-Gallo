import { OFICIAL } from './oficial.js';

/* Imagen de cada evento: cuadros del recorrido en video, recortados como cartel (4:5) y en panorámica. */
const HAS = new Set(['jhayco', 'risas', 'clasico', 'circo', 'apertura', 'voleibol', 'volcan', 'expo']);
// eventos que usan fotos del sitio oficial
const OF = { sinfonica: { img: OFICIAL.escena, wide: OFICIAL.home.cello } };
export const evImg = (id) => (OF[id] ? OF[id].img : HAS.has(id) ? `/media/ev/${id}.jpg` : '/media/arena.jpg');
export const evWide = (id) => (OF[id] ? OF[id].wide : HAS.has(id) ? `/media/ev/${id}-w.jpg` : '/media/arena.jpg');
// lo que se ve desde la butaca a la que lleva "Abrir el recinto en 3D", con el nombre del evento en pantalla
export const evPov = (id) => (HAS.has(id) || id === 'sinfonica' ? `/media/pov/${id}.jpg` : '/media/pov.jpg');
