/* ── utils.js ── Shared utility functions ── */
import { isLowEnd, getConfig } from './config.js';

/* ── Audio context (for UI beeps only) ── */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
export const audioCtx = AudioCtx ? new AudioCtx() : null;

export function softBeep(freq = 600, duration = 0.18, vol = 0.04) {
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

export function resumeAudioCtx() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  window.removeEventListener('pointerdown', resumeAudioCtx);
}

/* ── Toast notification ── */
let toastTimer = null;
const moodToast = document.getElementById('moodToast');

export function showToast(msg, type = 'info') {
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

export function showMoodToast(msg) {
  showToast(msg, 'info');
}

/* ── File / media helpers ── */
export function formatFileSize(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getMediaDuration(file) {
  return new Promise(resolve => {
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) { resolve(null); return; }
    const url = URL.createObjectURL(file);
    const el = file.type.startsWith('audio/') ? new Audio() : document.createElement('video');
    el.preload = 'metadata';
    el.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Math.round(el.duration)); };
    el.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    el.src = url;
  });
}

export function fmtDuration(sec) {
  if (!sec || isNaN(sec)) return null;
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ── Client-side MP3 compression (lamejs) ── */
export async function compressAudioFile(file, onStatus) {
  const SKIP_BELOW_MB  = 2.5;
  const TARGET_KBPS    = 128;
  const MIN_SAVE_RATIO = 0.10;

  const originalSize = file.size;

  if (originalSize <= SKIP_BELOW_MB * 1024 * 1024) {
    return { file, originalSize, compressedSize: originalSize, skipped: true, reason: 'already_small' };
  }

  if (typeof lamejs === 'undefined') {
    return { file, originalSize, compressedSize: originalSize, skipped: true, reason: 'no_encoder' };
  }

  try {
    onStatus && onStatus('Optimizing audio…');

    const arrayBuffer = await file.arrayBuffer();
    const tmpCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
    const audioBuffer = await tmpCtx.decodeAudioData(arrayBuffer.slice(0));
    await tmpCtx.close();

    const channels   = Math.min(audioBuffer.numberOfChannels, 2);
    const sampleRate = audioBuffer.sampleRate;
    const kbps       = TARGET_KBPS;

    const encoder   = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
    const mp3Chunks = [];
    const BLOCK     = 1152;
    const length    = audioBuffer.length;

    function f32ToI16(f32) {
      const i16 = new Int16Array(f32.length);
      for (let i = 0; i < f32.length; i++) {
        const clamped = Math.max(-1, Math.min(1, f32[i]));
        i16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
      }
      return i16;
    }

    const left  = audioBuffer.getChannelData(0);
    const right = channels > 1 ? audioBuffer.getChannelData(1) : left;

    for (let i = 0; i < length; i += BLOCK) {
      const lSlice = left.slice(i, Math.min(i + BLOCK, length));
      const rSlice = right.slice(i, Math.min(i + BLOCK, length));
      const lInt = f32ToI16(lSlice);
      const rInt = f32ToI16(rSlice);

      const buf = channels > 1
        ? encoder.encodeBuffer(lInt, rInt)
        : encoder.encodeBuffer(lInt);
      if (buf.length > 0) mp3Chunks.push(buf);

      if (i % (BLOCK * 100) === 0 && i > 0) {
        const pct = Math.round((i / length) * 100);
        onStatus && onStatus(`Optimizing… ${pct}%`);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    const tail = encoder.flush();
    if (tail.length > 0) mp3Chunks.push(tail);

    const blob          = new Blob(mp3Chunks, { type: 'audio/mpeg' });
    const compressedSize = blob.size;

    const saved = (originalSize - compressedSize) / originalSize;
    if (saved < MIN_SAVE_RATIO) {
      return { file, originalSize, compressedSize: originalSize, skipped: true, reason: 'no_saving' };
    }

    const optimizedFile = new File([blob], file.name, { type: 'audio/mpeg', lastModified: Date.now() });
    return { file: optimizedFile, originalSize, compressedSize, skipped: false };

  } catch (err) {
    console.warn('[compress] failed, falling back to original:', err);
    return { file, originalSize, compressedSize: originalSize, skipped: true, reason: 'error' };
  }
}

/* ── Core XHR upload to Cloudinary ── */
export function buildUploadXHR({ file, endpoint, onProgress, onSuccess, onFail, onError }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', getConfig().cloudinary.uploadPreset);
  const xhr = new XMLHttpRequest();
  xhr.open('POST', endpoint, true);
  xhr.upload.addEventListener('progress', e => {
    if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
  });
  xhr.addEventListener('load', () => {
    if (xhr.status === 200) {
      try { onSuccess(JSON.parse(xhr.responseText)); }
      catch(e) { onFail('Could not read upload response 🥺'); }
    } else {
      try {
        const r = JSON.parse(xhr.responseText);
        onFail(r.error?.message || 'Upload failed. Please try again.');
      } catch(_) { onFail('Upload failed. Please try again.'); }
    }
  });
  xhr.addEventListener('error', () => onError());
  xhr.send(formData);
  return xhr;
}
