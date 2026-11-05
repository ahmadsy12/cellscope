import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
let points = null;

async function loadF32(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status})`);
  return new Float32Array(await res.arrayBuffer());
}

async function loadCells() {
  const manifest = await (await fetch('/data/manifest.json')).json();
  const positions = await loadF32('/data/' + manifest.embeddings.pca.file);
  if (positions.length !== manifest.n_cells * 3) throw new Error('Size mismatch: manifest vs file');

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({ size: 0.02, color: 0x66ccff, sizeAttenuation: true });

  points = new THREE.Points(geometry, material);
  scene.add(points);
  window.cs.points = points;
  hudInfo = `${manifest.n_cells} cells · PCA`;
}

loadCells().catch((err) => { console.error(err); hud.textContent = String(err); });
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
    hud.textContent = `${hudInfo}  ${Math.round(frames * 1000 / (now - last))} FPS`;
    frames = 0; last = now;
  }
}
requestAnimationFrame(animate);