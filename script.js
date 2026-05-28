(() => {
'use strict';

/* ── Device detection ── */
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
const isLowEnd = navigator.deviceMemory ? navigator.deviceMemory <= 2 : false;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Loading screen with cute texts ── */
const loadingTexts = [
  'Preparing something cute for you... 🌸',
  'Waking up the butterflies... 🦋',
  'Sprinkling a little love... 💖',
  'Loading cyg\'s fave things... 🍜',
  'Gathering all the good vibes... ✨',
  'One sec, bubu is almost ready... 🥺',
  'Almost there, sayang! 💕',
];

const loadingScreen = document.getElementById('loadingScreen');
const loadingTextEl = document.getElementById('loadingText');
const appEl = document.getElementById('app');

if (loadingTextEl) {
  loadingTextEl.textContent = loadingTexts[Math.floor(Math.random() * loadingTexts.length)];
}

function hideLoading() {
  setTimeout(() => {
    if (loadingScreen) {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
    }
    if (appEl) {
      appEl.style.transition = 'opacity 0.6s ease';
      appEl.style.opacity = '1';
    }
  }, 1100);
}

window.addEventListener('load', hideLoading);

/* ── DOM refs ── */
const particles      = document.getElementById('particles');
const petals         = document.getElementById('petals');
const loveNotesCont  = document.getElementById('loveNotes');
const loveBtn        = document.getElementById('loveBtn');
const soundToggle    = document.getElementById('soundToggle');
const bgm            = document.getElementById('bgm');
const bgVideoEl      = document.getElementById('bgVideo');
const mainVidEl      = document.getElementById('mainVid');
const audioHint      = document.getElementById('audioHint');
const dailyMsgEl     = document.getElementById('dailyMsg');
const newMsgBtn      = document.getElementById('newMsgBtn');
const moodToast      = document.getElementById('moodToast');
const moodGrid       = document.getElementById('moodGrid');
const notesList      = document.getElementById('notesList');
const greetEmojiEl   = document.getElementById('greetEmoji');
const greetTitleEl   = document.getElementById('greetTitle');
const greetMsgEl     = document.getElementById('greetMsg');
const bottomNav      = document.getElementById('bottomNav');
const pages          = document.querySelectorAll('.page');
const navBtns        = document.querySelectorAll('.nav-btn');

/* ── Video setup: all videos start muted (autoplay policy) ── */
const memoryVidEl = document.getElementById('memoryVid');
[bgVideoEl, mainVidEl, memoryVidEl].forEach(v => {
  if (!v) return;
  v.muted = true;
  v.playsInline = true;
  if (isMobile) v.preload = 'metadata';
  v.play().catch(() => {});
});

/* ── Audio context (for UI beeps only) ── */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioCtx ? new AudioCtx() : null;

function softBeep(freq = 600, duration = 0.18, vol = 0.04) {
  if (!audioCtx || isLowEnd) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 0.015);
    g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    setTimeout(() => o.stop(), duration * 1000 + 50);
  } catch(e) {}
}

function resumeAudioCtx() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  window.removeEventListener('pointerdown', resumeAudioCtx);
}
window.addEventListener('pointerdown', resumeAudioCtx, { passive: true });

/* ── BGM toggle
     No bgm.mp3 in folder, so we unmute mainVid as the music source.
     bgVideoEl stays muted (background). bgm <audio> used if file exists. ── */
let audioOn = false;

function setAudioUI(on) {
  soundToggle.textContent = on ? '🔊' : '🔇';
  if (audioHint) audioHint.textContent = on
    ? 'Music on 🎵 Tap to mute'
    : 'Tap 🔇 to start music 🎵';
}

async function tryPlayAudio() {
  // 1. Try <audio> bgm.mp3 first
  if (bgm && bgm.readyState >= 2) {
    bgm.volume = 0.55;
    try { await bgm.play(); return true; } catch(e) {}
  }
  // 2. Fallback: unmute the hero video (it has its own audio)
  if (mainVidEl) {
    mainVidEl.muted = false;
    mainVidEl.volume = 0.7;
    try { await mainVidEl.play(); return true; } catch(e) { mainVidEl.muted = true; }
  }
  return false;
}

function stopAudio() {
  if (bgm) { bgm.pause(); bgm.currentTime = 0; }
  if (mainVidEl) { mainVidEl.muted = true; mainVidEl.play().catch(() => {}); }
}

if (soundToggle) {
  soundToggle.addEventListener('click', async () => {
    if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    if (!audioOn) {
      const ok = await tryPlayAudio();
      if (ok) { audioOn = true; setAudioUI(true); }
      else {
        // Still show feedback even if no audio file
        audioOn = true; setAudioUI(true);
        if (audioHint) audioHint.textContent = 'No music file found 🥺 Add bgm.mp3!';
      }
    } else {
      stopAudio();
      audioOn = false;
      setAudioUI(false);
    }
  });
}

/* ── Hearts ── */
const HEARTS = ['💖','💗','💕','🌸','✨','💫','🌷'];

function spawnHeart(x, y, scale = 1) {
  if (prefersReducedMotion) return;
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
window.addEventListener('click', e => {
  spawnHeart(e.clientX, e.clientY, 0.8 + Math.random() * 0.6);
  softBeep(540 + Math.random() * 120, 0.15, 0.035);
}, { passive: true });

/* ── Love btn burst ── */
if (loveBtn) {
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

/* ── Floating love notes ── */
const floatingTexts = [
  'MyCutiePie 💖', 'Cyg ku AcuBucuk2 😚', 'Atototomey baby 🥺',
  'Belajar leklok okay 📚💗', 'Jangan nuckal2 okeyh 😤❤️',
  'Sleep awal tau sayang 😴', 'Proud of you always 💕',
  'Thank you sebab selalu ada 💖', 'Mwah mwah for you 😚',
  'Forever my fav human 💗', 'Jangan skip makan tau 🍜',
];

function createFloatingNote(text, x, y, floating = false, timeout = 6000) {
  if (!loveNotesCont || prefersReducedMotion) return;
  const el = document.createElement('div');
  el.className = 'love-note' + (floating ? ' floating' : '');
  el.textContent = text;
  const cx = Math.min(Math.max(x, 6), window.innerWidth - 150);
  const cy = Math.min(Math.max(y, 6), window.innerHeight - 40);
  el.style.cssText = `left:${cx}px;top:${cy}px;`;
  loveNotesCont.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
  setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 420); }, timeout);
}

setInterval(() => {
  if (prefersReducedMotion) return;
  const t = floatingTexts[Math.floor(Math.random() * floatingTexts.length)];
  createFloatingNote(t, Math.random() * window.innerWidth, (0.15 + Math.random() * 0.6) * window.innerHeight, true, 6000 + Math.random() * 4000);
}, isMobile ? 3500 : 2600);

/* ── Daily sweet messages ── */
const dailyMessages = [
  'You are the highlight of every single day 🌸',
  'Hey cyg, just a reminder — you\'re doing amazing 💕',
  'Aaaa cyg dah makan belum? Jangan skip mkn okay! protein! 🍜',
  'You\'re so cute even when you don\'t notice it 🥺',
  'Today is a great day because you\'re in it ✨',
  'Cyg, jangan stress sangat. Breathe. I got you 🫶',
  'Ingat tau, rehat pun penting sama macam belajar 💖',
  'Miss you always, even bila tengah buat kerja 🌷',
  'You\'re my comfort even from far away 🌸',
  'Keep going cyg, you\'re stronger than you think 💪🏻',
  'Nanti kite  cari tiramisu ye 🥺💗',
  'You deserve all the nice things, tau tak? 🌷',
];

let lastMsgIdx = -1;
function getRandomMsg() {
  let idx;
  do { idx = Math.floor(Math.random() * dailyMessages.length); } while (idx === lastMsgIdx);
  lastMsgIdx = idx;
  return dailyMessages[idx];
}

function showDailyMsg() {
  if (!dailyMsgEl) return;
  dailyMsgEl.style.transition = 'opacity 0.3s ease';
  dailyMsgEl.style.opacity = '0';
  setTimeout(() => {
    dailyMsgEl.textContent = getRandomMsg();
    dailyMsgEl.style.opacity = '1';
  }, 300);
}

showDailyMsg();
if (newMsgBtn) newMsgBtn.addEventListener('click', () => { showDailyMsg(); softBeep(620, 0.18, 0.04); });

/* ── Greeting card (morning / night) ── */
function setGreeting() {
  const hour = new Date().getHours();
  let emoji, title, msg;
  if (hour >= 5 && hour < 12) {
    emoji = '🌅'; title = 'Good Morning, Cyg! 🌸';
    msg = 'Dah bangun? Jangan lupa breakfast ya sayang, nanti lapar 🥺 Start your day bright!';
  } else if (hour >= 12 && hour < 15) {
    emoji = '☀️'; title = 'Good Afternoon, Cyg! 💛';
    msg = 'Tengah hari dah ni~ Jangan lupa makan tengah hari okay! Kueyteow ke? 🍜 hehe';
  } else if (hour >= 15 && hour < 18) {
    emoji = '🌤️'; title = 'Hey Cyg 💕';
    msg = 'Petang dah. Rehat jap, minum air, tarik nafas sebentar 🌷 You\'re doing great today!';
  } else if (hour >= 18 && hour < 21) {
    emoji = '🌇'; title = 'Good Evening, Cyg 🌷';
    msg = 'Malam dah ni~ Dah makan malam belum? Jangan lupa makan tau, nanti baby risau 🥺💕';
  } else {
    emoji = '🌙'; title = 'Good Night, Cyg 🌙';
    msg = 'Dah lewat malam ni. Letak phone, rest sikit ya sayang. Sweet dreams always 💖 bubu loves you!';
  }
  if (greetEmojiEl) greetEmojiEl.textContent = emoji;
  if (greetTitleEl) greetTitleEl.textContent = title;
  if (greetMsgEl)  greetMsgEl.textContent = msg;
}
setGreeting();

/* ── Mood buttons ── */
const moodData = {
  happy: {
    msg: 'Aaaa good baby! Nampak happy harini hehe 💖 That smile of yours priceless tau!',
    hearts: 12, beep: 720,
  },
  sad: {
    msg: 'It\'s okay cyg, rehat jap ya 🥺 Bubu ada je, jangan tanggung sorang-sorang tau. You\'re not alone 🫶',
    hearts: 6, beep: 480,
  },
  tired: {
    msg: 'Penat eh baby? 😪 Jangan lupa minum air dan rest tau. Letak kerja jap, you deserve a break 🌸',
    hearts: 7, beep: 510,
  },
  stress: {
    msg: 'Slowly okay syg, jangan pressure diri sangat 💕 One step at a time. I believe in you always 🌷',
    hearts: 8, beep: 550,
  },
  excited: {
    msg: 'AAAA excited mode on!! ✨ Tell me tell me, apa yang best?? Nak tau jugak 🥳💖',
    hearts: 16, beep: 780,
  },
  missyou: {
    msg: 'Rindu cyg kat sini jugak tau 🥺💗 Nanti jumpa okay? Jangan rindu sangat, bubu sentiasa ada dalam hati 💖',
    hearts: 10, beep: 600,
  },
  hungry: {
    msg: 'Nak kueyteow kungfu ke tuuu 🍜 Hahaha cyg Johor girl la katakan~ Pergi makan jangan tangguh! 😋',
    hearts: 9, beep: 640,
  },
};

let moodToastTimer = null;

function showMoodToast(msg) {
  if (!moodToast) return;
  moodToast.textContent = msg;
  moodToast.classList.add('show');
  if (moodToastTimer) clearTimeout(moodToastTimer);
  moodToastTimer = setTimeout(() => moodToast.classList.remove('show'), 5500);
}

if (moodGrid) {
  moodGrid.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      const data = moodData[mood];
      if (!data) return;

      // toggle selected style
      moodGrid.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // show toast
      showMoodToast(data.msg);

      // spawn hearts from button
      const r = btn.getBoundingClientRect();
      const n = data.hearts || 8;
      for (let i = 0; i < n; i++) {
        setTimeout(() => {
          spawnHeart(
            r.left + r.width / 2 + (Math.random() - 0.5) * 80,
            r.top + r.height / 2 + (Math.random() - 0.5) * 60,
            0.7 + Math.random() * 0.8
          );
        }, i * 35);
      }

      softBeep(data.beep || 600, 0.2, 0.042);

      // bounce animation
      btn.style.transition = 'transform 0.15s ease';
      btn.style.transform = 'scale(1.22)';
      setTimeout(() => { btn.style.transform = ''; }, 160);
    });
  });
}

/* ── Page navigation ── */
function switchPage(targetPage) {
  pages.forEach(p => p.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));

  const page = document.getElementById('page' + targetPage.charAt(0).toUpperCase() + targetPage.slice(1));
  if (page) page.classList.add('active');

  const btn = document.querySelector(`.nav-btn[data-page="${targetPage}"]`);
  if (btn) btn.classList.add('active');

  // re-observe fade-reveal on newly visible page
  setTimeout(observeFadeReveal, 50);
  softBeep(560, 0.14, 0.03);
}

if (bottomNav) {
  bottomNav.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
  });
}

/* ── Notes page content ── */
const notesData = [
  {
    tag: '💌 From Bubu',
    body: 'Cyg, terima kasih sebab sabar dengan bubu. I know sometimes bubu buat perangai jugak, but I\'m always trying to be better for you 🥺💕',
    from: '— Your Baby 🌸'
  },
  {
    tag: '✨ Just Because',
    body: 'You make the boring days feel warm and the good days feel magical. I don\'t always say it tapi I notice everything you do 🌷',
    from: '— Your Baby 💗'
  },
  {
    tag: '🍜 Easter Egg hehe',
    body: 'One day nak bawak cyg makan kueyteow kungfu yang paling best kat Johor. Jangan lupa sambal kicap okay 😋 My treat forever!',
    from: '— Your Baby 🌸'
  },
  {
    tag: '🌙 Goodnight Note',
    body: 'Wherever you are right now, I hope you\'re resting well. Sweet dreams sayang. Tomorrow will be a good day, I promise 🌸',
    from: '— Your Baby 💖'
  },
  {
    tag: '🎀 Reminder',
    body: 'You are enough. You are more than enough. Don\'t let anyone — including yourself — make you feel otherwise 💕',
    from: '— Your Baby 🫶'
  },
];

if (notesList) {
  notesData.forEach((n, i) => {
    const card = document.createElement('div');
    card.className = 'note-card fade-reveal';
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <span class="note-tag">${n.tag}</span>
      <p class="note-body">${n.body}</p>
      <span class="note-from">${n.from}</span>
    `;
    notesList.appendChild(card);
  });
}

/* ── Gallery drag scroll ── */
const track = document.getElementById('galleryTrack');
if (track) {
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
function observeFadeReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('revealed'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-reveal:not(.revealed)').forEach(el => io.observe(el));
}
observeFadeReveal();

/* ── Pointer move hearts on desktop ── */
if (!isMobile && !prefersReducedMotion) {
  let lastMove = 0;
  window.addEventListener('pointermove', e => {
    const now = performance.now();
    if (now - lastMove > 55) { spawnHeart(e.clientX, e.clientY, 0.55 + Math.random() * 0.4); lastMove = now; }
  }, { passive: true });
}

})();
