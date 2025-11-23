// Game logic: 問題生成 (PythonのイメージをJSで実装)、UI制御、タイマー
// ...existing code...
(() => {
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

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // Problem generators (簡易版, Pythonのロジックを参考に)
  function cal_log() {
    const base = randInt(2, 5);
    const flag = randInt(0,4);
    if (flag === 0) {
      const y = randInt(0,5);
      const x = Math.pow(base, y);
      return { solution: y, formula: `\\log_{${base}} ${x}` };
    } else if (flag === 1) {
      const y = randInt(1,5);
      const x = Math.pow(base, y);
      return { solution: -y, formula: `\\log_{${base}} \\frac{1}{${x}}` };
    } else if (flag === 2) {
      const y = randInt(0,3);
      const x = Math.pow(base, y);
      const z = randInt(2,10);
      return { solution: Math.pow(z, y), formula: `${x}^{\\log_{${base}} ${z}}` };
    } else if (flag === 3) {
      const y = randInt(0,5);
      const x = Math.pow(base, y);
      const dummy = randInt(1,9);
      return { solution: y, formula: `\\log_{${base}} ${dummy}\\log_{${dummy}} ${x}` };
    } else {
      const y = randInt(1,5);
      const x = Math.pow(base, y);
      const dummyList = [2,3,5].filter(v => v !== base);
      const dummy = dummyList[Math.floor(Math.random()*dummyList.length)];
      return { solution: y, formula: `\\log_{${base}} ${dummy*x} - \\log_{${base}} ${dummy}` };
    }
  }

  function cal_integral() {
    const n = randInt(1,3);
    const toA = n * randInt(1,2);
    const solution = Math.pow(toA, n) / n;
    let formula;
    if (n === 1) formula = `\\int_0^{${toA}} dx`;
    else if (n === 2) formula = `\\int_0^{${toA}} x\\,dx`;
    else formula = `\\int_0^{${toA}} x^{${n-1}}\\,dx`;
    return { solution: Math.round(solution), formula };
  }

  function cal_differential() {
    const flag = randInt(0,1);
    if (flag === 0) {
      const n = randInt(1,3);
      const a = randInt(1,4);
      const solution = n * Math.pow(a, n-1);
      const formula = `\\left. \\frac{d}{dx} x^{${n}} \\right|_{x=${a}}`;
      return { solution, formula };
    } else {
      const keys = ["0","\\pi","\\frac{\\pi}{2}"];
      const key = randInt(0,2);
      const theta = keys[key];
      const pick = randInt(0,1);
      if (pick === 0) {
        const cosVals = [1,-1,0];
        return { solution: cosVals[key], formula: `\\left. \\frac{d}{dx}\\sin x \\right|_{x=${theta}}` };
      } else {
        const sinVals = [0,0,1];
        return { solution: -sinVals[key], formula: `\\left. \\frac{d}{dx}\\cos x \\right|_{x=${theta}}` };
      }
    }
  }

  function cal_trigonometric() {
    const thetaMap = ["0","\\pi","\\frac{\\pi}{2}","\\frac{\\pi}{3}","\\frac{\\pi}{4}"];
    const flag = randInt(0,3);
    if (flag === 0) {
      const key = randInt(0,4); return { solution: 1, formula: `\\sin^{2} ${thetaMap[key]} + \\cos^{2} ${thetaMap[key]}` };
    } else if (flag === 1) {
      const key = randInt(0,2); const sinVals = [0,0,1]; return { solution: sinVals[key], formula: `\\sin ${thetaMap[key]}` };
    } else if (flag === 2) {
      const key = randInt(0,2); const cosVals = [1,-1,0]; return { solution: cosVals[key], formula: `\\cos ${thetaMap[key]}` };
    } else {
      const choices = [0,0,1]; const key = [0,1,4][Math.floor(Math.random()*3)]; const tanVals = {0:0,1:0,4:1}; return { solution: tanVals[key], formula: `\\tan ${thetaMap[key]}` };
    }
  }

  function cal_combination() {
    const flag = randInt(0,3);
    if (flag === 0) {
      const n = randInt(0,5); let sol = 1; for (let i=2;i<=n;i++) sol *= i; return { solution: sol, formula: `${n}!` };
    } else if (flag === 1) {
      const n = randInt(1,5); const k = randInt(0,n); // permutations nPk
      let perm = 1;
      for (let i=0;i<k;i++) perm *= (n - i);
      return { solution: perm, formula: `{{}}_{${n}} \\mathrm{ P }_{${k}}` };
    } else if (flag === 2) {
      const n = randInt(1,8); const k = randInt(1,n);
      // nCk
      let num=1, den=1;
      for (let i=0;i<k;i++){ num*= (n - i); den *= (i+1); }
      return { solution: Math.round(num/den), formula: `{{}}_{${n}} \\mathrm{ C }_{${k}}` };
    } else {
      const n = randInt(1,4); const k = randInt(1,4);
      // multiset: C(n+k-1, k)
      const nn = n + k - 1; const kk = k;
      let num=1, den=1;
      for (let i=0;i<kk;i++){ num*= (nn - i); den *= (i+1); }
      return { solution: Math.round(num/den), formula: `{{}}_{${n}} \\mathrm{ H }_{${k}}` };
    }
  }

  function cal_sequence() {
    const flag = randInt(0,1);
    if (flag === 0) {
      const a = randInt(2,10); const r = randInt(2,3); const n = randInt(2,4);
      const solution = Math.round(a*(Math.pow(r,n)-1)/(r-1));
      return { solution, formula: `\\displaystyle ${a}\\sum_{k=0}^{${n-1}} ${r}^{k}` };
    } else {
      const a = randInt(1,10); const d = randInt(2,3); const n = randInt(2,4);
      const solution = Math.round((n + 1)*(2*a + n*d)/2);
      return { solution, formula: `\\displaystyle \\sum_{k=0}^{${n}} (${d}n + ${a})` };
    }
  }

  function cal_floor_ceil() {
    const tuples = [[Math.E, 'e'], [Math.PI, '\\pi'], [Math.SQRT2, '\\sqrt{2}']];
    const idx = randInt(0,2);
    let [x,xs] = tuples[idx];
    if (Math.random() < 0.5) { x = -x; xs = '-' + xs; }
    const flag = randInt(0,2);
    if (flag === 0) return { solution: Math.ceil(x), formula: `\\lceil ${xs} \\rceil` };
    else if (flag === 1) return { solution: Math.floor(x), formula: `\\lfloor ${xs} \\rfloor` };
    else return { solution: Math.floor(x), formula: `[ ${xs} ]` };
  }

  function cal_det() {
    const flag = randInt(0,1);
    if (flag === 0) {
      const a11 = randInt(0,8), a12 = randInt(0,8), a21 = randInt(0,8), a22 = randInt(0,8);
      const det = a11*a22 - a12*a21;
      return { solution: det, formula: `\\begin{vmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{vmatrix}` };
    } else {
      // 3x3 small int matrix
      const a = Array.from({length:3}, () => Array.from({length:3}, ()=> randInt(1,3)));
      // zero out some entries occasionally
      for (let k=0;k<randInt(0,1);k++){
        const i=randInt(0,2), j=randInt(0,2); a[i][j] = 0;
      }
      // compute determinant via rule of Sarrus / general
      const det = Math.round(
        a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])
        - a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])
        + a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0])
      );
      const matrixTex = '\\begin{vmatrix}' + a.map(row => row.join('&')).join('\\\\') + '\\end{vmatrix}';
      return { solution: det, formula: matrixTex };
    }
  }

  const generators = [cal_log, cal_integral, cal_differential, cal_trigonometric, cal_combination, cal_sequence, cal_floor_ceil, cal_det];

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

})();