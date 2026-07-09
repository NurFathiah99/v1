/* ══════════════════════════════════════════════
   script.js — Thin bootstrap
   All logic has been extracted into ES modules.
   This file just imports and initializes them.
   ══════════════════════════════════════════════ */

import { initFirestore } from './db.js';
import { resumeAudioCtx } from './utils.js';
import { startLoadingExperience } from './loader.js';
import { initVideos, showDailyMsg, setGreeting, initMoodButtons, initPageNavigation } from './pages.js';
import { initAllEffects } from './effects.js';
import { initAdmin } from './admin.js';
// MusicPlayer self-initializes on import (IIFE inside module)
import './music-player.js';

/* ── 1. Firebase ── */
initFirestore();

/* ── 2. Loading screen ── */
window.addEventListener('load', startLoadingExperience);

/* ── 3. Audio context resume on first interaction ── */
window.addEventListener('pointerdown', resumeAudioCtx, { passive: true });

/* ── 4. Videos ── */
initVideos();

/* ── 5. Visual effects (hearts, petals, notes, gallery, fade-reveal) ── */
initAllEffects();

/* ── 6. Page navigation, greeting, mood buttons, daily messages ── */
setGreeting();
showDailyMsg();
initMoodButtons();
initPageNavigation();

/* ── 7. Admin panel (login, CRUD, uploads, Firestore sync) ── */
initAdmin();

/* ── 8. Lucide icons ── */
if (window.lucide) {
  window.lucide.createIcons();
}
