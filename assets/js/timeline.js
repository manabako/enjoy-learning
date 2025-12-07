(() => {
    // --- データ
    let eventData = [];
    // --- 状態管理 ---
    let placedCards = [];
    let remainingCards = [];
    let currentCard = null;
    const timelineEl = document.getElementById('timeline');
    const draggableEl = document.getElementById('draggable');
    const challengerArea = document.querySelector('.challenger-area');

    // --- オートスクロール用変数 ---
    let isDragging = false;
    let dragClientY = 0;
    let autoScrollFrame = null;
    const SCROLL_SPEED = 10;
    const SCROLL_ZONE_SIZE = 100;

    // --- タッチイベント用の初期化
    let touchOverlay = null;

    function initGame() {
        let tempDeck = [...eventData].sort(() => Math.random() - 0.5);
        placedCards = [tempDeck.pop()];
        remainingCards = tempDeck;
        renderTimeline();
        setupNextTurn();
    }

    function setupNextTurn() {
        if (remainingCards.length === 0) {
            gameClear();
            return;
        }
        currentCard = remainingCards.pop();
        draggableEl.textContent = currentCard.event;
        draggableEl.classList.remove('shake');
    }

    function renderTimeline() {
        timelineEl.innerHTML = '';
        placedCards.forEach((card, index) => {
            createDropZone(index);
            const cardEl = document.createElement('div');
            cardEl.className = 'timeline-card';
            if (card.isNew) {
                cardEl.classList.add('placed-animation');
                card.isNew = false;
            }
            cardEl.innerHTML = `<div class="year">${card.year}</div><div class="content">${card.event}</div>`;
            timelineEl.appendChild(cardEl);
        });
        createDropZone(placedCards.length);
    }

    function createDropZone(index) {
        const zone = document.createElement('div');
        zone.className = 'drop-zone';
        zone.dataset.index = index;

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            handleAttempt(parseInt(zone.dataset.index));
        });

        timelineEl.appendChild(zone);
    }

    function handleAttempt(insertIndex) {
        const prevCard = insertIndex > 0 ? placedCards[insertIndex - 1] : null;
        const nextCard = insertIndex < placedCards.length ? placedCards[insertIndex] : null;
        const currentYear = currentCard.year;

        let isCorrect = true;
        if (prevCard && currentYear < prevCard.year) isCorrect = false;
        if (nextCard && currentYear > nextCard.year) isCorrect = false;

        if (isCorrect) success(insertIndex);
        else fail();
    }

    function success(index) {
        currentCard.isNew = true;
        placedCards.splice(index, 0, currentCard);
        renderTimeline();
        setupNextTurn();
    }

    function fail() {
        if (navigator.vibrate) navigator.vibrate(200);
        draggableEl.classList.remove('shake');
        void draggableEl.offsetWidth;
        draggableEl.classList.add('shake');
    }

    function gameClear() {
        challengerArea.innerHTML = `
            <div class="game-over">
                <h2>🎉 Complete!</h2>
                <button class="btn-restart" onclick="location.reload()">もう一度遊ぶ</button>
            </div>
        `;
        challengerArea.classList.remove('dimmed');
    }


    // --- オートスクロール & ドラッグ制御ロジック ---

    function updateScroll() {
        if (!isDragging) return;

        const viewportHeight = window.innerHeight;
        const scrollY = window.scrollY;

        if (dragClientY > viewportHeight - SCROLL_ZONE_SIZE) {
            window.scrollTo(0, scrollY + SCROLL_SPEED);
        }
        else if (dragClientY < SCROLL_ZONE_SIZE) {
            window.scrollTo(0, scrollY - SCROLL_SPEED);
        }

        autoScrollFrame = requestAnimationFrame(updateScroll);
    }

    function startDrag() {
        isDragging = true;
        draggableEl.style.opacity = '0.5';
        document.querySelectorAll('.drop-zone').forEach(el => el.classList.add('active'));
        challengerArea.classList.add('dimmed');

        if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
        autoScrollFrame = requestAnimationFrame(updateScroll);
    }

    function endDrag() {
        isDragging = false;
        draggableEl.style.opacity = '1';
        document.querySelectorAll('.drop-zone').forEach(el => {
            el.classList.remove('active');
            el.classList.remove('drag-over');
        });
        challengerArea.classList.remove('dimmed');

        if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
    }

    function moveTouchOverlay(x, y) {
        if(touchOverlay) {
            touchOverlay.style.left = (x - touchOverlay.offsetWidth / 2) + 'px';
            touchOverlay.style.top = (y - touchOverlay.offsetHeight / 2) + 'px';
        }
    }

    // URLパラメータからJSONファイル名を取得する関数
    function getJsonFileName() {
        const params = new URLSearchParams(window.location.search);
        return params.get("data") || "words"; // デフォルトをgreek.jsonに
    }


    document.addEventListener('DOMContentLoaded', async () => {
        // --- PC Mouse Events ---
        draggableEl.addEventListener('dragstart', (e) => {
            // 修正：Firefox対応。データをセットしないとドラッグが開始されない場合がある
            e.dataTransfer.setData('text/plain', '');
            e.dataTransfer.effectAllowed = 'move';

            startDrag();
        });

        draggableEl.addEventListener('dragend', endDrag);

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragClientY = e.clientY;
        });


        // --- Touch Device Events ---
        draggableEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];

            touchOverlay = draggableEl.cloneNode(true);
            touchOverlay.style.position = 'fixed';
            touchOverlay.style.width = draggableEl.offsetWidth + 'px';
            touchOverlay.style.zIndex = '1000';
            touchOverlay.style.pointerEvents = 'none'; // オーバーレイはクリックを透過させる
            touchOverlay.style.opacity = '0.9';
            touchOverlay.style.transform = 'scale(1.05)';
            document.body.appendChild(touchOverlay);

            moveTouchOverlay(touch.clientX, touch.clientY);

            // 初期位置セット
            dragClientY = touch.clientY;

            startDrag();

        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches[0];

            dragClientY = touch.clientY;
            moveTouchOverlay(touch.clientX, touch.clientY);

            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            document.querySelectorAll('.drop-zone').forEach(el => el.classList.remove('drag-over'));

            if (elementBelow && elementBelow.classList.contains('drop-zone')) {
                elementBelow.classList.add('drag-over');
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (!isDragging) return;

            const touch = e.changedTouches[0];
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);

            if (touchOverlay) {
                touchOverlay.remove();
                touchOverlay = null;
            }

            endDrag();

            if (elementBelow && elementBelow.classList.contains('drop-zone')) {
                handleAttempt(parseInt(elementBelow.dataset.index));
            }
        });
        
        // data load (fetch, fallback to window.EVENTS)
        try {
            const jsonFile = getJsonFileName(); // URLパラメータから取得
            const resp = await fetch(`../assets/json/${jsonFile}.json`);
            if (!resp.ok) throw new Error('fetch failed: ' + resp.status);
            eventData = await resp.json();
        } catch (err) {
            console.warn('events.json fetch failed, trying window.EVENTS fallback.', err);
            if (window && Array.isArray(window.EVENTS) && window.EVENTS.length) {
                eventData = window.EVENTS;
        } else {
            console.error('No events data available (fetch failed and window.EVENTS not present).', err);
            resultEl.textContent = 'データの読み込みに失敗しました。';
            return;
        }
        }

        // ゲーム開始
        initGame();
    });
})();