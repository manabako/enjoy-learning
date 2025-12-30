async function loadTags() {
const res = await fetch('../assets/json/geoguess-questions.json');
const data = await res.json();
const set = new Set();
data.forEach(x => (x.tags||[]).forEach(t => set.add(t)));
const container = document.getElementById('tags');
container.innerHTML = '';
function updateSelectedCount(){
    const cnt = container.querySelectorAll('.tag[aria-pressed="true"]').length;
    document.getElementById('selected-count').textContent = String(cnt);
}
Array.from(set).sort().forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'mode-card tag';
    btn.type = 'button';
    btn.innerHTML = `<div class="mode-title">${tag}</div>`;
    btn.setAttribute('aria-pressed','false');
    btn.addEventListener('click', () => {
      const is = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!is));
      btn.classList.toggle('active', !is);
      updateSelectedCount();
    });
    btn.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); btn.click(); } });
    container.appendChild(btn);
});
updateSelectedCount();
}
document.getElementById('start').addEventListener('click', () => {
const active = Array.from(document.querySelectorAll('.tag.active')).map(b => b.textContent);
const params = new URLSearchParams();
if (active.length) params.set('tags', active.join(','));
window.location.href = 'index.html?' + params.toString();
});
loadTags().catch(e => { document.getElementById('tags').textContent = '読み込みに失敗しました。'; console.error(e)});