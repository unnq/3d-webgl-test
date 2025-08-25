// Camera HUD: shows camera position/rotation; press "C" to toggle.
AFRAME.registerComponent('cam-hud', {
  schema: { enabled: {default: true}, throttle: {default: 100} }, // ms
  init() {
    // Create overlay
    this.box = document.createElement('div');
    Object.assign(this.box.style, {
      position:'fixed', left:'10px', top:'10px', padding:'6px 8px',
      background:'rgba(12,14,20,.75)', color:'#cdd3e1', font:'12px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace',
      border:'1px solid #20242f', borderRadius:'6px', zIndex:'9999', pointerEvents:'none'
    });
    document.body.appendChild(this.box);

    // Track active camera when it changes
    this.camEl = null;
    this.onCam = (e) => { this.camEl = e.detail.cameraEl || e.detail.camera; };
    this.el.sceneEl.addEventListener('camera-set-active', this.onCam);
    // In case camera already active:
    if (this.el.sceneEl.camera && this.el.sceneEl.camera.el) this.camEl = this.el.sceneEl.camera.el;

    // Toggle with "C"
    this.onKey = (e) => {
      if (e.key.toLowerCase() === 'c') {
        this.data.enabled = !this.data.enabled;
        this.box.style.display = this.data.enabled ? 'block' : 'none';
      }
    };
    window.addEventListener('keydown', this.onKey);

    this._last = 0;
  },
  tick(time) {
    if (!this.data.enabled || !this.camEl) return;
    if (time - this._last < this.data.throttle) return;
    this._last = time;

    const o3d = this.camEl.object3D;
    const p = o3d.position;
    const r = o3d.rotation; // radians
    const deg = AFRAME.THREE.MathUtils.radToDeg;

    const line1 = `pos  x:${p.x.toFixed(2)}  y:${p.y.toFixed(2)}  z:${p.z.toFixed(2)}`;
    const line2 = `rot  pitch:${deg(r.x).toFixed(1)}  yaw:${deg(r.y).toFixed(1)}  roll:${deg(r.z).toFixed(1)}`;
    this.box.textContent = `${line1}\n${line2}`;
  },
  remove() {
    this.el.sceneEl.removeEventListener('camera-set-active', this.onCam);
    window.removeEventListener('keydown', this.onKey);
    this.box && this.box.remove();
  }
});
