/* ==========================================================================
   SORRY ACCEPTANCE FORM — SCRIPT
   Vanilla JS only. No frameworks, no backend.
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------
     0. EMAILJS CONFIGURATION — PASTE YOUR KEYS HERE
     ------------------------------------------------------------------
     1. Create a free account at https://www.emailjs.com
     2. Add an Email Service (e.g. Gmail) -> copy the Service ID
     3. Create an Email Template with variables:
        {{mood}} {{food}} {{date}} {{time}} {{timestamp}}
        -> copy the Template ID
     4. Go to Account > General -> copy your Public Key
     5. Paste all three values below.
  ------------------------------------------------------------------- */
  const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';
  const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID';
  const EMAILJS_TEMPLATE_ID = 'YOUR_EMAILJS_TEMPLATE_ID';

  // Destination email is also set inside your EmailJS template's "To Email"
  // field on the EmailJS dashboard — set it to: pranavsy149@gmail.com
  const DESTINATION_EMAIL = 'pranavsy149@gmail.com';

  // Initialise EmailJS if the SDK loaded and a real key has been provided.
  let emailjsReady = false;
  if (window.emailjs && EMAILJS_PUBLIC_KEY && !EMAILJS_PUBLIC_KEY.startsWith('YOUR_')) {
    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    emailjsReady = true;
  }

  /* ------------------------------------------------------------------
     1. STATE
  ------------------------------------------------------------------- */
  const state = {
    step: 'landing',
    mood: 'Still a little upset 😡 (but said YES anyway)',
    food: null,
    date: null,
    time: null,
    dodgeAttempts: 0,
  };

  const STEP_ORDER = ['landing', 'mood', 'food', 'schedule', 'confirm', 'success'];

  /* ------------------------------------------------------------------
     2. DOM REFERENCES
  ------------------------------------------------------------------- */
  const screens = document.querySelectorAll('.screen');
  const progressDots = document.querySelectorAll('.progress-dot');
  const caseStatus = document.getElementById('caseStatus');

  const startBtn = document.getElementById('startBtn');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const moodButtons = document.getElementById('moodButtons');
  const toast = document.getElementById('toast');
  const dodgeCounter = document.getElementById('dodgeCounter');

  const foodGrid = document.getElementById('foodGrid');
  const foodError = document.getElementById('foodError');
  const foodNextBtn = document.getElementById('foodNextBtn');

  const dateInput = document.getElementById('dateInput');
  const timeSelect = document.getElementById('timeSelect');
  const timeHelp = document.getElementById('timeHelp');
  const scheduleError = document.getElementById('scheduleError');
  const scheduleNextBtn = document.getElementById('scheduleNextBtn');

  const summaryMood = document.getElementById('summaryMood');
  const summaryFood = document.getElementById('summaryFood');
  const summaryDate = document.getElementById('summaryDate');
  const summaryTime = document.getElementById('summaryTime');
  const acceptBtn = document.getElementById('acceptBtn');
  const acceptBtnLabel = document.getElementById('acceptBtnLabel');
  const submitError = document.getElementById('submitError');

  const seeYouBtn = document.getElementById('seeYouBtn');
  const floatingHeartsLayer = document.getElementById('floatingHearts');
  const confettiCanvas = document.getElementById('confettiCanvas');
  const sfxClick = document.getElementById('sfxClick');

  const backButtons = document.querySelectorAll('[data-back]');

  /* ------------------------------------------------------------------
     3. NAVIGATION
  ------------------------------------------------------------------- */
  function goToStep(step) {
    const current = document.querySelector('.screen--active');
    const next = document.getElementById(`screen-${step}`);
    if (!next || next === current) return;

    // Side-effects that must run before a given screen becomes visible
    if (step === 'confirm') populateSummary();
    if (step === 'mood') resetNoButton();

    if (current) {
      current.classList.add('screen--leaving');
      current.classList.remove('screen--active');
      setTimeout(() => current.classList.remove('screen--leaving'), 350);
    }

    next.classList.add('screen--active');
    state.step = step;
    updateProgress(step);
    playClick();

    // Move focus to the new screen's heading for accessibility
    const heading = next.querySelector('h1, h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress(step) {
    const idx = STEP_ORDER.indexOf(step);
    progressDots.forEach((dot) => {
      const dotIdx = STEP_ORDER.indexOf(dot.dataset.step);
      dot.classList.toggle('is-active', dotIdx === idx);
      dot.classList.toggle('is-done', dotIdx < idx);
    });
  }

  startBtn.addEventListener('click', () => goToStep('mood'));

  backButtons.forEach((btn) => {
    btn.addEventListener('click', () => goToStep(btn.dataset.back));
  });

  /* ------------------------------------------------------------------
     4. STEP 1 — MOOD: the NO button that refuses to be clicked
  ------------------------------------------------------------------- */
  const DODGE_MESSAGES = [
    'Areee pakdi gayi 😏', 'Jhooth mat bolo 😂', 'Ab itna bhi attitude theek nahi 😒',
    'Mumbai local se bhi zyada bhaag rahi ho 😭', 'Kay re didi 😂', 'Drama queen detected 👑',
    'Tu NO dabayegi aur main maan lunga? 😂', 'Nahi nahi, itni aasani se nahi 😤',
    'Button bhi jaanta hai tu jhooth bol rahi hai 😹', 'Ekdum fast hatt gaya na button 😝',
    'Try karte raho, chalta rahega 🏃‍♀️', 'Arre yeh button bhi tere jaisa stubborn hai 😂',
    'Chuk gayi! Ek aur try maar 😏', 'Kiti pळणार re baba 😂', 'Yeh NO button CBI mein hai, pakadna mushkil hai 🕵️‍♂️',
    'Bhagvan bhi nahi bacha sakta is button ko 😭', 'Sorry, yeh button sirf YES sunta hai 🙅‍♂️',
    'Tera gussa itna fast nahi jitna yeh button 💨', 'Ekdum ghanti waali cat jaisa bhaaga 🐱',
    'Aaj toh nahi pakadne wali tu 😌', 'Zara dheere dabao, button darr gaya 😂',
    'Kiti pyaari acting hai gussa waali 😹', 'Yeh button bhi tujhe mana rha hai, sun le 🙏',
    'Left se try kiya? Wo bhi fail 😆', 'Button: "Nahi didi, aaj nahi" 😂',
    'Arre yeh toh professional bhaagne wala hai 🏅', 'Bas ab YES dabao, energy bacha lo 🔋',
    'Mumbai ki traffic se bhi fast escape 🚦', 'Ek number attempt tha, phir bhi miss 😂',
    'Tujhe pata hai na yeh rigged hai 😌', 'Kay bhaari drama ahe he 😹',
    'Button ne bhi keh diya "bas kar didi" 😂', 'Itni koshish toh exam mein bhi nahi ki thi 📚😹',
    'NO ka koi wajood nahi is form mein 🚫', 'Full On Bollywood chase scene chal raha hai 🎬',
    'Tera finger fast hai, button usse bhi fast 😤', 'Chalo maano na, drama kaafi ho gaya 🥺',
    'Yeh button PhD kiya hai bhaagne mein 🎓', 'Ek try aur? Chalo dekhte hai 👀',
    'Areyy phir se miss! Kismat try karo 🍀', 'Gussa asli hai ya sirf show? 😏',
    'Tujhe pata chal gaya hoga ab, yeh NO nahi hoga 😭', 'Bas YES dabao, dono ka time bach jayega ⏳',
    'Kiti stubborn ahes tu, button se bhi zyada 😂', 'Screen ke kisi bhi corner mein dhoondh le 🔎',
    'Button ka GPS on hai, tu miss kar rahi hai 📍', 'Sach mein manlo, main bhi thak gaya likhte likhte 😩',
    'Yeh button tujhse zyada fit hai, gym jaata hai 💪😂', 'Almost pakda tha, phir bhi nahi 😹',
    'Ab toh has hi de, itna funny toh hai na 😂', 'Last warning: YES dabao warna button retire ho jayega 🏳️',
  ];

  function playClick() {
    try {
      sfxClick.currentTime = 0;
      sfxClick.volume = 0.25;
      sfxClick.play().catch(() => {});
    } catch (_) { /* audio not critical */ }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('is-visible'), 1600);
  }

  function randomDodgeMessage() {
    const i = Math.floor(Math.random() * DODGE_MESSAGES.length);
    return DODGE_MESSAGES[i];
  }

  // Move the NO button to a random safe position inside the viewport,
  // avoiding the YES button and the card's own edges.
  function dodgeNoButton() {
    const margin = 16;
    const btnRect = noBtn.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();

    const maxX = window.innerWidth - btnRect.width - margin;
    const maxY = window.innerHeight - btnRect.height - margin;

    let x, y, attempts = 0;
    do {
      x = margin + Math.random() * Math.max(0, maxX - margin);
      y = margin + Math.random() * Math.max(0, maxY - margin);
      attempts++;
    } while (
      attempts < 12 &&
      rectsOverlap(x, y, btnRect.width, btnRect.height,
        yesRect.left, yesRect.top, yesRect.width, yesRect.height, 24)
    );

    if (!noBtn.classList.contains('is-teleporting')) {
      // Fix in place at current visual position first, then animate to new spot
      noBtn.style.left = `${btnRect.left}px`;
      noBtn.style.top = `${btnRect.top}px`;
      noBtn.classList.add('is-teleporting');
      // Force reflow so the transition kicks in on next frame
      void noBtn.offsetWidth;
    }

    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;
    noBtn.classList.add('is-caught-once');
    setTimeout(() => noBtn.classList.remove('is-caught-once'), 500);
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh, pad) {
    return !(
      ax + aw + pad < bx ||
      ax > bx + bw + pad ||
      ay + ah + pad < by ||
      ay > by + bh + pad
    );
  }

  function handleNoInteraction(e) {
    e.preventDefault();
    state.dodgeAttempts += 1;
    dodgeNoButton();
    showToast(randomDodgeMessage());
    dodgeCounter.textContent = state.dodgeAttempts >= 3
      ? `Attempts so far: ${state.dodgeAttempts} — jitna marzi try karlo 😌`
      : `Attempts so far: ${state.dodgeAttempts}`;
  }

  // Pointerdown works better than click for a button that runs away
  noBtn.addEventListener('pointerdown', handleNoInteraction);
  noBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') handleNoInteraction(e);
  });

  yesBtn.addEventListener('click', () => {
    state.mood = 'Was upset, but forgave me after minor emotional damage 😡➡️🥹';
    caseStatus.textContent = 'STATUS: MOOD CONFIRMED ✅';
    goToStep('food');
  });

  // Reset NO button position whenever we leave/enter the mood screen
  function resetNoButton() {
    noBtn.classList.remove('is-teleporting', 'is-caught-once');
    noBtn.style.left = '';
    noBtn.style.top = '';
    state.dodgeAttempts = 0;
    dodgeCounter.textContent = '';
  }

  /* ------------------------------------------------------------------
     5. STEP 2 — FOOD SELECTION
  ------------------------------------------------------------------- */
  const FOOD_OPTIONS = [
    { id: 'panipuri', name: 'Pani Puri', emoji: '🥟' },
    { id: 'biryani', name: 'Chicken Biryani', emoji: '🍗' },
    { id: 'rassa', name: 'Tambda Pandhra Rassa', emoji: '🍲' },
    { id: 'icecream', name: 'Ice Cream', emoji: '🍨' },
    { id: 'pizza', name: 'Pizza', emoji: '🍕' },
    { id: 'brownie', name: 'Chocolate Brownie', emoji: '🍫' },
  ];

  function renderFoodGrid() {
    foodGrid.innerHTML = '';
    FOOD_OPTIONS.forEach((food) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'food-card';
      card.setAttribute('role', 'option');
      card.setAttribute('aria-selected', 'false');
      card.dataset.id = food.id;
      card.innerHTML = `
        <span class="food-card__emoji" aria-hidden="true">${food.emoji}</span>
        <span class="food-card__name">${food.name}</span>
      `;
      card.addEventListener('click', () => selectFood(food, card));
      foodGrid.appendChild(card);
    });
  }

  function selectFood(food, cardEl) {
    document.querySelectorAll('.food-card').forEach((c) => {
      c.classList.remove('is-selected');
      c.setAttribute('aria-selected', 'false');
    });
    cardEl.classList.add('is-selected');
    cardEl.setAttribute('aria-selected', 'true');
    state.food = food.name;
    foodError.hidden = true;
    playClick();
  }

  foodNextBtn.addEventListener('click', () => {
    if (!state.food) {
      foodError.hidden = false;
      foodGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    goToStep('schedule');
  });

  /* ------------------------------------------------------------------
     6. STEP 3 — SCHEDULE (date + time with disabled slot rules)
  ------------------------------------------------------------------- */
  // Rules:
  //  Mon-Fri : 9 AM - 7 PM disabled  -> only 7 PM - 11 PM bookable
  //  Sat/Sun : 2 PM - 7 PM disabled  -> only 9 AM - 2 PM and 7 PM - 11 PM bookable
  const ALL_SLOTS = [];
  for (let h = 9; h <= 22; h++) {
    ALL_SLOTS.push(h);
  }

  function formatHour(h) {
    const period = h >= 12 ? 'PM' : 'AM';
    let displayHour = h % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour}:00 ${period}`;
  }

  function isSlotDisabled(dateObj, hour) {
    const day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;
    if (isWeekend) {
      return hour >= 14 && hour < 19; // 2 PM - 7 PM
    }
    return hour >= 9 && hour < 19; // 9 AM - 7 PM
  }

  function setMinDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  function populateTimeSlots() {
    timeSelect.innerHTML = '';
    timeHelp.textContent = '';

    if (!dateInput.value) {
      timeSelect.disabled = true;
      timeSelect.innerHTML = '<option value="">Pehle date chuno</option>';
      return;
    }

    const selectedDate = new Date(`${dateInput.value}T00:00:00`);
    const available = ALL_SLOTS.filter((h) => !isSlotDisabled(selectedDate, h));

    if (available.length === 0) {
      timeSelect.disabled = true;
      timeSelect.innerHTML = '<option value="">Koi slot available nahi hai 😢</option>';
      return;
    }

    timeSelect.disabled = false;
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Ek time chuno';
    timeSelect.appendChild(placeholder);

    available.forEach((h) => {
      const opt = document.createElement('option');
      opt.value = String(h);
      opt.textContent = formatHour(h);
      timeSelect.appendChild(opt);
    });

    const day = selectedDate.getDay();
    const isWeekend = day === 0 || day === 6;
    timeHelp.textContent = isWeekend
      ? 'Weekend pe 2 PM - 7 PM busy hai, baaki sab free 😌'
      : 'Weekday pe 9 AM - 7 PM busy hai, sirf shaam 7 baje ke baad free 😌';
  }

  dateInput.addEventListener('change', () => {
    state.date = dateInput.value || null;
    state.time = null;
    scheduleError.hidden = true;
    populateTimeSlots();
  });

  timeSelect.addEventListener('change', () => {
    state.time = timeSelect.value ? formatHour(Number(timeSelect.value)) : null;
    scheduleError.hidden = true;
  });

  scheduleNextBtn.addEventListener('click', () => {
    if (!state.date || !state.time) {
      scheduleError.hidden = false;
      return;
    }
    goToStep('confirm');
  });

  /* ------------------------------------------------------------------
     7. STEP 4 — CONFIRM + SUBMIT
  ------------------------------------------------------------------- */
  function formatDateForDisplay(isoDate) {
    if (!isoDate) return '—';
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function populateSummary() {
    summaryMood.textContent = state.mood;
    summaryFood.textContent = state.food || '—';
    summaryDate.textContent = formatDateForDisplay(state.date);
    summaryTime.textContent = state.time || '—';
  }

  async function submitSorryForm() {
    acceptBtn.disabled = true;
    acceptBtnLabel.textContent = 'Sending…';
    submitError.hidden = true;

    const payload = {
      mood: state.mood,
      food: state.food,
      date: formatDateForDisplay(state.date),
      time: state.time,
      timestamp: new Date().toLocaleString('en-IN'),
      to_email: DESTINATION_EMAIL,
    };

    try {
      if (!emailjsReady) throw new Error('EmailJS not configured');
      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
      goToStep('success');
      launchCelebration();
    } catch (err) {
      // Graceful fallback — the apology still "counts" even if email fails.
      submitError.hidden = false;
      submitError.textContent = "Oops 😅 Message couldn't fly to Pranav, but your sorry acceptance is still saved in our hearts ❤️";
      acceptBtnLabel.textContent = 'Accept My Sorry';
      acceptBtn.disabled = false;
      // Still let her proceed to the celebration after a short pause —
      // the whole point is she shouldn't be stuck on a technicality.
      setTimeout(() => {
        goToStep('success');
        launchCelebration();
      }, 1800);
    }
  }

  acceptBtn.addEventListener('click', submitSorryForm);
  seeYouBtn.addEventListener('click', () => {
    caseStatus.textContent = 'STATUS: CASE CLOSED 💫';
    caseStatus.classList.remove('case-status--open');
    caseStatus.classList.add('case-status--closed');
  });

  /* ------------------------------------------------------------------
     8. FLOATING HEARTS (ambient background)
  ------------------------------------------------------------------- */
  const HEART_EMOJIS = ['❤️', '💗', '💕', '🩷', '💖'];

  function spawnFloatingHeart() {
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
    const left = Math.random() * 100;
    const duration = 10 + Math.random() * 8;
    const drift = (Math.random() - 0.5) * 120;
    heart.style.left = `${left}%`;
    heart.style.setProperty('--drift', `${drift}px`);
    heart.style.animationDuration = `${duration}s`;
    heart.style.fontSize = `${1 + Math.random() * 1.2}rem`;
    floatingHeartsLayer.appendChild(heart);
    setTimeout(() => heart.remove(), duration * 1000 + 500);
  }

  setInterval(spawnFloatingHeart, 1400);
  for (let i = 0; i < 5; i++) setTimeout(spawnFloatingHeart, i * 300);

  /* ------------------------------------------------------------------
     9. CONFETTI (canvas, lightweight, no dependencies)
  ------------------------------------------------------------------- */
  const ctx = confettiCanvas.getContext('2d');
  let confettiPieces = [];
  let confettiAnimId = null;

  function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfettiCanvas);
  resizeConfettiCanvas();

  const CONFETTI_COLORS = ['#E8536B', '#FF8C7A', '#FBD7DE', '#E8B65A', '#FFFFFF'];

  function createConfettiPiece() {
    return {
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * confettiCanvas.height * 0.5,
      size: 6 + Math.random() * 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speedY: 2 + Math.random() * 3,
      speedX: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.5 ? 'rect' : 'heart',
    };
  }

  function launchCelebration() {
    confettiPieces = Array.from({ length: 140 }, createConfettiPiece);
    if (!confettiAnimId) animateConfetti();
    // Stop spawning new pieces after a while by letting them fall off-screen
    setTimeout(() => { confettiPieces = confettiPieces.filter((p) => p.y < confettiCanvas.height + 40); }, 4000);
  }

  function drawHeart(x, y, size, color, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.beginPath();
    const s = size / 2;
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(0, -s * 0.4, -s, -s * 0.4, -s, s * 0.1);
    ctx.bezierCurveTo(-s, s * 0.6, 0, s, 0, s * 1.2);
    ctx.bezierCurveTo(0, s, s, s * 0.6, s, s * 0.1);
    ctx.bezierCurveTo(s, -s * 0.4, 0, -s * 0.4, 0, s * 0.3);
    ctx.fill();
    ctx.restore();
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiPieces.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      if (p.shape === 'heart') {
        drawHeart(p.x, p.y, p.size, p.color, p.rotation);
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    });

    confettiPieces = confettiPieces.filter((p) => p.y < confettiCanvas.height + 40);

    if (confettiPieces.length > 0) {
      confettiAnimId = requestAnimationFrame(animateConfetti);
    } else {
      confettiAnimId = null;
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  /* ------------------------------------------------------------------
     10. INIT
  ------------------------------------------------------------------- */
  function init() {
    renderFoodGrid();
    setMinDate();
    updateProgress('landing');
  }

  init();

})();