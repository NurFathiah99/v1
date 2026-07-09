/* ── db.js ── Firebase / Firestore initialization ── */
import { getConfig } from './config.js';

export let db = null;

export function initFirestore() {
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
}
