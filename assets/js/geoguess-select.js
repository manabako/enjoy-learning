// (type="module")

// データのフェッチ (トップレベル await を利用)
const res = await fetch('../assets/json/geoguess-questions.json');
const data = await res.json();

const container = document.getElementById('tags');
const countDisplay = document.getElementById('selected-count');

// 選択されたタグに基づいて表示件数を更新
const updateSelectedCount = () => {
    // アクティブなボタンからタグ名を取得
    const activeTags = Array.from(container.querySelectorAll('.tag.active .mode-title'))
                            .map(el => el.textContent);

    let cnt;
    if (activeTags.length === 0) {
        // 未選択時は全件数
        cnt = data.length;
    } else {
        // OR検索: 選択されたタグのいずれかを含む要素をカウント
        cnt = data.filter(item => 
            item.tags && item.tags.some(t => activeTags.includes(t))
        ).length;
    }

    countDisplay.textContent = "問題数：" + cnt.toLocaleString(); // カンマ区切りで見やすく
};

// タグボタンの生成
const renderTags = () => {
    const set = new Set();
    data.forEach(x => (x.tags || []).forEach(t => set.add(t)));

    container.innerHTML = '';

    Array.from(set).sort().forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'mode-card tag';
        btn.type = 'button';
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML = `<div class="mode-title">${tag}</div>`;

        // クリックイベント
        btn.addEventListener('click', () => {
            const isActive = btn.classList.toggle('active');
            btn.setAttribute('aria-pressed', String(isActive));
            updateSelectedCount();
        });

        // キーボード操作 (アクセシビリティ)
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });

        container.appendChild(btn);
    });
};

// 開始ボタンの処理
const navigateToIndex = () => {
    // 1. 選択されたタグを取得 (前述の Set を使うとさらにスマートです)
    const activeTags = Array.from(container.querySelectorAll('.tag.active .mode-title'))
                            .map(div => div.textContent);
    
    // 2. URLの組み立て
    const url = new URL('index.html', window.location.href);
    
    if (activeTags.length > 0) {
        url.searchParams.set('tags', activeTags.join(','));
    }

    // 3. 遷移実行
    window.location.href = url.href;
};


// 初期化
const init = () => {
  renderTags();
  updateSelectedCount();
  // イベントリスナーを呼び出す
  document.getElementById('start').addEventListener('click', navigateToIndex);
}

// 初期実行
init()