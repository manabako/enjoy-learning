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

    // --- createDropZone を改良：現在ホバーしているゾーンだけ active にする ---
    // --- createDropZone を改良：ホバー判定エリアを上下に拡張（見た目は変わらない） ---
    function createDropZone(index) {
        const zone = document.createElement('div');
        zone.className = 'drop-zone';
        zone.dataset.index = index;

        zone.addEventListener('dragenter', (e) => {
            e.preventDefault();
        });

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        zone.addEventListener('dragleave', () => {
            // dragleave は一時的に無視（グローバル dragover で制御）
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over', 'active');
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

    // --- startDrag の修正: すべてのドロップゾーンを一斉に開かない ---
    function startDrag() {
        isDragging = true;
        draggableEl.style.opacity = '0.5';
        // ドロップゾーンは一斉に active にしない（hover のときだけ開く）
        // document.querySelectorAll('.drop-zone').forEach(el => el.classList.add('active'));
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

        // --- グローバル dragover: すべてのドロップゾーンの判定を毎回更新 ---
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragClientY = e.clientY;
            
            // すべてのドロップゾーンについて判定を更新
            const zones = document.querySelectorAll('.drop-zone');
            let foundActive = false;
            
            zones.forEach(zone => {
                const rect = zone.getBoundingClientRect();
                const expandSize = 40;
                const expandedTop = rect.top - expandSize;
                const expandedBottom = rect.bottom + expandSize;
                const dragY = e.clientY;
                
                if (dragY >= expandedTop && dragY <= expandedBottom && !foundActive) {
                    zone.classList.add('active', 'drag-over');
                    foundActive = true;
                } else {
                    zone.classList.remove('active', 'drag-over');
                }
            });
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

        // --- touchmove の修正: 指の下のゾーンだけ active にする ---
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches[0];

            dragClientY = touch.clientY;
            moveTouchOverlay(touch.clientX, touch.clientY);

            // すべてのドロップゾーンについて判定を更新（マウスと同じロジック）
            const zones = document.querySelectorAll('.drop-zone');
            let foundActive = false;

            zones.forEach(zone => {
                const rect = zone.getBoundingClientRect();
                const expandSize = 40;
                const expandedTop = rect.top - expandSize;
                const expandedBottom = rect.bottom + expandSize;
                const dragY = touch.clientY;

                if (dragY >= expandedTop && dragY <= expandedBottom && !foundActive) {
                    zone.classList.add('active', 'drag-over');
                    foundActive = true;
                } else {
                    zone.classList.remove('active', 'drag-over');
                }
            });
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
            const contentFiles = Object.freeze({
                timeline: 'timeline',
                events: 'events',
                eventsag: 'eventsag',
                presidents: 'presidents',
                measurement: 'measurement',
                chokusenwakashu: 'chokusenwakashu'
            });
            const param = getJsonFileName();
            const jsonFile = contentFiles[param]; // URLパラメータから取得
            if (!jsonFile) throw new Error('invalid json file');
            const resp = await fetch(`../assets/json/${jsonFile}.json`);
            if (!resp.ok) throw new Error('fetch failed: ' + resp.status);
            eventData = await resp.json();
        } catch (err) {
            console.warn('Json fetch failed, trying window.EVENTS fallback.', err);
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