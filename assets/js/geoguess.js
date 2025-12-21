const questionsUrl = '../assets/json/geoguess-questions.json';

let map, answerMarker, answerLayer, solutionLayer, lineLayer;
let questions = [];
let interactionLocked = false;
let current = 0;
let totalScore = 0;
const TOTAL_COUNT = 5;
const MAX_SCORE = 1000;
// length scale for exponential decay (km)
const DECAY_KM = 1000;

function init() {
  setupElements();
  initMap();
  loadQuestions();
}

function setupElements() {
  document.getElementById('submit-answer').addEventListener('click', submitAnswer);
  document.getElementById('next-question').addEventListener('click', nextQuestion);
  document.getElementById('restart').addEventListener('click', restartQuestion);
}

function initMap() {
  map = L.map('map', {worldCopyJump:true}).setView([20, 0], 2);
  // Use Carto light tiles without labels to avoid text hints on the map
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  // click to place answer
  map.on('click', (e) => {
    placeAnswer(e.latlng);
  });
}

function loadQuestions() {
  fetch(questionsUrl).then(r => r.json()).then(data => {
    questions = [...data].sort(() => Math.random() - 0.5).slice(0, TOTAL_COUNT);
    showQuestion(current);
  }).catch(err => {
    console.error(err);
    document.getElementById('message').textContent = '問題データの読み込みに失敗しました。';
  });
}

function showQuestion(index) {
  clearLayers();
  const q = questions[index];
  document.getElementById('problem-number').textContent = (index + 1) + ' / ' + questions.length;
  document.getElementById('question-label').textContent = q.label;
  document.getElementById('message').textContent = '';

  // Start each question with a unified world view to avoid giving hints from initial centering
  map.setView([20, 0], 2);

  const submitBtn = document.getElementById('submit-answer');
  const nextBtn = document.getElementById('next-question');
  // show submit button (disabled until player places a pin) and hide "next" until after an answer
  submitBtn.style.display = '';
  submitBtn.disabled = true;
  nextBtn.style.display = 'none';
}

function placeAnswer(latlng) {
  // Do nothing if interactions are locked after submitting an answer
  if (interactionLocked) return;
  const submitBtn = document.getElementById('submit-answer');

  if (answerMarker) {
    answerMarker.setLatLng(latlng);
  } else {
    answerMarker = L.marker(latlng, {draggable:true}).addTo(map);
    answerMarker.on('dragend', (e) => {
      submitBtn.disabled = false;
    });
  }
  submitBtn.disabled = false;
}

function submitAnswer() {
  const q = questions[current];
  if (!answerMarker) return;

  const submitBtn = document.getElementById('submit-answer');
  const nextBtn = document.getElementById('next-question');
  const restartBtn = document.getElementById('restart');
  submitBtn.style.display = 'none';
  // lock interactions (disable placing/moving pins) until the next question
  interactionLocked = true;
  if (answerMarker && answerMarker.dragging) answerMarker.dragging.disable();

  const ansLatLng = answerMarker.getLatLng();
  const ansPoint = turf.point([ansLatLng.lng, ansLatLng.lat]);

  if (q.type === 'point') {
    const sol = q.feature; // Point
    const solPoint = turf.point(sol.coordinates);
    const d = turf.distance(solPoint, ansPoint, {units:'kilometers'});
    const gained = scoreFromDistance(d);
    totalScore += gained;

    showResultPoint(solPoint, ansPoint, d, gained);
  } else if (q.type === 'polygon') {
    const poly = q.feature;
    const inside = turf.booleanPointInPolygon(ansPoint, poly);
    let d = 0;
    if (inside) {
      d = 0;
    } else {
      // convert polygon to line and compute distance
      const polyLine = turf.polygonToLine(poly);
      // turf.pointToLineDistance returns measure in kilometers
      d = turf.pointToLineDistance(ansPoint, polyLine, {units:'kilometers'});
    }
    const gained = scoreFromDistance(d, inside);
    totalScore += gained;

    showResultPolygon(poly, ansPoint, d, gained, inside);
  }

  document.getElementById('score').textContent = totalScore;
  // show next button (ensure it's visible by setting block to override CSS rule)
  if (current + 1 === TOTAL_COUNT) {
    restartBtn.style.display = 'block'; 
    restartBtn.disabled = false; 
  } else if (nextBtn) { 
    nextBtn.style.display = 'block'; 
    nextBtn.disabled = false; 
  }
}

function scoreFromDistance(distance_km, inside=false) {
  if (inside) return MAX_SCORE;
  const s = Math.round(Math.max(0, MAX_SCORE * Math.exp(-distance_km / DECAY_KM)));
  return s;
}

function showResultPoint(solPoint, ansPoint, distance_km, gained) {
  clearResultLayers();
  // show solution marker
  const [solLon, solLat] = solPoint.geometry.coordinates;
  solutionLayer = L.marker([solLat, solLon], {icon: greenIcon()}).addTo(map);

  // line
  const ansLatLng = [ansPoint.geometry.coordinates[1], ansPoint.geometry.coordinates[0]];
  const solLatLng = [solLat, solLon];
  lineLayer = L.polyline(
    [ansLatLng, solLatLng], 
    {color:'#2563eb', weight:4, dashArray: '1 6'}
  ).addTo(map);

  const msg = `距離: ${distance_km.toFixed(2)} km — 獲得: ${gained} 点`;
  document.getElementById('message').textContent = msg;
  if (current + 1 === TOTAL_COUNT) {
    const msgTotalScore = `合計得点: ${totalScore} 点`;
    document.getElementById('total-score-msg').textContent = msgTotalScore;
  }
}

function showResultPolygon(poly, ansPoint, distance_km, gained, inside) {
  clearResultLayers();
  // show polygon
  solutionLayer = L.geoJSON(poly, {
    style: {color: '#2563eb', weight:2, fillOpacity: 0.08, dashArray: '1 6'}
  }).addTo(map);

  // if outside, show nearest point on poly boundary and draw line
  const ansLatLng = [ansPoint.geometry.coordinates[1], ansPoint.geometry.coordinates[0]];
  if (inside) {
    // 点数表示
    const msg = `領域内 — 満点: ${gained} 点`;
    document.getElementById('message').textContent = msg;
  } else {
    // compute nearest point on polygon boundary
    const polyLine = turf.polygonToLine(poly);
    const snapped = turf.nearestPointOnLine(polyLine, ansPoint, {units:'kilometers'});
    const snappedLatLng = [snapped.geometry.coordinates[1], snapped.geometry.coordinates[0]];
    lineLayer = L.polyline(
      [ansLatLng, snappedLatLng], 
      {color:'#2563eb', weight:4, dashArray: '1 6'}
    ).addTo(map);
    // 点数表示
    const msg = `境界までの距離: ${distance_km.toFixed(2)} km — 獲得: ${gained} 点`;
    document.getElementById('message').textContent = msg;
  }
  if (current + 1 === TOTAL_COUNT) {
    const msgTotalScore = `合計得点: ${totalScore} 点`;
    document.getElementById('total-score-msg').textContent = msgTotalScore;
  }
}

function nextQuestion() {
  current = (current + 1) % questions.length;
  // remove answer marker and result layers
  clearLayers();
  interactionLocked = false;
  showQuestion(current);
}

function clearLayers() {
  clearResultLayers();
  if (answerMarker) {
    map.removeLayer(answerMarker);
    answerMarker = null;
  }
}

function clearResultLayers() {
  if (solutionLayer) {
    map.removeLayer(solutionLayer);
    solutionLayer = null;
  }
  if (lineLayer) {
    map.removeLayer(lineLayer);
    lineLayer = null;
  }
}

function restartQuestion() {
  const restartBtn = document.getElementById('restart');
  restartBtn.style.display = 'none';
  current = 0;
  totalScore = 0;
  document.getElementById('score').textContent = totalScore;
  document.getElementById('total-score-msg').textContent = '';
  clearLayers();
  interactionLocked = false;
  loadQuestions();
}

function greenIcon() {
  return L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconSize: [25,41],
    iconAnchor: [12,41],
    popupAnchor: [1,-34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    shadowSize: [41,41]
  });
}

// boot
document.addEventListener('DOMContentLoaded', init);