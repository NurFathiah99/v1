/* ── effects.js ── Hearts, petals, floating love notes ── */
import { isMobile, prefersReducedMotion } from './config.js';
import { softBeep } from './utils.js';

/* ── Hearts ── */
const HEARTS = ['💖','💗','💕','🌸','✨','💫','🌷'];
const particles = document.getElementById('particles');

export function spawnHeart(x, y, scale = 1) {
  if (prefersReducedMotion || !particles) return;
  const el = document.createElement('div');
  el.className = 'floating-heart';
  el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  el.style.cssText = `left:${x - 10}px;top:${y - 10}px;opacity:1;transform:translateY(0) scale(${scale});position:absolute;`;
  particles.appendChild(el);
  const dx = (Math.random() - 0.5) * 70;
  const dur = 1400 + Math.random() * 800;
  const start = performance.now();
  (function frame(t) {
    const p = (t - start) / dur;
    if (p >= 1) { el.remove(); return; }
    el.style.transform = `translate(${dx * p}px, ${-90 * p}px) scale(${scale}) rotate(${p * 25}deg)`;
    el.style.opacity = String(1 - p);
    requestAnimationFrame(frame);
  })(performance.now());
}

/* ── Click hearts on tap ── */
export function initClickHearts() {
  window.addEventListener('click', e => {
    spawnHeart(e.clientX, e.clientY, 0.8 + Math.random() * 0.6);
    softBeep(540 + Math.random() * 120, 0.15, 0.035);
  }, { passive: true });
}

/* ── Love btn burst ── */
export function initLoveBtnBurst() {
  const loveBtn = document.getElementById('loveBtn');
  if (!loveBtn) return;
  loveBtn.addEventListener('click', () => {
    const r = loveBtn.getBoundingClientRect();
    const n = isMobile ? 8 : 14;
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        spawnHeart(
          r.left + r.width / 2 + (Math.random() - 0.5) * r.width * 1.4,
          r.top + r.height / 2 + (Math.random() - 0.5) * r.height * 1.4,
          0.9 + Math.random() * 0.9
        );
      }, i * 28);
    }
    softBeep(680, 0.22, 0.045);
  });
}

/* ── Petals ── */
export function initPetals() {
  const petals = document.getElementById('petals');
  if (!petals) return;

  function spawnPetal() {
    if (prefersReducedMotion) return;
    const el = document.createElement('div');
    el.className = 'petal';
    const size = isMobile ? 7 + Math.random() * 10 : 10 + Math.random() * 14;
    el.style.cssText = `left:${Math.random() * innerWidth}px;width:${size}px;height:${size}px;`;
    petals.appendChild(el);
    const dur = (isMobile ? 10000 : 8000) + Math.random() * 7000;
    el.style.animation = `petalFall ${dur}ms linear forwards`;
    setTimeout(() => el.remove(), dur + 100);
  }

  const maxPetals = isMobile ? 10 : 16;
  setInterval(() => { if (petals.children.length < maxPetals) spawnPetal(); }, isMobile ? 1100 : 750);
}

/* ── Floating love notes ── */
export function initFloatingNotes() {
  // Disabled as per user request to remove floating text
}

/* ── Pointer move hearts on desktop ── */
export function initPointerHearts() {
  if (isMobile || prefersReducedMotion) return;
  let lastMove = 0;
  window.addEventListener('pointermove', e => {
    const now = performance.now();
    if (now - lastMove > 55) { spawnHeart(e.clientX, e.clientY, 0.55 + Math.random() * 0.4); lastMove = now; }
  }, { passive: true });
}

/* ── Gallery drag scroll ── */
export function initGalleryScroll() {
  const track = document.getElementById('galleryTrack');
  if (!track) return;
  let isDown = false, startX, scrollLeft, autoPaused = false, resumeTimer = null;
  const pauseAuto  = () => { autoPaused = true; if (resumeTimer) clearTimeout(resumeTimer); };
  const resumeAuto = () => { if (resumeTimer) clearTimeout(resumeTimer); resumeTimer = setTimeout(() => { autoPaused = false; }, 1600); };

  track.addEventListener('pointerdown', e => { isDown = true; track.setPointerCapture(e.pointerId); startX = e.pageX - track.offsetLeft; scrollLeft = track.scrollLeft; pauseAuto(); }, { passive: true });
  track.addEventListener('pointermove', e => { if (!isDown) return; track.scrollLeft = scrollLeft - (e.pageX - track.offsetLeft - startX) * 1.1; }, { passive: true });
  const stopDrag = e => { if (!isDown) return; isDown = false; try { track.releasePointerCapture(e.pointerId); } catch(e) {} resumeAuto(); };
  track.addEventListener('pointerup', stopDrag, { passive: true });
  track.addEventListener('pointercancel', stopDrag, { passive: true });
  track.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > 0) { track.scrollLeft += e.deltaY * 0.8; e.preventDefault(); } }, { passive: false });

  // photo tap hearts
  track.querySelectorAll('.photo').forEach(photo => {
    photo.addEventListener('click', () => {
      const r = photo.getBoundingClientRect();
      for (let i = 0; i < 5; i++) {
        setTimeout(() => spawnHeart(r.left + r.width / 2 + (Math.random() - 0.5) * r.width, r.top + r.height / 2, 0.7 + Math.random() * 0.5), i * 40);
      }
    });
  });

  // auto-scroll
  let autoSpeed = isMobile ? 0.10 : 0.22;
  function autoStep() {
    if (!autoPaused) {
      track.scrollLeft += autoSpeed;
      if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 1) track.scrollLeft = 0;
    }
    requestAnimationFrame(autoStep);
  }
  if (!prefersReducedMotion) requestAnimationFrame(autoStep);
}

/* ── Scroll reveal (fade-reveal) ── */
export function observeFadeReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('revealed'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-reveal:not(.revealed)').forEach(el => io.observe(el));
}

/* ── Initialize all effects ── */
export function initAllEffects() {
  initClickHearts();
  initLoveBtnBurst();
  initPetals();
  initPointerHearts();
  initGalleryScroll();
  observeFadeReveal();
}
