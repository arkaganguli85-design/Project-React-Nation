// Writes public/models/marble_bust_01/bust.gltf: the Poly Haven mesh with texture references removed.
import fs from 'node:fs';

const g = JSON.parse(fs.readFileSync('assets-src/marble_bust_01/marble_bust_01_4k.gltf', 'utf8'));
delete g.images; delete g.textures; delete g.samplers;
g.materials = [{ name: 'marble', doubleSided: false, pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 0.6 } }];
fs.writeFileSync('public/models/marble_bust_01/bust.gltf', JSON.stringify(g));
console.log('ok', Object.keys(g));
