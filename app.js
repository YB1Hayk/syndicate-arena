// ── Telegram SDK ────────────────────────────────────────────────
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0a0a0a');
}

const TG_USER   = tg?.initDataUnsafe?.user;
const USER_NAME = TG_USER?.first_name?.toUpperCase() || 'АГЕНТ';

// ── Конфиг администратора (заполни после создания бота) ──────────
const ADMIN_CONFIG = {
  BOT_TOKEN:     '8821995930:AAEc-jijNmI6-LkM7Ln0GAjmTq4CLRaxONQ',
  ADMIN_CHAT_ID: '8697914151',
};

// ── Отправка уведомления админу через Bot API ────────────────────
async function notifyAdmin(email) {
  const user        = TG_USER;
  const tgId        = user?.id        || '—';
  const firstName   = user?.first_name || '—';
  const lastName    = user?.last_name  || '';
  const username    = user?.username   ? `@${user.username}` : '—';
  const psychotype  = localStorage.getItem('sa_psychotype') || '—';
  const now         = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

  const text =
    `🆕 *НОВАЯ РЕГИСТРАЦИЯ — SYNDICATE ARENA*\n\n` +
    `👤 Имя: ${firstName} ${lastName}\n` +
    `🔗 Username: ${username}\n` +
    `🆔 Telegram ID: \`${tgId}\`\n` +
    `📧 Email: \`${email}\`\n` +
    `🧠 Психотип: *${psychotype}*\n` +
    `📅 Время: ${now} МСК`;

  try {
    await fetch(
      `https://api.telegram.org/bot${ADMIN_CONFIG.BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    ADMIN_CONFIG.ADMIN_CHAT_ID,
          text:       text,
          parse_mode: 'Markdown',
        }),
      }
    );
  } catch (e) {
    console.warn('Admin notify failed:', e);
  }
}

// ════════════════════════════════════════════
//  ЭКРАН 1: КАЛИБРОВКА
// ════════════════════════════════════════════

const QUIZ = [
  {
    question: 'Выходит горячая новость. Первая свеча — +80 пунктов вверх. Твоё действие?',
    options: [
      { text: 'Жду откат к зоне пробоя и захожу на ретесте', type: 'АРХИТЕКТОР' },
      { text: 'Смотрю объёмы. Если слабеют — вхожу против',  type: 'СТРАТЕГ'    },
      { text: 'Фиксирую направление и ищу вход в первые 5 минут', type: 'СКАНЕР' },
    ]
  },
  {
    question: 'Сделка в минусе −25 пунктов. До стопа −15. Как ты себя ведёшь?',
    options: [
      { text: 'Стоп стоит — значит жду. Руки прочь от терминала', type: 'АРХИТЕКТОР' },
      { text: 'Анализирую: изменился ли сигнал? Если нет — держу', type: 'СТРАТЕГ' },
      { text: 'Закрываю вручную. Рынок изменился — план устарел',  type: 'СКАНЕР'    },
    ]
  },
  {
    question: 'Какой результат в трейдинге для тебя главный?',
    options: [
      { text: 'Стабильный рост депозита на дистанции 6+ месяцев', type: 'СТРАТЕГ'    },
      { text: 'Точные входы с минимальным риском на сделку',       type: 'АРХИТЕКТОР' },
      { text: 'Максимально использовать каждый новостной импульс', type: 'СКАНЕР'    },
    ]
  }
];

const PROFILES = {
  АРХИТЕКТОР: {
    badge: 'АРХИТЕКТОР',
    desc:  'Ты торгуешь расчётом, а не эмоцией. Ждёшь подтверждения и берёшь качественный вход. Синдикат ценит таких — рынок не прощает торопливость.'
  },
  СКАНЕР: {
    badge: 'СКАНЕР',
    desc:  'Ты — скорость и реакция. Считываешь рынок быстро и действуешь решительно. Задача Синдиката — направить твою энергию в правильное русло.'
  },
  СТРАТЕГ: {
    badge: 'СТРАТЕГ',
    desc:  'Ты мыслишь масштабом. Тебе важна картина целиком: тренд, объёмы, контекст. Синдикат создан для людей, которые видят дальше одной свечи.'
  }
};

let currentQ = 0;
const scores = { АРХИТЕКТОР: 0, СКАНЕР: 0, СТРАТЕГ: 0 };

const progressFill  = document.getElementById('quiz-progress-fill');
const stepLabel     = document.getElementById('quiz-step-label');
const questionEl    = document.getElementById('quiz-question');
const optionsEl     = document.getElementById('quiz-options');
const quizContainer = document.getElementById('quiz-container');
const traderCard    = document.getElementById('trader-card');

function renderQuestion() {
  const q   = QUIZ[currentQ];
  const pct = (currentQ / QUIZ.length) * 100;

  progressFill.style.width  = pct + '%';
  stepLabel.textContent     = `ВОПРОС ${currentQ + 1} / ${QUIZ.length}`;
  questionEl.textContent    = q.question;
  optionsEl.innerHTML       = '';

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className   = 'quiz-option';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => selectOption(btn, opt.type));
    btn.style.opacity   = '0';
    btn.style.transform = 'translateX(-8px)';
    btn.style.transition = `opacity 0.3s ease ${i * 0.08}s, transform 0.3s ease ${i * 0.08}s`;
    optionsEl.appendChild(btn);
    requestAnimationFrame(() => {
      btn.style.opacity   = '1';
      btn.style.transform = 'translateX(0)';
    });
  });
}

function selectOption(btn, type) {
  document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  scores[type]++;
  setTimeout(() => {
    currentQ++;
    if (currentQ < QUIZ.length) renderQuestion();
    else showResult();
  }, 380);
}

function showResult() {
  const psychotype = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const profile    = PROFILES[psychotype];

  document.getElementById('card-badge').textContent = profile.badge;
  document.getElementById('card-name').textContent  = `АГЕНТ: ${USER_NAME}`;
  document.getElementById('card-desc').textContent  = profile.desc;

  const trialEnd = Date.now() + 5 * 24 * 60 * 60 * 1000;
  localStorage.setItem('sa_psychotype', psychotype);
  localStorage.setItem('sa_trial_end',  trialEnd);
  localStorage.setItem('sa_name',       USER_NAME);

  progressFill.style.width = '100%';
  setTimeout(() => {
    quizContainer.classList.add('hidden');
    traderCard.classList.remove('hidden');
    startTrialTimer(trialEnd);
  }, 300);
}

function startTrialTimer(endTs) {
  const el = document.getElementById('trial-timer');
  function tick() {
    const diff = endTs - Date.now();
    if (diff <= 0) { el.textContent = 'ИСТЁК'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000)  / 60000);
    const s = Math.floor((diff % 60000)    / 1000);
    el.textContent = `${d}Д ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ── Навигация ────────────────────────────────────────────────────
function goToScreen(n) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${n}`).classList.add('active');
  window.scrollTo(0, 0);
  window.dispatchEvent(new CustomEvent('screen-change', { detail: n }));
}

document.getElementById('btn-to-screen2').addEventListener('click', () => goToScreen(2));

// ── Инициализация ────────────────────────────────────────────────
// Запускается после полной загрузки всех обработчиков
window.addEventListener('load', function init() {
  const savedType = localStorage.getItem('sa_psychotype');
  const trialEnd  = Number(localStorage.getItem('sa_trial_end') || 0);
  const verified  = localStorage.getItem('sa_verified');

  // Если прошёл тест и верифицировал email — сразу в штаб
  if (savedType && verified) {
    // Восстанавливаем карточку в фоне (нужна для профиля)
    const profile = PROFILES[savedType];
    document.getElementById('card-badge').textContent = profile.badge;
    document.getElementById('card-name').textContent  =
      `АГЕНТ: ${localStorage.getItem('sa_name') || USER_NAME}`;
    document.getElementById('card-desc').textContent  = profile.desc;
    if (trialEnd) startTrialTimer(trialEnd);
    goToScreen(4);
    return;
  }

  // Если прошёл тест, но не верифицировал — показываем карточку
  if (savedType && trialEnd) {
    const profile = PROFILES[savedType];
    document.getElementById('card-badge').textContent = profile.badge;
    document.getElementById('card-name').textContent  =
      `АГЕНТ: ${localStorage.getItem('sa_name') || USER_NAME}`;
    document.getElementById('card-desc').textContent  = profile.desc;
    quizContainer.classList.add('hidden');
    traderCard.classList.remove('hidden');
    startTrialTimer(trialEnd);
    return;
  }

  // Новый пользователь — запускаем тест
  renderQuestion();
});

// ════════════════════════════════════════════
//  ЭКРАН 2: ПОЛУЧИТЬ ОРУЖИЕ
// ════════════════════════════════════════════

const BROKER_URL = 'https://fxproaffiliate.g2afse.com/click?pid=7274&offer_id=38&l=1773141291';

const s2 = { brokerClicked: false, idVerified: false };

const btnBack1       = document.getElementById('btn-back-1');
const btnBroker      = document.getElementById('btn-broker');
const statusRegister = document.getElementById('status-register');
const cardRegister   = document.getElementById('card-register');
const inputId        = document.getElementById('input-trading-id');
const btnVerify      = document.getElementById('btn-verify');
const statusVerify   = document.getElementById('status-verify');
const cardVerify     = document.getElementById('card-verify');
const stateChecking  = document.getElementById('state-checking');
const stateSuccess   = document.getElementById('state-success');
const stateError     = document.getElementById('state-error');
const errorText      = document.getElementById('error-text');
const btnToScreen3   = document.getElementById('btn-to-screen3');
const btnNextLabel   = document.getElementById('btn-next-label');

btnBack1.addEventListener('click', () => goToScreen(1));

btnBroker.addEventListener('click', () => {
  if (tg) tg.openLink(BROKER_URL); else window.open(BROKER_URL, '_blank');
  btnBroker.classList.add('clicked');
  btnBroker.innerHTML = '<span class="btn-broker-icon">✓</span> ССЫЛКА ОТКРЫТА';
  s2.brokerClicked = true;
  statusRegister.textContent = '✓';
  statusRegister.classList.add('done');
  cardRegister.classList.add('completed');
  localStorage.setItem('sa_broker_clicked', '1');
  updateNextButton();
});

function validateEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

inputId.addEventListener('input', () => {
  const val = inputId.value.trim();
  inputId.classList.remove('valid', 'invalid');
  hideAllStates();
  if (val.length > 0) inputId.classList.add(validateEmail(val) ? 'valid' : 'invalid');
});

btnVerify.addEventListener('click', async () => {
  const val = inputId.value.trim();
  if (!validateEmail(val)) {
    showState('error');
    errorText.textContent = 'Введи корректный email (example@mail.com).';
    inputId.classList.add('invalid');
    shake(inputId);
    return;
  }
  showState('checking');
  btnVerify.disabled = true;

  await notifyAdmin(val);

  showState('success');
  inputId.classList.remove('invalid');
  inputId.classList.add('valid');
  inputId.disabled   = true;
  btnVerify.disabled = true;
  s2.idVerified = true;
  statusVerify.textContent = '✓';
  statusVerify.classList.add('done');
  cardVerify.classList.add('completed');
  localStorage.setItem('sa_email',    val);
  localStorage.setItem('sa_verified', '1');
  updateNextButton();
})

function hideAllStates() {
  [stateChecking, stateSuccess, stateError].forEach(el => el.classList.add('hidden'));
}
function showState(name) {
  hideAllStates();
  const map = { checking: stateChecking, success: stateSuccess, error: stateError };
  map[name]?.classList.remove('hidden');
}

function shake(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
}

function updateNextButton() {
  if (s2.idVerified) {
    btnToScreen3.disabled = false;
    btnToScreen3.classList.remove('locked');
    btnToScreen3.classList.remove('hidden');
  }
}

btnToScreen3.addEventListener('click', () => { if (!btnToScreen3.disabled) goToScreen(3); });

function restoreScreen2() {
  if (localStorage.getItem('sa_broker_clicked')) {
    s2.brokerClicked = true;
    btnBroker.classList.add('clicked');
    btnBroker.innerHTML = '<span class="btn-broker-icon">✓</span> ССЫЛКА ОТКРЫТА';
    statusRegister.textContent = '✓';
    statusRegister.classList.add('done');
    cardRegister.classList.add('completed');
  }
  const savedEmail = localStorage.getItem('sa_email');
  if (savedEmail && localStorage.getItem('sa_verified')) {
    s2.idVerified = true;
    inputId.value = savedEmail;
    inputId.disabled  = true;
    btnVerify.disabled = true;
    inputId.classList.add('valid');
    showState('success');
    statusVerify.textContent = '✓';
    statusVerify.classList.add('done');
    cardVerify.classList.add('completed');
  }
  updateNextButton();
}

window.addEventListener('screen-change', (e) => { if (e.detail === 2) restoreScreen2(); });

// ════════════════════════════════════════════
//  ЭКРАН 3: ЗАРЯЖАЙ ОБОЙМУ
// ════════════════════════════════════════════

const DEPOSIT_LEVELS = [
  { id: 'level-recruit', min: 30,  max: 99,       label: 'RECRUIT' },
  { id: 'level-rookie',  min: 100, max: 299,      label: 'ROOKIE'  },
  { id: 'level-hunter',  min: 300, max: 499,      label: 'HUNTER'  },
  { id: 'level-elite',   min: 500, max: Infinity, label: 'ELITE'   },
];

const btnBack2         = document.getElementById('btn-back-2');
const ammoFill         = document.getElementById('ammo-fill');
const ammoGlow         = document.getElementById('ammo-glow');
const ammoAmount       = document.getElementById('ammo-amount');
const unlockStatus     = document.getElementById('unlock-status');
const unlockIcon       = document.getElementById('unlock-icon');
const unlockText       = document.getElementById('unlock-text');
const inputDeposit     = document.getElementById('input-deposit');
const btnConfirmDep    = document.getElementById('btn-confirm-deposit');
const btnDepositBroker = document.getElementById('btn-deposit-broker');
const btnToScreen4     = document.getElementById('btn-to-screen4');
const btnS4Label       = document.getElementById('btn-s4-label');
const btnSkipDeposit   = document.getElementById('btn-skip-deposit');

let currentDeposit = Number(localStorage.getItem('sa_deposit') || 0);

btnBack2.addEventListener('click', () => goToScreen(2));

btnDepositBroker.addEventListener('click', () => {
  const url = 'https://your-broker-deposit-link.com';
  if (tg) tg.openLink(url); else window.open(url, '_blank');
  btnDepositBroker.innerHTML = '<span class="btn-broker-icon">✓</span> ПЕРЕХОД К ПОПОЛНЕНИЮ';
  btnDepositBroker.style.borderColor = 'var(--gold-dim)';
  btnDepositBroker.style.color = 'var(--gold)';
});

btnConfirmDep.addEventListener('click', () => {
  const val = Number(inputDeposit.value);
  if (!val || val < 1) { shake(inputDeposit); return; }
  currentDeposit = val;
  localStorage.setItem('sa_deposit', val);
  updateDepositUI(val);
  inputDeposit.blur();
});

function updateDepositUI(amount) {
  const CAP    = 500;
  const rawPct = Math.min((amount / CAP) * 100, 100);

  animateCounter(ammoAmount, amount);
  ammoFill.style.width = rawPct + '%';
  ammoGlow.style.width = rawPct + '%';

  document.querySelectorAll('.ammo-tick').forEach(tick => {
    tick.classList.toggle('reached', amount >= Number(tick.dataset.val));
  });

  let activeLevel = null;
  DEPOSIT_LEVELS.forEach(lvl => {
    const card     = document.getElementById(lvl.id);
    const isActive = amount >= lvl.min && amount <= lvl.max;
    card.classList.toggle('active', isActive);
    if (isActive) activeLevel = lvl;
  });

  if (amount >= 30) unlockAccount(activeLevel);
  else lockAccount();
}

function animateCounter(el, targetVal) {
  const startVal  = Number(el.textContent.replace(/\D/g, '')) || 0;
  const duration  = 600;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = `$${Math.round(startVal + (targetVal - startVal) * eased).toLocaleString()}`;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function unlockAccount(level) {
  const label = level ? level.label : 'ROOKIE';
  unlockStatus.classList.add('unlocked');
  unlockIcon.textContent = '🔓';
  unlockText.textContent = `РАЗБЛОКИРОВАНО: ${label} — ТРИАЛ СНЯТ`;
  localStorage.setItem('sa_unlocked', '1');
  localStorage.setItem('sa_level',    label);

  btnToScreen4.disabled = false;
  btnToScreen4.classList.remove('locked');
  btnS4Label.textContent = 'ВОЙТИ В ШТАБ →';

  const trialEl = document.getElementById('trial-timer');
  if (trialEl) {
    trialEl.textContent = '∞ АКТИВЕН';
    trialEl.style.color       = 'var(--gold)';
    trialEl.style.textShadow  = '0 0 10px var(--gold)';
  }
}

function lockAccount() {
  unlockStatus.classList.remove('unlocked');
  unlockIcon.textContent = '🔒';
  unlockText.textContent = 'ТРИАЛ: АКТИВЕН (5 ДНЕЙ)';
}

btnSkipDeposit.addEventListener('click', () => goToScreen(4));
btnToScreen4.addEventListener('click',   () => { if (!btnToScreen4.disabled) goToScreen(4); });

function restoreScreen3() {
  const saved = Number(localStorage.getItem('sa_deposit') || 0);
  if (saved > 0) {
    currentDeposit    = saved;
    inputDeposit.value = saved;
    setTimeout(() => updateDepositUI(saved), 80);
  } else {
    lockAccount();
  }
}

window.addEventListener('screen-change', (e) => { if (e.detail === 3) restoreScreen3(); });

// ════════════════════════════════════════════
//  ЭКРАН 4: ШТАБ — НОВОСТИ
// ════════════════════════════════════════════

const hqUsername  = document.getElementById('hq-username');
const hqBadge     = document.getElementById('hq-badge');
const hqTrialPill = document.getElementById('hq-trial-pill');
const hqTrialLbl  = document.getElementById('hq-trial-label');
const bottomNav   = document.querySelector('.bottom-nav');

// ── Настройки новостей ───────────────────────────────────────────
const NEWS_JSON_URL = 'https://yb1hayk.github.io/syndicate-arena/news.json';

const CACHE_KEY = 'sa_news_data';
const CACHE_TS  = 'sa_news_ts';
const CACHE_TTL = 60 * 60 * 1000;

// ── Резервные новости (показываются если fetch не работает) ──────
const FALLBACK_NEWS = [
  { title: 'Золото держится выше $3300 на фоне неопределённости по ставке ФРС', link: '', date: new Date().toISOString(), timeAgo: 'сегодня', source: 'Синдикат', tag: 'XAU' },
  { title: 'Нефть Brent снижается: ОПЕК+ обсуждает увеличение добычи', link: '', date: new Date().toISOString(), timeAgo: 'сегодня', source: 'Синдикат', tag: 'OIL' },
  { title: 'Доллар укрепляется перед выходом данных по инфляции в США', link: '', date: new Date().toISOString(), timeAgo: 'сегодня', source: 'Синдикат', tag: 'USD' },
  { title: 'ФРС: члены комитета расходятся во мнениях о сроках снижения ставки', link: '', date: new Date().toISOString(), timeAgo: 'сегодня', source: 'Синдикат', tag: 'FED' },
  { title: 'Евро слабеет после выхода данных по ВВП еврозоны', link: '', date: new Date().toISOString(), timeAgo: 'сегодня', source: 'Синдикат', tag: 'EUR' },
  { title: 'Природный газ: запасы в США выше ожиданий, цены под давлением', link: '', date: new Date().toISOString(), timeAgo: 'сегодня', source: 'Синдикат', tag: 'GAS' },
];

// ── Ключевые слова для тегирования ──────────────────────────────
const INSTRUMENT_TAGS = [
  { key: 'XAU', words: ['золото', 'xau', 'gold', 'слитки'] },
  { key: 'OIL', words: ['нефть', 'wti', 'brent', 'oil', 'opec', 'опек', 'баррель'] },
  { key: 'GAS', words: ['газ', 'natural gas', 'lng', 'спг'] },
  { key: 'FED', words: ['фрс', 'fed', 'пауэлл', 'powell', 'федрезерв', 'ставка сша'] },
  { key: 'CPI', words: ['инфляция', 'cpi', 'pce', 'inflation', 'индекс цен'] },
  { key: 'EUR', words: ['евро', 'eur', 'ecb', 'ецб', 'еврозона', 'лагард'] },
  { key: 'GBP', words: ['фунт', 'gbp', 'boe', 'банк англии'] },
  { key: 'USD', words: ['доллар', 'usd', 'dxy', 'индекс доллара'] },
];

let allNews        = [];
let activeFilter   = 'all';
let newsInitDone   = false;

// ── Определяем тег инструмента по тексту ────────────────────────
function detectTag(text) {
  const lower = text.toLowerCase();
  for (const inst of INSTRUMENT_TAGS) {
    if (inst.words.some(w => lower.includes(w))) return inst.key;
  }
  return 'NEWS';
}

// ── Время "назад" ────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'только что';
  if (m < 60) return `${m} мин назад`;
  if (h < 24) return `${h} ч назад`;
  return `${d} д назад`;
}

// ── Рендер карточек новостей ─────────────────────────────────────
function renderNews(items) {
  const feed = document.getElementById('news-feed');
  const filtered = activeFilter === 'all'
    ? items
    : items.filter(n => n.tag === activeFilter);

  if (!filtered.length) {
    feed.innerHTML = `
      <div class="news-error">
        <div class="news-error-icon">📭</div>
        По этому фильтру новостей нет.<br>Попробуй другой инструмент.
      </div>`;
    return;
  }

  feed.innerHTML = filtered.map(n => `
    <div class="news-card" onclick="openNews('${encodeURIComponent(n.link)}')">
      <div class="news-card-top">
        <span class="news-instrument-tag tag-${n.tag}">${n.tag}</span>
        <span class="news-time">${n.timeAgo}</span>
      </div>
      <div class="news-title">${n.title}</div>
      <div class="news-source">${n.source}</div>
    </div>
  `).join('');
}

// ── Открытие новости ─────────────────────────────────────────────
function openNews(encodedUrl) {
  const url = decodeURIComponent(encodedUrl);
  if (tg) tg.openLink(url); else window.open(url, '_blank');
}

// ── Fetch с жёстким таймаутом 6 сек ─────────────────────────────
function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// ── Загрузка новостей ────────────────────────────────────────────
async function fetchNews(force = false) {
  const feed        = document.getElementById('news-feed');
  const refreshBtn  = document.getElementById('news-refresh-btn');
  const updateLabel = document.getElementById('news-update-label');
  const nextLabel   = document.getElementById('news-next-label');

  const cachedTs   = Number(localStorage.getItem(CACHE_TS) || 0);
  const cachedData = localStorage.getItem(CACHE_KEY);
  const age        = Date.now() - cachedTs;

  // Показываем кэш мгновенно, обновляем в фоне если нужно
  if (!force && cachedData && age < CACHE_TTL) {
    try {
      allNews = JSON.parse(cachedData);
      renderNews(allNews);
      updateLabel.textContent = `Обновлено: ${new Date(cachedTs).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})}`;
      setNextUpdateLabel(nextLabel);
      return;
    } catch (_) {}
  }

  feed.innerHTML = `
    <div class="news-skeleton"></div>
    <div class="news-skeleton"></div>
    <div class="news-skeleton"></div>`;
  refreshBtn.classList.add('spinning');
  updateLabel.textContent = 'Загружаем...';

  try {
    const res  = await fetchWithTimeout(NEWS_JSON_URL + '?v=' + Date.now(), 6000);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.items || !data.items.length) throw new Error('empty');

    allNews = data.items.map(n => ({ ...n, timeAgo: timeAgo(n.date) }));
    localStorage.setItem(CACHE_KEY, JSON.stringify(allNews));
    localStorage.setItem(CACHE_TS,  String(Date.now()));
    renderNews(allNews);
    updateLabel.textContent = `Обновлено: ${data.updated}`;
    setNextUpdateLabel(nextLabel);

  } catch (e) {
    // Пробуем кэш
    if (cachedData) {
      try {
        allNews = JSON.parse(cachedData);
        renderNews(allNews);
        updateLabel.textContent = 'Из кэша';
        setNextUpdateLabel(nextLabel);
        refreshBtn.classList.remove('spinning');
        return;
      } catch (_) {}
    }
    // Показываем резервные новости
    allNews = FALLBACK_NEWS;
    renderNews(allNews);
    updateLabel.textContent = 'Демо-данные Синдиката';
  }

  refreshBtn.classList.remove('spinning');
}

// ── Метка следующего обновления (12:00 МСК) ─────────────────────
function setNextUpdateLabel(el) {
  const now    = new Date();
  const msk    = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const next   = new Date(msk);
  next.setHours(12, 0, 0, 0);
  if (msk >= next) next.setDate(next.getDate() + 1);
  const diffH  = Math.round((next - msk) / 3600000);
  el.textContent = diffH < 1
    ? 'Следующее обновление — скоро'
    : `Следующее обновление через ~${diffH} ч`;
}

// ── Фильтры ─────────────────────────────────────────────────────
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderNews(allNews);
    });
  });
}

// ── Кнопка обновления ────────────────────────────────────────────
document.getElementById('news-refresh-btn').addEventListener('click', () => {
  fetchNews(true);
});

// ── Инициализация штаба ──────────────────────────────────────────
function initHQ() {
  const name     = localStorage.getItem('sa_name')     || USER_NAME;
  const level    = localStorage.getItem('sa_level')    || 'ТРИАЛ';
  const unlocked = localStorage.getItem('sa_unlocked') === '1';
  const trialEnd = Number(localStorage.getItem('sa_trial_end') || 0);

  hqUsername.textContent = `АГЕНТ: ${name}`;
  hqBadge.textContent    = level;

  if (unlocked) {
    hqTrialPill.classList.add('gold-pill');
    hqTrialLbl.textContent = level;
  } else {
    hqTrialLbl.textContent = trialEnd ? formatTrialShort(trialEnd) : 'ТРИАЛ';
  }

  bottomNav.classList.add('visible');

  if (!newsInitDone) {
    initFilters();
    newsInitDone = true;
  }
  fetchNews();
}

function formatTrialShort(endTs) {
  const diff = endTs - Date.now();
  if (diff <= 0) return 'ИСТЁК';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  return `${d}Д ${h}Ч`;
}

// ── Профиль ──────────────────────────────────────────────────────
document.getElementById('btn-profile').addEventListener('click', () => {
  const psychotype = localStorage.getItem('sa_psychotype') || '—';
  const level      = localStorage.getItem('sa_level')      || 'ТРИАЛ';
  const email      = localStorage.getItem('sa_email')      || '—';
  const deposit    = localStorage.getItem('sa_deposit')    || '0';

  if (tg) {
    tg.showPopup({
      title: '👤 МОЙ ПРОФИЛЬ',
      message:
        `Психотип: ${psychotype}\n` +
        `Уровень: ${level}\n` +
        `Email: ${email}\n` +
        `Депозит: $${deposit}`,
      buttons: [{ type: 'close', text: 'ЗАКРЫТЬ' }]
    });
  } else {
    alert(`Психотип: ${psychotype}\nУровень: ${level}\nEmail: ${email}\nДепозит: $${deposit}`);
  }
});

window.addEventListener('screen-change', (e) => {
  if (e.detail === 4) initHQ();
  if (e.detail !== 4) bottomNav.classList.remove('visible');
});
