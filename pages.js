/* ── pages.js ── Page navigation, greeting, mood, daily messages, notes, memories, lightbox ── */
import { isMobile } from './config.js';
import { softBeep, showToast, showMoodToast } from './utils.js';
import { spawnHeart, observeFadeReveal } from './effects.js';

/* ── State ── */
export let currentMemoriesTab = 'photos';
export let activeDailyMessages = [];
export let activeNotesData = [];
export let activeMemoriesData = [];

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

activeDailyMessages = [...dailyMessages];

let lastMsgIdx = -1;
function getRandomMsg() {
  let idx;
  do { idx = Math.floor(Math.random() * activeDailyMessages.length); } while (idx === lastMsgIdx);
  lastMsgIdx = idx;
  return activeDailyMessages[idx];
}

const dailyMsgEl = document.getElementById('dailyMsg');

export function showDailyMsg() {
  if (!dailyMsgEl) return;
  dailyMsgEl.style.transition = 'opacity 0.3s ease';
  dailyMsgEl.style.opacity = '0';
  setTimeout(() => {
    dailyMsgEl.textContent = getRandomMsg();
    dailyMsgEl.style.opacity = '1';
  }, 300);
}

export function setActiveDailyMessages(msgs) {
  if (msgs.length > 0) {
    activeDailyMessages = msgs;
  } else {
    activeDailyMessages = [...dailyMessages];
  }
}

/* ── Greeting card (morning / night) ── */
export function setGreeting() {
  const greetEmojiEl = document.getElementById('greetEmoji');
  const greetTitleEl = document.getElementById('greetTitle');
  const greetMsgEl   = document.getElementById('greetMsg');

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

/* ── Mood buttons ── */
const moodData = {
  happy:   { msg: 'Aaaa good baby! Nampak happy harini hehe 💖 That smile of yours priceless tau!', hearts: 12, beep: 720 },
  sad:     { msg: 'It\'s okay cyg, rehat jap ya 🥺 Bubu ada je, jangan tanggung sorang-sorang tau. You\'re not alone 🫶', hearts: 6, beep: 480 },
  tired:   { msg: 'Penat eh baby? 😪 Jangan lupa minum air dan rest tau. Letak kerja jap, you deserve a break 🌸', hearts: 7, beep: 510 },
  stress:  { msg: 'Slowly okay syg, jangan pressure diri sangat 💕 One step at a time. I believe in you always 🌷', hearts: 8, beep: 550 },
  excited: { msg: 'AAAA excited mode on!! ✨ Tell me tell me, apa yang best?? Nak tau jugak 🥳💖', hearts: 16, beep: 780 },
  missyou: { msg: 'Rindu cyg kat sini jugak tau 🥺💗 Nanti jumpa okay? Jangan rindu sangat, bubu sentiasa ada dalam hati 💖', hearts: 10, beep: 600 },
  hungry:  { msg: 'Nak kueyteow kungfu ke tuuu 🍜 Hahaha cyg Johor girl la katakan~ Pergi makan jangan tangguh! 😋', hearts: 9, beep: 640 },
};

export function initMoodButtons() {
  const moodGrid = document.getElementById('moodGrid');
  if (!moodGrid) return;
  moodGrid.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      const data = moodData[mood];
      if (!data) return;

      moodGrid.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      showMoodToast(data.msg);

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
      btn.style.transition = 'transform 0.15s ease';
      btn.style.transform = 'scale(1.22)';
      setTimeout(() => { btn.style.transform = ''; }, 160);
    });
  });
}

/* ── Page navigation ── */
const appEl    = document.getElementById('app');
const pages    = document.querySelectorAll('.page');
const navBtns  = document.querySelectorAll('.nav-btn');

export function switchPage(targetPage) {
  pages.forEach(p => p.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));

  const page = document.getElementById('page' + targetPage.charAt(0).toUpperCase() + targetPage.slice(1));
  if (page) page.classList.add('active');

  const btn = document.querySelector(`.nav-btn[data-page="${targetPage}"]`);
  if (btn) btn.classList.add('active');

  if (appEl) {
    if (targetPage === 'music') {
      appEl.classList.add('music-page-active');
    } else {
      appEl.classList.remove('music-page-active');
    }
    const navEl = document.getElementById('bottomNav');
    if (navEl) {
      if (targetPage === 'music') {
        navEl.style.width = '';
      } else {
        requestAnimationFrame(() => {
          navEl.style.width = appEl.getBoundingClientRect().width + 'px';
        });
        setTimeout(() => {
          navEl.style.width = appEl.getBoundingClientRect().width + 'px';
        }, 380);
      }
    }
  }

  setTimeout(observeFadeReveal, 50);
  softBeep(560, 0.14, 0.03);
}

export function initPageNavigation() {
  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) {
    bottomNav.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });
  }

  if (window.viewAllMemoriesBtn) {
    viewAllMemoriesBtn.addEventListener('click', () => switchPage('memories'));
  }

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

  if (window.lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  if (window.lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  const newMsgBtn = document.getElementById('newMsgBtn');
  if (newMsgBtn) newMsgBtn.addEventListener('click', () => { showDailyMsg(); softBeep(620, 0.18, 0.04); });
}

/* ── Lightbox ── */
export function openLightbox(item) {
  const lightboxModal   = document.getElementById('lightboxModal');
  const lightboxImg     = document.getElementById('lightboxImg');
  const lightboxVid     = document.getElementById('lightboxVid');
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

export function closeLightbox() {
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxVid   = document.getElementById('lightboxVid');
  if (lightboxModal) lightboxModal.classList.remove('show');
  if (lightboxVid) { lightboxVid.pause(); lightboxVid.src = ''; }
}

/* ── Notes data ── */
const notesData = [
  { tag: '💌 From Bubu', body: 'Cyg, terima kasih sebab sabar dengan bubu. I know sometimes bubu buat perangai jugak, but I\'m always trying to be better for you 🥺💕', from: '— Your Baby 🌸' },
  { tag: '✨ Just Because', body: 'You make the boring days feel warm and the good days feel magical. I don\'t always say it tapi I notice everything you do 🌷', from: '— Your Baby 💗' },
  { tag: '🍜 Easter Egg hehe', body: 'One day nak bawak cyg makan kueyteow kungfu yang paling best kat Johor. Jangan lupa sambal kicap okay 😋 My treat forever!', from: '— Your Baby 🌸' },
  { tag: '🌙 Goodnight Note', body: 'Wherever you are right now, I hope you\'re resting well. Sweet dreams sayang. Tomorrow will be a good day, I promise 🌸', from: '— Your Baby 💖' },
  { tag: '🎀 Reminder', body: 'You are enough. You are more than enough. Don\'t let anyone — including yourself — make you feel otherwise 💕', from: '— Your Baby 🫶' },
];

activeNotesData = [...notesData];
export function getDefaultNotesData() { return [...notesData]; }

export function setActiveNotesData(notes) {
  if (notes.length > 0) {
    activeNotesData = notes;
  } else {
    activeNotesData = [...notesData];
  }
}

/* ── Render Notes ── */
export function renderNotes(data) {
  const notesList = document.getElementById('notesList');
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

/* ── Memories data ── */
const fallbackMemories = [
  { id: 'fb1', url: 'pic/pic1.jpg', type: 'image', caption: 'Sweet Memory 1 🌸', album: '2024', uploadedBy: 'Baby' },
  { id: 'fb2', url: 'pic/pic2.jpg', type: 'image', caption: 'Sweet Memory 2 💖', album: 'Date Ideas', uploadedBy: 'Cayang' },
  { id: 'fb3', url: 'pic/pic3.jpg', type: 'image', caption: 'Sweet Memory 3 💕', album: 'Food Adventures', uploadedBy: 'Baby' },
  { id: 'fb4', url: 'pic/pic4.jpg', type: 'image', caption: 'Sweet Memory 4 🦋', album: 'Trips', uploadedBy: 'Cayang' },
  { id: 'fb5', url: 'pic/pic5.jpg', type: 'image', caption: 'Sweet Memory 5 ✨', album: '2025', uploadedBy: 'Baby' }
];

activeMemoriesData = [...fallbackMemories];
export function getFallbackMemories() { return [...fallbackMemories]; }

export function setActiveMemoriesData(mems) {
  activeMemoriesData = [...mems, ...fallbackMemories];
}

/* ── Render Homepage Previews ── */
export function renderHomePreviews(data) {
  const grid = document.getElementById('homeMemoriesPreviewGrid');
  if (!grid) return;
  grid.innerHTML = '';

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
      mediaHtml = `<img class="preview-media-element" src="${item.url}" alt="${item.caption || 'Preview'}" loading="lazy">`;
    }

    const uploaderHtml = item.uploadedBy ? `<span class="uploader-tag mini">by ${item.uploadedBy}</span>` : '';
    cell.innerHTML = `
      <div class="preview-media-wrap">
        ${uploaderHtml}
        ${mediaHtml}
      </div>
    `;

    cell.addEventListener('click', () => openLightbox(item));
    grid.appendChild(cell);
  });
  if (window.lucide) window.lucide.createIcons();
}

/* ── Render Memories page ── */
export function renderMemories(data) {
  const container = document.getElementById('galleryContainer');
  if (!container) return;
  container.innerHTML = "";

  const filtered = data.filter(m => {
    if (currentMemoriesTab === 'photos') return m.type !== 'video';
    return m.type === 'video';
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text); font-family: 'Lora', serif; font-style: italic; margin-top: 20px;">No ${currentMemoriesTab} uploaded yet 🥺</p>`;
    return;
  }

  const albumOrder = ["Date Ideas", "Food Adventures", "Trips", "2025", "2024", "General"];

  const grouped = {};
  filtered.forEach(item => {
    const alb = item.album || "General";
    if (!grouped[alb]) grouped[alb] = [];
    grouped[alb].push(item);
  });

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

        card.addEventListener('click', () => openLightbox(item));
        grid.appendChild(card);
      });

      section.appendChild(grid);
      container.appendChild(section);
    }
  });
  if (window.lucide) window.lucide.createIcons();
}

/* ── Video setup ── */
export function initVideos() {
  const bgVideoEl  = document.getElementById('bgVideo');
  const mainVidEl  = document.getElementById('mainVid');
  const memoryVidEl = document.getElementById('memoryVid');
  [bgVideoEl, mainVidEl, memoryVidEl].forEach(v => {
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    if (isMobile) v.preload = 'metadata';
    v.play().catch(() => {});
  });
}
