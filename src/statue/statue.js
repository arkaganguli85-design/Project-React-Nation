import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const LIME = 0xc6ff00;

// ---------- marble: procedural veins in object space (no UVs needed)
function marbleMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: 0xf1eee6, roughness: 0.42, metalness: 0.0, envMapIntensity: 0.55 });
  m.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vObj;
float h3(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=.5, r=0.; for(int i=0;i<5;i++){ r+=a*n3(p); p*=2.03; a*=.5; } return r; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 p = vObj * 1.6;
  float warp = fbm(p * 1.3);
  float vein = 1.0 - abs(2.0 * fbm(p * 1.1 + warp * 2.2) - 1.0);
  float fine = 1.0 - abs(2.0 * fbm(p * 4.0 + warp) - 1.0);
  float cloud = fbm(p * 0.9);
  vec3 grey = vec3(0.50, 0.52, 0.56);
  diffuseColor.rgb = mix(diffuseColor.rgb, grey, pow(vein, 14.0) * 0.55 + pow(fine, 20.0) * 0.18);
  diffuseColor.rgb *= 0.93 + 0.1 * cloud;
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor + (fbm(vObj * 9.0) - 0.5) * 0.22, 0.2, 0.9);`);
  };
  return m;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(198,255,0,0.95)');
  r.addColorStop(0.25, 'rgba(198,255,0,0.45)');
  r.addColorStop(0.6, 'rgba(198,255,0,0.1)');
  r.addColorStop(1, 'rgba(198,255,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// ---------- sunglasses: angular shield lenses, emissive lime frame, temple arms
function buildGlasses() {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshBasicMaterial({ color: LIME, toneMapped: false });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b1200, roughness: 0.06, metalness: 0.35, transparent: true, opacity: 0.93,
    clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4,
  });

  const outer = [[-0.27, 0.15], [0.27, 0.17], [0.29, 0.0], [0.18, -0.145], [-0.18, -0.125], [-0.28, 0.02]];
  const scaleAbout = (pts, s) => pts.map(([x, y]) => [x * s, y * s]);
  const mk = (pts) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath(); return sh; };

  const frameShape = mk(outer);
  const hole = new THREE.Path();
  scaleAbout(outer, 0.8).forEach(([x, y], i) => (i ? hole.lineTo(x, y) : hole.moveTo(x, y)));
  hole.closePath();
  frameShape.holes.push(hole);
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1 });
  const lensGeo = new THREE.ShapeGeometry(mk(scaleAbout(outer, 0.83)));

  [-1, 1].forEach((side) => {
    const eye = new THREE.Group();
    eye.position.set(0.32 * side, 0.075, 0.82);
    eye.rotation.y = 0.52 * side;
    eye.scale.setScalar(1.12);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.z = 0.02;
    eye.add(frame, lens);
    if (side < 0) eye.scale.x = -1.12; // mirror shape so the slant mirrors too
    g.add(eye);
  });
  // bridge
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.04), frameMat);
  bridge.position.set(0, 0.145, 0.86);
  g.add(bridge);
  // temple arms
  [-1, 1].forEach((side) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.56 * side, 0.15, 0.7), new THREE.Vector3(0.8 * side, 0.14, 0.38), new THREE.Vector3(0.84 * side, 0.1, 0.0),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.018, 6), frameMat));
  });
  return { group: g, frameMat, lensMat };
}

// ---------- eyes (visible through the tinted lenses; they track the cursor)
function buildEyes(marble) {
  const eyes = [];
  const root = new THREE.Group();
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x15170f });
  [-1, 1].forEach((side) => {
    const e = new THREE.Group();
    e.position.set(0.3 * side, 0.07, 0.62);
    e.add(new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 18), marble));
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), pupilMat);
    iris.position.z = 0.133;
    e.add(iris);
    root.add(e); eyes.push(e);
  });
  return { root, eyes };
}

// ---------- scanned bust: Poly Haven "Marble Bust 01" (CC0, Rico Cilliers)
// One mesh, so the head is "rigged" by bending the neck in the vertex shader: vertices ramp from 0 to 1
// rotation weight between shoulders and chin, matching headGroup's rotation exactly above the ramp.
const BUST = { px: -0.005, py: 0.24, pz: 0.02, faceYaw: 0.245, scale: 10, pivotY: -1.3 };
const HEAD_BEND = /* glsl */ `
uniform vec3 uHead;
mat3 headRot(float w) {
  vec3 a = uHead * w; vec3 s = sin(a), c = cos(a);
  mat3 rx = mat3(1.,0.,0., 0.,c.x,s.x, 0.,-s.x,c.x);
  mat3 ry = mat3(c.y,0.,-s.y, 0.,1.,0., s.y,0.,c.y);
  mat3 rz = mat3(c.z,s.z,0., -s.z,c.z,0., 0.,0.,1.);
  return ry * rx * rz;
}
float headW(float y) { return smoothstep(-0.45, 0.2, y); }`;

async function buildBustGLB({ root, renderer, lowPower }) {
  const base = import.meta.env.BASE_URL + 'models/marble_bust_01/';
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(base + 'bust.gltf');
  let src; gltf.scene.traverse((o) => { if (o.isMesh && !src) src = o; });
  if (!src) throw new Error('no mesh in bust.gltf');
  src.updateMatrixWorld(true);

  // bake: world -> centred on the neck pivot, face turned to +z, scaled to scene units
  const geo = src.geometry.clone();
  geo.applyMatrix4(src.matrixWorld);
  geo.translate(-BUST.px, -BUST.py, -BUST.pz);
  geo.rotateY(BUST.faceYaw);
  geo.scale(BUST.scale, BUST.scale, BUST.scale);

  const size = lowPower ? '1k' : '2k';
  const tl = new THREE.TextureLoader();
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const tex = (name, srgb) => { const t = tl.load(`${base}textures/${name}_${size}.jpg`); t.anisotropy = aniso; t.flipY = false; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const headUniform = { value: new THREE.Vector3() };

  const mat = new THREE.MeshStandardMaterial({ map: tex('diff', true), normalMap: tex('nor_gl'), roughnessMap: tex('rough'), roughness: 1, metalness: 0, envMapIntensity: 0.6 });
  mat.onBeforeCompile = (s) => {
    s.uniforms.uHead = headUniform;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\n' + HEAD_BEND)
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = headRot(headW(position.y)) * objectNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = headRot(headW(position.y)) * transformed;');
    // the scan is warm and stained; pull it toward clean white marble
    s.fragmentShader = s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
{ float lum = dot(diffuseColor.rgb, vec3(0.333)); diffuseColor.rgb = mix(vec3(lum), diffuseColor.rgb, 0.3) * 1.22; }`);
  };
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  depth.onBeforeCompile = (s) => {
    s.uniforms.uHead = headUniform;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\n' + HEAD_BEND)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = headRot(headW(position.y)) * transformed;');
  };

  const mesh = new THREE.Mesh(geo, mat);
  mesh.customDepthMaterial = depth;
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  mesh.position.set(0, BUST.pivotY, 0);
  root.add(mesh);

  return {
    pivot: new THREE.Vector3(0, BUST.pivotY, 0),
    glassesOffset: new THREE.Vector3(-0.04, 1.37, 0.34), glassesScale: 0.9,
    bodyMesh: null, eyes: [], headUniform,
    stats: { source: 'glb', tris: geo.index.count / 3 },
  };
}

// ---------- procedural fallback: SDF-sculpted bust built in a worker
async function buildProcedural({ root, headGroup }) {
  const marble = marbleMaterial();
  const eyeRig = buildEyes(marble);
  const worker = new Worker(new URL('./sculpt.worker.js', import.meta.url), { type: 'module' });
  const meshes = await new Promise((resolve, reject) => {
    worker.onmessage = (e) => resolve(e.data);
    worker.onerror = reject;
    worker.postMessage({ quality: 'high' });
  });
  worker.terminate();
  const toGeo = (m) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
    g.setIndex(new THREE.BufferAttribute(m.indices, 1));
    g.computeBoundingSphere();
    return g;
  };
  const headMesh = new THREE.Mesh(toGeo(meshes.head), marble);
  const bodyMesh = new THREE.Mesh(toGeo(meshes.body), marble);
  [headMesh, bodyMesh].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  // authored in world space; children of headGroup are offset by -pivot
  const OFF = new THREE.Vector3(0, 1.0, 0.05);
  headMesh.position.copy(OFF);
  eyeRig.root.position.copy(OFF);
  headGroup.add(headMesh, eyeRig.root);
  root.add(bodyMesh);
  return {
    pivot: new THREE.Vector3(0, -1.0, -0.05),
    glassesOffset: OFF.clone(), glassesScale: 1,
    bodyMesh, eyes: eyeRig.eyes, headUniform: null,
    stats: { source: 'procedural', buildMs: meshes.ms, tris: (meshes.head.indices.length + meshes.body.indices.length) / 3 },
  };
}

export function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export async function createStatue(canvas, { reducedMotion = false, lowPower = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.3;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  const CAM_TARGET = new THREE.Vector3(0, -0.75, 0);
  const BASE_YAW = -0.38;

  // lighting: hard cinematic side key, lime-tinted rim, soft fill, glasses spill
  const key = new THREE.DirectionalLight(0xfff3e0, 4.4);
  key.position.set(-5.5, 2.4, 1.6);
  key.castShadow = !lowPower;
  key.shadow.mapSize.set(1536, 1536);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -4, near: 1, far: 14 });
  key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
  const rim = new THREE.DirectionalLight(0xd8ff66, 2.0);
  rim.position.set(4.5, 1.2, -3.5);
  const fill = new THREE.DirectionalLight(0x9aa8ff, 0.12);
  fill.position.set(3, -1, 4);
  const spill = new THREE.PointLight(LIME, 2, 3.2, 1.8);
  scene.add(key, rim, fill);

  const root = new THREE.Group();
  scene.add(root);

  // rig: root > [bust mesh] ; neckPivot > headGroup > glasses (+ glow sprites, spill light)
  // The bust mesh bends at the neck in its vertex shader (GLB) or is split head/body (procedural).
  const neckPivot = new THREE.Group();
  const headGroup = new THREE.Group();
  neckPivot.add(headGroup);
  root.add(neckPivot);

  const glasses = buildGlasses();
  headGroup.add(glasses.group);

  const gTex = glowTexture();
  const sprites = [-1, 1].map((s) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 }));
    sp.position.set(0.37 * s, 0.07, 1.0); sp.scale.setScalar(1.05);
    glasses.group.add(sp); return sp;
  });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.22 }));
  halo.position.set(0, 0.07, 0.95); halo.scale.set(2.6, 1.3, 1);
  glasses.group.add(halo);
  spill.position.set(0, 0.3, 1.9);
  glasses.group.add(spill);

  // Prefer the CC0 scanned bust; fall back to the procedural sculpt if it cannot load.
  const ctx = { root, headGroup, renderer, lowPower };
  let rig;
  try { rig = await buildBustGLB(ctx); }
  catch (err) { console.warn('GLB bust unavailable, using procedural sculpt.', err); rig = await buildProcedural(ctx); }
  neckPivot.position.copy(rig.pivot);
  glasses.group.position.copy(rig.glassesOffset);
  glasses.group.scale.setScalar(rig.glassesScale);
  const bodyMesh = rig.bodyMesh, eyes = rig.eyes, headUniform = rig.headUniform;
  const meshes = rig.stats;

  // ---------- state
  const st = {
    tx: 0, ty: 0,               // target pointer in -1..1
    yaw: 0, pitch: 0, vy: 0, vp: 0,
    glow: 1, glowTarget: 1,
    nod: 0, nodV: 0,
    blink: 0, nextBlink: 2 + Math.random() * 3,
    lastInput: 0, flash: 0, paused: false, visible: true, t: 0,
    sx: 0, sy: 0,
  };

  const resize = () => {
    const w = canvas.clientWidth || 600, h = canvas.clientHeight || 700;
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole head in frame on tall/narrow viewports
    // fit by height first (head and shoulders), then back off if the box is too narrow (shoulders are about 4.8 units wide)
    const fitWidth = 4.8 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    const dist = Math.max(10.8, fitWidth);
    CAM_TARGET.y = -0.5;
    camera.position.set(0.5, 0.2, dist);
    camera.lookAt(CAM_TARGET);
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  const io = new IntersectionObserver((e) => { st.visible = e[0].isIntersecting; if (st.visible && !raf) loop(); }, { threshold: 0.01 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => { st.paused = document.hidden; if (!st.paused && !raf) loop(); });

  let last = performance.now(), raf = 0;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; st.t += dt;
    const t = st.t;
    const idle = !reducedMotion && (now - st.lastInput > 2500);

    // idle drift when nobody is interacting, otherwise follow the pointer
    let tx = st.tx, ty = st.ty;
    if (reducedMotion) { tx = ty = 0; }
    else if (idle) { tx = Math.sin(t * 0.35) * 0.35; ty = Math.sin(t * 0.5 + 1) * 0.12; }

    // critically-damped-ish spring for natural inertia
    const yawT = clamp(tx, -1, 1) * 0.62;
    const pitchT = clamp(ty, -1, 1) * 0.3;
    const k = 38, c = 9.5;
    st.vy += ((yawT - st.yaw) * k - st.vy * c) * dt; st.yaw += st.vy * dt;
    st.vp += ((pitchT - st.pitch) * k * 0.8 - st.vp * c) * dt; st.pitch += st.vp * dt;

    // click nod
    st.nodV += (-st.nod * 90 - st.nodV * 9) * dt; st.nod += st.nodV * dt;

    headGroup.rotation.set(st.pitch + st.nod * 0.5, st.yaw, st.yaw * -0.06, 'YXZ');
    if (headUniform) headUniform.value.set(headGroup.rotation.x, headGroup.rotation.y, headGroup.rotation.z);
    // three-quarter base pose, shoulders follow a fraction of the turn
    root.rotation.y = BASE_YAW + st.yaw * 0.12;
    if (bodyMesh) { // procedural bust only: the scanned bust bends in its shader instead
      const breathe = reducedMotion ? 0 : Math.sin(t * 1.2) * 0.006;
      bodyMesh.position.y = breathe; neckPivot.position.y = rig.pivot.y + breathe * 0.6;
    }

    // procedural eyes lead the head a little further
    eyes.forEach((e) => {
      e.rotation.y = clamp(tx * 0.9 - st.yaw * 0.6, -0.5, 0.5);
      e.rotation.x = clamp(ty * 0.5 - st.pitch * 0.4, -0.35, 0.35);
    });
    // blink
    st.nextBlink -= dt;
    if (!reducedMotion && st.nextBlink <= 0) { st.blink = 1; st.nextBlink = 2.5 + Math.random() * 4; }
    st.blink = Math.max(0, st.blink - dt * 7);
    const blinkDip = Math.sin(st.blink * Math.PI);
    eyes.forEach((e) => e.scale.y = Math.max(0.05, 1 - blinkDip * 0.95));

    // neon: smooth toward target, subtle pulse, click flash; a blink dips the neon briefly
    st.glow += (st.glowTarget - st.glow) * (1 - Math.exp(-dt * 7));
    st.flash = Math.max(0, st.flash - dt * 2.2);
    const pulse = reducedMotion ? 0 : Math.sin(t * 1.6) * 0.06;
    const gi = st.glow + pulse + st.flash * 1.6 - (eyes.length ? 0 : blinkDip * 0.45);
    sprites.forEach((s) => { s.material.opacity = clamp(0.28 * gi, 0, 1); s.scale.setScalar(0.95 + gi * 0.28); });
    halo.material.opacity = clamp(0.1 * gi, 0, 0.7);
    spill.intensity = 0.8 + gi * 1.6;
    glasses.lensMat.opacity = 0.93 - st.flash * 0.3;

    renderer.render(scene, camera);
  }

  function loop() {
    raf = requestAnimationFrame((n) => {
      raf = 0;
      if (st.paused || !st.visible) return;
      frame(n);
      loop();
    });
  }
  loop();

  return {
    setPointer(nx, ny) { st.tx = nx; st.ty = ny; st.lastInput = performance.now(); },
    setGlow(v) { st.glowTarget = v; },
    react() { st.nodV = -4; st.flash = 1; st.vy += (Math.random() < 0.5 ? -1 : 1) * 3.5; st.blink = 1; },
    setReducedMotion(v) { reducedMotion = v; },
    dispose() { ro.disconnect(); io.disconnect(); renderer.dispose(); },
    stats: meshes,
    glassesGroup: glasses.group,
  };
}
