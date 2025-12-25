let allEvents = [];
let currentSet = [];
let sortable = null;

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function pickRandom(array, count = 4) {
  const result = [];
  const used = new Set();
  while (result.length < count && result.length < array.length) {
    const idx = Math.floor(Math.random() * array.length);
    if (!used.has(idx)) {
      used.add(idx);
      result.push(array[idx]);
    }
  }
  return result;
}

function renderList(listEl, items) {
  listEl.innerHTML = '';
  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.dataset.year = String(item.year);
    li.dataset.id = item.id ?? String(i);
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-grabbed', 'false');
    li.draggable = true; // 明示的に draggable 属性を付与
    li.innerHTML = `
      <span class="left-year" aria-hidden="true"></span>
      <span class="updown-marker" title="つまんで移動"><i class="fa-solid fa-arrows-up-down"></i></span>
      <span class="event">${item.event}</span>
    `;
    listEl.appendChild(li);
  });
}


function setNotesPopup(popupContainer, items) {
  popupContainer.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    const notes = item.notes || '解説なし';
    const yearLabel = item.year < 0 ? `${-item.year} BC` : item.year;
    div.className = 'popup-content';
    div.innerHTML = `<h3>${yearLabel} — ${item.event}</h3><p>${notes}</p>`;
    popupContainer.appendChild(div);
  });
}

function initSortable(listEl) {
  if (sortable) sortable.destroy();
  sortable = Sortable.create(listEl, {
    animation: 200,
    swapThreshold: 0.65,
    draggable: '.list-item',
    // フォールバックを強制してポインタ／タッチで安定してドラッグできるようにする
    forceFallback: true,
    fallbackTolerance: 5,
    fallbackOnBody: true,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onStart: (evt) => {
      const el = evt.item;
      el.setAttribute('aria-grabbed', 'true');
    },
    onEnd: (evt) => {
      const el = evt.item;
      el.setAttribute('aria-grabbed', 'false');
      el.focus();
    },
  });
}

function markYears(lis) {
  lis.forEach(li => {
    const y = Number(li.dataset.year);
    const label = y < 0 ? `${-y} BC` : `${y}`;
    const left = li.querySelector('.left-year');
    if (left) {
      left.textContent = label;
      // 年号表示状態を示すクラスを付与（左寄せ表示を有効にする）
      li.classList.add('year-shown');
    }
  });
}

function checkAnswer(listEl, resultEl, answerBtn, nextBtn, notesBtn) {
  const lis = [...listEl.querySelectorAll('li')];
  const years = lis.map(li => Number(li.dataset.year));
  const sorted = [...years].slice().sort((a, b) => a - b);
  const isCorrect = years.every((v, i) => v === sorted[i]);
  if (isCorrect) {
    resultEl.textContent = '✅ 正解！';
    resultEl.style.color = 'green';
  } else {
    resultEl.textContent = '❌ 不正解！';
    resultEl.style.color = 'red';
  }
  markYears(lis);
  answerBtn.style.display = 'none';
  nextBtn.style.display = 'inline-block';
  notesBtn.style.display = 'inline-block';
}

function loadProblem(listEl, resultEl, answerBtn, nextBtn, notesBtn, popupContainer) {
  resultEl.textContent = '';
  answerBtn.style.display = 'inline-block';
  nextBtn.style.display = 'none';
  notesBtn.style.display = 'none';

  currentSet = pickRandom(allEvents, 4);
  renderList(listEl, currentSet);
  setNotesPopup(popupContainer, currentSet);
  initSortable(listEl);
}

// keyboard reordering: when a list-item has focus, ArrowUp/Down moves it
function enableKeyboardReorder(listEl) {
  listEl.addEventListener('keydown', (e) => {
    const target = e.target;
    if (!target || !target.classList || !target.classList.contains('list-item')) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const li = target;
      if (e.key === 'ArrowUp') {
        const prev = li.previousElementSibling;
        if (prev) li.parentNode.insertBefore(li, prev);
      } else {
        const next = li.nextElementSibling;
        if (next) li.parentNode.insertBefore(next.nextElementSibling, li);
      }
      // keep focus on moved element
      li.focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('list');
  const answerBtn = document.getElementById('answerBtn');
  const nextBtn = document.getElementById('nextBtn');
  const notesBtn = document.getElementById('notesBtn');
  const closeBtn = document.getElementById('closeBtn');
  const resultEl = document.getElementById('result');
  const popupOverlay = document.getElementById('popupOverlay');
  const popupContainer = document.getElementById('popupContainer');

  if (!listEl) {
    console.error('list element not found');
    return;
  }

  // handlers
  answerBtn.addEventListener('click', () => checkAnswer(listEl, resultEl, answerBtn, nextBtn, notesBtn));
  nextBtn.addEventListener('click', () => loadProblem(listEl, resultEl, answerBtn, nextBtn, notesBtn, popupContainer));
  notesBtn.addEventListener('click', () => {
    popupOverlay.style.display = 'flex';
    popupOverlay.setAttribute('aria-hidden', 'false');
  });
  closeBtn.addEventListener('click', () => {
    popupOverlay.style.display = 'none';
    popupOverlay.setAttribute('aria-hidden', 'true');
  });
  popupOverlay.addEventListener('click', (e) => { if (e.target === popupOverlay) {
    popupOverlay.style.display = 'none';
    popupOverlay.setAttribute('aria-hidden', 'true');
  } });

  enableKeyboardReorder(listEl);

  // data load (fetch, fallback to window.EVENTS)
  try {
    const resp = await fetch(`../assets/json/events.json`);
    if (!resp.ok) throw new Error('fetch failed: ' + resp.status);
    allEvents = await resp.json();
  } catch (err) {
    console.warn('events.json fetch failed, trying window.EVENTS fallback.', err);
    if (window && Array.isArray(window.EVENTS) && window.EVENTS.length) {
      allEvents = window.EVENTS;
    } else {
      console.error('No events data available (fetch failed and window.EVENTS not present).', err);
      resultEl.textContent = 'データの読み込みに失敗しました。';
      return;
    }
  }

  loadProblem(listEl, resultEl, answerBtn, nextBtn, notesBtn, popupContainer);
});