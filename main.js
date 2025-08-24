// main.js (ESM with import map in index.html)
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const canvas = document.getElementById('webgl');
const loading = document.getElementById('loading');
const fallback = document.getElementById('fallback');
const title = document.getElementById('modelTitle');
const toggleEnv = document.getElementById('toggleEnv');
const toggleRotate = document.getElementById('toggleRotate');
const toggleWire = document.getElementById('toggleWire');

let renderer, scene, camera, controls, mixer, clock, modelRoot, envMap;
let autoRotate = false;

init();
resize();
window.addEventListener('resize', resize);

// -------------------- init --------------------
async function init() {
  if (!canvas) return;
  clock = new THREE.Clock();

  // Safe renderer init
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    console.error('Three.js renderer init failed:', e);
    showFallback(true);
    return;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1117);

  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(2.8, 1.6, 3.2);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.5;
  controls.panSpeed = 0.6;

  // Ground (optional visual reference)
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(10, 64).rotateX(-Math.PI / 2),
    new THREE.ShadowMaterial({ opacity: 0.18 })
  );
  ground.receiveShadow = true;
  ground.visible = false;
  scene.add(ground);

  // Lights
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(4, 6, 4);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.35));

  envMap = null;

  // UI listeners
  if (toggleWire) toggleWire.addEventListener('change', () => setWireframe(toggleWire.checked));
  if (toggleRotate) toggleRotate.addEventListener('change', () => { autoRotate = toggleRotate.checked; });
  if (toggleEnv) toggleEnv.addEventListener('change', () => applyEnv(toggleEnv.checked));
  const cards = document.getElementById('galleryCards');
  if (cards) cards.addEventListener('click', onCardClick);

  animate();

  // Viewer ready: hide all overlays
  hideOverlays();
  console.log('THREE r' + THREE.REVISION);
}

// -------------------- resize --------------------
function resize() {
  if (!renderer || !camera) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h || 1;
  camera.updateProjectionMatrix();
}

// -------------------- animate --------------------
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  controls.update();
  if (mixer) mixer.update(dt);
  if (autoRotate && modelRoot) modelRoot.rotation.y += dt * 0.5;
  renderer.render(scene, camera);
}

// -------------------- UI handlers --------------------
async function onCardClick(e) {
  const btn = e.target.closest('.card');
  if (!btn) return;
  const url = btn.getAttribute('data-model');
  const name = btn.getAttribute('data-name') || '3D Viewer';
  const hdr = btn.getAttribute('data-env');
  if (title) title.textContent = name;
  await loadModel(url, hdr);
}

// -------------------- env / model loading --------------------
async function ensureEnv(hdrUrl) {
  if (envMap || !hdrUrl) return;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  try {
    const texture = await new RGBELoader().loadAsync(hdrUrl);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    envMap = pmrem.fromEquirectangular(texture).texture;
    texture.dispose();
  } catch (err) {
    console.warn('HDR load failed:', err);
  } finally {
    pmrem.dispose();
  }
  // If toggle is on, apply immediately
  if (toggleEnv?.checked) applyEnv(true);
}

async function loadModel(url, hdrUrl) {
  if (!url) return;

  showLoading(true);

  try {
    await ensureEnv(hdrUrl);

    // Remove previous
    if (modelRoot) {
      scene.remove(modelRoot);
      disposeHierarchy(modelRoot);
      modelRoot = null;
    }

    const loader = new GLTFLoader();
    loader.setCrossOrigin('anonymous'); // help with cross-origin assets
    const gltf = await loader.loadAsync(url);

    modelRoot = gltf.scene || gltf.scenes?.[0];
    if (!modelRoot) throw new Error('No scene in glTF');

    centerAndScale(modelRoot, 1.8);
    scene.add(modelRoot);

    // Animations
    if (gltf.animations?.length) {
      mixer = new THREE.AnimationMixer(modelRoot);
      gltf.animations.forEach(clip => mixer.clipAction(clip).play());
    } else {
      mixer = null;
    }

    // Apply env if available/desired
    if (envMap && toggleEnv?.checked) applyEnv(true);

  } catch (err) {
    console.error('Model load failed:', err);
    alert('Model failed to load. Check the console for details.');
  } finally {
    showLoading(false);
  }
}

// -------------------- helpers --------------------
function centerAndScale(object3D, targetSize = 2) {
  const box = new THREE.Box3().setFromObject(object3D);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);

  object3D.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? (targetSize / maxDim) : 1;
  object3D.scale.setScalar(scale);

  // Sit on ground visually
  const newBox = new THREE.Box3().setFromObject(object3D);
  object3D.position.y -= newBox.min.y;
}

function applyEnv(enabled) {
  // Prefer scene.environment for PBR materials
  scene.environment = enabled ? envMap : null;

  // Also set per-material envMap for non-PBR/legacy cases
  if (!modelRoot) return;
  modelRoot.traverse(obj => {
    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => {
        if ('envMap' in m) {
          m.envMap = enabled ? envMap : null;
          m.needsUpdate = true;
        }
      });
    }
  });
}

function setWireframe(enabled) {
  if (!modelRoot) return;
  modelRoot.traverse(obj => {
    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => { m.wireframe = enabled; });
    }
  });
}

function disposeHierarchy(root) {
  root.traverse(obj => {
    if (obj.isMesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => {
        for (const k in m) {
          const v = m[k];
          if (v && v.isTexture) v.dispose?.();
        }
        m.dispose?.();
      });
      obj.geometry?.dispose?.();
    }
  });
}

// -------------------- overlay controls --------------------
function showLoading(v) {
  if (loading) loading.style.display = v ? 'grid' : 'none';
  if (fallback) fallback.style.display = 'none'; // never show the warning once initialized
}

function hideOverlays() {
  if (loading) loading.style.display = 'none';
  if (fallback) fallback.style.display = 'none';
}

function showFallback(v) {
  if (fallback) fallback.style.display = v ? 'grid' : 'none';
  if (loading) loading.style.display = 'none';
}
