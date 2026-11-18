import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** Lists every file under dir (paths relative to it, with forward slashes). */
function walk(dir: string, root = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p, root) : [relative(root, p).split(sep).join('/')];
  });
}

/**
 * Builds /sw.js from sw/sw.js with the list of files to keep offline: the
 * built app plus everything in public/ (the music is downloaded by the page).
 */
function offline(): Plugin {
  let publicDir = 'public';
  return {
    name: 'games-ieq-offline',
    apply: 'build',
    configResolved(c) {
      publicDir = c.publicDir;
    },
    generateBundle(_, bundle) {
      const hash = createHash('sha256');
      const pub = walk(publicDir).filter((f) => !f.startsWith('music/') && !f.startsWith('.'));
      for (const f of pub) hash.update(f).update(readFileSync(join(publicDir, f)));
      const built = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      for (const f of built) {
        const item = bundle[f];
        hash.update(f).update(item.type === 'chunk' ? item.code : item.source);
      }
      const files = ['/', ...[...built, ...pub].map((f) => `/${f}`)];
      const version = hash.digest('hex').slice(0, 12);
      const src = readFileSync('sw/sw.js', 'utf8')
        .replace('self.__VERSION__', JSON.stringify(version))
        .replace('self.__FILES__', JSON.stringify(files));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: src });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), offline()],
});
