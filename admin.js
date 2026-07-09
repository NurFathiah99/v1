/* ── admin.js ── Admin panel: login, CRUD for messages/notes/memories/songs, upload zones ── */
import { getConfig } from './config.js';
import { db } from './db.js';
import { softBeep, showToast, formatFileSize, getMediaDuration, fmtDuration, compressAudioFile, buildUploadXHR } from './utils.js';
import {
  showDailyMsg, setActiveDailyMessages,
  renderNotes, setActiveNotesData, getDefaultNotesData,
  renderMemories, renderHomePreviews, setActiveMemoriesData, getFallbackMemories, activeMemoriesData
} from './pages.js';
import MusicPlayer from './music-player.js';

/* ── State ── */
let currentAdminUser = null;
let lastMessagesSnapshot = null;
let lastNotesSnapshot = null;
let lastMemoriesSnapshot = null;
let lastSongsSnapshot = null;
let editingMsgId = null;
let editingNoteId = null;
let editingMemId = null;
let editingSongId = null;

/* ══════════════════════════════════════════════
   ADMIN LOGIN
   ══════════════════════════════════════════════ */

export function initAdminLogin() {
  const adminLoginCard   = document.getElementById('adminLoginCard');
  const adminPanelCard   = document.getElementById('adminPanelCard');
  const adminRole        = document.getElementById('adminRole');
  const adminPasscode    = document.getElementById('adminPasscode');
  const adminLoginBtn    = document.getElementById('adminLoginBtn');
  const adminLoginError  = document.getElementById('adminLoginError');
  const adminWelcomeTitle = document.getElementById('adminWelcomeTitle');
  const adminLogoutBtn   = document.getElementById('adminLogoutBtn');

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
        MusicPlayer.setAdminLoggedIn(true);
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
      MusicPlayer.setAdminLoggedIn(false);
    });
  }
}

/* ══════════════════════════════════════════════
   BROWSER CREDENTIALS SAVING
   ══════════════════════════════════════════════ */

export function initConfigForm() {
  const localFbApiKeyInput      = document.getElementById('localFbApiKey');
  const localFbProjIdInput      = document.getElementById('localFbProjId');
  const localFbAppIdInput       = document.getElementById('localFbAppId');
  const localCloudNameInput     = document.getElementById('localCloudName');
  const localUploadPresetInput  = document.getElementById('localUploadPreset');
  const saveLocalConfigBtn      = document.getElementById('saveLocalConfigBtn');
  const clearLocalConfigBtn     = document.getElementById('clearLocalConfigBtn');

  if (localFbApiKeyInput)      localFbApiKeyInput.value      = localStorage.getItem('fb_apiKey') || '';
  if (localFbProjIdInput)      localFbProjIdInput.value      = localStorage.getItem('fb_projectId') || '';
  if (localFbAppIdInput)       localFbAppIdInput.value       = localStorage.getItem('fb_appId') || '';
  if (localCloudNameInput)     localCloudNameInput.value     = localStorage.getItem('cl_cloudName') || '';
  if (localUploadPresetInput)  localUploadPresetInput.value  = localStorage.getItem('cl_uploadPreset') || '';

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
}

/* ══════════════════════════════════════════════
   ADMIN SUBTABS
   ══════════════════════════════════════════════ */

export function initAdminTabs() {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-tab-content').forEach(sect => sect.style.display = 'none');
      const target = btn.dataset.target;
      if (target === 'adminMsg')   document.getElementById('adminMsgSection').style.display = 'block';
      if (target === 'adminNotes') document.getElementById('adminNotesSection').style.display = 'block';
      if (target === 'adminMems')  document.getElementById('adminMemsSection').style.display = 'block';
      if (target === 'adminMusic') document.getElementById('adminMusicSection').style.display = 'block';
      softBeep(580, 0.15, 0.03);
    });
  });
}

/* ══════════════════════════════════════════════
   DAILY MESSAGES CRUD
   ══════════════════════════════════════════════ */

const adminMsgList     = document.getElementById('adminMsgList');
const newMsgInput      = document.getElementById('newMsgInput');
const addMsgBtn        = document.getElementById('addMsgBtn');
const cancelMsgEditBtn = document.getElementById('cancelMsgEditBtn');

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

export function initMessagesCRUD() {
  if (cancelMsgEditBtn) {
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
      if (!db) { showToast("Database is offline. Configure Firestore credentials! 🥺", "error"); return; }
      if (editingMsgId) {
        db.collection("daily_messages").doc(editingMsgId).update({ text })
          .then(() => {
            newMsgInput.value = ""; editingMsgId = null; addMsgBtn.textContent = "Add"; cancelMsgEditBtn.style.display = "none";
            showToast("Daily message updated successfully! 🌸", "success"); softBeep(650, 0.18, 0.04);
          }).catch(err => showToast("Error: " + err.message, "error"));
      } else {
        db.collection("daily_messages").add({ text, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
          .then(() => {
            newMsgInput.value = "";
            showToast("Daily message added successfully! 🌸", "success"); softBeep(650, 0.18, 0.04);
          }).catch(err => showToast("Error: " + err.message, "error"));
      }
    });
  }
}

/* ══════════════════════════════════════════════
   NOTES CRUD
   ══════════════════════════════════════════════ */

const adminNotesList    = document.getElementById('adminNotesList');
const noteTagInput      = document.getElementById('noteTagInput');
const noteBodyInput     = document.getElementById('noteBodyInput');
const noteFromInput     = document.getElementById('noteFromInput');
const addNoteBtn        = document.getElementById('addNoteBtn');
const cancelNoteEditBtn = document.getElementById('cancelNoteEditBtn');

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

export function initNotesCRUD() {
  if (cancelNoteEditBtn) {
    cancelNoteEditBtn.addEventListener('click', () => {
      noteTagInput.value = ''; noteBodyInput.value = ''; noteFromInput.value = '';
      editingNoteId = null; addNoteBtn.textContent = 'Add Note'; cancelNoteEditBtn.style.display = 'none';
    });
  }

  if (addNoteBtn) {
    addNoteBtn.addEventListener('click', () => {
      const tag = noteTagInput.value.trim();
      const body = noteBodyInput.value.trim();
      const from = noteFromInput.value.trim();
      if (!tag || !body || !from) { showToast("Please fill all fields! 🥺", "error"); return; }
      if (!db) { showToast("Database is offline. Configure Firestore! 🥺", "error"); return; }
      if (editingNoteId) {
        db.collection("notes").doc(editingNoteId).update({ tag, body, from })
          .then(() => {
            noteTagInput.value = ""; noteBodyInput.value = ""; noteFromInput.value = "";
            editingNoteId = null; addNoteBtn.textContent = "Add Note"; cancelNoteEditBtn.style.display = "none";
            showToast("Love letter note updated successfully! 🌸", "success"); softBeep(650, 0.18, 0.04);
          }).catch(err => showToast("Error: " + err.message, "error"));
      } else {
        db.collection("notes").add({ tag, body, from, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
          .then(() => {
            noteTagInput.value = ""; noteBodyInput.value = ""; noteFromInput.value = "";
            showToast("Love letter note added successfully! 🌸", "success"); softBeep(650, 0.18, 0.04);
          }).catch(err => showToast("Error: " + err.message, "error"));
      }
    });
  }
}

/* ══════════════════════════════════════════════
   MEMORIES CRUD
   ══════════════════════════════════════════════ */

const adminMemsList     = document.getElementById('adminMemsList');
const memCaptionInput   = document.getElementById('memCaptionInput');
const memTypeSelect     = document.getElementById('memTypeSelect');
const memAlbumSelect    = document.getElementById('memAlbumSelect');
const memUrlInput       = document.getElementById('memUrlInput');
const addMemBtn         = document.getElementById('addMemBtn');
const cancelMemEditBtn  = document.getElementById('cancelMemEditBtn');

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

window.deleteDoc = function(collection, id) {
  if (!db) return;
  if (confirm("Are you sure you want to delete this item? 🥺")) {
    db.collection(collection).doc(id).delete()
      .then(() => { showToast("Item deleted successfully! 🌸", "success"); softBeep(400, 0.25, 0.05); })
      .catch(err => showToast("Error: " + err.message, "error"));
  }
};

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

export function initMemoriesCRUD() {
  if (cancelMemEditBtn) {
    cancelMemEditBtn.addEventListener('click', () => {
      memCaptionInput.value = ''; memTypeSelect.value = 'image';
      if (memAlbumSelect) memAlbumSelect.value = 'General';
      memUrlInput.value = ''; editingMemId = null;
      addMemBtn.textContent = 'Add Memory'; cancelMemEditBtn.style.display = 'none';
    });
  }

  if (addMemBtn) {
    addMemBtn.addEventListener('click', () => {
      const caption = memCaptionInput.value.trim();
      const type = memTypeSelect.value;
      const album = memAlbumSelect ? memAlbumSelect.value : 'General';
      const url = memUrlInput.value.trim();
      if (!url) { showToast("Please upload a file or paste a URL! 🥺", "error"); return; }
      if (!db) { showToast("Database is offline. Configure Firestore! 🥺", "error"); return; }
      if (editingMemId) {
        db.collection("memories").doc(editingMemId).update({ caption, type, album, url })
          .then(() => {
            memCaptionInput.value = ""; if (memAlbumSelect) memAlbumSelect.value = "General";
            memUrlInput.value = ""; editingMemId = null;
            addMemBtn.textContent = "Add Memory"; cancelMemEditBtn.style.display = "none";
            showToast("Memory updated successfully! 🌸", "success"); softBeep(650, 0.18, 0.04);
          }).catch(err => showToast("Error: " + err.message, "error"));
      } else {
        const uploader = (currentAdminUser && currentAdminUser.includes('Cayang')) ? 'Cayang' : 'Baby';
        db.collection("memories").add({ caption, type, album, url, uploadedBy: uploader, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
          .then(() => {
            memCaptionInput.value = ""; if (memAlbumSelect) memAlbumSelect.value = "General";
            memUrlInput.value = "";
            showToast("Memory added successfully! 🌸", "success"); softBeep(650, 0.18, 0.04);
          }).catch(err => showToast("Error: " + err.message, "error"));
      }
    });
  }
}

/* ══════════════════════════════════════════════
   MEMORIES UPLOAD (3-STATE UX)
   ══════════════════════════════════════════════ */

export function initMemoriesUpload() {
  const dropZone         = document.getElementById('dropZone');
  const fileInput        = document.getElementById('fileInput');
  const memUploadingState = document.getElementById('memUploadingState');
  const memUploadingFilename = document.getElementById('memUploadingFilename');
  const memUploadingPct  = document.getElementById('memUploadingPct');
  const memProgressBar   = document.getElementById('uploadProgressBar');
  const memPreviewCard   = document.getElementById('memPreviewCard');
  const memPreviewMedia  = document.getElementById('memPreviewMedia');
  const memPreviewFilename = document.getElementById('memPreviewFilename');
  const memPreviewMeta   = document.getElementById('memPreviewMeta');
  const memReplaceBtn    = document.getElementById('memReplaceBtn');
  const memErrorCard     = document.getElementById('memErrorCard');
  const memErrorMsg      = document.getElementById('memErrorMsg');
  const memRetryBtn      = document.getElementById('memRetryBtn');

  let _lastMemFile = null;

  function memShowState(state) {
    if (dropZone)          dropZone.style.display          = state === 'drop'      ? '' : 'none';
    if (memUploadingState) memUploadingState.style.display = state === 'uploading' ? '' : 'none';
    if (memPreviewCard)    memPreviewCard.style.display    = state === 'preview'   ? '' : 'none';
    if (memErrorCard)      memErrorCard.style.display      = state === 'error'     ? '' : 'none';
    if (addMemBtn) addMemBtn.disabled = (state === 'uploading');
  }

  async function uploadMemFile(file) {
    const cloudName    = getConfig().cloudinary.cloudName;
    const uploadPreset = getConfig().cloudinary.uploadPreset;
    if (!cloudName || !uploadPreset || cloudName === 'YOUR_CLOUD_NAME') {
      showToast('Configure Cloudinary first in Admin → Config! 🥺', 'error'); return;
    }
    _lastMemFile = file;
    memShowState('uploading');
    if (memUploadingFilename) memUploadingFilename.textContent = file.name;
    if (memUploadingPct)      memUploadingPct.textContent      = '0%';
    if (memProgressBar)       memProgressBar.style.width       = '0%';

    const isVideo = file.type.startsWith('video/');
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    buildUploadXHR({
      file, endpoint,
      onProgress: pct => {
        if (memProgressBar)  memProgressBar.style.width = `${pct}%`;
        if (memUploadingPct) memUploadingPct.textContent = `${pct}%`;
      },
      onSuccess: async (resp) => {
        if (memUrlInput) memUrlInput.value = resp.secure_url;
        if (memTypeSelect) memTypeSelect.value = isVideo ? 'video' : 'image';
        if (memPreviewMedia) {
          if (isVideo) {
            const thumb = resp.eager?.[0]?.secure_url || null;
            memPreviewMedia.innerHTML = thumb
              ? `<div style="position:relative;display:inline-block"><img src="${thumb}" alt="thumb"><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1.6rem;">&#9654;</span></div>`
              : `<div class="audio-icon-box">🎥</div>`;
          } else {
            const objUrl = URL.createObjectURL(file);
            memPreviewMedia.innerHTML = `<img src="${objUrl}" alt="preview" onload="URL.revokeObjectURL(this.src)">`;
          }
        }
        if (memPreviewFilename) memPreviewFilename.textContent = file.name;
        const dur    = await getMediaDuration(file);
        const durStr = dur ? ` · ${fmtDuration(dur)}` : '';
        if (memPreviewMeta) memPreviewMeta.textContent = `${formatFileSize(file.size)}${durStr} · ${isVideo ? 'Video' : 'Image'}`;
        memShowState('preview');
        if (window.lucide) window.lucide.createIcons();
        showToast('Yeay, uploaded! 🎉 Fill in the details and click Add Memory.', 'success');
        softBeep(750, 0.22, 0.06);
      },
      onFail: (msg) => { if (memErrorMsg) memErrorMsg.textContent = msg; memShowState('error'); },
      onError: () => { if (memErrorMsg) memErrorMsg.textContent = 'Network error. Check your connection and try again.'; memShowState('error'); }
    });
  }

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragenter', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('dragend',   () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); dropZone.classList.remove('dragover');
      if (e.dataTransfer.files?.[0]) uploadMemFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.[0]) uploadMemFile(fileInput.files[0]);
      fileInput.value = '';
    });
  }

  if (memReplaceBtn) {
    memReplaceBtn.addEventListener('click', () => {
      if (memUrlInput) memUrlInput.value = '';
      memShowState('drop');
      fileInput && fileInput.click();
    });
  }
  if (memRetryBtn) {
    memRetryBtn.addEventListener('click', () => { if (_lastMemFile) uploadMemFile(_lastMemFile); });
  }

  const _cancelMemEl = document.getElementById('cancelMemEditBtn');
  if (_cancelMemEl) {
    _cancelMemEl.addEventListener('click', () => {
      memShowState('drop');
      if (memUrlInput) memUrlInput.value = '';
      _lastMemFile = null;
    });
  }
}

/* ══════════════════════════════════════════════
   SONGS CRUD (Admin panel)
   ══════════════════════════════════════════════ */

const adminSongsList    = document.getElementById('adminSongsList');
const songTitleInput    = document.getElementById('songTitleInput');
const songArtistInput   = document.getElementById('songArtistInput');
const songUrlInput      = document.getElementById('songUrlInput');
const addSongBtn        = document.getElementById('addSongBtn');
const cancelSongEditBtn = document.getElementById('cancelSongEditBtn');

function renderAdminSongsList(snapshot) {
  if (!adminSongsList) return;
  adminSongsList.innerHTML = '';
  if (!snapshot || snapshot.empty) {
    adminSongsList.innerHTML = '<li style="font-family:\'Caveat\', cursive; color: #6b5347; font-size:0.95rem; padding: 8px 0;">No songs yet. Add one above! 🎵</li>';
    return;
  }
  snapshot.forEach(doc => {
    const d = doc.data();
    const isDeezer = d.url && (d.url.includes('deezer.com') || d.sourceType === 'deezer');
    const badgeHtml = isDeezer
      ? `<span style="font-size:0.65rem; padding:1px 4px; background:#fdf2f8; color:#db2777; border-radius:4px; margin-left:6px; font-weight:bold; border:1px solid #fbcfe8; vertical-align:middle;">Deezer Preview</span>`
      : `<span style="font-size:0.65rem; padding:1px 4px; background:#f0fdf4; color:#166534; border-radius:4px; margin-left:6px; font-weight:bold; border:1px solid #bbf7d0; vertical-align:middle;">Uploaded MP3</span>`;
    
    const coverHtml = d.cover
      ? `<img src="${d.cover}" style="width:24px;height:24px;border-radius:3px;margin-right:8px;vertical-align:middle;border:1px solid var(--border);">`
      : `<span class="admin-song-icon" style="margin-right:8px;vertical-align:middle;">🎵</span>`;

    const li = document.createElement('li');
    li.className = 'admin-song-item';
    li.innerHTML = `
      <div style="display:flex; align-items:center; flex:1;">
        ${coverHtml}
        <div class="admin-song-info">
          <span class="admin-song-title">${d.title || 'Untitled'}${badgeHtml}</span>
          <span class="admin-song-artist">${d.artist || ''}</span>
        </div>
      </div>
      <button class="admin-song-play" onclick="playSongById('${doc.id}')">▶ Play</button>
      <div class="admin-item-actions">
        <button onclick="startEditSong('${doc.id}')">Edit</button>
        <button onclick="deleteSong('${doc.id}')">Delete</button>
      </div>
    `;
    adminSongsList.appendChild(li);
  });
}

window.playSongById = function(id) { MusicPlayer.playById(id); };

window.deleteSong = function(id) {
  if (!db) return;
  if (confirm('Delete this song from the playlist? 🥺')) {
    db.collection('songs').doc(id).delete()
      .then(() => { showToast('Song removed! 🌸', 'success'); softBeep(400, 0.25, 0.05); })
      .catch(err => showToast('Error: ' + err.message, 'error'));
  }
};

window.startEditSong = function(id) {
  const snap = MusicPlayer.snapshot || lastSongsSnapshot;
  if (!snap) return;
  const doc = snap.docs.find(d => d.id === id);
  if (!doc) return;
  const data = doc.data();
  if (songTitleInput)  songTitleInput.value  = data.title  || '';
  if (songArtistInput) songArtistInput.value = data.artist || '';
  if (songUrlInput)    songUrlInput.value    = data.url    || '';
  editingSongId = id;
  if (addSongBtn) addSongBtn.textContent = 'Update Song';
  if (cancelSongEditBtn) cancelSongEditBtn.style.display = 'block';
  if (songTitleInput) songTitleInput.focus();
};

export function initSongsCRUD() {
  if (cancelSongEditBtn) {
    cancelSongEditBtn.addEventListener('click', () => {
      if (songTitleInput)  songTitleInput.value  = '';
      if (songArtistInput) songArtistInput.value = '';
      if (songUrlInput)    songUrlInput.value    = '';
      editingSongId = null;
      if (addSongBtn) addSongBtn.textContent = 'Add Song';
      cancelSongEditBtn.style.display = 'none';
    });
  }

  if (addSongBtn) {
    addSongBtn.addEventListener('click', () => {
      const title  = (songTitleInput  ? songTitleInput.value.trim()  : '');
      const artist = (songArtistInput ? songArtistInput.value.trim() : '');
      const url    = (songUrlInput    ? songUrlInput.value.trim()    : '');
      if (!title) { showToast('Please enter a song title! 🎵', 'error'); return; }
      if (!url)   { showToast('Please upload or paste a URL! 🎵', 'error'); return; }
      if (!db)    { showToast('Database offline. Configure Firestore! 🥺', 'error'); return; }

      if (editingSongId) {
        db.collection('songs').doc(editingSongId).update({ title, artist, url })
          .then(() => {
            if (songTitleInput)  songTitleInput.value  = '';
            if (songArtistInput) songArtistInput.value = '';
            if (songUrlInput)    songUrlInput.value    = '';
            editingSongId = null;
            if (addSongBtn) addSongBtn.textContent = 'Add Song';
            if (cancelSongEditBtn) cancelSongEditBtn.style.display = 'none';
            showToast('Song updated! 🌸', 'success'); softBeep(650, 0.18, 0.04);
          }).catch(err => showToast('Error: ' + err.message, 'error'));
      } else {
        db.collection('songs').add({ title, artist, url, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
          .then(() => {
            if (songTitleInput)  songTitleInput.value  = '';
            if (songArtistInput) songArtistInput.value = '';
            if (songUrlInput)    songUrlInput.value    = '';
            showToast('Song added to playlist! 🎵', 'success'); softBeep(750, 0.22, 0.06);
          }).catch(err => showToast('Error: ' + err.message, 'error'));
      }
    });
  }
}

/* ══════════════════════════════════════════════
   MUSIC UPLOAD (3-STATE UX)
   ══════════════════════════════════════════════ */

export function initMusicUpload() {
  const musicDropZone         = document.getElementById('musicDropZone');
  const musicFileInput        = document.getElementById('musicFileInput');
  const musicUploadingState   = document.getElementById('musicUploadingState');
  const musicUploadingFilename = document.getElementById('musicUploadingFilename');
  const musicUploadingPct     = document.getElementById('musicUploadingPct');
  const musicProgressBar      = document.getElementById('musicUploadProgressBar');
  const musicPreviewCard      = document.getElementById('musicPreviewCard');
  const musicPreviewMedia     = document.getElementById('musicPreviewMedia');
  const musicPreviewFilename  = document.getElementById('musicPreviewFilename');
  const musicPreviewMeta      = document.getElementById('musicPreviewMeta');
  const musicReplaceBtn       = document.getElementById('musicReplaceBtn');
  const musicErrorCard        = document.getElementById('musicErrorCard');
  const musicErrorMsg         = document.getElementById('musicErrorMsg');
  const musicRetryBtn         = document.getElementById('musicRetryBtn');

  let _lastMusicFile = null;
  let _lastMusicObjectUrl = null;

  function musicShowState(state) {
    if (musicDropZone)       musicDropZone.style.display       = state === 'drop'      ? '' : 'none';
    if (musicUploadingState) musicUploadingState.style.display = state === 'uploading' ? '' : 'none';
    if (musicPreviewCard)    musicPreviewCard.style.display    = state === 'preview'   ? '' : 'none';
    if (musicErrorCard)      musicErrorCard.style.display      = state === 'error'     ? '' : 'none';
    if (addSongBtn) addSongBtn.disabled = (state === 'uploading');
  }

  async function uploadMusicFile(file) {
    const cloudName    = getConfig().cloudinary.cloudName;
    const uploadPreset = getConfig().cloudinary.uploadPreset;
    if (!cloudName || !uploadPreset || cloudName === 'YOUR_CLOUD_NAME') {
      showToast('Configure Cloudinary first in Admin → Config! 🥺', 'error'); return;
    }
    _lastMusicFile = file;
    musicShowState('uploading');
    if (musicUploadingFilename) musicUploadingFilename.textContent = file.name;
    if (musicUploadingPct)      musicUploadingPct.textContent      = '⏳ Optimizing…';
    if (musicProgressBar)       musicProgressBar.style.width       = '0%';

    const compResult = await compressAudioFile(file, (status) => {
      if (musicUploadingPct) musicUploadingPct.textContent = status;
    });

    const uploadFile    = compResult.file;
    const originalSize  = compResult.originalSize;
    const finalSize     = compResult.compressedSize;
    const wasCompressed = !compResult.skipped;

    if (musicUploadingPct) musicUploadingPct.textContent = '0%';
    if (musicUploadingFilename) musicUploadingFilename.textContent =
      wasCompressed ? `${file.name} (optimized)` : file.name;

    const cloudN   = getConfig().cloudinary.cloudName;
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudN}/video/upload`;

    buildUploadXHR({
      file: uploadFile, endpoint,
      onProgress: pct => {
        if (musicProgressBar)  musicProgressBar.style.width  = `${pct}%`;
        if (musicUploadingPct) musicUploadingPct.textContent = `Uploading ${pct}%`;
      },
      onSuccess: async (resp) => {
        if (songUrlInput) songUrlInput.value = resp.secure_url;
        if (songTitleInput && !songTitleInput.value) {
          songTitleInput.value = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        }
        if (_lastMusicObjectUrl) URL.revokeObjectURL(_lastMusicObjectUrl);
        _lastMusicObjectUrl = URL.createObjectURL(file);
        if (musicPreviewMedia) {
          musicPreviewMedia.innerHTML = `
            <div class="audio-icon-box">🎵</div>
            <audio controls src="${_lastMusicObjectUrl}" style="width:100%;margin-top:6px;accent-color:var(--btn);"></audio>
          `;
        }
        if (musicPreviewFilename) musicPreviewFilename.textContent = file.name;
        const dur    = await getMediaDuration(file);
        const durStr = dur ? ` · ${fmtDuration(dur)}` : '';
        let metaText = `${formatFileSize(finalSize)}${durStr} · Audio`;
        let optimNote = '';
        if (wasCompressed) {
          metaText  = `${formatFileSize(originalSize)} → ${formatFileSize(finalSize)}${durStr} · Audio`;
          optimNote = `<div class="upload-optim-note">✓ Optimized for faster playback &amp; lower data usage</div>`;
        } else if (compResult.reason === 'already_small') {
          optimNote = `<div class="upload-optim-note">✓ Already optimized — no compression needed</div>`;
        }
        if (musicPreviewMeta) musicPreviewMeta.innerHTML = `<span>${metaText}</span>${optimNote}`;
        musicShowState('preview');
        if (window.lucide) window.lucide.createIcons();
        showToast(
          wasCompressed
            ? `🎵 Uploaded! Saved ${formatFileSize(originalSize - finalSize)} via optimization.`
            : 'MP3 uploaded! 🎵 Enter a title and click Add Song.',
          'success'
        );
        softBeep(750, 0.22, 0.06);
      },
      onFail: (msg) => { if (musicErrorMsg) musicErrorMsg.textContent = msg; musicShowState('error'); },
      onError: () => { if (musicErrorMsg) musicErrorMsg.textContent = 'Network error. Check your connection and try again.'; musicShowState('error'); }
    });
  }

  if (musicDropZone && musicFileInput) {
    musicDropZone.addEventListener('click', () => musicFileInput.click());
    musicDropZone.addEventListener('dragover',  e => { e.preventDefault(); musicDropZone.classList.add('dragover'); });
    musicDropZone.addEventListener('dragenter', e => { e.preventDefault(); musicDropZone.classList.add('dragover'); });
    musicDropZone.addEventListener('dragleave', () => musicDropZone.classList.remove('dragover'));
    musicDropZone.addEventListener('dragend',   () => musicDropZone.classList.remove('dragover'));
    musicDropZone.addEventListener('drop', e => {
      e.preventDefault(); musicDropZone.classList.remove('dragover');
      if (e.dataTransfer.files?.[0]) uploadMusicFile(e.dataTransfer.files[0]);
    });
    musicFileInput.addEventListener('change', () => {
      if (musicFileInput.files?.[0]) uploadMusicFile(musicFileInput.files[0]);
      musicFileInput.value = '';
    });
  }

  if (musicReplaceBtn) {
    musicReplaceBtn.addEventListener('click', () => {
      if (songUrlInput) songUrlInput.value = '';
      if (_lastMusicObjectUrl) { URL.revokeObjectURL(_lastMusicObjectUrl); _lastMusicObjectUrl = null; }
      musicShowState('drop');
      musicFileInput && musicFileInput.click();
    });
  }
  if (musicRetryBtn) {
    musicRetryBtn.addEventListener('click', () => { if (_lastMusicFile) uploadMusicFile(_lastMusicFile); });
  }

  if (cancelSongEditBtn) {
    cancelSongEditBtn.addEventListener('click', () => {
      musicShowState('drop');
      if (songUrlInput) songUrlInput.value = '';
      if (_lastMusicObjectUrl) { URL.revokeObjectURL(_lastMusicObjectUrl); _lastMusicObjectUrl = null; }
      _lastMusicFile = null;
    }, true);
  }
}

/* ══════════════════════════════════════════════
   DATA LOAD (Firestore realtime sync)
   ══════════════════════════════════════════════ */

export function initDataLoad() {
  if (!db) {
    renderNotes(activeNotesData.length ? activeNotesData : getDefaultNotesData());
    renderMemories(activeMemoriesData.length ? activeMemoriesData : getFallbackMemories());
    showDailyMsg();
    return;
  }

  // Daily Messages
  db.collection("daily_messages").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    lastMessagesSnapshot = snapshot;
    const msgs = [];
    snapshot.forEach(doc => { msgs.push(doc.data().text); });
    setActiveDailyMessages(msgs);
    showDailyMsg();
    renderAdminMessagesList(snapshot);
  }, err => { console.warn("Firestore messages fetch failed, fallback active:", err); showDailyMsg(); });

  // Notes
  db.collection("notes").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    lastNotesSnapshot = snapshot;
    const notes = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      notes.push({ id: doc.id, tag: data.tag, body: data.body, from: data.from });
    });
    setActiveNotesData(notes);
    renderNotes(notes.length > 0 ? notes : getDefaultNotesData());
    renderAdminNotesList(snapshot);
  }, err => { console.warn("Firestore notes fetch failed, fallback active:", err); renderNotes(getDefaultNotesData()); });

  // Memories
  db.collection("memories").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    lastMemoriesSnapshot = snapshot;
    const mems = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.url) {
        mems.push({ id: doc.id, url: data.url, type: data.type || "image", caption: data.caption || "", album: data.album || "General", uploadedBy: data.uploadedBy || "" });
      }
    });
    setActiveMemoriesData(mems);
    renderMemories(activeMemoriesData);
    renderHomePreviews(activeMemoriesData);
    renderAdminMemoriesList(snapshot);
  }, err => { console.warn("Firestore memories fetch failed, fallback active:", err); renderMemories(getFallbackMemories()); });

  // Songs
  loadSongsFromDB();
}

function loadSongsFromDB() {
  const cached = localStorage.getItem('local_playlist');
  if (cached) {
    try { MusicPlayer.setPlaylist(JSON.parse(cached), null); } catch(e) {}
  }
  if (!db) return;

  db.collection('songs').orderBy('createdAt', 'asc').onSnapshot(snapshot => {
    lastSongsSnapshot = snapshot;
    const songs = [];
    snapshot.forEach(doc => {
      const d = doc.data();
      songs.push({
        id: doc.id,
        title: d.title || 'Untitled',
        artist: d.artist || '',
        url: d.url || '',
        duration: d.duration || 0,
        orderIndex: d.orderIndex,
        album: d.album || '',
        cover: d.cover || '',
        sourceType: d.sourceType || 'uploaded'
      });
    });
    songs.sort((a, b) => {
      if (a.orderIndex !== undefined && b.orderIndex !== undefined) return a.orderIndex - b.orderIndex;
      if (a.orderIndex !== undefined) return -1;
      if (b.orderIndex !== undefined) return 1;
      return 0;
    });
    MusicPlayer.setPlaylist(songs, snapshot);
    renderAdminSongsList(snapshot);
  }, err => { console.warn('Firestore songs fetch failed:', err); });
}

/* ══════════════════════════════════════════════
   INITIALIZE ALL ADMIN FEATURES
   ══════════════════════════════════════════════ */

export function initAdmin() {
  initAdminLogin();
  initConfigForm();
  initAdminTabs();
  initMessagesCRUD();
  initNotesCRUD();
  initMemoriesCRUD();
  initMemoriesUpload();
  initSongsCRUD();
  initMusicUpload();
  initDataLoad();
}
