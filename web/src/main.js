import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadManifest, loadF32, loadU8, loadJSON } from './data.js';
import vertexShader from './shaders/points.vert.glsl?raw';
import fragmentShader from './shaders/points.frag.glsl?raw';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101114);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 0, 3);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.cs = { THREE, renderer, scene, camera, controls };

// ---- CONTENT START ----
const hex = (h) => new THREE.Vector3(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255);
const PALETTE = [0x4e79a7, 0xf28e2b, 0xe15759, 0x76b7b2, 0x59a14f, 0xedc948,
                 0xb07aa1, 0xff9da7, 0x9c755f, 0xbab0ac, 0x1b9e77, 0x7570b3].map(hex);

const uniforms = {
  uWorldSize: { value: 0.03 },
  uPxPerUnit: { value: 1.0 },
  uHighlight: { value: -1.0 },
  uPalette:   { value: PALETTE },
};

function updatePointScale() {
  const h = renderer.getDrawingBufferSize(new THREE.Vector2()).y;
  uniforms.uPxPerUnit.value = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
}
window.addEventListener('resize', updatePointScale);
updatePointScale();

let points = null, material = null, manifest = null, clusterCodes = null, markers = null;

async function loadCells(embeddingName = 'pca') {
  if (points) {
    scene.remove(points);
    points.geometry.dispose();
  }

  manifest = await loadManifest();
  const emb = manifest.embeddings[embeddingName];
  const nCells = emb.n_cells || manifest.n_cells;
  const isSynthetic = emb.synthetic || false;

  const positions = await loadF32('/data/' + emb.file);
  const clusterFile = isSynthetic ? emb.cluster_file : manifest.obs.cluster.file;
  clusterCodes = await loadU8('/data/' + clusterFile);
  markers = await loadJSON('/data/' + manifest.markers);

  if (positions.length !== nCells * 3) throw new Error('positions: size mismatch');
  if (clusterCodes.length !== nCells) throw new Error('cluster codes: size mismatch');

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aCluster', new THREE.BufferAttribute(clusterCodes, 1));

  material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  points = new THREE.Points(geometry, material);
  scene.add(points);
  window.cs.points = points;

  const label = isSynthetic ? 'SYNTHETIC' : 'PCA';
  hudInfo = `${nCells} cells · ${label} · ${manifest.obs.cluster.categories.length} clusters`;
}

loadCells().catch((err) => { console.error(err); hud.textContent = String(err); });

// Dataset selector
const selector = document.createElement('select');
selector.style.cssText = 'position:fixed;top:40px;left:10px;z-index:10;padding:4px;';
selector.innerHTML = `
  <option value="pca">Real (PCA)</option>
  <option value="synth_100k">Synthetic 100k</option>
  <option value="synth_500k">Synthetic 500k</option>
`;
selector.addEventListener('change', () => loadCells(selector.value));
document.body.appendChild(selector);

const tooltip = document.getElementById('tooltip');

function describeCell(i) {
  const label = manifest.obs.cluster.categories[clusterCodes[i]];
  const top = markers.markers[label].slice(0, 3).map((m) => m.gene).join(', ');
  return `cell ${i}<br>cluster ${label}<br>top markers: ${top}`;
}

function showTooltip(i, x, y) {
  if (i < 0) { 
    tooltip.style.display = 'none'; 
    uniforms.uHighlight.value = -1; 
    return; 
  }
  tooltip.innerHTML = describeCell(i);
  tooltip.style.left = x + 14 + 'px';
  tooltip.style.top = y + 14 + 'px';
  tooltip.style.display = 'block';
  uniforms.uHighlight.value = clusterCodes[i];
}

const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.015;
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('pointermove', (e) => {
  if (!points) return;
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(points);
  if (hits.length > 0) {
    showTooltip(hits[0].index, e.clientX, e.clientY);
  } else {
    showTooltip(-1, 0, 0);
  }
});

function update(dt) { /* nothing to animate yet */ }
// ---- CONTENT END ----

const hud = document.getElementById('hud');
let hudInfo = '';
let frames = 0, last = performance.now(), prev = last;

function animate(now) {
  requestAnimationFrame(animate);
  update((now - prev) / 1000);
  prev = now;
  controls.update();
  renderer.render(scene, camera);

  frames++;
  if (now - last > 500) {
    const fps = Math.round(frames * 1000 / (now - last));
    const r = renderer.info.render;
    hud.textContent = `${hudInfo} · ${r.calls} calls · ${r.points} points · ${r.triangles} triangles · ${fps} FPS`;
    frames = 0; last = now;
  }
}
requestAnimationFrame(animate);