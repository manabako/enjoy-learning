const DURATION = 60;
let remaining = DURATION;
let timerInterval = null;
let score = 0;
let current = null; // { correct, choices: [...] }

const el = {
  timerBar: document.getElementById('timer-bar'),
  timeRemaining: document.getElementById('time-remaining'),
  swatch: document.getElementById('swatch'),
  choices: document.getElementById('choices'),
  result: document.getElementById('result'),
  score: document.getElementById('score'),
  levelDisplay: document.getElementById('select-display')
};

let colors = [];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const escapeHtml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function getSelectedLevel() {
  try {
    const url = new URL(window.location.href);
    const param = url.searchParams.get('level');
    const stored = sessionStorage.getItem('colorGameLevel');
    const lvl = param ? Number(param) : (stored ? Number(stored) : null);
    if (![1,2,3].includes(lvl)) {
      // no valid level chosen -> go to selector
      window.location.href = 'select.html';
      return null;
    }
    return lvl;
  } catch (e) {
    window.location.href = 'select.html';
    return null;
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
function updateTimerBar(ratio) { el.timerBar.style.width = `${Math.round(ratio * 100)}%`; }

function finishGame() {
  setTimeout(()=> {
    alert(`時間切れ！ 正解数: ${score}`);
    window.location.reload();
  }, 50);
}

function loadNextProblem() {
  if (!colors.length) return;
  const correct = colors[randInt(0, colors.length - 1)];
  // pick three distractors
  const others = shuffle(colors.filter(c => c.name !== correct.name)).slice(0, 3);
  const choices = shuffle([correct, ...others]);
  current = { correct, choices };
  renderProblem();
}

function renderProblem() {
  el.swatch.style.background = current.correct.hex;
  el.swatch.style.borderColor = '#808080'; // 50% gray

  el.choices.innerHTML = '';
  current.choices.forEach(item => {
    const li = document.createElement('li');
    li.className = 'choice';
    li.setAttribute('role', 'option');
    li.setAttribute('tabindex', '0');
    li.dataset.name = item.name;
    li.setAttribute('aria-pressed', 'false');
    li.innerHTML = `<div class="yomi">${escapeHtml(item.yomi || '')}</div><div class="name">${escapeHtml(item.name)}</div>`;
    li.addEventListener('click', () => handleChoice(li));
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChoice(li); } });
    el.choices.appendChild(li);
  });

  el.result.textContent = '';
}

function handleChoice(li) {
  if (li.classList.contains('disabled')) return;
  const chosen = li.dataset.name;
  const correct = current.correct.name;
  if (chosen === correct) {
    score++;
    el.result.textContent = '正解！ 次の問題へ';
    el.result.style.color = '#2563eb';
    el.score.textContent = score;
    // highlight correct
    li.classList.add('selected');
    setTimeout(() => loadNextProblem(), 600);
  } else {
    el.result.textContent = '不正解。次に進みます…';
    el.result.style.color = 'red';
    // briefly show correct and move on
    const items = Array.from(el.choices.querySelectorAll('.choice'));
    items.forEach(it => { it.classList.add('disabled'); });
    // reveal correct choice visually
    const correctEl = Array.from(el.choices.querySelectorAll('.choice')).find(it => it.dataset.name === correct);
    if (correctEl) correctEl.classList.add('selected');
    setTimeout(() => loadNextProblem(), 900);
  }
}

async function init() {
  const level = getSelectedLevel();
  if (!level) return; // redirected to selector
  el.levelDisplay.textContent = level;

  try {
    const resp = await fetch('../assets/json/colors.json');
    if (!resp.ok) throw new Error('fetch failed');
    const all = await resp.json();
    colors = all.filter(c => Number(c.level) === Number(level));
    if (!colors || colors.length === 0) {
      console.warn(`No colors found for level ${level}, falling back to full list.`);
      colors = all;
    }
  } catch (e) {
    console.error('colors.json load failed', e);
    el.result.textContent = 'データの読み込みに失敗しました。';
    return;
  }

  loadNextProblem();
  startTimer();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();