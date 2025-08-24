import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'; // if you use HDR

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

async function init() {
  if (!canvas) return;
  clock = new THREE.Clock();

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
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

  // Ground reference
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(10, 64).rotateX(-Math.PI/2),
    new THREE.ShadowMaterial({ opacity: 0.18 })
  );
  ground.receiveShadow = true;
  ground.position.y = 0;
  ground.visible = false; // purely stylistic; toggle if you add actual shadows
  scene.add(ground);

  // Lighting
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(4, 6, 4);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  // Optional: environment HDR (nice reflections) — lazy loaded on first model load
  envMap = null;

  // Wireframe toggle
  if (toggleWire) toggleWire.addEventListener('change', () => setWireframe(toggleWire.checked));

  // Auto-rotate toggle
  if (toggleRotate) toggleRotate.addEventListener('change', () => {
    autoRotate = toggleRotate.checked;
  });

  // Env toggle
  if (toggleEnv) toggleEnv.addEventListener('change', () => applyEnv(toggleEnv.checked));

  // Card events
  const cards = document.getElementById('galleryCards');
  if (cards) cards.addEventListener('click', onCardClick);

  animate();
}

function resize() {
  if (!renderer || !camera) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  controls.update();
  if (mixer) mixer.update(dt);
  if (autoRotate && modelRoot) modelRoot.rotation.y += dt * 0.5;
  renderer.render(scene, camera);
}

async function onCardClick(e) {
  const btn = e.target.closest('.card');
  if (!btn) return;
  const url = btn.getAttribute('data-model');
  const name = btn.getAttribute('data-name') || '3D Viewer';
  const hdr = btn.getAttribute('data-env');
  if (title) title.textContent = name;
  await loadModel(url, hdr);
}

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
  }
}

async function loadModel(url, hdrUrl) {
  if (!url) return;
  showLoading(true);

  try {
    await ensureEnv(hdrUrl);

    // Clear prior
    if (modelRoot) {
      scene.remove(modelRoot);
      disposeHierarchy(modelRoot);
      modelRoot = null;
    }

    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);

    modelRoot = gltf.scene || gltf.scenes[0];
    if (!modelRoot) throw new Error('No scene in glTF');

    // Optional: center and scale
    centerAndScale(modelRoot, 1.8);

    if (envMap && toggleEnv?.checked) applyEnv(true);

    scene.add(modelRoot);

    // Animations
    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(modelRoot);
      gltf.animations.forEach(clip => mixer.clipAction(clip).play());
    } else {
      mixer = null;
    }

  } catch (err) {
    console.error(err);
    alert('Model failed to load. Check the console for details.');
  } finally {
    showLoading(false);
  }
}

function centerAndScale(object3D, targetSize = 2) {
  // Compute bounding box
  const box = new THREE.Box3().setFromObject(object3D);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);

  // Recenter to origin
  object3D.position.sub(center);

  // Uniform scale to targetSize
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? (targetSize / maxDim) : 1;
  object3D.scale.setScalar(scale);

  // Move slightly up so it sits visually on ground
  object3D.position.y -= (box.min.y * scale);
}

function applyEnv(enabled) {
  if (!modelRoot) return;
  modelRoot.traverse(obj => {
    if (obj.isMesh && obj.material && 'envMap' in obj.material) {
      obj.material.envMap = enabled ? envMap : null;
      obj.material.needsUpdate = true;
    }
  });
}

function setWireframe(enabled) {
  if (!modelRoot) return;
  modelRoot.traverse(obj => {
    if (obj.isMesh && obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.wireframe = enabled);
      } else {
        obj.material.wireframe = enabled;
      }
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

function showLoading(v) {
  if (!loading) return;
  loading.hidden = !v;
  fallback.hidden = true;
}

// Progressive enhancement: detect WebGL
try {
  const test = document.createElement('canvas');
  const ok = !!(window.WebGL2RenderingContext && test.getContext('webgl2')) || !!test.getContext('webgl');
  if (!ok) {
    fallback.hidden = false;
    if (loading) loading.hidden = true;
  }
} catch (e) {
  fallback.hidden = false;
}
