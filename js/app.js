(() => {
  // ── Matrix digital rain ──
  const canvas = document.getElementById('matrixRain');
  const ctx = canvas.getContext('2d');
  const matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
  const fontSize = 14;
  const frameInterval = 50;
  let columns, drops, lastFrameTime = 0;

  function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(0).map(() => Math.floor(Math.random() * (canvas.height / fontSize)));
  }
  initCanvas();
  window.addEventListener('resize', initCanvas);

  function drawMatrix(timestamp) {
    requestAnimationFrame(drawMatrix);
    if (timestamp - lastFrameTime < frameInterval) return;
    lastFrameTime = timestamp;

    ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff41';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  requestAnimationFrame(drawMatrix);

  // ── Countdown logic ──
  // Promotion: March 13 – March 28, 2026
  const PROMO_START = new Date(Date.UTC(2026, 2, 13, 7, 0, 0));
  const PROMO_END = new Date(Date.UTC(2026, 2, 29, 6, 59, 59));
  const TOTAL_BARS = 15;

  // Peak hours: 8 AM – 2 PM ET (EDT = UTC-4) on weekdays
  const PEAK_START_UTC = 12;
  const PEAK_END_UTC = 18;

  const subtitle = document.getElementById('subtitle');
  const hoursPiece = document.getElementById('hours');
  const minutesPiece = document.getElementById('minutes');
  const secondsPiece = document.getElementById('seconds');
  const daysLeftEl = document.getElementById('daysLeft');
  const barSegments = document.getElementById('barSegments');

  let currentState = null;
  let intervalId = null;

  function pad(val) {
    return (val < 10 && val > -1 ? '0' : '') + val;
  }

  function flipTo(piece, newValue) {
    const paddedValue = pad(newValue);
    const top = piece.querySelector('.clock__card-top');
    const bottom = piece.querySelector('.clock__card-bottom');
    const back = piece.querySelector('.clock__card-back');
    const backBottom = piece.querySelector('.clock__card-back-bottom');

    if (top.textContent === paddedValue) return;
    back.setAttribute('data-value', top.textContent);
    backBottom.setAttribute('data-value', top.textContent);
    top.textContent = paddedValue;
    bottom.setAttribute('data-value', paddedValue);
    piece.classList.remove('flip');
    void piece.offsetWidth;
    piece.classList.add('flip');
  }

  function isWeekday(date) {
    const day = date.getUTCDay();
    return day >= 1 && day <= 5;
  }

  function isPeakHours(date) {
    if (!isWeekday(date)) return false;
    const h = date.getUTCHours();
    return h >= PEAK_START_UTC && h < PEAK_END_UTC;
  }

  function determineState() {
    const now = new Date();
    if (now >= PROMO_END) return 'expired';
    if (now < PROMO_START) return 'on';
    return isPeakHours(now) ? 'off' : 'on';
  }

  function getNextWeekday(from) {
    const d = new Date(from);
    d.setUTCDate(d.getUTCDate() + 1);
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return d;
  }

  function getTargetTime() {
    const now = new Date();
    const state = determineState();

    if (state === 'expired') return now;

    if (state === 'off') {
      const target = new Date(now);
      target.setUTCHours(PEAK_END_UTC, 0, 0, 0);
      return target;
    }

    if (isWeekday(now) && now.getUTCHours() < PEAK_START_UTC) {
      const target = new Date(now);
      target.setUTCHours(PEAK_START_UTC, 0, 0, 0);
      return target < PROMO_END ? target : PROMO_END;
    }

    const nextWd = getNextWeekday(now);
    nextWd.setUTCHours(PEAK_START_UTC, 0, 0, 0);
    return nextWd < PROMO_END ? nextWd : PROMO_END;
  }

  function buildProgressBar() {
    barSegments.innerHTML = '';
    for (let i = 0; i < TOTAL_BARS; i++) {
      const seg = document.createElement('div');
      seg.className = 'bar__segment';
      barSegments.appendChild(seg);
    }
  }

  function updateProgressBar() {
    const now = new Date();
    const totalMs = PROMO_END - PROMO_START;
    const elapsedMs = Math.max(0, now - PROMO_START);
    const elapsedBars = Math.min(TOTAL_BARS, Math.floor((elapsedMs / totalMs) * TOTAL_BARS));

    const promoEndDate = new Date(now.getFullYear(), 2, 28);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const remainDays = Math.max(0, Math.round((promoEndDate - todayStart) / (1000 * 60 * 60 * 24)));
    daysLeftEl.textContent = `${remainDays} day${remainDays !== 1 ? 's' : ''} until the spoon returns`;

    const segments = barSegments.querySelectorAll('.bar__segment');
    segments.forEach((seg, i) => {
      seg.className = i < elapsedBars
        ? 'bar__segment bar__segment--active'
        : 'bar__segment bar__segment--inactive';
    });
  }

  function applyState(newState) {
    if (newState === currentState) return;
    currentState = newState;
    document.body.className = `state-${newState}`;

    if (newState === 'on') {
      subtitle.innerHTML = 'there is no spoon. jack in.<span class="cursor">_</span>';
    } else if (newState === 'off') {
      subtitle.innerHTML = 'the spoon is back. hold.<span class="cursor">_</span>';
    } else {
      subtitle.innerHTML = 'the spoon was real all along.<span class="cursor">_</span>';
    }
  }

  function updateCountdown() {
    const state = determineState();
    applyState(state);

    if (state === 'expired') {
      flipTo(hoursPiece, 0);
      flipTo(minutesPiece, 0);
      flipTo(secondsPiece, 0);
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return;
    }

    const now = new Date();
    const target = getTargetTime();
    let diff = Math.max(0, Math.floor((target - now) / 1000));

    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    flipTo(hoursPiece, hours);
    flipTo(minutesPiece, minutes);
    flipTo(secondsPiece, seconds);
  }

  function scheduleNextMidnight() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    setTimeout(() => {
      updateProgressBar();
      scheduleNextMidnight();
    }, tomorrow - now);
  }

  buildProgressBar();
  updateProgressBar();
  updateCountdown();
  intervalId = setInterval(updateCountdown, 1000);
  scheduleNextMidnight();
})();