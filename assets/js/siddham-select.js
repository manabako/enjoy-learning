const buttons = Array.from(document.querySelectorAll('.mode-card'));

function selectLevel(level) {
  const mode = String(level) === '3' ? 'iast' : 'tl';
  sessionStorage.setItem('siddhamMode', mode);
  // navigate to game index; include param for convenience
  location.href = `./index.html?mode=${mode}`;
}

buttons.forEach(btn => {
  btn.addEventListener('click', () => selectLevel(btn.dataset.level));
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectLevel(btn.dataset.level);
    }
  });
});

// Allow keyboard navigation focus
buttons.forEach((b, i) => b.tabIndex = 0);