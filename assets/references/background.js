const list = document.getElementById("list");
const answerBtn = document.getElementById("answerBtn");
const nextBtn = document.getElementById("nextBtn");
const resultDiv = document.querySelector(".result");
const notesBtn = document.getElementById("notesBtn")
const closeBtn = document.getElementById("closeBtn")
let allProblems = []; // JSONから読み込む全問題データ
let randomSet = [];

// シャッフル関数 (Fisher-Yates)
function shuffle(array) {
    // for (let i = array.length - 1; i > 0; i--) {
    //     const j = Math.floor(Math.random() * (i + 1));
    //     [array[i], array[j]] = [array[j], array[i]];
    // }
    const randomIndex = Math.floor(Math.random()*4)
    return array[randomIndex];
}

function pickRandom(array, count = 4) {
    const result = [];
    const used = new Set();
    while (result.length < count) {
        const idx = Math.floor(Math.random() * array.length);
        if (!used.has(idx)) {
            used.add(idx);
            result.push(array[idx]);
        }
    }
    return result;
}

// ランダムに4問を抽出して表示
function loadProblem() {
    list.innerHTML = "";
    randomSet = pickRandom(allProblems, 4);
    randomSet.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="updown-marker"><i class="fa-solid fa-arrows-up-down"></i></span>
            <span class="year">${item.year}</span>
            <span class="event">${item.event}</span>
        `;
        list.appendChild(li);
    });
    // 年を非表示に戻す
    document.querySelectorAll(".year").forEach(y => y.style.display = "none");
    resultDiv.textContent = "";
    // ポップアップに解説をセット
    randomSet.sort((a, b) => a.year - b.year);
    setNotes()
}

// ポップアップに解説をセット
function setNotes() {
    const container = document.getElementById("popupContainer");
    container.innerHTML = ""; // 子要素を一度すべて削除
    randomSet.forEach(item => {
        const div = document.createElement("div");
        let notes = item.notes
        if (notes === null) {
            notes = "解説なし";
        }
        div.innerHTML = `
            <div class="popup-content">
            <h3>${-item.year} BC: ${item.event}</h3>
            <p>${notes}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// 並べ替え可能にする
new Sortable(list, {
    animation: 500, // ← 移動アニメーション (ms)
});

// 回答ボタン
answerBtn.addEventListener("click", () => {
    const years = [...document.querySelectorAll("#list .year")];
    const upDowns = [...document.querySelectorAll("#list .updown-marker")];
    const values = years.map(y => parseInt(y.textContent, 10));
    const sorted = [...values].sort((a, b) => a - b);
    console.log(sorted)
    const isCorrect = values.every((v, i) => v === sorted[i]);

    if (isCorrect) {
        resultDiv.textContent = "✅ 正解！";
        resultDiv.style.color = "green";
    } else {
        resultDiv.textContent = "❌ 不正解！";
        resultDiv.style.color = "red";
    }

    upDowns.forEach(y => y.style.display = "none");
    // 年号の表示調整
    years.forEach(y => {
        y.style.display = "inline-block";
        let text = y.textContent.trim();
        text = text.replace('-', '');      // 語末の "-" のみ削除
        y.textContent = `${text} BC`;   // " BCE" を追加
    });

    answerBtn.style.display = "none";
    nextBtn.style.display = "inline-block";
    notesBtn.style.display = "inline-block";
});

// 次へボタン
nextBtn.addEventListener("click", () => {
    loadProblem();
    nextBtn.style.display = "none";
    answerBtn.style.display = "inline-block";
    notesBtn.style.display = "none";
});

// ポップアップ
notesBtn.addEventListener("click", () => {
    document.getElementById("popupOverlay").style.display = "flex";
});

closeBtn.addEventListener("click", () => {
    document.getElementById("popupOverlay").style.display = "none";
})


// 最初の読み込み
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // JSONデータを取得
        const response = await fetch(`../../assets/json/events.json`);
        allProblems = await response.json();
        loadProblem();
    } catch (error) {
        console.error("JSON読み込みエラー:", error);
    }
});