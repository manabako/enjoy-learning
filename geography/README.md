# 地理推測ゲーム（Geo-guess）

このディレクトリには地理を推測するシンプルなゲームが入っています。

使い方:
- 地図をクリックして回答ピンを立て、`回答` ボタンを押すと判定されます。
- `次へ` ボタンで次の問題に進みます。
- 点問題（例: 自由の女神）は点からの距離で採点されます。
- 面問題（例: アメリカ）は領域内なら距離0、外側なら領域までの距離で採点されます。

主要ファイル:
- `index.html` — ゲームページ
- `../assets/js/geoguess.js` — ゲームのロジック（Leaflet と Turf.js を使用）
- `../assets/css/geoguess.css` — ゲーム固有のスタイル
- `../assets/json/geoguess-questions.json` — サンプル問題（GeoJSON 構造）

依存ライブラリ（CDN 経由）:
- Leaflet (地図表示)
- Turf.js (地理計算)

注意:
- タイルは現在 OpenStreetMap の公式タイルを使っています。小規模な利用（GitHub Pages など）想定しています。
- GeoJSON データは簡略化しています。