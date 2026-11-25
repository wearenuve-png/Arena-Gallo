/* Imagen de cada evento: cuadros del recorrido en video, recortados como cartel (4:5) y en panorámica. */
const HAS = new Set(['jhayco', 'risas', 'clasico', 'circo', 'apertura', 'voleibol', 'volcan', 'expo']);
export const evImg = (id) => (HAS.has(id) ? `/media/ev/${id}.jpg` : '/media/arena.jpg');
export const evWide = (id) => (HAS.has(id) ? `/media/ev/${id}-w.jpg` : '/media/arena.jpg');
// lo que se ve desde la butaca a la que lleva "Abrir el recinto en 3D", con el nombre del evento en pantalla
export const evPov = (id) => (HAS.has(id) ? `/media/pov/${id}.jpg` : '/media/pov.jpg');
