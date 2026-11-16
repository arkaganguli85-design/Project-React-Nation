// Moves the downloaded 4K Poly Haven bust into assets-src/ and writes web-sized textures into public/.
// Source: https://polyhaven.com/a/marble_bust_01 (CC0, Rico Cilliers)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const pub = 'public/models/marble_bust_01';
const src = 'assets-src/marble_bust_01';
fs.mkdirSync(src, { recursive: true });
fs.mkdirSync(`${pub}/textures`, { recursive: true });

const original = `${pub}/textures`;
for (const f of fs.readdirSync(original).filter((n) => n.endsWith('_4k.jpg'))) {
  fs.renameSync(`${original}/${f}`, `${src}/${f}`);
}
for (const f of ['marble_bust_01_4k.gltf']) {
  if (fs.existsSync(`${pub}/${f}`)) fs.renameSync(`${pub}/${f}`, `${src}/${f}`);
}

for (const kind of ['diff', 'nor_gl', 'rough']) {
  for (const [label, size] of [['2k', 2048], ['1k', 1024]]) {
    const out = `${pub}/textures/${kind}_${label}.jpg`;
    await sharp(`${src}/marble_bust_01_${kind}_4k.jpg`).resize(size, size).jpeg({ quality: 86 }).toFile(out);
    console.log(out, fs.statSync(out).size);
  }
}
