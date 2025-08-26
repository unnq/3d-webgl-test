// hover-highlight.js
if (window.AFRAME) {
  AFRAME.registerComponent('hover-highlight', {
    schema: { color:{default:'#ffd54a'}, emissiveIntensity:{default:0.8}, scale:{default:1.06} },
    init() {
      this._savedScale = this.el.object3D.scale.clone();
      this.onEnter = () => { document.body.style.cursor='pointer'; this.apply(true); };
      this.onLeave = () => { document.body.style.cursor='';        this.apply(false); };
      this.el.addEventListener('mouseenter', this.onEnter);
      this.el.addEventListener('mouseleave', this.onLeave);
    },
    apply(on) {
      const s = this.data, o3d = this.el.object3D;
      // scale feedback
      if (on) o3d.scale.set(this._savedScale.x*s.scale, this._savedScale.y*s.scale, this._savedScale.z*s.scale);
      else    o3d.scale.copy(this._savedScale);
      // material feedback
      o3d.traverse(obj => {
        if (!obj.isMesh || !obj.material) return;
        const mat = obj.material;
        if (on) {
          if (!obj.userData.__orig) {
            obj.userData.__orig = {
              color: mat.color ? mat.color.clone() : null,
              emissive: mat.emissive ? mat.emissive.clone() : null,
              ei: mat.emissiveIntensity ?? 1
            };
          }
          if (mat.emissive) {
            mat.emissive.set(s.color);
            mat.emissiveIntensity = Math.max(obj.userData.__orig.ei, s.emissiveIntensity);
            mat.needsUpdate = true;
          } else if (mat.color) {
            mat.color.set(s.color);
          }
        } else if (obj.userData.__orig) {
          const orig = obj.userData.__orig;
          if (mat.emissive && orig.emissive) {
            mat.emissive.copy(orig.emissive);
            mat.emissiveIntensity = orig.ei;
            mat.needsUpdate = true;
          }
          if (mat.color && orig.color) mat.color.copy(orig.color);
          delete obj.userData.__orig;
        }
      });
    },
    remove() {
      this.el.removeEventListener('mouseenter', this.onEnter);
      this.el.removeEventListener('mouseleave', this.onLeave);
    }
  });
}
