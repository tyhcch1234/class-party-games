# 班會好好玩 · Class Party Games

給香港中學班主任的班會／派對遊戲庫。48 個遊戲（含 10 個線上同玩版本），按時間、人數、場地即時篩選，每個遊戲附玩法、物資、帶領貼士與變化版本。

純靜態網站，無框架、無 build step、可離線使用。

## 內容

- **48 個遊戲**，分 7 類：破冰暖身、團隊協作、溝通默契、腦力反應、反思連結、收心收尾、**線上同玩**
- **線上同玩**：10 個為網課／自備裝置課堂重新設計的版本，每張卡列出可直接使用的免費平台（Kahoot、Padlet、Jamboard、Mentimeter、Gartic Phone、分組討論室…）與主持流程
- **篩選**：關鍵字搜尋、時間（≤10 / 10–20 / 20+ 分鐘）、人數、場地（課室／操場／線上）、收藏
- **6 個班會流程範本**：迷你班會 15 分鐘、新學年第一次班會、共創班規、班級修復、減壓放電、線上同步班會 40 分鐘
- **帶活動 6 個心法**：講規則、分組、計時、輸贏、反思、收尾
- **工具箱**：活動計時器（有聲提示）、隨機分組器（貼名單即分組）、班級計分板（可改名、加組）
- 收藏與展開狀態存在 `localStorage`，不會上傳
- 支援列印：按右上角「列印」輸出 A4 遊戲卡（只列印目前篩選結果）

## 使用

直接用瀏覽器打開 `index.html` 即可，或起一個本機伺服器：

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

部署到 GitHub Pages：Settings → Pages → Source 選 `Deploy from a branch` → `main` / `/ (root)`。

## 檔案結構

```
index.html          頁面結構、SVG icon sprite、班會流程與心法
assets/styles.css   全部樣式（含響應式與列印樣式）
assets/games.js     遊戲資料（唯一的內容來源）
assets/app.js       篩選、卡片、隨機抽、計時器、分組器
```

## 新增一個遊戲

只改 `assets/games.js`，在 `GAMES.push(...)` 內加一個物件：

```js
{
  id: 'unique-id',                 // 唯一，會成為 #g-unique-id 深層連結
  title: '遊戲名稱',
  en: 'English Name',              // 可省略
  cat: 'icebreaker',               // icebreaker|teamwork|talk|brain|reflect|wind
  players: [8, 40],                // 最少／最多人數
  duration: 15,                    // 分鐘
  energy: 2,                       // 1 低 / 2 中 / 3 高
  materials: ['紙', '筆'],
  place: '課室',                   // 課室 | 操場 | 線上 | 兩者皆可
  platform: ['Kahoot!'],           // 選填，線上遊戲用；會在詳情顯示「使用平台」
  summary: '一句話說明這個遊戲在做甚麼。',
  steps: ['第一步', '第二步'],
  tips: ['帶領貼士'],
  variants: ['變化玩法'],
  warn: '安全提示（可省略）'
}
```

首頁的遊戲總數會自動更新，篩選分類亦會自動出現（`CATS` 加 key、`app.js` 的 `CAT_ORDER` 同步加一項即可）。

## 設計原則

1. 低物資、低準備、高參與
2. 每個遊戲都要有反思環節，否則只是娛樂
3. 不設物質獎品，避免輸的一組更難受
4. 允許 `pass`，不強迫分享

## 授權

可自由用於課堂教學與校內分享。若要把內容改作商業用途，請先聯絡作者。
