# AI Web 開發入門

給零基礎同仁的網頁教學網站：先學網頁基礎（HTML、CSS、JavaScript、跟 AI 協作、除錯、發布），再用 4 個小範例實戰。

純靜態 HTML／CSS／原生 JavaScript，沒有框架、不需要建置。只支援電腦版瀏覽器。

## 怎麼看

- 直接雙擊 `index.html` 就能開（file:// 也能正常運作）。
- 或在專案目錄執行 `python3 -m http.server 8000`，開 http://localhost:8000/ 。
- 線上版部署在 GitHub Pages（從 `main` 分支根目錄發布）。

## 結構

```
index.html              首頁：學習路線圖＋閱讀進度
basics/                 網頁基礎文章（01–08）
projects/               實戰範例文章（01–04）
examples/               範例成品，可直接打開
assets/css/site.css     全站樣式（含深色模式）
assets/js/nav-data.js   文章清單：側欄、上下篇、首頁路線都從這裡產生
assets/js/site.js       側欄、目錄、複製按鈕、試試看、已讀標記
```

## 新增一篇文章

1. 複製 `basics/01-what-is-web.html` 當樣板，改 `<title>`、`<body data-page="...">` 與內文。
2. 在 `assets/js/nav-data.js` 找到對應項目，把 `ready` 改成 `true`。

文章可用的元件（提示框、程式碼、試試看、流程圖、比喻卡、對照、提示詞）直接看第 1 章的原始碼照著寫即可。
