import fs from 'node:fs';
import path from 'node:path';
import { resolve } from 'node:path';

const BASE = process.env.BASE || '/';

export default {
  base: BASE,
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        index: resolve('index.html'),
        eventos: resolve('eventos.html'),
        evento: resolve('evento.html'),
        asientos: resolve('asientos.html'),
        boletos: resolve('boletos.html'),
        arena: resolve('arena.html'),
        espacios: resolve('espacios.html'),
        ubicacion: resolve('ubicacion.html'),
        nosotros: resolve('nosotros.html'),
        alianzas: resolve('alianzas.html'),
        contacto: resolve('contacto.html'),
      },
    },
  },
  plugins: [
    {
      // al publicar en una subcarpeta (GitHub Pages), las rutas absolutas escritas en el código llevan el prefijo
      name: 'prefix-base',
      apply: 'build',
      enforce: 'pre',
      transform(code, id) {
        if (BASE === '/' || !/\/src\/.*\.js$/.test(id)) return null;
        const out = code.replace(/(['"`])\/(media\/|assets\/|[a-z-]+\.html)/g, `$1${BASE}$2`);
        return out === code ? null : { code: out, map: null };
      },
    },
    {
      // solo en desarrollo: el estudio de render guarda capturas PNG en ./renders
      name: 'save-shot',
      configureServer(server) {
        server.middlewares.use('/__save', (req, res) => {
          const url = new URL(req.url, 'http://localhost');
          const name = (url.searchParams.get('name') || 'shot').replace(/[^a-z0-9_-]/gi, '');
          const ext = url.searchParams.get('ext') === 'bin' ? 'bin' : 'png';
          const sub = url.searchParams.get('dir') === 'people' ? 'public/assets/people' : 'renders';
          const chunks = [];
          req.on('data', (c) => chunks.push(c));
          req.on('end', () => {
            const dir = path.resolve(sub);
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, `${name}.${ext}`), Buffer.concat(chunks));
            res.end('ok');
          });
        });
      },
    },
  ],
};
