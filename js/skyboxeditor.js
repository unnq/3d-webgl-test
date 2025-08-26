// skyboxeditor.js

// Elements
const skyPane = document.getElementById('skyPane');
const closeSkyBtn = document.getElementById('closeSkyPane');
const presetSel = document.getElementById('skyPreset');
const uploadInp = document.getElementById('skyUpload');
const rotRange  = document.getElementById('skyRot');
const rotVal    = document.getElementById('rotVal');
const thumbImg  = document.getElementById('skyThumb');
const applyBtn  = document.getElementById('applySky');
const resetBtn  = document.getElementById('resetSky');

// Target the <a-sky> element
const skyEl = document.getElementById('sky') || document.querySelector('a-sky');

// Save original state for Reset
const originalSrc = skyEl?.getAttribute('src') || '';
const originalRot = skyEl?.getAttribute('rotation') || '0 0 0';

// Track current selected source (preset or upload)
let selectedSrc = originalSrc;
thumbImg.src = selectedSrc || '';

/* ---------- Open/Close ---------- */

// Open when the in-world editor panel is clicked
document.getElementById('skyboxeditor')?.addEventListener('click', openSkyPane);

function openSkyPane() {
  skyPane.classList.add('open');
  skyPane.setAttribute('aria-hidden', 'false');
  skyPane.style.pointerEvents = 'auto';
  skyPane.style.zIndex = '1000';

  // Initialize UI with current sky values
  const rotY = Number((skyEl?.getAttribute('rotation') || '0 0 0').split(' ')[1] || 0);
  rotRange.value = isFinite(rotY) ? rotY : 0;
  rotVal.textContent = `${rotRange.value}°`;
}

function closeSkyPane() {
  skyPane.classList.remove('open');
  skyPane.setAttribute('aria-hidden', 'true');
  skyPane.style.pointerEvents = 'none';
  skyPane.style.zIndex = '-1';
}

document.getElementById('closeSkyPane')?.addEventListener('click', closeSkyPane);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSkyPane(); });

/* ---------- Controls ---------- */

// Preset select
presetSel?.addEventListener('change', () => {
  if (!presetSel.value) return;
  selectedSrc = presetSel.value;
  thumbImg.src = selectedSrc;
});

// Upload image
uploadInp?.addEventListener('change', () => {
  const file = uploadInp.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  selectedSrc = url;
  thumbImg.src = url;
});

// Rotation display
rotRange?.addEventListener('input', () => {
  rotVal.textContent = `${rotRange.value}°`;
});

// Apply to scene
applyBtn?.addEventListener('click', () => {
  if (!skyEl) return;
  if (selectedSrc) {
    // If using an uploaded image URL, A-Frame handles blob URLs fine
    skyEl.setAttribute('src', selectedSrc);
  }
  const y = Number(rotRange.value) || 0;
  skyEl.setAttribute('rotation', `0 ${y} 0`);
});

// Reset to original
resetBtn?.addEventListener('click', () => {
  if (!skyEl) return;
  skyEl.setAttribute('src', originalSrc);
  skyEl.setAttribute('rotation', originalRot);
  selectedSrc = originalSrc;
  thumbImg.src = originalSrc || '';
  const y = Number((originalRot || '0 0 0').split(' ')[1] || 0);
  rotRange.value = isFinite(y) ? y : 0;
  rotVal.textContent = `${rotRange.value}°`;
});

