/* ══════════════════════════════════════════════
   music-player.js — single-owner module
   All playback state lives here. No dual-listener races.
   ══════════════════════════════════════════════ */
import { getConfig, isMobile } from './config.js';
import { db } from './db.js';
import { audioCtx, softBeep, showToast, fmtDuration, formatFileSize, getMediaDuration, compressAudioFile, buildUploadXHR } from './utils.js';

/* ── Shared state used by both MusicPlayer and admin CRUD below ── */
let audioOn = false;
export function getAudioOn() { return audioOn; }
export function setAudioOn(v) { audioOn = v; }

const MusicPlayer = (() => {
  // ── State
  let _playlist       = [];
  let _idx            = 0;
  let _isPlaying      = false;
  let _snapshot       = null;
  let _editingSongId  = null;
  let _isAdmin        = false;

  let _shuffle        = localStorage.getItem('mp_shuffle') === 'true';
  let _repeatMode     = localStorage.getItem('mp_repeat') || 'all';
  let _volume         = parseFloat(localStorage.getItem('mp_volume') || '0.55');
  let _isMuted        = false;
  let isSeekingProgress = false;

  // ── DOM refs
  const _bgm         = document.getElementById('bgm');
  const _miniPlayer  = document.getElementById('miniPlayer');
  const _titleEl     = document.getElementById('miniPlayerTitle');
  const _barsEl      = document.getElementById('miniPlayerBars');
  const _prevBtn     = document.getElementById('prevSongBtn');
  const _playBtn     = document.getElementById('playPauseBtn');
  const _nextBtn     = document.getElementById('nextSongBtn');
  const _soundToggle = document.getElementById('soundToggle');
  const _audioHint   = document.getElementById('audioHint');

  const _playerPlayPauseBtn = document.getElementById('playerPlayPauseBtn');
  const _playerPrevBtn      = document.getElementById('playerPrevBtn');
  const _playerNextBtn      = document.getElementById('playerNextBtn');
  const _playerShuffleBtn   = document.getElementById('playerShuffleBtn');
  const _playerRepeatBtn    = document.getElementById('playerRepeatBtn');
  const _playerVolumeSlider = document.getElementById('playerVolumeSlider');
  const _playerMuteBtn      = document.getElementById('playerMuteBtn');
  const _playerProgressSlider = document.getElementById('playerProgressSlider');
  const _playerCurrentTime  = document.getElementById('playerCurrentTime');
  const _playerTotalDuration = document.getElementById('playerTotalDuration');
  const _playerVinyl        = document.getElementById('playerVinyl');
  const _playerCassette     = document.getElementById('playerCassette');
  const _playerSongTitle    = document.getElementById('playerSongTitle');
  const _playerSongArtist   = document.getElementById('playerSongArtist');
  const _playlistSongsList  = document.getElementById('playlistSongsList');
  const _playlistSearch     = document.getElementById('playlistSearch');
  const _totalSongsCount    = document.getElementById('totalSongsCount');
  const _playlistEmptyState = document.getElementById('playlistEmptyState');
  const _musicPageDropZone  = document.getElementById('musicPageDropZone');
  const _musicPageFileInput = document.getElementById('musicPageFileInput');
  const _musicPageUploadingQueue = document.getElementById('musicPageUploadingQueue');

  if (_bgm) {
    _bgm.volume = _volume;
  }

  function cleanTitle(title) {
    if (!title) return '';
    return title.replace(/\.[^/.]+$/, "");
  }

  function _getRandomIndex() {
    if (_playlist.length <= 1) return 0;
    let nextIdx = _idx;
    while (nextIdx === _idx) {
      nextIdx = Math.floor(Math.random() * _playlist.length);
    }
    return nextIdx;
  }

  function _loadTrack(song) {
    if (!_bgm || !song) return;
    _bgm.pause();
    while (_bgm.firstChild) _bgm.removeChild(_bgm.firstChild);
    const s = document.createElement('source');
    s.src  = song.url;
    s.type = 'audio/mpeg';
    _bgm.appendChild(s);
    _bgm.load();
    _bgm.volume = _isMuted ? 0 : _volume;
  }

  function _syncUI() {
    const hasPlaylist = _playlist.length > 0;
    const song        = hasPlaylist ? _playlist[_idx] : null;
    const label       = song
      ? (song.artist ? `${song.title} — ${song.artist}` : song.title)
      : 'No music available';

    if (_titleEl) {
      _titleEl.textContent = label;
      requestAnimationFrame(() => {
        if (_titleEl.scrollWidth > _titleEl.clientWidth + 2) {
          _titleEl.classList.add('scrolling');
        } else {
          _titleEl.classList.remove('scrolling');
        }
      });
    }

    if (_miniPlayer) _miniPlayer.classList.toggle('playing', _isPlaying);

    if (_playBtn) {
      _playBtn.innerHTML = _isPlaying
        ? '<i data-lucide="pause"></i>'
        : '<i data-lucide="play"></i>';
      _playBtn.disabled = !hasPlaylist;
      _playBtn.title    = _isPlaying ? 'Pause' : 'Play';
    }

    const canSkip = hasPlaylist && _playlist.length > 1;
    if (_prevBtn) _prevBtn.disabled = !canSkip;
    if (_nextBtn) _nextBtn.disabled = !canSkip;

    if (_soundToggle) {
      _soundToggle.innerHTML = _isPlaying
        ? '<i data-lucide="volume-2"></i>'
        : '<i data-lucide="volume-x"></i>';
    }

    if (_audioHint) {
      _audioHint.innerHTML = _isPlaying
        ? 'Music on <i data-lucide="music" style="width: 14px; height: 14px;"></i> Tap to mute'
        : 'Tap <i data-lucide="volume-x" style="width: 14px; height: 14px;"></i> to start music';
    }

    if (_playerSongTitle) {
      _playerSongTitle.textContent = song ? song.title : 'No song playing';
      requestAnimationFrame(() => {
        if (_playerSongTitle.scrollWidth > _playerSongTitle.clientWidth + 2) {
          _playerSongTitle.classList.add('scrolling');
        } else {
          _playerSongTitle.classList.remove('scrolling');
        }
      });
    }

    if (_playerSongArtist) {
      _playerSongArtist.textContent = song ? (song.artist || 'Unknown Artist') : 'Add music in Admin or upload above!';
    }

    if (_playerPlayPauseBtn) {
      _playerPlayPauseBtn.innerHTML = _isPlaying
        ? '<i data-lucide="pause"></i>'
        : '<i data-lucide="play"></i>';
      _playerPlayPauseBtn.disabled = !hasPlaylist;
    }

    if (_playerPrevBtn) _playerPrevBtn.disabled = !canSkip;
    if (_playerNextBtn) _playerNextBtn.disabled = !canSkip;

    if (_playerShuffleBtn) {
      _playerShuffleBtn.classList.toggle('active', _shuffle);
    }

    if (_playerRepeatBtn) {
      _playerRepeatBtn.classList.toggle('active', _repeatMode !== 'off');
      if (_repeatMode === 'one') {
        _playerRepeatBtn.innerHTML = '<i data-lucide="repeat-1"></i>';
      } else {
        _playerRepeatBtn.innerHTML = '<i data-lucide="repeat"></i>';
      }
    }

    const showVinyl = _idx % 2 === 0;
    if (_playerVinyl) {
      _playerVinyl.style.display = showVinyl ? 'flex' : 'none';
      _playerVinyl.classList.toggle('playing', _isPlaying);
      
      const centerEl = _playerVinyl.querySelector('.vinyl-label-center');
      if (centerEl) {
        if (song && song.cover) {
          centerEl.style.backgroundImage = `url(${song.cover})`;
          centerEl.style.backgroundSize = 'cover';
          centerEl.style.backgroundPosition = 'center';
          const heartEl = centerEl.querySelector('.vinyl-heart');
          if (heartEl) heartEl.style.display = 'none';
        } else {
          centerEl.style.backgroundImage = '';
          const heartEl = centerEl.querySelector('.vinyl-heart');
          if (heartEl) heartEl.style.display = '';
        }
      }
    }
    if (_playerCassette) {
      if (!showVinyl) {
        _playerCassette.classList.add('active');
      } else {
        _playerCassette.classList.remove('active');
      }
      _playerCassette.classList.toggle('playing', _isPlaying);
    }

    if (_playlistSongsList) {
      _playlistSongsList.querySelectorAll('.playlist-song-item').forEach(li => {
        const isCurrent = li.dataset.id === song?.id;
        li.classList.toggle('active', isCurrent);
        const iconSpan = li.querySelector('.song-item-icon');
        if (iconSpan) {
          if (isCurrent && _isPlaying) {
            iconSpan.innerHTML = '<span class="equalizer-anim"><span></span><span></span><span></span></span>';
          } else {
            iconSpan.textContent = '🎵';
          }
        }
      });
    }

    _syncVolumeUI();
    if (window.lucide) window.lucide.createIcons();
  }

  function _syncVolumeUI() {
    if (_playerVolumeSlider) {
      _playerVolumeSlider.value = _isMuted ? 0 : _volume * 100;
    }
    if (_playerMuteBtn) {
      if (_isMuted) {
        _playerMuteBtn.innerHTML = '<i data-lucide="volume-x"></i>';
      } else if (_volume < 0.3) {
        _playerMuteBtn.innerHTML = '<i data-lucide="volume"></i>';
      } else if (_volume < 0.7) {
        _playerMuteBtn.innerHTML = '<i data-lucide="volume-1"></i>';
      } else {
        _playerMuteBtn.innerHTML = '<i data-lucide="volume-2"></i>';
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  async function play() {
    if (!_bgm || _playlist.length === 0) return;
    if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    try {
      await _bgm.play();
      _isPlaying = true;
      audioOn    = true;
    } catch (e) {
      console.warn('Playback blocked:', e);
    }
    _syncUI();
  }

  function pause() {
    if (_bgm) _bgm.pause();
    _isPlaying = false;
    audioOn    = false;
    _syncUI();
  }

  async function togglePlayPause() {
    if (_isPlaying) { pause(); } else { await play(); }
  }

  async function goTo(idx, keepPlaying) {
    if (_playlist.length === 0) return;
    _idx = ((idx % _playlist.length) + _playlist.length) % _playlist.length;
    _loadTrack(_playlist[_idx]);
    _syncUI();

    if (keepPlaying || _isPlaying) {
      await play();
      showToast(`🎵 Now playing: ${cleanTitle(_playlist[_idx].title)}`, 'success');
      softBeep(680, 0.18, 0.04);
    }
  }

  async function playById(id) {
    const i = _playlist.findIndex(s => s.id === id);
    if (i === -1) return;
    await goTo(i, true);
  }

  function setPlaylist(songs, snapshot) {
    const wasEmpty   = _playlist.length === 0;
    const prevId     = _playlist[_idx]?.id;

    localStorage.setItem('local_playlist', JSON.stringify(songs));

    _playlist  = songs;
    _snapshot  = snapshot;

    if (_playlist.length === 0) {
      _idx = 0;
      _syncUI();
      renderPlaylist();
      return;
    }

    const sameIdx = _playlist.findIndex(s => s.id === prevId);
    _idx = sameIdx >= 0 ? sameIdx : 0;

    if (wasEmpty || sameIdx === -1) {
      _loadTrack(_playlist[_idx]);
    }

    if (_isPlaying) {
      goTo(_idx, true);
    }

    _syncUI();
    renderPlaylist();
  }

  function renderPlaylist() {
    if (!_playlistSongsList) return;

    const uploadZone = document.querySelector('.music-page-upload');
    if (uploadZone) {
      uploadZone.style.display = _isAdmin ? 'block' : 'none';
    }

    const deezerSearchSection = document.getElementById('deezerSearchSection');
    if (deezerSearchSection) {
      deezerSearchSection.style.display = _isAdmin ? 'block' : 'none';
    }

    const query = (_playlistSearch?.value || '').toLowerCase().trim();
    const favs = JSON.parse(localStorage.getItem('mp_favorites') || '[]');
    const currentSong = _playlist[_idx];

    const filtered = _playlist.filter(song => {
      return song.title.toLowerCase().includes(query) || (song.artist || '').toLowerCase().includes(query);
    });

    if (_totalSongsCount) {
      _totalSongsCount.textContent = _playlist.length;
    }

    if (filtered.length === 0) {
      _playlistSongsList.style.display = 'none';
      if (_playlistEmptyState) {
        _playlistEmptyState.style.display = 'block';
        _playlistEmptyState.textContent = query ? 'No matching songs found 🔍' : 'No music uploaded yet 🎵';
      }
      return;
    } else {
      _playlistSongsList.style.display = '';
      if (_playlistEmptyState) _playlistEmptyState.style.display = 'none';
    }

    _playlistSongsList.innerHTML = '';
    filtered.forEach((song) => {
      const originalIdx = _playlist.findIndex(s => s.id === song.id);
      const isActive = song.id === currentSong?.id;
      const isFavorite = favs.includes(song.id);

      const isDeezer = song.url && (song.url.includes('deezer.com') || song.sourceType === 'deezer');
      const badgeHtml = isDeezer
        ? `<span class="song-badge deezer-badge" style="font-size: 0.6rem; padding: 1px 4px; background: #fdf2f8; color: #db2777; border-radius: 4px; margin-left: 6px; font-weight: bold; border: 1px solid #fbcfe8; vertical-align: middle;">Deezer Preview</span>`
        : `<span class="song-badge mp3-badge" style="font-size: 0.65rem; padding: 1px 4px; background: #f0fdf4; color: #166534; border-radius: 4px; margin-left: 6px; font-weight: bold; border: 1px solid #bbf7d0; vertical-align: middle;">Uploaded MP3</span>`;

      const coverHtml = song.cover
        ? `<img src="${song.cover}" style="width: 28px; height: 28px; border-radius: 4px; border: 1px solid var(--border); margin-right: 8px; vertical-align: middle;">`
        : '';

      const li = document.createElement('li');
      li.className = `playlist-song-item ${isActive ? 'active' : ''}`;
      li.dataset.id = song.id;
      li.dataset.index = originalIdx;
      li.draggable = _isAdmin;

      const dragHandle = _isAdmin
        ? `<span class="playlist-drag-handle" title="Drag to reorder"><i data-lucide="grip-vertical"></i></span>`
        : '';

      const adminActions = _isAdmin
        ? `<button class="song-action-btn rename-btn" title="Rename"><i data-lucide="edit-3"></i></button>
           <button class="song-action-btn delete-btn" title="Remove"><i data-lucide="trash-2"></i></button>`
        : '';

      li.innerHTML = `
        ${dragHandle}
        <div class="song-item-left" style="${!_isAdmin ? 'padding-left: 10px;' : ''}; display: flex; align-items: center; flex: 1;">
          <span class="song-item-index" style="margin-right: 8px;">${originalIdx + 1}</span>
          ${coverHtml}
          <span class="song-item-icon" style="${song.cover ? 'display: none;' : ''}">${isActive && _isPlaying ? '<span class="equalizer-anim"><span></span><span></span><span></span></span>' : '🎵'}</span>
          <div class="song-item-info">
            <span class="song-item-title">${cleanTitle(song.title)}${badgeHtml}</span>
            <span class="song-item-artist">${song.artist || 'Unknown Artist'}</span>
          </div>
        </div>
        <div class="song-item-right">
          <span class="song-item-duration">${fmtDuration(song.duration) || '--:--'}</span>
          <div class="song-item-actions">
            <button class="song-action-btn fav-btn ${isFavorite ? 'active' : ''}" title="Favorite"><i data-lucide="heart"></i></button>
            ${adminActions}
          </div>
        </div>
      `;

      li.addEventListener('click', (e) => {
        if (e.target.closest('.song-action-btn') || e.target.closest('.playlist-drag-handle')) return;
        goTo(originalIdx, true);
      });

      li.querySelector('.fav-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(song.id);
      });

      if (_isAdmin) {
        li.querySelector('.rename-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          renameSong(song.id);
        });

        li.querySelector('.delete-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          removeSong(song.id);
        });
      }

      _playlistSongsList.appendChild(li);
    });

    if (_isAdmin) {
      const items = _playlistSongsList.querySelectorAll('.playlist-song-item');
      items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function toggleFavorite(id) {
    const favs = JSON.parse(localStorage.getItem('mp_favorites') || '[]');
    const index = favs.indexOf(id);
    if (index === -1) {
      favs.push(id);
      showToast('Added to favorites! 💖', 'success');
      softBeep(680, 0.15, 0.04);
    } else {
      favs.splice(index, 1);
      showToast('Removed from favorites.', 'info');
      softBeep(520, 0.15, 0.03);
    }
    localStorage.setItem('mp_favorites', JSON.stringify(favs));
    renderPlaylist();
    _syncUI();
  }

  function renameSong(id) {
    if (!_isAdmin) { showToast('Unauthorized action! 🥺', 'error'); return; }
    const song = _playlist.find(s => s.id === id);
    if (!song) return;
    const newName = prompt(`Rename "${song.title}" to:`, song.title);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed) { showToast('Name cannot be empty! 🥺', 'error'); return; }

    if (db) {
      db.collection('songs').doc(id).update({ title: trimmed })
        .then(() => { showToast('Song renamed! 🌸', 'success'); softBeep(620, 0.15, 0.03); })
        .catch(err => showToast('Error: ' + err.message, 'error'));
    } else {
      const local = JSON.parse(localStorage.getItem('local_playlist') || '[]');
      const item = local.find(s => s.id === id);
      if (item) {
        item.title = trimmed;
        localStorage.setItem('local_playlist', JSON.stringify(local));
        setPlaylist(local, null);
      }
    }
  }

  function removeSong(id) {
    if (!_isAdmin) { showToast('Unauthorized action! 🥺', 'error'); return; }
    if (!confirm('Are you sure you want to delete this song? 🥺')) return;
    if (db) {
      db.collection('songs').doc(id).delete()
        .then(() => { showToast('Song removed! 🌸', 'success'); softBeep(450, 0.2, 0.04); })
        .catch(err => showToast('Error: ' + err.message, 'error'));
    } else {
      let local = JSON.parse(localStorage.getItem('local_playlist') || '[]');
      local = local.filter(s => s.id !== id);
      localStorage.setItem('local_playlist', JSON.stringify(local));
      setPlaylist(local, null);
      showToast('Song removed! 🌸', 'success');
    }
  }

  // ── Drag & Drop Event Handlers
  let dragSourceEl = null;

  function handleDragStart(e) {
    dragSourceEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
    this.classList.add('dragging');
  }

  function handleDragOver(e) { if (e.preventDefault) e.preventDefault(); return false; }
  function handleDragEnter(e) { this.classList.add('drag-over'); }
  function handleDragLeave(e) { this.classList.remove('drag-over'); }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
    const sourceId = e.dataTransfer.getData('text/plain');
    const targetId = this.dataset.id;
    if (sourceId !== targetId) {
      const srcIdx = _playlist.findIndex(s => s.id === sourceId);
      const tgtIdx = _playlist.findIndex(s => s.id === targetId);
      if (srcIdx !== -1 && tgtIdx !== -1) {
        const temp = _playlist.splice(srcIdx, 1)[0];
        _playlist.splice(tgtIdx, 0, temp);
        renderPlaylist();
        if (db) {
          const batch = db.batch();
          _playlist.forEach((song, i) => {
            const ref = db.collection('songs').doc(song.id);
            batch.update(ref, { orderIndex: i });
          });
          batch.commit().catch(err => console.error("Firestore batch commit error:", err));
        } else {
          localStorage.setItem('local_playlist', JSON.stringify(_playlist));
          setPlaylist(_playlist, null);
        }
      }
    }
    return false;
  }

  function handleDragEnd(e) {
    this.classList.remove('dragging');
    if (_playlistSongsList) {
      _playlistSongsList.querySelectorAll('.playlist-song-item').forEach(item => {
        item.classList.remove('drag-over');
      });
    }
  }

  // ── Multi-File Upload to Cloudinary
  async function uploadMultipleSongs(files) {
    if (!_isAdmin) { showToast('Unauthorized action! 🥺', 'error'); return; }
    if (!files || files.length === 0) return;
    const cloudName = getConfig().cloudinary.cloudName;
    const uploadPreset = getConfig().cloudinary.uploadPreset;
    if (!cloudName || !uploadPreset || cloudName === 'YOUR_CLOUD_NAME') {
      showToast('Configure Cloudinary first in Admin → Config! 🥺', 'error');
      return;
    }

    const uploadQueue = document.getElementById('musicPageUploadingQueue');
    const queueText = document.getElementById('musicPageUploadQueueText');
    const progressBar = document.getElementById('musicPageUploadProgressBar');
    const pctText = document.getElementById('musicPageUploadPctText');

    if (uploadQueue) uploadQueue.style.display = 'flex';

    let successCount = 0;
    const totalFiles = files.length;

    let maxOrder = 0;
    _playlist.forEach(s => {
      if (s.orderIndex !== undefined && s.orderIndex > maxOrder) {
        maxOrder = s.orderIndex;
      }
    });

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const fileNum = i + 1;

      if (queueText) queueText.textContent = `[${fileNum}/${totalFiles}] Optimizing: ${file.name}`;
      if (pctText) pctText.textContent = '⏳ Optimizing…';
      if (progressBar) progressBar.style.width = '0%';

      const compResult = await compressAudioFile(file, (status) => {
        if (pctText) pctText.textContent = status;
      });

      const uploadFile = compResult.file;

      if (queueText) queueText.textContent = `[${fileNum}/${totalFiles}] Uploading: ${file.name}`;
      if (pctText) pctText.textContent = '0%';

      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

      try {
        const resp = await new Promise((resolve, reject) => {
          buildUploadXHR({
            file: uploadFile,
            endpoint,
            onProgress: pct => {
              if (progressBar) progressBar.style.width = `${pct}%`;
              if (pctText) pctText.textContent = `Uploading ${pct}%`;
            },
            onSuccess: resolve,
            onFail: reject,
            onError: () => reject(new Error('Network error'))
          });
        });

        const duration = await getMediaDuration(file);
        const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');

        if (db) {
          await db.collection('songs').add({
            title: cleanName,
            artist: '',
            url: resp.secure_url,
            duration: duration || 0,
            orderIndex: maxOrder + fileNum,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        } else {
          const localSongs = JSON.parse(localStorage.getItem('local_playlist') || '[]');
          const newSong = {
            id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            title: cleanName,
            artist: '',
            url: resp.secure_url,
            duration: duration || 0,
            orderIndex: localSongs.length
          };
          localSongs.push(newSong);
          localStorage.setItem('local_playlist', JSON.stringify(localSongs));
          setPlaylist(localSongs, null);
        }

        successCount++;
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        showToast(`Failed to upload ${file.name}: ${err.message || err}`, 'error');
      }
    }

    if (uploadQueue) uploadQueue.style.display = 'none';
    if (successCount > 0) {
      showToast(`Uploaded ${successCount} song(s)! 🎵`, 'success');
      softBeep(750, 0.22, 0.06);
    }
  }

  // ── Auto-play next song on ended
  if (_bgm) {
    _bgm.addEventListener('ended', () => {
      if (_playlist.length === 0) return;
      if (_repeatMode === 'one') {
        goTo(_idx, true);
      } else if (_shuffle) {
        goTo(_getRandomIndex(), true);
      } else {
        if (_idx < _playlist.length - 1) {
          goTo(_idx + 1, true);
        } else {
          if (_repeatMode === 'all') {
            goTo(0, true);
          } else {
            _isPlaying = false;
            audioOn = false;
            _syncUI();
          }
        }
      }
    });

    _bgm.addEventListener('timeupdate', () => {
      if (!_bgm.duration || isNaN(_bgm.duration)) return;
      const pct = (_bgm.currentTime / _bgm.duration) * 100;
      if (!isSeekingProgress && _playerProgressSlider) {
        _playerProgressSlider.value = pct;
      }
      if (_playerCurrentTime) {
        _playerCurrentTime.textContent = fmtDuration(Math.floor(_bgm.currentTime));
      }
    });

    _bgm.addEventListener('loadedmetadata', () => {
      if (_playerTotalDuration && _bgm.duration) {
        _playerTotalDuration.textContent = fmtDuration(Math.round(_bgm.duration));
      }
    });
  }

  // ── Progress seeking
  if (_playerProgressSlider) {
    _playerProgressSlider.addEventListener('input', () => {
      isSeekingProgress = true;
      if (_bgm.duration) {
        const targetTime = (_playerProgressSlider.value / 100) * _bgm.duration;
        if (_playerCurrentTime) _playerCurrentTime.textContent = fmtDuration(Math.floor(targetTime));
      }
    });

    _playerProgressSlider.addEventListener('change', () => {
      if (_bgm.duration) {
        _bgm.currentTime = (_playerProgressSlider.value / 100) * _bgm.duration;
      }
      isSeekingProgress = false;
    });
  }

  // ── Volume & mute
  if (_playerVolumeSlider) {
    _playerVolumeSlider.value = _volume * 100;
    _playerVolumeSlider.addEventListener('input', () => {
      _volume = _playerVolumeSlider.value / 100;
      _bgm.volume = _volume;
      _isMuted = _volume === 0;
      localStorage.setItem('mp_volume', _volume);
      _syncVolumeUI();
    });
  }

  if (_playerMuteBtn) {
    _playerMuteBtn.addEventListener('click', () => {
      _isMuted = !_isMuted;
      _bgm.volume = _isMuted ? 0 : _volume;
      _syncVolumeUI();
      softBeep(560, 0.12, 0.03);
    });
  }

  // ── Controls
  if (_playerPlayPauseBtn) {
    _playerPlayPauseBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlayPause(); });
  }
  if (_playerPrevBtn) {
    _playerPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(_idx - 1, _isPlaying); });
  }
  if (_playerNextBtn) {
    _playerNextBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(_idx + 1, _isPlaying); });
  }
  if (_playerShuffleBtn) {
    _playerShuffleBtn.addEventListener('click', () => {
      _shuffle = !_shuffle;
      localStorage.setItem('mp_shuffle', _shuffle);
      _syncUI();
      softBeep(_shuffle ? 720 : 540, 0.15, 0.04);
      showToast(_shuffle ? 'Shuffle mode ON 🔀' : 'Shuffle mode OFF ➡️', 'info');
    });
  }
  if (_playerRepeatBtn) {
    _playerRepeatBtn.addEventListener('click', () => {
      if (_repeatMode === 'off') _repeatMode = 'all';
      else if (_repeatMode === 'all') _repeatMode = 'one';
      else _repeatMode = 'off';
      localStorage.setItem('mp_repeat', _repeatMode);
      _syncUI();
      softBeep(640, 0.15, 0.04);
      let msg = 'Repeat: OFF';
      if (_repeatMode === 'all') msg = 'Repeat: ALL 🔁';
      if (_repeatMode === 'one') msg = 'Repeat: ONE 🔂';
      showToast(msg, 'info');
    });
  }

  // ── Search & Collapse
  if (_playlistSearch) {
    _playlistSearch.addEventListener('input', () => { renderPlaylist(); });
  }

  const playlistTitleEl = document.querySelector('.playlist-title');
  const playlistContainer = document.querySelector('.playlist-songs-container');
  if (playlistTitleEl && playlistContainer) {
    playlistTitleEl.style.cursor = 'pointer';
    playlistTitleEl.title = 'Click to collapse/expand playlist';
    playlistTitleEl.addEventListener('click', () => {
      const isHidden = playlistContainer.style.display === 'none';
      playlistContainer.style.display = isHidden ? 'block' : 'none';
      softBeep(520, 0.15, 0.03);
    });
  }

  // ── Drag & Drop Multi-Upload triggers
  if (_musicPageDropZone && _musicPageFileInput) {
    _musicPageDropZone.addEventListener('click', () => _musicPageFileInput.click());
    _musicPageDropZone.addEventListener('dragover',  e => { e.preventDefault(); _musicPageDropZone.classList.add('dragover'); });
    _musicPageDropZone.addEventListener('dragenter', e => { e.preventDefault(); _musicPageDropZone.classList.add('dragover'); });
    _musicPageDropZone.addEventListener('dragleave', () => _musicPageDropZone.classList.remove('dragover'));
    _musicPageDropZone.addEventListener('dragend',   () => _musicPageDropZone.classList.remove('dragover'));
    _musicPageDropZone.addEventListener('drop', e => {
      e.preventDefault(); _musicPageDropZone.classList.remove('dragover');
      if (e.dataTransfer.files?.length > 0) uploadMultipleSongs(e.dataTransfer.files);
    });
    _musicPageFileInput.addEventListener('change', () => {
      if (_musicPageFileInput.files?.length > 0) uploadMultipleSongs(_musicPageFileInput.files);
      _musicPageFileInput.value = '';
    });
  }

  // ── Wire up original mini-player elements
  if (_playBtn) {
    _playBtn.addEventListener('click', e => { e.stopPropagation(); togglePlayPause(); });
  }
  if (_prevBtn) {
    _prevBtn.addEventListener('click', e => { e.stopPropagation(); goTo(_idx - 1, _isPlaying); });
  }
  if (_nextBtn) {
    _nextBtn.addEventListener('click', e => { e.stopPropagation(); goTo(_idx + 1, _isPlaying); });
  }
  if (_soundToggle) {
    const fresh = _soundToggle.cloneNode(true);
    _soundToggle.parentNode.replaceChild(fresh, _soundToggle);
    fresh.addEventListener('click', e => { e.stopPropagation(); togglePlayPause(); });
  }

  // ── Deezer Search Setup
  let currentPreviewAudio = null;
  let currentPreviewBtn = null;

  async function performDeezerSearch() {
    const searchInput = document.getElementById('deezerSearchInput');
    const resultsList = document.getElementById('deezerResultsList');
    const resultsContainer = document.getElementById('deezerResultsContainer');
    
    const query = (searchInput?.value || '').trim();
    if (!query) {
      showToast('Please enter a search query! 🔍', 'error');
      return;
    }
    
    if (resultsList) {
      resultsList.innerHTML = '<li style="font-family:\'Lora\', serif; text-align:center; padding: 12px; color: var(--text);">Searching Deezer... ⏳</li>';
    }
    if (resultsContainer) {
      resultsContainer.style.display = 'block';
    }
    
    try {
      const data = await searchDeezerJSONP(query);
      if (!data || !data.data || data.data.length === 0) {
        if (resultsList) {
          resultsList.innerHTML = '<li style="font-family:\'Lora\', serif; text-align:center; padding: 12px; color: var(--text);">No songs found 🥺</li>';
        }
        return;
      }
      
      renderDeezerResults(data.data);
    } catch (err) {
      console.error(err);
      if (resultsList) {
        resultsList.innerHTML = '<li style="font-family:\'Lora\', serif; text-align:center; padding: 12px; color: var(--text);">Search failed. Please try again! 🥺</li>';
      }
    }
  }

  function searchDeezerJSONP(query) {
    return new Promise((resolve, reject) => {
      const callbackName = 'deezerCallback_' + Math.floor(Math.random() * 1000000);
      window[callbackName] = (data) => {
        resolve(data);
        document.getElementById(scriptId)?.remove();
        delete window[callbackName];
      };
      
      const scriptId = 'deezerScript_' + callbackName;
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&output=jsonp&callback=${callbackName}`;
      script.onerror = (err) => {
        reject(err);
        document.getElementById(scriptId)?.remove();
        delete window[callbackName];
      };
      document.body.appendChild(script);
    });
  }

  function renderDeezerResults(songs) {
    const resultsList = document.getElementById('deezerResultsList');
    if (!resultsList) return;
    resultsList.innerHTML = '';
    
    songs.forEach(song => {
      const li = document.createElement('li');
      li.className = 'playlist-song-item';
      li.style.cursor = 'default';
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.padding = '8px';
      
      const durationStr = fmtDuration(song.duration) || '--:--';
      
      li.innerHTML = `
        <img src="${song.album.cover_small || ''}" alt="Cover" style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--border); margin-right: 10px;">
        <div class="song-item-left" style="flex: 1; padding: 0;">
          <div class="song-item-info">
            <span class="song-item-title" style="font-weight: 600; font-size: 0.9rem;">${song.title}</span>
            <span class="song-item-artist" style="font-size: 0.75rem; opacity: 0.8; display: block;">${song.artist.name} &middot; ${song.album.title}</span>
          </div>
        </div>
        <div class="song-item-right" style="gap: 8px; display: flex; align-items: center;">
          <span class="song-item-duration" style="font-size: 0.8rem; margin-right: 4px;">${durationStr}</span>
          <div class="song-item-actions" style="display: flex; gap: 4px;">
            <button class="song-action-btn deezer-preview-btn" title="Preview" style="background: transparent; color: var(--text); border: 1px solid var(--border); border-radius: 4px; padding: 4px 8px; font-size: 0.75rem; display: flex; align-items: center; gap: 4px;"><i data-lucide="play" style="width:12px; height:12px;"></i> Preview</button>
            <button class="song-action-btn deezer-add-btn" style="background: var(--btn); color: var(--bg); border: 2px solid var(--border); border-radius: 4px; padding: 4px 8px; font-size: 0.75rem; font-family: 'Lora', serif; font-weight: bold; box-shadow: 1px 1px 0 var(--border); display: flex; align-items: center; gap: 4px;"><i data-lucide="plus" style="width:12px; height:12px;"></i> Add</button>
          </div>
        </div>
      `;
      
      const previewBtn = li.querySelector('.deezer-preview-btn');
      previewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePreview(song.preview, previewBtn);
      });
      
      const addBtn = li.querySelector('.deezer-add-btn');
      addBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        addBtn.disabled = true;
        addBtn.textContent = 'Adding...';
        await addDeezerSongToPlaylist(song);
        addBtn.textContent = 'Added';
        softBeep(700, 0.2, 0.05);
      });
      
      resultsList.appendChild(li);
    });
    
    if (window.lucide) window.lucide.createIcons();
  }

  function togglePreview(url, btn) {
    if (currentPreviewAudio && !currentPreviewAudio.paused && currentPreviewBtn === btn) {
      currentPreviewAudio.pause();
      btn.innerHTML = '<i data-lucide="play" style="width:12px; height:12px;"></i> Preview';
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    
    if (currentPreviewAudio) {
      currentPreviewAudio.pause();
      if (currentPreviewBtn) {
        currentPreviewBtn.innerHTML = '<i data-lucide="play" style="width:12px; height:12px;"></i> Preview';
      }
    }
    
    MusicPlayer.pause();
    
    currentPreviewAudio = new Audio(url);
    currentPreviewBtn = btn;
    currentPreviewAudio.volume = 0.55;
    currentPreviewAudio.play().catch(err => {
      console.error("Preview play failed:", err);
      showToast("Cannot play preview 🥺", "error");
    });
    btn.innerHTML = '<i data-lucide="pause" style="width:12px; height:12px;"></i> Pause';
    if (window.lucide) window.lucide.createIcons();
    
    currentPreviewAudio.addEventListener('ended', () => {
      btn.innerHTML = '<i data-lucide="play" style="width:12px; height:12px;"></i> Preview';
      if (window.lucide) window.lucide.createIcons();
    });
  }

  async function addDeezerSongToPlaylist(song) {
    const title = song.title;
    const artist = song.artist.name;
    const album = song.album.title;
    const cover = song.album.cover_medium || song.album.cover || '';
    const url = song.preview;
    const duration = song.duration;
    
    let maxOrder = 0;
    _playlist.forEach(s => {
      if (s.orderIndex !== undefined && s.orderIndex > maxOrder) {
        maxOrder = s.orderIndex;
      }
    });
    
    if (db) {
      try {
        await db.collection('songs').add({
          title,
          artist,
          album,
          cover,
          url,
          duration,
          sourceType: 'deezer',
          orderIndex: maxOrder + 1,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('Deezer song added to playlist! 🎵', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to add song to Firestore! 🥺', 'error');
      }
    } else {
      const localSongs = JSON.parse(localStorage.getItem('local_playlist') || '[]');
      const newSong = {
        id: 'deezer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title,
        artist,
        album,
        cover,
        url,
        duration,
        sourceType: 'deezer',
        orderIndex: localSongs.length
      };
      localSongs.push(newSong);
      localStorage.setItem('local_playlist', JSON.stringify(localSongs));
      setPlaylist(localSongs, null);
      showToast('Deezer song added to local playlist! 🎵', 'success');
    }
  }

  // Bind Deezer inputs
  const deezerSearchBtn = document.getElementById('deezerSearchBtn');
  const deezerSearchInput = document.getElementById('deezerSearchInput');

  if (deezerSearchBtn) {
    deezerSearchBtn.addEventListener('click', performDeezerSearch);
  }
  if (deezerSearchInput) {
    deezerSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performDeezerSearch();
    });
  }

  _syncUI();

  return { play, pause, togglePlayPause, goTo, playById, setPlaylist, renderPlaylist,
    get idx()       { return _idx; },
    get isPlaying() { return _isPlaying; },
    get playlist()  { return _playlist; },
    get snapshot()  { return _snapshot; },
    setEditingSongId(id) { _editingSongId = id; },
    getEditingSongId()   { return _editingSongId; },
    setAdminLoggedIn(val) { _isAdmin = val; renderPlaylist(); },
    get isAdmin() { return _isAdmin; }
  };
})();

export default MusicPlayer;
