const DURATION = 60;
let remaining = DURATION;
let timerInterval = null;
let score = 0;
let currentProblem = null; // { tag, choices: [...], correctIds: Set }

const el = {
  timerBar: document.getElementById('timer-bar'),
  timeRemaining: document.getElementById('time-remaining'),
  question: document.getElementById('question'),
  choices: document.getElementById('choices'),
  submitBtn: document.getElementById('submit-answer'),
  result: document.getElementById('result')
};

let allElements = [];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

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
  // build problem:
  // pick a random tag from available tags
  const tags = Array.from(new Set(allElements.flatMap(e => e.tags || [])));
  const tag = tags[randInt(0, tags.length - 1)];
  // elements that match tag
  const positives = allElements.filter(e => (e.tags || []).includes(tag));
  const negatives = allElements.filter(e => !(e.tags || []).includes(tag));
  // ensure at least 1 positive in choices
  const nCorrect = Math.min(Math.max(1, randInt(1, Math.min(2, positives.length))), positives.length);
  const chosenPos = shuffle([...positives]).slice(0, nCorrect);
  const needed = 6 - chosenPos.length;
  const chosenNeg = shuffle([...negatives]).slice(0, needed);
  const choices = shuffle([...chosenPos, ...chosenNeg]).map(e => ({ id: e.number, symbol: e.symbol, name: e.name }));
  const correctIds = new Set(chosenPos.map(e => e.number));
  currentProblem = { tag, choices, correctIds };

  renderProblem();
}

function renderProblem() {
  // question text
  el.question.textContent = `${currentProblem.tag} に含まれるのは？`;
  // render six buttons
  el.choices.innerHTML = '';
  currentProblem.choices.forEach(item => {
    const li = document.createElement('li');
    li.className = 'choice';
    li.setAttribute('role', 'option');
    li.setAttribute('tabindex', '0');
    li.dataset.id = String(item.id);
    li.setAttribute('aria-pressed', 'false');
    li.innerHTML = `<div class="symbol">${item.symbol}</div><div class="name">${item.name}</div>`;
    li.addEventListener('click', () => toggleChoice(li));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChoice(li); }
    });
    el.choices.appendChild(li);
  });
  el.result.textContent = '';
}

function toggleChoice(elm) {
  if (elm.classList.contains('disabled')) return;
  const pressed = elm.getAttribute('aria-pressed') === 'true';
  elm.setAttribute('aria-pressed', String(!pressed));
  elm.classList.toggle('selected', !pressed);
}

function checkAnswer() {
  const pressedEls = Array.from(el.choices.querySelectorAll('.choice.selected'));
  const selectedIds = new Set(pressedEls.map(n => Number(n.dataset.id)));
  // check exact match: selected set equals correctIds
  const correctIds = currentProblem.correctIds;
  const eq = selectedIds.size === correctIds.size && [...selectedIds].every(id => correctIds.has(id));
  if (eq) {
    score++;
    el.result.textContent = '✅ 正解！ 次の問題へ';
    el.result.style.color = 'green';
    // brief delay then next problem
    setTimeout(() => {
      loadNextProblem();
    }, 600);
  } else {
    // incorrect: clear selections and give feedback; require retry (do not advance)
    el.result.textContent = '❌ 不正解。選択をリセットしました。';
    el.result.style.color = 'red';
    // visual reset: briefly disable then re-enable (so user sees reset)
    const items = Array.from(el.choices.querySelectorAll('.choice'));
    items.forEach(it => { it.classList.add('disabled'); it.classList.remove('selected'); it.setAttribute('aria-pressed','false'); });
    setTimeout(() => items.forEach(it => it.classList.remove('disabled')), 400);
  }
}

// init / data load
async function init() {
  try {
    const resp = await fetch('../assets/json/elements.json');
    if (!resp.ok) throw new Error('fetch failed');
    allElements = await resp.json();
  } catch (e) {
    console.error('elements.json load failed', e);
    el.question.textContent = 'データの読み込みに失敗しました。';
    return;
  }

  loadNextProblem();
  startTimer();
  el.submitBtn.addEventListener('click', checkAnswer);
}

// start when DOM ready
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();