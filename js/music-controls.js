// Basic open/close
const pane = document.getElementById('musicPane');
const closeBtn = document.getElementById('closePane');
const playBtn = document.getElementById('play');
const pauseBtn = document.getElementById('pause');

// Open when the 3D jukebox is clicked
document.getElementById('jukebox')?.addEventListener('click', () => {
  pane.classList.add('open');
  pane.setAttribute('aria-hidden', 'false');
});

// Close on button or ESC
function closePane() {
  pane.classList.remove('open');
  pane.setAttribute('aria-hidden', 'true');
}
closeBtn.addEventListener('click', closePane);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePane(); });

// ---- YouTube Player API (so play/pause work reliably) ----
// Load API script once
(function loadYT(){
  if (window.YT) return;
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

let ytPlayer;
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('ytPlayer', {
    events: {
      // Optional: start paused so user clicks Play which satisfies autoplay policies.
      'onReady': (e) => { /* e.target.pauseVideo(); */ }
    }
  });
};

// Buttons
playBtn.addEventListener('click', () => { ytPlayer && ytPlayer.playVideo(); });
pauseBtn.addEventListener('click', () => { ytPlayer && ytPlayer.pauseVideo(); });
