import { randInt } from './generators.js';

const DURATION = 60;
let remaining = DURATION;
let timerInterval = null;
let score = 0;
let pairs = []; // current round pairs
let disabledCount = 0;
let selectedLeft = null; // button element
let selectedRight = null;

const el = {
  timerBar: document.getElementById('timer-bar'),
  timeRemaining: document.getElementById('time-remaining'),
  leftCol: document.getElementById('left-column'),
  rightCol: document.getElementById('right-column'),
  message: document.getElementById('message'),
  scoreDisplay: document.getElementById('score'),
  restartBtn: document.getElementById('restart')
};

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function setMessage(text, dur = 900) {
  el.message.textContent = text;
  if (dur > 0) setTimeout(() => { if (el.message.textContent === text) el.message.textContent = ''; }, dur);
}

async function loadGroups() {
  const res = await fetch('../assets/json/pair-group.json');
  const data = await res.json();
  const params = new URLSearchParams(window.location.search);
  const genresParam = params.get('genres');
  const selected = genresParam ? genresParam.split(',') : [];
  // if none selected, include all
  const chosen = data.filter(g => selected.length === 0 || selected.includes(g.genre));
  // flatten group entries
  const pool = [];
  chosen.forEach(g => {
    (g.group || []).forEach(entry => {
      // find alias-like key (array) other than 'entry'
      let aliasKey = null;
      for (const k of Object.keys(entry)) {
        if (k === 'entry') continue;
        if (Array.isArray(entry[k])) { aliasKey = k; break; }
      }
      // fallback to 'aliases' if present
      if (!aliasKey && Array.isArray(entry.aliases)) aliasKey = 'aliases';
      // if still none, skip this entry
      if (!aliasKey) return;

      // normalize alias array so we always have an array of strings
      const rawArr = Array.isArray(entry[aliasKey]) ? entry[aliasKey] : [];
      const normalized = rawArr.map(a => {
        if (typeof a === 'string') return a;
        if (a && typeof a === 'object') {
          // prefer common string keys if present
          for (const key of ['jpn']) {
            if (typeof a[key] === 'string') return a[key];
          }
          // fallback: first string value in the object
          const vals = Object.values(a); const firstStr = vals.find(v => typeof v === 'string');
          if (firstStr) return firstStr;
          // entirely non-string object, stringify as last resort
          try { return JSON.stringify(a); } catch(e) { return String(a); }
        }
        return String(a);
      }).filter(Boolean);

      // if no aliases found after normalization, fall back to the entry text itself
      const aliases = normalized.length ? normalized : [String(entry.entry)];

      pool.push({ entry: entry.entry, aliases });
    });
  });
  return pool;
}

function makeRound(pool) {
  // choose up to 5 random distinct items
  const N = Math.min(5, pool.length);
  const indices = [];
  while (indices.length < N) {
    const i = randInt(0, pool.length - 1);
    if (!indices.includes(i)) indices.push(i);
  }
  pairs = indices.map((idx, i) => {
    const item = pool[idx];
    const alias = item.aliases.length ? item.aliases[Math.floor(Math.random() * item.aliases.length)] : item.entry;
    return { id: `p${i}`, entry: item.entry, alias };
  });
  renderPairs();
}

function renderPairs() {
  disabledCount = 0;
  selectedLeft = null; selectedRight = null;
  el.leftCol.innerHTML = '';
  el.rightCol.innerHTML = '';

  const leftItems = pairs.map(p => ({ id: p.id, label: p.entry }));
  const rightItems = pairs.map(p => ({ id: p.id, label: p.alias }));
  shuffle(leftItems); shuffle(rightItems);

  leftItems.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.label;
    btn.dataset.pairId = item.id;
    btn.className = 'match-btn left';
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', onLeftClick);
    el.leftCol.appendChild(btn);
  });

  rightItems.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.label;
    btn.dataset.pairId = item.id;
    btn.className = 'match-btn right';
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', onRightClick);
    el.rightCol.appendChild(btn);
  });
}

function onLeftClick(e) {
  const btn = e.currentTarget;
  if (btn.disabled) return;
  // toggle
  const pressed = btn.getAttribute('aria-pressed') === 'true';
  if (pressed) {
    btn.setAttribute('aria-pressed', 'false');
    selectedLeft = null;
    return;
  }
  // deselect previous
  if (selectedLeft) selectedLeft.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-pressed', 'true');
  selectedLeft = btn;
  tryMatch();
}

function onRightClick(e) {
  const btn = e.currentTarget;
  if (btn.disabled) return;
  const pressed = btn.getAttribute('aria-pressed') === 'true';
  if (pressed) {
    btn.setAttribute('aria-pressed', 'false');
    selectedRight = null;
    return;
  }
  if (selectedRight) selectedRight.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-pressed', 'true');
  selectedRight = btn;
  tryMatch();
}

function tryMatch() {
  if (!selectedLeft || !selectedRight) return;
  const leftId = selectedLeft.dataset.pairId;
  const rightId = selectedRight.dataset.pairId;
  if (leftId === rightId) {
    // correct
    selectedLeft.disabled = true;
    selectedRight.disabled = true;
    selectedLeft.setAttribute('aria-pressed', 'false');
    selectedRight.setAttribute('aria-pressed', 'false');
    selectedLeft.classList.add('matched');
    selectedRight.classList.add('matched');
    selectedLeft = null; selectedRight = null;
    disabledCount += 1;
    score += 1;
    el.scoreDisplay.textContent = String(score);
    if (disabledCount >= pairs.length) {
      // round complete: new pairs after short delay
      setMessage('正解！次へ', 700);
      setTimeout(() => {
        // make new round
        loadGroups().then(pool => makeRound(pool));
      }, 300);
    } else {
      setMessage('正解！', 700);
    }
  } else {
    // incorrect
    setMessage('違います', 900);
    // unselect both after short delay
    const L = selectedLeft; const R = selectedRight;
    selectedLeft = null; selectedRight = null;
    setTimeout(() => {
      if (L) L.setAttribute('aria-pressed', 'false');
      if (R) R.setAttribute('aria-pressed', 'false');
    }, 300);
  }
}

function startTimer() {
  const start = Date.now();
  remaining = DURATION;
  el.timeRemaining.textContent = remaining;
  updateTimerBar(1);
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - start) / 1000;
    remaining = Math.max(0, Math.ceil(DURATION - elapsed));
    el.timeRemaining.textContent = remaining;
    const ratio = Math.max(0, (DURATION - elapsed) / DURATION);
    updateTimerBar(ratio);
    if (elapsed >= DURATION) {
      clearInterval(timerInterval);
      finishGame();
    }
  }, 200);
}

function updateTimerBar(ratio) {
  el.timerBar.style.width = `${Math.round(ratio * 100)}%`;
  if (ratio < 0.25) el.timerBar.style.filter = 'hue-rotate(-20deg)';
  else el.timerBar.style.filter = '';
}

function finishGame() {
  // disable all remaining buttons
  Array.from(document.querySelectorAll('.match-btn')).forEach(b => b.disabled = true);
  el.restartBtn.hidden = false;
  setMessage(`時間切れ！ 作成したペア: ${score}`, 0);
}

function restart() {
  score = 0; el.scoreDisplay.textContent = '0';
  el.restartBtn.hidden = true;
  setMessage('');
  loadGroups().then(pool => {
    makeRound(pool);
    startTimer();
  });
}

// init
async function init() {
  try {
    const pool = await loadGroups();
    if (pool.length < 1) {
      el.leftCol.textContent = '出題データがありません。';
      return;
    }
    makeRound(pool);
    startTimer();
    el.restartBtn.addEventListener('click', restart);
  } catch (e) {
    console.error(e);
    el.leftCol.textContent = '読み込みに失敗しました。';
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
