async function loadGenres() {
  const res = await fetch('../assets/json/pair-group.json');
  const data = await res.json();
  const container = document.getElementById('genres');
  container.innerHTML = '';
  // map genre -> count of items
  const genreMap = new Map();
  data.forEach(x => {
    const cnt = Array.isArray(x.group) ? x.group.length : 0;
    genreMap.set(x.genre, cnt);
  });

  function updateSelectedCount(){
    const activeBtn = container.querySelector('.tag[aria-pressed="true"]');
    const cnt = activeBtn ? Number(activeBtn.dataset.count || 0) : 0;
    document.getElementById('selected-count').textContent = String(cnt);
  }

  Array.from(genreMap.keys()).sort().forEach(genre => {
    const btn = document.createElement('button');
    btn.className = 'mode-card tag';
    btn.type = 'button';
    btn.innerHTML = `<div class="mode-title">${genre}</div>`;
    btn.setAttribute('aria-pressed','false');
    btn.dataset.count = String(genreMap.get(genre) || 0);

    btn.addEventListener('click', () => {
      const isActive = btn.getAttribute('aria-pressed') === 'true';
      if (isActive) {
        // deselect
        btn.setAttribute('aria-pressed','false');
        btn.classList.remove('active');
      } else {
        // make this selection exclusive
        const prev = container.querySelector('.tag[aria-pressed="true"]');
        if (prev) { prev.setAttribute('aria-pressed','false'); prev.classList.remove('active'); }
        btn.setAttribute('aria-pressed','true');
        btn.classList.add('active');
      }
      updateSelectedCount();
    });

    btn.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); btn.click(); } });
    container.appendChild(btn);
  });
  updateSelectedCount();
}

document.getElementById('start').addEventListener('click', () => {
  const activeBtn = document.querySelector('.tag.active');
  const params = new URLSearchParams();
  if (activeBtn) params.set('genres', activeBtn.textContent.trim());
  window.location.href = 'index.html?' + params.toString();
});

loadGenres().catch(e => { document.getElementById('genres').textContent = '読み込みに失敗しました。'; console.error(e)});
