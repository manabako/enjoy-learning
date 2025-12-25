// Game logic: 問題生成 (PythonのイメージをJSで実装)、UI制御、タイマー
import { generators, randInt } from './generators.js';

const DURATION = 60; // seconds
let remaining = DURATION;
let timerInterval = null;
let problemNumber = 1;
let solvedCount = 0;
let currentSolution = null;

const el = {
  timerBar: document.getElementById('timer-bar'),
  timeRemaining: document.getElementById('time-remaining'),
  problemNumber: document.getElementById('problem-number'),
  formula: document.getElementById('formula'),
  answerInput: document.getElementById('answer-input'),
  tenkey: document.getElementById('tenkey'),
  submitBtn: document.getElementById('submit-answer'),
  message: document.getElementById('message')
};

function newProblem() {
  const idx = randInt(0, generators.length - 1);
  const { solution, formula } = generators[idx]();
  currentSolution = solution;
  renderFormula(formula);
}

function renderFormula(latex) {
  // use KaTeX to render into #formula
  try {
    katex.render(latex, el.formula, { throwOnError: false, displayMode: true });
  } catch (e) {
    el.formula.textContent = latex;
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
  // animate color change near end
  if (ratio < 0.25) el.timerBar.style.filter = 'hue-rotate(-20deg)';
  else el.timerBar.style.filter = '';
}

function finishGame() {
  const finalNum = solvedCount;
  setTimeout(()=> {
    alert(`時間切れ！ 解いた問題数: ${finalNum}`);
    // reload to restart
    window.location.reload();
  }, 50);
}

function setMessage(text, duration=1200) {
  el.message.textContent = text;
  if (duration>0) setTimeout(()=> { if (el.message.textContent === text) el.message.textContent = ''; }, duration);
}

function submitAnswer() {
  const val = el.answerInput.value.trim();
  if (val === '') { setMessage('答えを入力してください'); return; }
  // parse as number (allow negative)
  const num = Number(val);
  if (Number.isNaN(num)) { setMessage('数値で入力してください'); el.answerInput.value = ''; return; }
  if (Math.abs(num - currentSolution) < 1e-6) {
    // correct
    solvedCount++;
    problemNumber++;
    el.problemNumber.textContent = problemNumber;
    setMessage('正解！ 次の問題へ', 800);
    el.answerInput.value = '';
    newProblem();
  } else {
    // clear input even on incorrect
    el.answerInput.value = '';
    setMessage(`不正解。正しくありません`, 900);
  }
}

// tenkey handlers
function onTenkeyClick(e) {
  if (!e.target.classList.contains('tk')) return;
  const v = e.target.textContent;
  const input = el.answerInput;
  if (v === '⌫') {
    // existing backspace logic...
    const selStart = input.selectionStart ?? input.value.length;
    const selEnd = input.selectionEnd ?? selStart;
    if (selStart !== selEnd) {
      const before = input.value.slice(0, selStart);
      const after = input.value.slice(selEnd);
      input.value = before + after;
      input.setSelectionRange(selStart, selStart);
    } else {
      input.value = input.value.slice(0, -1);
    }
  } else if (v === 'C') {
    input.value = '';
  } else if (v === '-') {
    if (!input.value.startsWith('-') && (input.selectionStart ?? 0) === 0) {
      input.value = '-' + input.value;
    } else {
      setMessage('マイナスは先頭でのみ入力できます', 900);
    }
  } else {
    // digit pressed
    const digit = v;
    // Prevent adding a digit after a single leading zero (allow only "0")
    const cur = input.value;
    // consider "-0" case too
    if (cur === '0' || cur === '-0') {
      setMessage('先頭が0のときは別の数字を入力できません', 900);
      input.focus();
      return;
    }
    // If selection exists, insert at cursor; otherwise append
    const selStart = input.selectionStart ?? input.value.length;
    const selEnd = input.selectionEnd ?? selStart;
    if (selStart !== selEnd) {
      const before = input.value.slice(0, selStart);
      const after = input.value.slice(selEnd);
      const newVal = before + digit + after;
      // prevent creating leading-zero patterns like "01" or "-01"
      if (/^-?0[0-9]/.test(newVal)) {
        setMessage('先頭が0のときは別の数字を入力できません', 900);
      } else {
        input.value = newVal;
        const pos = selStart + 1;
        input.setSelectionRange(pos, pos);
      }
    } else {
      // simple append
      const newVal = input.value + digit;
      if (/^-?0[0-9]/.test(newVal)) {
        setMessage('先頭が0のときは別の数字を入力できません', 900);
      } else {
        input.value = newVal;
      }
    }
  }
  input.focus();
}

  function isTouchDevice() {
  return ('ontouchstart' in window) ||
          (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
          (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);
}

// init
function init() {
  const touchOnly = isTouchDevice();

  if (touchOnly) {
    // モバイル：ネイティブキーボードを起動させない（テンキーのみ）
    el.answerInput.setAttribute('readonly', 'readonly');
    el.answerInput.setAttribute('inputmode', 'none');
    el.answerInput.classList.add('touch-only');
    // タッチ開始でフォーカス移動やスクロール暴発を防ぐ
    el.answerInput.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
  } else {
    // PC：キーボード入力を有効にする
    el.answerInput.removeAttribute('readonly');
    el.answerInput.setAttribute('inputmode', 'numeric');
    el.answerInput.classList.remove('touch-only');

    // キー入力の制御（マイナスは先頭のみ許可、Enter で送信）
    el.answerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { submitAnswer(); return; }
      // 許可する制御キー
      const allowedControls = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
      if (allowedControls.includes(e.key)) return;
      // マイナスは先頭のみ
      if (e.key === '-') {
        const selStart = el.answerInput.selectionStart ?? 0;
        if (!(selStart === 0 && !el.answerInput.value.startsWith('-'))) {
          e.preventDefault();
          setMessage('マイナスは先頭でのみ入力できます', 900);
        }
        return;
      }
      // 数字のみ許可
      if (/^[0-9]$/.test(e.key)) return;
      // それ以外は禁止
      e.preventDefault();
    }, { passive: false });
  }

  // 共通初期化
  newProblem();
  startTimer();
  el.tenkey.addEventListener('click', onTenkeyClick);
  el.submitBtn.addEventListener('click', submitAnswer);

  // input のサニタイズ（既存の input イベントハンドラが無ければここで追加）
  el.answerInput.addEventListener('input', () => {
    let v = el.answerInput.value;
    const firstMinus = v.indexOf('-');
    if (firstMinus > 0) {
      v = v.replace(/-/g, '');
      el.answerInput.value = v;
      setMessage('マイナスは先頭でのみ入力できます', 900);
    } else if (firstMinus === 0) {
      const rest = v.slice(1).replace(/-/g, '');
      if (rest.length !== v.slice(1).length) {
        el.answerInput.value = '-' + rest;
        setMessage('マイナスは先頭でのみ入力できます', 900);
      }
    }
  });

  el.answerInput.focus();
}

// wait DOM ready if script loaded deferred
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else init();