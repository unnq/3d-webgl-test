// Basic open/close
const pane = document.getElementById('musicPane');
const closeBtn = document.getElementById('closePane');
const playBtn = document.getElementById('play');
const pauseBtn = document.getElementById('pause');

// Open when the 3D jukebox is clicked
document.getElementById('jukebox')?.addEventListener('click', () => {
  pane.classList.add('open');
  pane.setAttribute('aria-hidden', 'false');
  pane.style.pointerEvents = 'auto';
  pane.style.zIndex = '1000';
  if (ytPlayer?.getIframe()) {
    ytPlayer.getIframe().style.pointerEvents = 'auto';
  }
});

// Close on button or ESC
function closePane() {
  pane.classList.remove('open');
  pane.setAttribute('aria-hidden', 'true');
  pane.style.pointerEvents = 'none';
  pane.style.zIndex = '-1';
  if (ytPlayer?.getIframe()) {
    ytPlayer.getIframe().style.pointerEvents = 'none';
  }
  // Pause video when closing
  if (ytPlayer?.pauseVideo) {
    ytPlayer.pauseVideo();
  }
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
      'onReady': (e) => {
        // Set initial state
        const iframe = ytPlayer.getIframe();
        if (iframe) {
          iframe.style.pointerEvents = 'none';
        }
        pane.style.pointerEvents = 'none';
        pane.style.zIndex = '-1';
      }
    }
  });
};

// Buttons
playBtn.addEventListener('click', () => { ytPlayer && ytPlayer.playVideo(); });
pauseBtn.addEventListener('click', () => { ytPlayer && ytPlayer.pauseVideo(); });
