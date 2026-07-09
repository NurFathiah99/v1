/* ── loader.js ── Loading screen with cute texts ── */
import { softBeep } from './utils.js';

export function startLoadingExperience() {
  const loadingScreen = document.getElementById('loadingScreen');
  const loadingTextEl = document.getElementById('loadingText');
  const appEl = document.getElementById('app');
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
