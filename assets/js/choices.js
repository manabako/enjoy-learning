// Utility functions
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (arr) => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const DURATION = 60;

// elements
const el = {
  timerBar: null,
  timeRemaining: null,
  question: null,
  choices: null,
  result: null,
  scoreDisplay: null,
  restartBtn: null
};

// state
let remaining = DURATION;
let timerInterval = null;
let score = 0;
let allProblems = [];
let currentProblemData = null;
let gameActive = true;

const startTimer = () => {
  const start = Date.now();
  remaining = DURATION;
  el.timeRemaining.textContent = remaining;
  updateTimerBar(1);
  clearInterval(timerInterval);
  gameActive = true;
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
};

const updateTimerBar = (ratio) => {
  el.timerBar.style.width = `${Math.round(ratio * 100)}%`;
};

const finishGame = () => {
  gameActive = false;
  // Disable choice buttons
  const buttons = el.choices.querySelectorAll('button');
  buttons.forEach(btn => btn.disabled = true);
  
  // Display score and restart button
  el.result.textContent = `時間切れ！ 正解数: ${score}`;
  el.restartBtn.hidden = false;
};

const loadNextProblem = () => {
  if (!gameActive) return;
  
  // Pick random problem
  const idx = randInt(0, allProblems.length - 1);
  const problem = allProblems[idx];
  
  // Pick 2 random options
  const optionsLength = problem.options.length;
  if (optionsLength < 2) {
    el.question.textContent = 'エラー：選択肢が不足しています';
    return;
  }
  
  let indices = [];
  while (indices.length < 2) {
    const i = randInt(0, optionsLength - 1);
    if (!indices.includes(i)) indices.push(i);
  }
  
  const selectedOptions = indices.map(i => problem.options[i]);
  
  // Determine correct answer based on reverse flag
  let correctOption;
  if (problem.question.reverse) {
    // reverse=true: smaller value is correct
    correctOption = selectedOptions[0].value <= selectedOptions[1].value 
      ? selectedOptions[0] 
      : selectedOptions[1];
  } else {
    // reverse=false: larger value is correct
    correctOption = selectedOptions[0].value >= selectedOptions[1].value 
      ? selectedOptions[0] 
      : selectedOptions[1];
  }
  
  currentProblemData = {
    question: problem.question,
    options: selectedOptions,
    correctOption: correctOption
  };
  
  renderProblem();
};

const renderProblem = () => {
  el.question.textContent = currentProblemData.question.question;
  el.result.textContent = '';
  el.choices.innerHTML = '';
  
  const { options } = currentProblemData;
  
  options.forEach((option) => {
    const li = document.createElement('li');
    li.className = 'choice';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice-btn';
    btn.textContent = option.name;
    btn.addEventListener('click', () => onChoiceClick(option));
    li.appendChild(btn);
    el.choices.appendChild(li);
  });
};

const onChoiceClick = (selectedOption) => {
  if (!gameActive) return;
  
  const isCorrect = selectedOption === currentProblemData.correctOption;
  
  if (isCorrect) {
    score++;
    el.scoreDisplay.textContent = score;
    el.result.textContent = '正解！';
    // Disable buttons and move to next problem quickly
    disableButtons();
    setTimeout(() => {
      loadNextProblem();
    }, 300);
  } else {
    el.result.textContent = '不正解...';
    disableButtons();
    // Longer wait for incorrect answer
    setTimeout(() => {
      loadNextProblem();
    }, 900);
  }
};

const disableButtons = () => {
  const buttons = el.choices.querySelectorAll('button');
  buttons.forEach(btn => btn.disabled = true);
};

const init = async () => {
  el.timerBar = document.getElementById('timer-bar');
  el.timeRemaining = document.getElementById('time-remaining');
  el.question = document.getElementById('question');
  el.choices = document.getElementById('choices');
  el.result = document.getElementById('result');
  el.scoreDisplay = document.getElementById('score');
  el.restartBtn = document.getElementById('restart');

  const res = await fetch('../assets/json/choices.json');
  const data = await res.json();
  
  const params = new URLSearchParams(window.location.search);
  const tagsParam = params.get('tags');
  const selectedTags = tagsParam ? tagsParam.split(',') : [];
  
  // Filter problems by selected tags (OR logic: if no tags selected, use all)
  let filtered = data;
  if (selectedTags.length > 0) {
    filtered = data.filter(item =>
      item.tags && item.tags.some(tag => selectedTags.includes(tag))
    );
  }
  
  // Flatten into array of {element, question, options}
  allProblems = [];
  filtered.forEach(element => {
    (element.questions || []).forEach(question => {
      allProblems.push({
        element,
        question,
        options: element.options || []
      });
    });
  });
  
  if (allProblems.length === 0) {
    el.question.textContent = 'エラー：問題が見つかりません';
    return;
  }

  // Restart button handler (hidden during gameplay)
  if (el.restartBtn) {
    el.restartBtn.hidden = true;
    el.restartBtn.addEventListener('click', () => {
      // Reset core state
      score = 0;
      el.scoreDisplay.textContent = score;
      gameActive = true;
      remaining = DURATION;
      // Clear result and choices
      el.result.textContent = '';
      el.choices.innerHTML = '';
      // Hide restart button
      el.restartBtn.hidden = true;
      // Start new game
      startTimer();
      loadNextProblem();
    });
  }

  // Start game
  startTimer();
  loadNextProblem();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
