/* Egyptian game (simple structure like colors.js) */

const EGYPTIAN_POOL = Array.from('ꜣꞽïyꜥwbpfmnrhḥḫẖzsšqkgtṯdḏ');
const JSON_PATH_DEFAULT = '../assets/json/egyptian.json';
const MAX_SCALE = 4;
const BASE_SPEED_INIT = 0.00025;

// elements
const el = {
  egyptian: null,
  furigana: null,
  choices: null,
  result: null,
  scalePercent: null,
  timerBar: null,
  restartBtn: null,
  problemNumber: null
};

// state
let pool = [];
let currentIndex = 0;
let readingPos = 0;
let revealed = [];
let scale = 1.0;
let baseSpeed = BASE_SPEED_INIT;
let lastTime = 0;
let paused = false;
let pauseUntil = 0;
let rafId = null;
let score = 0; // number of completed readings
let pendingNextTimeout = null; // id of scheduled next-question timeout
let displayIndex = 1; // 1-based problem counter for display



function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }
function sampleExcluding(poolArr, exclude, n){ const available = poolArr.filter(ch => !exclude.includes(ch)); shuffle(available); return available.slice(0,n); }

function getQueryTags(){ const p = new URLSearchParams(location.search); const t = p.get('tags'); return t ? t.split(',').map(s=>s.trim()).filter(Boolean) : []; }

async function loadData(path){ const res = await fetch(path); if(!res.ok) throw new Error('Fetch failed'); return res.json(); }

function currentEntry(){ return pool[currentIndex % pool.length]; }

function renderFurigana(){
  if(!el.furigana) return;
  const r = currentEntry().tl;
  const parts = Array.from(r).map((ch,i)=> revealed[i] ? ch : '●');
  el.furigana.textContent = parts.join(' ');
}

function setChoicesForNextChar(){
  if(!el.choices) return;
  el.choices.innerHTML = '';
  const r = currentEntry().tl;
  if(readingPos >= r.length) return;
  const correct = r[readingPos];
  const dummies = sampleExcluding(EGYPTIAN_POOL, [correct], 5);
  const options = shuffle([correct, ...dummies]);
  options.forEach(opt => {
    const li = document.createElement('li');
    li.className = 'choice';
    li.setAttribute('role','option');
    li.tabIndex = 0;
    li.textContent = opt;
    li.addEventListener('click', () => handleChoice(li, opt));
    li.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); li.click(); } });
    el.choices.appendChild(li);
  });
}

function handleChoice(elm, value){
  if(paused) return;
  const r = currentEntry().tl;
  const correct = r[readingPos];
  if(value === correct){
    revealed[readingPos] = true;
    renderFurigana();
    elm.classList.add('selected');
    // pause growth for 1s and advance lastTime so dt doesn't include pause duration
    pauseUntil = performance.now() + 1000;
    lastTime = pauseUntil;
    readingPos++;
    if(readingPos >= r.length){
      // completed the reading
      score++;
      if(el.result) el.result.textContent = '正解！ 次の問題へ';
      currentIndex++;
      displayIndex++;
      baseSpeed *= 1.12;
      // schedule next question; keep reference so we can cancel on game over
      if(pendingNextTimeout) { clearTimeout(pendingNextTimeout); pendingNextTimeout = null; }
      pendingNextTimeout = setTimeout(()=>{
        // reset scale for the next question and optionally reshuffle wrap
        scale = 1.0;
        if(currentIndex >= pool.length){ shuffle(pool); currentIndex = 0; }
        pendingNextTimeout = null;
        startQuestion();
      }, 700);
    } else {
      setTimeout(()=> setChoicesForNextChar(), 125);
      if(el.result) el.result.textContent = '';
    }
  } else {
    elm.classList.add('disabled');
    setTimeout(()=> elm.classList.remove('disabled'), 700);
    if(el.result) el.result.textContent = '違います';
    setTimeout(()=> { if(el.result && el.result.textContent === '違います') el.result.textContent = ''; }, 700);
  }
}

function startQuestion(){
  const entry = currentEntry();
  readingPos = 0;
  revealed = Array.from({length: entry.tl.length}).map(()=>false);
  if(el.egyptian) {
    el.egyptian.textContent = entry.word;
    el.egyptian.style.transform = `scale(${scale})`;
  }
  // ensure restart button hidden while playing
  if(el.restartBtn) el.restartBtn.hidden = true;
  // update problem number (sequential display)
  if(el.problemNumber) el.problemNumber.textContent = String(displayIndex);
  renderFurigana();
  setChoicesForNextChar();
  if(el.result) el.result.textContent = '';
}

function updateBar(){
  const pct = Math.min(1, Math.max(0, (scale - 1) / (MAX_SCALE - 1)));
  if(el.timerBar) el.timerBar.style.width = `${100 - pct*100}%`;
  if(el.scalePercent) el.scalePercent.textContent = scale.toFixed(2);
}

function gameOver(){
  paused = true;
  const r = currentEntry().tl;
  if(el.furigana) el.furigana.textContent = r.split('').join(' ')
  if(rafId) cancelAnimationFrame(rafId);
  if(el.result) el.result.textContent = `終了！ 正解数: ${score}`;  // clear any pending next-question timeouts so we don't hide the restart button
  if(pendingNextTimeout){ clearTimeout(pendingNextTimeout); pendingNextTimeout = null; }  if(el.choices) Array.from(el.choices.children).forEach(c => c.classList.add('disabled'));
  if(el.restartBtn) el.restartBtn.hidden = false;
} 

function tick(now){
  rafId = requestAnimationFrame(tick);
  if(paused) return;
  if(now < pauseUntil) return;
  // if lastTime is before the pause end, advance it so dt does not include the paused duration
  if(lastTime < pauseUntil) lastTime = pauseUntil;
  const dt = now - lastTime;
  lastTime = now;
  const speed = baseSpeed * (1 + (currentIndex * 0.12));
  scale += speed * dt;
  if(el.egyptian) el.egyptian.style.transform = `scale(${scale})`;
  if(scale >= MAX_SCALE){ updateBar(); gameOver(); return; }
  updateBar();
}

async function init() {
  el.egyptian = document.getElementById('egyptian');
  el.furigana = document.getElementById('furigana');
  el.choices = document.getElementById('choices');
  el.result = document.getElementById('result');
  el.scalePercent = document.getElementById('scale-percent');
  el.timerBar = document.getElementById('timer-bar');
  el.restartBtn = document.getElementById('restart');
  el.problemNumber = document.getElementById('problem-number');

  const jsonPath = JSON_PATH_DEFAULT;
  let data;
  try {
    data = await loadData(jsonPath);
  } catch (e) {
    console.error('egyptian.json load failed', e);
    if(el.egyptian) el.egyptian.textContent = 'データの読み込みに失敗しました。';
    return;
  }

  const tags = getQueryTags();
  pool = tags.length ? data.filter(x => (x.tags||[]).some(t=>tags.includes(t))) : data.slice();
  if(!pool.length){ if(el.egyptian) el.egyptian.textContent = '該当する問題が見つかりません。ジャンル選択に戻ってください。'; return; }
  shuffle(pool);

  // Restart button handler (hidden during gameplay)
  if(el.restartBtn) {
    el.restartBtn.hidden = true;
    el.restartBtn.addEventListener('click', ()=>{
      // reset core state, reshuffle questions and restart game
      scale = 1.0;
      baseSpeed = BASE_SPEED_INIT;
      score = 0;
      displayIndex = 1;
      shuffle(pool);
      currentIndex = 0;
      paused = false;
      pauseUntil = 0;
      // clear any visual disabled/selected state
      if(el.choices) Array.from(el.choices.children).forEach(c => c.classList.remove('disabled','selected'));
      if(el.result) el.result.textContent = '';
      if(el.restartBtn) el.restartBtn.hidden = true;
      startQuestion();
      lastTime = performance.now();
      rafId = requestAnimationFrame(tick);
    });
  }

  // start
  startQuestion();
  lastTime = performance.now();
  rafId = requestAnimationFrame(tick);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init(); 