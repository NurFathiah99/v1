(() => {
'use strict';

/* ── CONFIGURATION (Edit with your credentials) ── */
const FIREBASE_CONFIG = (window.ENV_CONFIG && window.ENV_CONFIG.firebase) ? window.ENV_CONFIG.firebase : {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const CLOUDINARY_CONFIG = (window.ENV_CONFIG && window.ENV_CONFIG.cloudinary) ? window.ENV_CONFIG.cloudinary : {
  cloudName: "",
  uploadPreset: ""
};

function getConfig() {
  const localFbApiKey = localStorage.getItem('fb_apiKey');
  const localFbProjId = localStorage.getItem('fb_projectId');
  const localFbAppId = localStorage.getItem('fb_appId');
  const localCloudName = localStorage.getItem('cl_cloudName');
  const localUploadPreset = localStorage.getItem('cl_uploadPreset');

  return {
    firebase: {
      apiKey: localFbApiKey || FIREBASE_CONFIG.apiKey,
      projectId: localFbProjId || FIREBASE_CONFIG.projectId,
      appId: localFbAppId || FIREBASE_CONFIG.appId,
      authDomain: (localFbProjId || FIREBASE_CONFIG.projectId) ? `${localFbProjId || FIREBASE_CONFIG.projectId}.firebaseapp.com` : ""
    },
    cloudinary: {
      cloudName: localCloudName || CLOUDINARY_CONFIG.cloudName,
      uploadPreset: localUploadPreset || CLOUDINARY_CONFIG.uploadPreset
    }
  };
}

let db = null;
const config = getConfig();

if (window.firebase && config.firebase.projectId && config.firebase.projectId !== "YOUR_PROJECT_ID") {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config.firebase);
    }
    db = firebase.firestore();
  } catch (err) {
    console.error("Firebase init error:", err);
  }
}

/* ── Device detection ── */
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
const isLowEnd = navigator.deviceMemory ? navigator.deviceMemory <= 2 : false;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Loading screen with cute texts ── */
const loadingScreen = document.getElementById('loadingScreen');
const loadingTextEl = document.getElementById('loadingText');
const appEl = document.getElementById('app');

function startLoadingExperience() {
  const barFill = document.getElementById('loadingBarFill');
  const percentEl = document.getElementById('loadingPercent');
  const leftHeart = document.getElementById('leftHeart');
  const rightHeart = document.getElementById('rightHeart');
  const mergedHeart = document.getElementById('mergedHeart');
  const loadingCursor = document.getElementById('loadingCursor');
  const textContentEl = document.getElementById('loadingTextContent');
  
  if (!barFill || !percentEl) {
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (appEl) appEl.style.opacity = '1';
    return;
  }

  let progress = 0;
  const targetText = "I LOVE YOU";
  let lastTextLength = 0;

  function updateTypingText(text) {
    if (!textContentEl) return;
    
    if (text.length > lastTextLength) {
      textContentEl.innerHTML = '';
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.textContent = text[i];
        if (i >= lastTextLength) {
          span.className = 'pop-letter';
        }
        textContentEl.appendChild(span);
      }
      lastTextLength = text.length;
    } else if (text.length < lastTextLength) {
      textContentEl.innerHTML = '';
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.textContent = text[i];
        textContentEl.appendChild(span);
      }
      lastTextLength = text.length;
    }
  }

  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 3) + 2;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      
      barFill.style.width = '100%';
      percentEl.textContent = '100%';
      
      updateTypingText("I LOVE YOU ❤️");
      if (loadingCursor) loadingCursor.style.display = 'none';
      if (loadingTextEl) loadingTextEl.classList.add('heartbeat');
      
      if (leftHeart && rightHeart && mergedHeart) {
        leftHeart.style.transform = 'translateX(40px) scale(0.7)';
        leftHeart.style.opacity = '0';
        rightHeart.style.transform = 'translateX(-40px) scale(0.7)';
        rightHeart.style.opacity = '0';
        
        setTimeout(() => {
          leftHeart.style.display = 'none';
          rightHeart.style.display = 'none';
          mergedHeart.style.display = 'inline-block';
          softBeep(720, 0.25, 0.05);
          
          setTimeout(() => {
            if (loadingTextEl) {
              loadingTextEl.classList.remove('heartbeat');
            }
            if (textContentEl) {
              textContentEl.textContent = "Our love is connected.";
            }
            
            setTimeout(() => {
              if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
              }
              if (appEl) {
                appEl.style.transition = 'opacity 0.6s ease';
                appEl.style.opacity = '1';
              }
            }, 1000);
          }, 1200);
        }, 500);
      } else {
        setTimeout(() => {
          if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
          }
          if (appEl) {
            appEl.style.opacity = '1';
          }
        }, 1000);
      }
    } else {
      barFill.style.width = progress + '%';
      percentEl.textContent = progress + '%';
      
      const charIndex = Math.min(Math.floor(progress / 10), 9);
      const subText = targetText.substring(0, charIndex + 1);
      updateTypingText(subText);
    }
  }, 50);
}

window.addEventListener('load', startLoadingExperience);

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
  soundToggle.innerHTML = on ? '<i data-lucide="volume-2"></i>' : '<i data-lucide="volume-x"></i>';
  if (audioHint) {
    audioHint.innerHTML = on
      ? 'Music on <i data-lucide="music" style="width: 14px; height: 14px;"></i> Tap to mute'
      : 'Tap <i data-lucide="volume-x" style="width: 14px; height: 14px;"></i> to start music';
  }
  if (window.lucide) window.lucide.createIcons();
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

let activeDailyMessages = [...dailyMessages];

let lastMsgIdx = -1;
function getRandomMsg() {
  let idx;
  do { idx = Math.floor(Math.random() * activeDailyMessages.length); } while (idx === lastMsgIdx);
  lastMsgIdx = idx;
  return activeDailyMessages[idx];
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
  let iconName, title, msg;
  if (hour >= 5 && hour < 12) {
    iconName = 'sunrise'; title = 'Good Morning, Cyg! 🌸';
    msg = 'Dah bangun? Jangan lupa breakfast ya sayang, nanti lapar 🥺 Start your day bright!';
  } else if (hour >= 12 && hour < 15) {
    iconName = 'sun'; title = 'Good Afternoon, Cyg! 💛';
    msg = 'Tengah hari dah ni~ Jangan lupa makan tengah hari okay! Kueyteow ke? 🍜 hehe';
  } else if (hour >= 15 && hour < 18) {
    iconName = 'cloud-sun'; title = 'Hey Cyg 💕';
    msg = 'Petang dah. Rehat jap, minum air, tarik nafas sebentar 🌷 You\'re doing great today!';
  } else if (hour >= 18 && hour < 21) {
    iconName = 'sunset'; title = 'Good Evening, Cyg 🌷';
    msg = 'Malam dah ni~ Dah makan malam belum? Jangan lupa makan tau, nanti baby risau 🥺💕';
  } else {
    iconName = 'moon'; title = 'Good Night, Cyg 🌙';
    msg = 'Dah lewat malam ni. Letak phone, rest sikit ya sayang. Sweet dreams always 💖 bubu loves you!';
  }
  if (greetEmojiEl) {
    greetEmojiEl.innerHTML = `<i data-lucide="${iconName}" style="width: 32px; height: 32px;"></i>`;
  }
  if (greetTitleEl) greetTitleEl.textContent = title;
  if (greetMsgEl)  greetMsgEl.textContent = msg;
  if (window.lucide) window.lucide.createIcons();
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

let toastTimer = null;

function showToast(msg, type = 'info') {
  if (!moodToast) return;
  moodToast.classList.remove('success', 'error', 'info');
  moodToast.classList.add(type);
  moodToast.textContent = msg;
  moodToast.classList.add('show');
  
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    moodToast.classList.remove('show');
  }, type === 'error' ? 6000 : 4500);
}

function showMoodToast(msg) {
  showToast(msg, 'info');
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

// Memories Switcher Page Navigation Buttons
if (window.viewAllMemoriesBtn) {
  viewAllMemoriesBtn.addEventListener('click', () => {
    switchPage('memories');
  });
}

// Gallery Tab Switchers (Photos / Videos)
if (window.memShowPhotosBtn && window.memShowVideosBtn) {
  memShowPhotosBtn.addEventListener('click', () => {
    currentMemoriesTab = 'photos';
    memShowPhotosBtn.classList.add('active');
    memShowVideosBtn.classList.remove('active');
    renderMemories(activeMemoriesData);
  });
  
  memShowVideosBtn.addEventListener('click', () => {
    currentMemoriesTab = 'videos';
    memShowVideosBtn.classList.add('active');
    memShowPhotosBtn.classList.remove('active');
    renderMemories(activeMemoriesData);
  });
}

// Lightbox modal close triggers
if (window.lightboxClose) {
  lightboxClose.addEventListener('click', closeLightbox);
}
if (window.lightboxModal) {
  lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) {
      closeLightbox();
    }
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

// Render Notes dynamically
function renderNotes(data) {
  if (!notesList) return;
  notesList.innerHTML = "";
  data.forEach((n, i) => {
    const card = document.createElement('div');
    card.className = 'note-card fade-reveal revealed';
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <span class="note-tag">${n.tag}</span>
      <p class="note-body">${n.body}</p>
      <span class="note-from">${n.from}</span>
    `;
    notesList.appendChild(card);
  });
}

let currentMemoriesTab = 'photos';

// Open Lightbox
function openLightbox(item) {
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxVid = document.getElementById('lightboxVid');
  const lightboxCaption = document.getElementById('lightboxCaption');
  if (!lightboxModal) return;

  lightboxImg.style.display = 'none';
  lightboxVid.style.display = 'none';
  lightboxVid.src = '';
  
  if (item.type === 'video') {
    lightboxVid.src = item.url;
    lightboxVid.style.display = 'block';
    lightboxVid.play().catch(() => {});
  } else {
    lightboxImg.src = item.url;
    lightboxImg.style.display = 'block';
  }

  lightboxCaption.textContent = item.caption || '';
  lightboxModal.classList.add('show');
}

// Close Lightbox
function closeLightbox() {
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxVid = document.getElementById('lightboxVid');
  if (lightboxModal) {
    lightboxModal.classList.remove('show');
  }
  if (lightboxVid) {
    lightboxVid.pause();
    lightboxVid.src = '';
  }
}

// Render Homepage Previews (latest 5-6)
function renderHomePreviews(data) {
  const grid = document.getElementById('homeMemoriesPreviewGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  // Show latest 6 items
  const previews = data.slice(0, 6);
  previews.forEach(item => {
    const cell = document.createElement('div');
    cell.className = 'preview-cell';
    
    let mediaHtml = '';
    if (item.type === 'video') {
      mediaHtml = `
        <video class="preview-media-element" playsinline autoplay muted loop src="${item.url}"></video>
        <span class="preview-type-badge"><i data-lucide="clapperboard" style="width: 12px; height: 12px; stroke: #fff;"></i></span>
      `;
    } else {
      mediaHtml = `
        <img class="preview-media-element" src="${item.url}" alt="${item.caption || 'Preview'}" loading="lazy">
      `;
    }
    
    const uploaderHtml = item.uploadedBy ? `<span class="uploader-tag mini">by ${item.uploadedBy}</span>` : '';
    cell.innerHTML = `
      <div class="preview-media-wrap">
        ${uploaderHtml}
        ${mediaHtml}
      </div>
    `;
    
    cell.addEventListener('click', () => {
      openLightbox(item);
    });
    
    grid.appendChild(cell);
  });
  if (window.lucide) window.lucide.createIcons();
}

// Render memories page dynamically (Grouped by Albums, split by Photos/Videos)
function renderMemories(data) {
  const container = document.getElementById('galleryContainer');
  if (!container) return;
  container.innerHTML = "";

  // Filter based on active tab
  const filtered = data.filter(m => {
    if (currentMemoriesTab === 'photos') return m.type !== 'video';
    return m.type === 'video';
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text); font-family: 'Lora', serif; font-style: italic; margin-top: 20px;">No ${currentMemoriesTab} uploaded yet 🥺</p>`;
    return;
  }

  // Predefined album order
  const albumOrder = ["Date Ideas", "Food Adventures", "Trips", "2025", "2024", "General"];

  // Group filtered data by album
  const grouped = {};
  filtered.forEach(item => {
    const alb = item.album || "General";
    if (!grouped[alb]) grouped[alb] = [];
    grouped[alb].push(item);
  });

  // Render sections
  albumOrder.forEach(albName => {
    const items = grouped[albName];
    if (items && items.length > 0) {
      const section = document.createElement('div');
      section.className = 'album-section';
      
      const title = document.createElement('h3');
      title.className = 'album-title';
      
      const albumIcons = {
        "Date Ideas": "calendar-heart",
        "Food Adventures": "cake-slice",
        "Trips": "plane",
        "2025": "calendar",
        "2024": "calendar",
        "General": "sparkles"
      };
      const iconName = albumIcons[albName] || "sparkles";
      title.innerHTML = `<i data-lucide="${iconName}"></i> ${albName}`;
      section.appendChild(title);
      
      const grid = document.createElement('div');
      grid.className = 'album-grid';
      
      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        
        let mediaHtml = '';
        if (item.type === 'video') {
          mediaHtml = `
            <div class="video-card-preview">
              <video src="${item.url}" preload="metadata" muted></video>
              <div class="play-overlay">▶</div>
            </div>
          `;
        } else {
          mediaHtml = `<img src="${item.url}" alt="${item.caption || 'Memory'}" loading="lazy">`;
        }
        
        const uploaderHtml = item.uploadedBy ? `<span class="uploader-tag">by ${item.uploadedBy}</span>` : '';
        card.innerHTML = `
          ${uploaderHtml}
          ${mediaHtml}
          <div class="gallery-card-caption">${item.caption || 'Sweet Memory 🌸'}</div>
        `;
        
        card.addEventListener('click', () => {
          openLightbox(item);
        });
        
        grid.appendChild(card);
      });
      
      section.appendChild(grid);
      container.appendChild(section);
    }
  });
  if (window.lucide) window.lucide.createIcons();
}

// State variables for dynamic data
let activeNotesData = [...notesData];

const fallbackMemories = [
  { id: 'fb1', url: 'pic/pic1.jpg', type: 'image', caption: 'Sweet Memory 1 🌸', album: '2024', uploadedBy: 'Baby' },
  { id: 'fb2', url: 'pic/pic2.jpg', type: 'image', caption: 'Sweet Memory 2 💖', album: 'Date Ideas', uploadedBy: 'Cayang' },
  { id: 'fb3', url: 'pic/pic3.jpg', type: 'image', caption: 'Sweet Memory 3 💕', album: 'Food Adventures', uploadedBy: 'Baby' },
  { id: 'fb4', url: 'pic/pic4.jpg', type: 'image', caption: 'Sweet Memory 4 🦋', album: 'Trips', uploadedBy: 'Cayang' },
  { id: 'fb5', url: 'pic/pic5.jpg', type: 'image', caption: 'Sweet Memory 5 ✨', album: '2025', uploadedBy: 'Baby' }
];

let activeMemoriesData = [...fallbackMemories];

// Caching and Edit state variables
let lastMessagesSnapshot = null;
let lastNotesSnapshot = null;
let lastMemoriesSnapshot = null;

let editingMsgId = null;
let editingNoteId = null;
let editingMemId = null;

// Initialize database data load
function initDataLoad() {
  if (!db) {
    renderNotes(activeNotesData);
    renderMemories(activeMemoriesData);
    showDailyMsg();
    return;
  }

  // Daily Messages Realtime sync
  db.collection("daily_messages").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    lastMessagesSnapshot = snapshot;
    const msgs = [];
    snapshot.forEach(doc => {
      msgs.push(doc.data().text);
    });
    if (msgs.length > 0) {
      activeDailyMessages = msgs;
    } else {
      activeDailyMessages = [...dailyMessages];
    }
    showDailyMsg();
    renderAdminMessagesList(snapshot);
  }, err => {
    console.warn("Firestore messages fetch failed, fallback active:", err);
    showDailyMsg();
  });

  // Notes Realtime sync
  db.collection("notes").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    lastNotesSnapshot = snapshot;
    const notes = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      notes.push({
        id: doc.id,
        tag: data.tag,
        body: data.body,
        from: data.from
      });
    });
    if (notes.length > 0) {
      activeNotesData = notes;
    } else {
      activeNotesData = [...notesData];
    }
    renderNotes(activeNotesData);
    renderAdminNotesList(snapshot);
  }, err => {
    console.warn("Firestore notes fetch failed, fallback active:", err);
    renderNotes(activeNotesData);
  });

  // Memories Realtime sync
  db.collection("memories").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    lastMemoriesSnapshot = snapshot;
    const mems = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.url) {
        mems.push({
          id: doc.id,
          url: data.url,
          type: data.type || "image",
          caption: data.caption || "",
          album: data.album || "General",
          uploadedBy: data.uploadedBy || ""
        });
      }
    });
    activeMemoriesData = [...mems, ...fallbackMemories];
    renderMemories(activeMemoriesData);
    renderHomePreviews(activeMemoriesData);
    renderAdminMemoriesList(snapshot);
  }, err => {
    console.warn("Firestore memories fetch failed, fallback active:", err);
    activeMemoriesData = [...fallbackMemories];
    renderMemories(activeMemoriesData);
  });
}

// ── Admin Panel Login & Toggles ─────────
let currentAdminUser = null;

const adminLoginCard = document.getElementById('adminLoginCard');
const adminPanelCard = document.getElementById('adminPanelCard');
const adminRole = document.getElementById('adminRole');
const adminPasscode = document.getElementById('adminPasscode');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginError = document.getElementById('adminLoginError');
const adminWelcomeTitle = document.getElementById('adminWelcomeTitle');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

if (adminLoginBtn) {
  adminLoginBtn.addEventListener('click', () => {
    const role = adminRole.value;
    const pass = adminPasscode.value.trim().toLowerCase();
    let authenticated = false;

    if (role === 'cayang' && pass === '0203') {
      authenticated = true;
      currentAdminUser = 'Cayang 🌸';
    } else if (role === 'baby' && pass === '0203') {
      authenticated = true;
      currentAdminUser = 'Bubu 💖';
    }

    if (authenticated) {
      adminLoginCard.style.display = 'none';
      adminPanelCard.style.display = 'block';
      adminWelcomeTitle.innerHTML = `Welcome to HQ, ${currentAdminUser} <i data-lucide="settings"></i>`;
      if (window.lucide) window.lucide.createIcons();
      adminPasscode.value = '';
      adminLoginError.style.display = 'none';
      softBeep(700, 0.2, 0.05);
    } else {
      adminLoginError.textContent = 'Incorrect secret passcode! 🥺 Try again baby...';
      adminLoginError.style.display = 'block';
      softBeep(300, 0.3, 0.06);
    }
  });
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', () => {
    currentAdminUser = null;
    adminPanelCard.style.display = 'none';
    adminLoginCard.style.display = 'block';
    softBeep(450, 0.15, 0.04);
  });
}

// ── Browser Credentials Saving Form ──
const localFbApiKeyInput = document.getElementById('localFbApiKey');
const localFbProjIdInput = document.getElementById('localFbProjId');
const localFbAppIdInput = document.getElementById('localFbAppId');
const localCloudNameInput = document.getElementById('localCloudName');
const localUploadPresetInput = document.getElementById('localUploadPreset');
const saveLocalConfigBtn = document.getElementById('saveLocalConfigBtn');
const clearLocalConfigBtn = document.getElementById('clearLocalConfigBtn');

if (localFbApiKeyInput) localFbApiKeyInput.value = localStorage.getItem('fb_apiKey') || '';
if (localFbProjIdInput) localFbProjIdInput.value = localStorage.getItem('fb_projectId') || '';
if (localFbAppIdInput) localFbAppIdInput.value = localStorage.getItem('fb_appId') || '';
if (localCloudNameInput) localCloudNameInput.value = localStorage.getItem('cl_cloudName') || '';
if (localUploadPresetInput) localUploadPresetInput.value = localStorage.getItem('cl_uploadPreset') || '';

if (saveLocalConfigBtn) {
  saveLocalConfigBtn.addEventListener('click', () => {
    localStorage.setItem('fb_apiKey', localFbApiKeyInput.value.trim());
    localStorage.setItem('fb_projectId', localFbProjIdInput.value.trim());
    localStorage.setItem('fb_appId', localFbAppIdInput.value.trim());
    localStorage.setItem('cl_cloudName', localCloudNameInput.value.trim());
    localStorage.setItem('cl_uploadPreset', localUploadPresetInput.value.trim());
    showToast('Local config saved! Reloading to apply changes... 🌸', 'success');
    softBeep(650, 0.25, 0.05);
    setTimeout(() => location.reload(), 1500);
  });
}

if (clearLocalConfigBtn) {
  clearLocalConfigBtn.addEventListener('click', () => {
    localStorage.removeItem('fb_apiKey');
    localStorage.removeItem('fb_projectId');
    localStorage.removeItem('fb_appId');
    localStorage.removeItem('cl_cloudName');
    localStorage.removeItem('cl_uploadPreset');
    showToast('Local config cleared! Reloading... 🌸', 'success');
    setTimeout(() => location.reload(), 1500);
  });
}

// ── Admin Subtabs toggler ──
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.admin-tab-content').forEach(sect => sect.style.display = 'none');
    const target = btn.dataset.target;
    if (target === 'adminMsg') document.getElementById('adminMsgSection').style.display = 'block';
    if (target === 'adminNotes') document.getElementById('adminNotesSection').style.display = 'block';
    if (target === 'adminMems') document.getElementById('adminMemsSection').style.display = 'block';
    
    softBeep(580, 0.15, 0.03);
  });
});

// ── Daily Messages CRUD events ──
const adminMsgList = document.getElementById('adminMsgList');
const newMsgInput = document.getElementById('newMsgInput');
const addMsgBtn = document.getElementById('addMsgBtn');

function renderAdminMessagesList(snapshot) {
  if (!adminMsgList) return;
  adminMsgList.innerHTML = "";
  snapshot.forEach(doc => {
    const text = doc.data().text;
    const li = document.createElement('li');
    li.className = 'admin-item';
    li.innerHTML = `
      <span class="admin-item-text">${text}</span>
      <div class="admin-item-actions">
        <button onclick="startEditMsg('${doc.id}')">Edit</button>
        <button onclick="deleteDoc('daily_messages', '${doc.id}')">Delete</button>
      </div>
    `;
    adminMsgList.appendChild(li);
  });
}

// startEditMsg and cancelMsgEdit
window.startEditMsg = function(id) {
  if (!lastMessagesSnapshot) return;
  const doc = lastMessagesSnapshot.docs.find(d => d.id === id);
  if (!doc) return;
  const data = doc.data();
  newMsgInput.value = data.text || '';
  editingMsgId = id;
  addMsgBtn.textContent = 'Update';
  cancelMsgEditBtn.style.display = 'block';
  newMsgInput.focus();
};

if (window.cancelMsgEditBtn) {
  cancelMsgEditBtn.addEventListener('click', () => {
    newMsgInput.value = '';
    editingMsgId = null;
    addMsgBtn.textContent = 'Add';
    cancelMsgEditBtn.style.display = 'none';
  });
}

if (addMsgBtn) {
  addMsgBtn.addEventListener('click', () => {
    const text = newMsgInput.value.trim();
    if (!text) return;
    if (!db) {
      showToast("Database is offline. Configure Firestore credentials! 🥺", "error");
      return;
    }
    if (editingMsgId) {
      db.collection("daily_messages").doc(editingMsgId).update({
        text: text
      }).then(() => {
        newMsgInput.value = "";
        editingMsgId = null;
        addMsgBtn.textContent = "Add";
        cancelMsgEditBtn.style.display = "none";
        showToast("Daily message updated successfully! 🌸", "success");
        softBeep(650, 0.18, 0.04);
      }).catch(err => showToast("Error: " + err.message, "error"));
    } else {
      db.collection("daily_messages").add({
        text: text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        newMsgInput.value = "";
        showToast("Daily message added successfully! 🌸", "success");
        softBeep(650, 0.18, 0.04);
      }).catch(err => showToast("Error: " + err.message, "error"));
    }
  });
}

// ── Notes CRUD events ──
const adminNotesList = document.getElementById('adminNotesList');
const noteTagInput = document.getElementById('noteTagInput');
const noteBodyInput = document.getElementById('noteBodyInput');
const noteFromInput = document.getElementById('noteFromInput');
const addNoteBtn = document.getElementById('addNoteBtn');

function renderAdminNotesList(snapshot) {
  if (!adminNotesList) return;
  adminNotesList.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement('li');
    li.className = 'admin-item';
    li.innerHTML = `
      <div class="admin-item-text">
        <span class="admin-item-tag">${data.tag}</span>
        <strong>${data.from}</strong>
        <p style="margin-top:4px; font-size:0.75rem;">${data.body.substring(0, 40)}...</p>
      </div>
      <div class="admin-item-actions">
        <button onclick="startEditNote('${doc.id}')">Edit</button>
        <button onclick="deleteDoc('notes', '${doc.id}')">Delete</button>
      </div>
    `;
    adminNotesList.appendChild(li);
  });
}

// startEditNote and cancelNoteEdit
window.startEditNote = function(id) {
  if (!lastNotesSnapshot) return;
  const doc = lastNotesSnapshot.docs.find(d => d.id === id);
  if (!doc) return;
  const data = doc.data();
  noteTagInput.value = data.tag || '';
  noteBodyInput.value = data.body || '';
  noteFromInput.value = data.from || '';
  editingNoteId = id;
  addNoteBtn.textContent = 'Update Note';
  cancelNoteEditBtn.style.display = 'block';
  noteTagInput.focus();
};

if (window.cancelNoteEditBtn) {
  cancelNoteEditBtn.addEventListener('click', () => {
    noteTagInput.value = '';
    noteBodyInput.value = '';
    noteFromInput.value = '';
    editingNoteId = null;
    addNoteBtn.textContent = 'Add Note';
    cancelNoteEditBtn.style.display = 'none';
  });
}

if (addNoteBtn) {
  addNoteBtn.addEventListener('click', () => {
    const tag = noteTagInput.value.trim();
    const body = noteBodyInput.value.trim();
    const from = noteFromInput.value.trim();
    if (!tag || !body || !from) {
      showToast("Please fill all fields! 🥺", "error");
      return;
    }
    if (!db) {
      showToast("Database is offline. Configure Firestore! 🥺", "error");
      return;
    }
    if (editingNoteId) {
      db.collection("notes").doc(editingNoteId).update({
        tag, body, from
      }).then(() => {
        noteTagInput.value = "";
        noteBodyInput.value = "";
        noteFromInput.value = "";
        editingNoteId = null;
        addNoteBtn.textContent = "Add Note";
        cancelNoteEditBtn.style.display = "none";
        showToast("Love letter note updated successfully! 🌸", "success");
        softBeep(650, 0.18, 0.04);
      }).catch(err => showToast("Error: " + err.message, "error"));
    } else {
      db.collection("notes").add({
        tag, body, from,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        noteTagInput.value = "";
        noteBodyInput.value = "";
        noteFromInput.value = "";
        showToast("Love letter note added successfully! 🌸", "success");
        softBeep(650, 0.18, 0.04);
      }).catch(err => showToast("Error: " + err.message, "error"));
    }
  });
}

// ── Memories CRUD events ──
const adminMemsList = document.getElementById('adminMemsList');
const memCaptionInput = document.getElementById('memCaptionInput');
const memTypeSelect = document.getElementById('memTypeSelect');
const memAlbumSelect = document.getElementById('memAlbumSelect');
const memUrlInput = document.getElementById('memUrlInput');
const uploadMediaBtn = document.getElementById('uploadMediaBtn');
const addMemBtn = document.getElementById('addMemBtn');

function renderAdminMemoriesList(snapshot) {
  if (!adminMemsList) return;
  adminMemsList.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement('li');
    li.className = 'admin-item';
    
    const isVideo = data.type === 'video';
    const previewHtml = isVideo 
      ? `<div class="admin-thumb-video">🎥</div>` 
      : `<img src="${data.url}" class="admin-thumb" alt="Preview">`;

    li.innerHTML = `
      ${previewHtml}
      <div class="admin-item-text">
        <strong>${data.caption || 'No Caption'}</strong>
        <span class="admin-item-badge">${data.type || 'image'}</span>
        ${data.uploadedBy ? `<span class="admin-item-badge" style="background: var(--bg); color: var(--btn-shade); border: 1px dashed var(--border); font-family: 'Caveat', cursive; font-size: 0.85rem; font-weight: bold; margin-left: 4px;">by ${data.uploadedBy}</span>` : ''}
      </div>
      <div class="admin-item-actions">
        <button onclick="startEditMem('${doc.id}')">Edit</button>
        <button onclick="deleteDoc('memories', '${doc.id}')">Delete</button>
      </div>
    `;
    adminMemsList.appendChild(li);
  });
}

// Delete document helper (exposed to global onclick events)
window.deleteDoc = function(collection, id) {
  if (!db) return;
  if (confirm("Are you sure you want to delete this item? 🥺")) {
    db.collection(collection).doc(id).delete()
      .then(() => {
        showToast("Item deleted successfully! 🌸", "success");
        softBeep(400, 0.25, 0.05);
      })
      .catch(err => showToast("Error: " + err.message, "error"));
  }
};

// startEditMem and cancelMemEdit
window.startEditMem = function(id) {
  if (!lastMemoriesSnapshot) return;
  const doc = lastMemoriesSnapshot.docs.find(d => d.id === id);
  if (!doc) return;
  const data = doc.data();
  memCaptionInput.value = data.caption || '';
  memTypeSelect.value = data.type || 'image';
  if (memAlbumSelect) memAlbumSelect.value = data.album || 'General';
  memUrlInput.value = data.url || '';
  editingMemId = id;
  addMemBtn.textContent = 'Update Memory';
  cancelMemEditBtn.style.display = 'block';
  memCaptionInput.focus();
};

if (window.cancelMemEditBtn) {
  cancelMemEditBtn.addEventListener('click', () => {
    memCaptionInput.value = '';
    memTypeSelect.value = 'image';
    if (memAlbumSelect) memAlbumSelect.value = 'General';
    memUrlInput.value = '';
    editingMemId = null;
    addMemBtn.textContent = 'Add Memory';
    cancelMemEditBtn.style.display = 'none';
  });
}

if (addMemBtn) {
  addMemBtn.addEventListener('click', () => {
    const caption = memCaptionInput.value.trim();
    const type = memTypeSelect.value;
    const album = memAlbumSelect ? memAlbumSelect.value : 'General';
    const url = memUrlInput.value.trim();
    if (!url) {
      showToast("Please upload a file or paste a URL! 🥺", "error");
      return;
    }
    if (!db) {
      showToast("Database is offline. Configure Firestore! 🥺", "error");
      return;
    }
    if (editingMemId) {
      db.collection("memories").doc(editingMemId).update({
        caption, type, album, url
      }).then(() => {
        memCaptionInput.value = "";
        if (memAlbumSelect) memAlbumSelect.value = "General";
        memUrlInput.value = "";
        editingMemId = null;
        addMemBtn.textContent = "Add Memory";
        cancelMemEditBtn.style.display = "none";
        showToast("Memory updated successfully! 🌸", "success");
        softBeep(650, 0.18, 0.04);
      }).catch(err => showToast("Error: " + err.message, "error"));
    } else {
      const uploader = (currentAdminUser && currentAdminUser.includes('Cayang')) ? 'Cayang' : 'Baby';
      db.collection("memories").add({
        caption, type, album, url,
        uploadedBy: uploader,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        memCaptionInput.value = "";
        if (memAlbumSelect) memAlbumSelect.value = "General";
        memUrlInput.value = "";
        showToast("Memory added successfully! 🌸", "success");
        softBeep(650, 0.18, 0.04);
      }).catch(err => showToast("Error: " + err.message, "error"));
    }
  });
}

// ── Cloudinary Direct Unsigned Upload (Drag & Drop / Select File) ──
if (window.dropZone && window.fileInput) {
  // Trigger file selection on click
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag over states
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('dragend', () => {
    dropZone.classList.remove('dragover');
  });

  // Handle dropped files
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  });

  // Handle selected files
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      uploadFile(fileInput.files[0]);
    }
  });

  function uploadFile(file) {
    const cloudName = getConfig().cloudinary.cloudName;
    const uploadPreset = getConfig().cloudinary.uploadPreset;

    if (!cloudName || cloudName === "YOUR_CLOUD_NAME" || !uploadPreset || uploadPreset === "YOUR_UPLOAD_PRESET") {
      showToast("Please configure your Cloudinary Cloud Name and Upload Preset in the local config block or in script.js first! 🥺", "error");
      return;
    }

    // Set UI to uploading
    dropZoneText.textContent = `Uploading ${file.name}...`;
    uploadProgress.style.display = 'block';
    uploadProgressBar.style.width = '0%';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/upload`, true);

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        uploadProgressBar.style.width = `${percent}%`;
        dropZoneText.textContent = `Uploading ${file.name} (${percent}%)`;
      }
    });

    // Handle complete
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          memUrlInput.value = response.secure_url;
          
          // Auto-select type
          if (file.type.startsWith('video/')) {
            memTypeSelect.value = 'video';
          } else {
            memTypeSelect.value = 'image';
          }

          dropZoneText.textContent = `Upload successful! 🎉`;
          showToast('Yeay, cayang success upload', 'success');
          softBeep(750, 0.22, 0.06);
        } catch (err) {
          dropZoneText.textContent = `Failed to parse upload response 🥺`;
          showToast("Error parsing response: " + err.message, "error");
        }
      } else {
        dropZoneText.textContent = `Upload failed (Status: ${xhr.status}) 🥺`;
        try {
          const response = JSON.parse(xhr.responseText);
          showToast(`Cloudinary error: ${response.error?.message || 'Unknown error'}`, "error");
        } catch (err) {
          showToast(`Upload failed: Server returned status ${xhr.status}`, "error");
        }
      }
      
      // Clear progress bar
      setTimeout(() => {
        uploadProgress.style.display = 'none';
        uploadProgressBar.style.width = '0%';
        if (dropZoneText.textContent === `Upload successful! 🎉` || dropZoneText.textContent.includes('failed')) {
          dropZoneText.textContent = `Drag & drop photo/video here, or click to browse`;
        }
      }, 2000);
    });

    // Handle error
    xhr.addEventListener('error', () => {
      dropZoneText.textContent = `Upload failed 🥺`;
      showToast("An error occurred during file upload. Check your internet connection or console.", "error");
      uploadProgress.style.display = 'none';
    });

    xhr.send(formData);
  }
}

// Initial DB call
initDataLoad();

// Initial Lucide icons parse
if (window.lucide) {
  window.lucide.createIcons();
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
