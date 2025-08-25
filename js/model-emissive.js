// Keep emissive boost for meshes that already have non-black emissive color
(function () {
  const el = document.querySelector('[gltf-model]');
  if (!el) return;
  el.addEventListener('model-loaded', (e) => {
    const g = e.detail.model;
    g.traverse((o) => {
      if (o.isMesh && o.material && o.material.emissive) {
        const c = o.material.emissive;
        if ((c.r + c.g + c.b) > 0.001) {
          o.material.emissiveIntensity = 10.0; // tweak 6–12 to taste
          o.material.needsUpdate = true;
        }
      }
    });
  });
})();
