// Builds the marble bust meshes from signed distance fields (surface nets).
// Runs in a worker so the intro animation never stalls.

const sqrt = Math.sqrt, abs = Math.abs, min = Math.min, max = Math.max;

const smin = (a, b, k) => { const h = max(k - abs(a - b), 0) / k; return min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);

function ell(x, y, z, cx, cy, cz, rx, ry, rz) {
  const qx = (x - cx) / rx, qy = (y - cy) / ry, qz = (z - cz) / rz;
  const k0 = sqrt(qx * qx + qy * qy + qz * qz);
  const k1 = sqrt((qx / rx) ** 2 + (qy / ry) ** 2 + (qz / rz) ** 2);
  return k1 < 1e-6 ? -min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}
const sph = (x, y, z, cx, cy, cz, r) => sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2) - r;
function cap(x, y, z, ax, ay, az, bx, by, bz, r) {
  const pax = x - ax, pay = y - ay, paz = z - az, bax = bx - ax, bay = by - ay, baz = bz - az;
  const h = min(1, max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  return sqrt((pax - bax * h) ** 2 + (pay - bay * h) ** 2 + (paz - baz * h) ** 2) - r;
}

// deterministic hash
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---- hair curls: points on an upper/back shell of the skull
const HC = { x: 0, y: 0.26, z: -0.1 };
const curls = [];
(function buildCurls() {
  const make = (n, rMin, rMax, shell, seed) => {
    const ga = Math.PI * (3 - sqrt(5));
    for (let i = 0; i < n; i++) {
      const yy = 1 - (i / (n - 1)) * 2.0;
      const rad = sqrt(max(0, 1 - yy * yy));
      const th = ga * i + hash(i + seed) * 0.5;
      const dx = Math.cos(th) * rad, dz = Math.sin(th) * rad, dy = yy;
      if (dy < -0.12) continue; // nothing below the nape line
      // keep the face clear; hairline sits high on the forehead
      const front = dz > 0.28;
      if (front && dy < 0.52 + hash(i * 3 + seed) * 0.12) continue;
      if (front && abs(dx) > 0.72 && dy < 0.62) continue;
      const jitter = 0.94 + hash(i * 7 + seed) * 0.1;
      const r = rMin + hash(i * 11 + seed) * (rMax - rMin);
      curls.push([
        HC.x + dx * 0.78 * shell * jitter,
        HC.y + dy * 0.92 * shell * jitter,
        HC.z + dz * 0.92 * shell * jitter,
        r,
      ]);
    }
  };
  make(120, 0.21, 0.30, 0.98, 1);
  make(170, 0.12, 0.18, 1.1, 99);
  // classical forehead curls and sideburn curls
  const fringe = [[-0.55, 0.62, 0.62], [-0.3, 0.7, 0.7], [0, 0.74, 0.72], [0.3, 0.7, 0.7], [0.55, 0.62, 0.62],
    [-0.74, 0.32, 0.42], [0.74, 0.32, 0.42], [-0.78, 0.0, 0.2], [0.78, 0.0, 0.2]];
  fringe.forEach((c, i) => curls.push([c[0], c[1] + 0.2, c[2], 0.15 + hash(i + 5) * 0.05]));
})();

// bucket curls in a coarse grid so each sample only tests nearby ones
const BK = { x0: -1.8, y0: -1.0, z0: -1.8, s: 0.5, nx: 8, ny: 6, nz: 8 };
const buckets = Array.from({ length: BK.nx * BK.ny * BK.nz }, () => []);
curls.forEach((c, i) => {
  const bi = Math.floor((c[0] - BK.x0) / BK.s), bj = Math.floor((c[1] - BK.y0) / BK.s), bk = Math.floor((c[2] - BK.z0) / BK.s);
  if (bi >= 0 && bi < BK.nx && bj >= 0 && bj < BK.ny && bk >= 0 && bk < BK.nz) buckets[bi + BK.nx * (bj + BK.ny * bk)].push(i);
});
function hairField(x, y, z) {
  const bi = Math.floor((x - BK.x0) / BK.s), bj = Math.floor((y - BK.y0) / BK.s), bk = Math.floor((z - BK.z0) / BK.s);
  let h = 9;
  for (let k = bk - 1; k <= bk + 1; k++) for (let j = bj - 1; j <= bj + 1; j++) for (let i = bi - 1; i <= bi + 1; i++) {
    if (i < 0 || j < 0 || k < 0 || i >= BK.nx || j >= BK.ny || k >= BK.nz) continue;
    const list = buckets[i + BK.nx * (j + BK.ny * k)];
    for (let n = 0; n < list.length; n++) {
      const c = curls[list[n]];
      h = smin(h, sqrt((x - c[0]) ** 2 + (y - c[1]) ** 2 + (z - c[2]) ** 2) - c[3], 0.07);
    }
  }
  return h;
}

// ---- head (rigged part): cranium, face, hair, neck
function head(x, y, z) {
  const ax = abs(x);
  const nr = sqrt(x * x + (z + 0.02) ** 2) - 0.33;
  const neck = max(nr, abs(y + 1.15) - 0.6);
  // far from the head: neck only
  const hx = x, hy = y + 0.1, hz = z - 0.05;
  const far = sqrt(hx * hx + hy * hy + hz * hz) - 1.55;
  if (far > 0.3) return min(neck, far);
  let d = ell(x, y, z, 0, 0.24, -0.1, 0.78, 0.9, 0.9);
  d = smin(d, ell(x, y, z, 0, -0.16, 0.2, 0.67, 0.8, 0.68), 0.25);
  d = smin(d, ell(x, y, z, 0, -0.6, 0.14, 0.55, 0.45, 0.52), 0.22);
  d = smin(d, ell(x, y, z, 0, -0.9, 0.46, 0.23, 0.15, 0.2), 0.14);
  // brow ridge
  d = smin(d, cap(ax, y, z, 0.0, 0.22, 0.74, 0.6, 0.18, 0.6, 0.095), 0.1);
  // eye sockets
  d = smax(d, -sph(ax, y, z, 0.31, 0.07, 0.7, 0.18), 0.07);
  // cheekbones
  d = smin(d, sph(ax, y, z, 0.47, -0.2, 0.44, 0.17), 0.2);
  // nose
  d = smin(d, cap(x, y, z, 0, 0.12, 0.72, 0, -0.32, 0.88, 0.085), 0.1);
  d = smin(d, sph(x, y, z, 0, -0.37, 0.93, 0.098), 0.06);
  d = smin(d, sph(ax, y, z, 0.12, -0.33, 0.84, 0.075), 0.06);
  d = smax(d, -sph(ax, y, z, 0.065, -0.43, 0.9, 0.034), 0.03);
  // lips
  d = smin(d, ell(x, y, z, 0, -0.55, 0.77, 0.22, 0.05, 0.075), 0.045);
  d = smin(d, ell(x, y, z, 0, -0.64, 0.76, 0.19, 0.06, 0.075), 0.045);
  d = smax(d, -ell(x, y, z, 0, -0.598, 0.83, 0.2, 0.012, 0.06), 0.015);
  // ears
  d = smin(d, ell(ax, y, z, 0.77, -0.12, -0.05, 0.07, 0.23, 0.15), 0.05);
  // hair curls
  d = smin(d, hairField(x, y, z), 0.06);
  d = smin(d, neck, 0.28);
  return d;
}

// ---- bust (static part): shoulders, chest, plinth
function body(x, y, z) {
  let d = ell(x, y, z, 0, -2.25, -0.1, 1.28, 0.85, 0.66);
  d = smin(d, sph(abs(x), y, z, 1.0, -1.92, -0.1, 0.34), 0.3);
  d = smin(d, ell(x, y, z, 0, -1.55, -0.08, 0.78, 0.42, 0.45), 0.34);
  d = smin(d, ell(abs(x), y, z, 0.42, -2.1, 0.42, 0.42, 0.34, 0.24), 0.2);
  d = max(d, -2.78 - y);
  const plinth = max(abs(x) - 1.05, abs(y + 2.95) - 0.17, abs(z) - 0.75);
  d = min(d, plinth);
  return d;
}

// ---- surface nets
function extract(fn, b, step) {
  const nx = Math.ceil((b[3] - b[0]) / step) + 1;
  const ny = Math.ceil((b[4] - b[1]) / step) + 1;
  const nz = Math.ceil((b[5] - b[2]) / step) + 1;
  const val = new Float32Array(nx * ny * nz);
  const idx = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++)
        val[idx(i, j, k)] = fn(b[0] + i * step, b[1] + j * step, b[2] + k * step);

  const vmap = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cidx = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos = [];
  const corners = [[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]];
  const edges = [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const v = val[idx(i + corners[c][0], j + corners[c][1], k + corners[c][2])];
          cv[c] = v; if (v < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (let e = 0; e < 12; e++) {
          const a = edges[e][0], c = edges[e][1];
          if ((cv[a] < 0) === (cv[c] < 0)) continue;
          const t = cv[a] / (cv[a] - cv[c]);
          sx += corners[a][0] + t * (corners[c][0] - corners[a][0]);
          sy += corners[a][1] + t * (corners[c][1] - corners[a][1]);
          sz += corners[a][2] + t * (corners[c][2] - corners[a][2]);
          n++;
        }
        vmap[cidx(i, j, k)] = pos.length / 3;
        pos.push(b[0] + (i + sx / n) * step, b[1] + (j + sy / n) * step, b[2] + (k + sz / n) * step);
      }

  const ind = [];
  const quad = (a, b2, c, d, flip) => {
    if (a < 0 || b2 < 0 || c < 0 || d < 0) return;
    if (flip) ind.push(a, c, b2, a, d, c); else ind.push(a, b2, c, a, c, d);
  };
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const v0 = val[idx(i, j, k)] < 0;
        // x-edge
        if (v0 !== (val[idx(i + 1, j, k)] < 0))
          quad(vmap[cidx(i, j - 1, k - 1)], vmap[cidx(i, j, k - 1)], vmap[cidx(i, j, k)], vmap[cidx(i, j - 1, k)], !v0);
        // y-edge
        if (v0 !== (val[idx(i, j + 1, k)] < 0))
          quad(vmap[cidx(i - 1, j, k - 1)], vmap[cidx(i - 1, j, k)], vmap[cidx(i, j, k)], vmap[cidx(i, j, k - 1)], !v0);
        // z-edge
        if (v0 !== (val[idx(i, j, k + 1)] < 0))
          quad(vmap[cidx(i - 1, j - 1, k)], vmap[cidx(i, j - 1, k)], vmap[cidx(i, j, k)], vmap[cidx(i - 1, j, k)], !v0);
      }

  const P = new Float32Array(pos);
  const N = new Float32Array(P.length);
  const e = step * 0.5;
  for (let v = 0; v < P.length; v += 3) {
    const x = P[v], y = P[v + 1], z = P[v + 2];
    const gx = fn(x + e, y, z) - fn(x - e, y, z);
    const gy = fn(x, y + e, z) - fn(x, y - e, z);
    const gz = fn(x, y, z + e) - fn(x, y, z - e);
    const l = sqrt(gx * gx + gy * gy + gz * gz) || 1;
    N[v] = gx / l; N[v + 1] = gy / l; N[v + 2] = gz / l;
  }
  return { positions: P, normals: N, indices: new Uint32Array(ind) };
}

self.onmessage = (e) => {
  const q = e.data && e.data.quality === 'low' ? 1.2 : 1;
  const t0 = performance.now();
  const h = extract(head, [-1.3, -1.75, -1.25, 1.3, 1.3, 1.3], 0.024 * q);
  const b = extract(body, [-1.95, -3.2, -1.15, 1.95, -1.15, 1.15], 0.04 * q);
  self.postMessage(
    { head: h, body: b, ms: performance.now() - t0 },
    [h.positions.buffer, h.normals.buffer, h.indices.buffer, b.positions.buffer, b.normals.buffer, b.indices.buffer]
  );
};
