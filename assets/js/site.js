/*
 * AI Web 開發入門｜全站互動程式
 * 原生 JavaScript，無函式庫，一般 <script> 載入（不是 ES module）。
 * 依賴：window.SITE_NAV（nav-data.js 須先載入）、<body> 的 data-page / data-root。
 * 不使用 fetch，所以可以直接用 file:// 雙擊開啟。
 */
(function () {
  'use strict';

  /* ---------- 小工具 ---------- */

  // 用 CSS 選擇器找第一個符合的元素，找不到回傳 null
  function $(sel) {
    return document.querySelector(sel);
  }

  // 建立元素：tag 是標籤名，cls 是 class（可省略），text 是文字（可省略）
  function make(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  // 讀取 localStorage；不能用（隱私模式、被封鎖）時回傳預設值，不拋錯
  function storageGet(key, fallback) {
    try {
      var v = window.localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  // 寫入 localStorage；不能用時靜默略過，網站照常運作
  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // 存不進去就算了
    }
  }

  // 取得已讀文章的 id 陣列（存在 localStorage 的 read 鍵）
  function getReadList() {
    try {
      var list = JSON.parse(storageGet('read', '[]'));
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  // 儲存已讀文章的 id 陣列
  function setReadList(list) {
    storageSet('read', JSON.stringify(list));
  }

  // 包住單一功能：出錯就跳過，不影響其他功能，也不在 console 留下訊息
  function run(fn) {
    try {
      fn();
    } catch (e) {
      // 這個功能壞了就略過
    }
  }

  // 數字補成兩位數：1 → "01"
  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  // 全域狀態：目前頁面資訊與站點資料（在 init 裡設定）
  var ctx = { page: '', root: '', nav: [], items: [] };

  // 側欄連結的對照表：文章 id → 側欄的 <a>，已讀勾選時用來即時更新樣式
  var navLinks = {};

  // 把 SITE_NAV 攤平成一維陣列（所有文章項目，跨 section）
  function flattenItems(nav) {
    var out = [];
    nav.forEach(function (sec) {
      ((sec && sec.items) || []).forEach(function (item) {
        if (item && item.id) out.push(item);
      });
    });
    return out;
  }

  /* ---------- 深淺色主題 ---------- */

  // 判斷目前實際是否為深色：有手動設定就用手動的，否則跟隨系統
  function isDark() {
    var t = document.documentElement.dataset.theme;
    if (t) return t === 'dark';
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  }

  // 設定深淺色並存進 localStorage
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    storageSet('theme', t);
  }

  // 依目前實際主題更新切換鈕的圖示：深色顯示 🌙，淺色顯示 ☀️
  function paintThemeButton(btn) {
    btn.textContent = isDark() ? '🌙' : '☀️';
  }

  /* ---------- 1. 側欄 ---------- */

  // 更新側欄某一篇的已讀樣式（已讀標記勾選時呼叫）
  function setSidebarRead(id, on) {
    var link = navLinks[id];
    if (link) link.classList.toggle('is-read', on);
  }

  // 建立側欄：品牌列（含深淺色切換鈕）＋每個 section 的文章清單
  function buildSidebar() {
    var side = $('#sidebar');
    if (!side) return;
    side.textContent = '';

    // 品牌列
    var brand = make('div', 'brand');
    var brandLink = make('a', 'brand-link', 'AI Web 開發入門');
    brandLink.href = ctx.root + 'index.html';
    var themeBtn = make('button', 'theme-toggle');
    themeBtn.type = 'button';
    themeBtn.setAttribute('aria-label', '切換深淺色');
    paintThemeButton(themeBtn);
    themeBtn.addEventListener('click', function () {
      setTheme(isDark() ? 'light' : 'dark');
      paintThemeButton(themeBtn);
    });
    // 沒有手動設定時，系統切換深淺色也要同步更新圖示
    run(function () {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        paintThemeButton(themeBtn);
      });
    });
    brand.appendChild(brandLink);
    brand.appendChild(themeBtn);
    side.appendChild(brand);

    // 文章清單
    var readList = getReadList();
    ctx.nav.forEach(function (sec) {
      var section = make('div', 'nav-section');
      section.appendChild(make('h2', 'nav-section-title', sec.section || ''));
      var ul = make('ul', 'nav-list');

      ((sec.items || [])).forEach(function (item) {
        if (!item || !item.id) return;
        var li = make('li', 'nav-item');
        var el;
        if (item.ready) {
          // 可以點的項目
          el = make('a', 'nav-link');
          el.href = ctx.root + item.id + '.html';
          el.appendChild(document.createTextNode(item.title || ''));
          if (item.minutes) el.appendChild(make('span', 'nav-minutes', item.minutes + ' 分'));
          if (item.id === ctx.page) {
            el.classList.add('is-current');
            el.setAttribute('aria-current', 'page');
          }
          if (readList.indexOf(item.id) !== -1) el.classList.add('is-read');
          navLinks[item.id] = el;
        } else {
          // 還在撰寫中的項目：灰色、不可點
          el = make('span', 'nav-link is-disabled');
          el.appendChild(document.createTextNode(item.title || ''));
          el.appendChild(make('span', 'nav-badge', '撰寫中'));
        }
        li.appendChild(el);
        ul.appendChild(li);
      });

      section.appendChild(ul);
      side.appendChild(section);
    });
  }

  /* ---------- 2. 右側目錄 ---------- */

  // 建立右側目錄：收集 .content 裡所有 h2，沒有 id 的自動補上 sec-1、sec-2…
  function buildToc() {
    var toc = $('#toc');
    if (!toc) return;

    var heads = Array.prototype.slice.call(document.querySelectorAll('.content h2'));
    if (heads.length === 0) {
      toc.hidden = true; // 沒有標題就隱藏整個目錄
      return;
    }

    // 替沒有 id 的標題補上 id（跳過已經被別人用掉的 id）
    var counter = 0;
    heads.forEach(function (h) {
      if (h.id) return;
      do {
        counter += 1;
      } while (document.getElementById('sec-' + counter));
      h.id = 'sec-' + counter;
    });

    // 目錄的標題與連結清單
    toc.textContent = '';
    toc.appendChild(make('p', 'toc-title', '本頁內容'));
    var ul = make('ul', 'toc-list');
    var links = {};
    heads.forEach(function (h) {
      var li = make('li');
      var a = make('a', '', h.textContent.trim());
      a.href = '#' + h.id;
      links[h.id] = a;
      li.appendChild(a);
      ul.appendChild(li);
    });
    toc.appendChild(ul);
    toc.hidden = false;

    // 捲動時標記目前段落：用 IntersectionObserver 看哪個標題進入畫面上方的「觀察帶」
    if (!('IntersectionObserver' in window)) return;
    var visible = {};
    var active = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        visible[en.target.id] = en.isIntersecting;
      });
      // 文件順序中第一個在觀察帶內的標題就是目前段落；都不在時維持上一個
      var current = null;
      for (var i = 0; i < heads.length; i++) {
        if (visible[heads[i].id]) {
          current = heads[i].id;
          break;
        }
      }
      if (current && current !== active) {
        if (active) links[active].classList.remove('is-active');
        links[current].classList.add('is-active');
        active = current;
      }
    }, { rootMargin: '0px 0px -70% 0px' });
    heads.forEach(function (h) {
      io.observe(h);
    });
  }

  /* ---------- 3. 程式碼與提示詞的複製按鈕 ---------- */

  // 複製文字：先用 navigator.clipboard；不能用就借一個隱藏的 textarea 配 execCommand('copy')
  // 回傳 Promise，成功為 true、失敗為 false
  function copyText(text) {
    // 退路方案：舊瀏覽器或 clipboard 權限不足時使用
    function fallbackCopy() {
      var ta = make('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(ta);
      return ok;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        return true;
      }, fallbackCopy);
    }
    return Promise.resolve(fallbackCopy());
  }

  // 把複製按鈕切成「已複製」，1.5 秒後還原成「複製」
  function flashCopied(btn) {
    clearTimeout(btn._resetTimer);
    btn.classList.add('is-copied');
    btn.textContent = '已複製';
    btn._resetTimer = setTimeout(function () {
      btn.classList.remove('is-copied');
      btn.textContent = '複製';
    }, 1500);
  }

  // 建立一顆「複製」按鈕；getText 會在按下的當下才呼叫，取得要複製的文字
  function makeCopyButton(getText) {
    var btn = make('button', 'copy-btn', '複製');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      copyText(getText()).then(function (ok) {
        if (ok) flashCopied(btn);
      });
    });
    return btn;
  }

  // 每個正文的 <pre> 外面包一層 .code-block 並加按鈕；.prompt 內也加按鈕
  function setupCodeCopy() {
    document.querySelectorAll('.content pre').forEach(function (pre) {
      // 已經包過就跳過（避免重複執行時包兩層）
      if (!pre.parentNode || pre.parentNode.classList.contains('code-block')) return;
      var wrap = make('div', 'code-block');
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      wrap.appendChild(makeCopyButton(function () {
        return pre.textContent;
      }));
    });

    document.querySelectorAll('.prompt').forEach(function (box) {
      var src = box.querySelector('.prompt-text');
      if (!src || box.querySelector('.copy-btn')) return;
      box.appendChild(makeCopyButton(function () {
        return src.innerText;
      }));
    });
  }

  /* ---------- 4. 試試看 ---------- */

  // 讓 textarea 的 Tab 插入兩個空白，而不是跳到下一個元素。
  // 離開方式（二選一即可離開）：按 Shift+Tab；或先按 Esc，再按 Tab
  function setupTabKey(ta, onChange) {
    var escArmed = false; // 剛按過 Esc，下一次 Tab 就讓焦點離開
    ta.setAttribute('title', 'Tab 插入兩個空白；按 Shift+Tab，或先按 Esc 再按 Tab 可離開');
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        escArmed = true;
        return;
      }
      if (e.key !== 'Tab') {
        escArmed = false;
        return;
      }
      var armed = escArmed;
      escArmed = false;
      if (e.shiftKey || armed) return; // 瀏覽器預設行為：正常離開

      e.preventDefault();
      var s = ta.selectionStart;
      var end = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = s + 2;
      onChange();
    });
  }

  // 把 .tryit 重組成「工具列 + 左邊編輯區 + 右邊預覽」，預覽用 iframe 的 srcdoc 顯示
  function setupTryit() {
    document.querySelectorAll('.tryit').forEach(function (box) {
      var ta = box.querySelector('textarea.tryit-code');
      if (!ta) return;
      var initial = ta.value; // 記住原始程式碼，給「重設」用

      // 上方工具列
      var bar = make('div', 'tryit-bar');
      bar.appendChild(make('span', 'tryit-title', '試試看：改左邊，右邊馬上變'));
      var resetBtn = make('button', 'tryit-reset', '重設');
      resetBtn.type = 'button';
      bar.appendChild(resetBtn);

      // 下方主體：左邊 textarea、右邊預覽
      var body = make('div', 'tryit-body');
      var iframe = make('iframe', 'tryit-preview');
      iframe.setAttribute('sandbox', 'allow-scripts');
      iframe.setAttribute('title', '預覽結果');

      // 清空 box 後把原本的 textarea 放回主體（ta 變數仍指向同一個節點）
      box.textContent = '';
      body.appendChild(ta);
      body.appendChild(iframe);
      box.appendChild(bar);
      box.appendChild(body);

      var timer = null;
      function render() {
        iframe.srcdoc = ta.value;
      }
      // 輸入後等 300ms 才更新預覽，避免每打一個字就重新載入
      function scheduleRender() {
        clearTimeout(timer);
        timer = setTimeout(render, 300);
      }

      ta.addEventListener('input', scheduleRender);
      resetBtn.addEventListener('click', function () {
        ta.value = initial;
        clearTimeout(timer);
        render();
      });
      setupTabKey(ta, scheduleRender);
      render();
    });
  }

  /* ---------- 5. 已讀標記 ---------- */

  // 文章頁底部的「我讀完這篇了」勾選框：勾選存進 read 陣列，並即時更新側欄
  function setupReadMark() {
    var box = $('#read-mark');
    var page = ctx.page;
    if (!box || !page || page === 'index') return;

    var label = make('label', 'read-toggle');
    var checkbox = make('input');
    checkbox.type = 'checkbox';
    checkbox.checked = getReadList().indexOf(page) !== -1;
    label.appendChild(checkbox);
    label.appendChild(make('span', '', '我讀完這篇了'));

    box.textContent = '';
    box.appendChild(label);

    checkbox.addEventListener('change', function () {
      // 先移除這一篇，勾選時再加回去，避免重複
      var list = getReadList().filter(function (id) {
        return id !== page;
      });
      if (checkbox.checked) list.push(page);
      setReadList(list);
      setSidebarRead(page, checkbox.checked);
    });
  }

  /* ---------- 6. 上一篇／下一篇 ---------- */

  // 產生一個上一篇或下一篇的連結；dir 是 'prev' 或 'next'
  function makePagerLink(item, dir, label) {
    var a = make('a', 'pager-link ' + dir);
    a.href = ctx.root + item.id + '.html';
    a.appendChild(make('span', 'pager-label', label));
    a.appendChild(make('span', 'pager-title', item.title || ''));
    return a;
  }

  // 在所有 ready 的文章中找目前頁的前後一篇，有才產生對應的連結
  function buildPager() {
    var pager = $('#pager');
    if (!pager) return;
    var list = ctx.items.filter(function (it) {
      return it.ready;
    });
    var idx = -1;
    list.forEach(function (it, i) {
      if (it.id === ctx.page) idx = i;
    });
    if (idx === -1) return;

    if (idx > 0) pager.appendChild(makePagerLink(list[idx - 1], 'prev', '← 上一篇'));
    if (idx < list.length - 1) pager.appendChild(makePagerLink(list[idx + 1], 'next', '下一篇 →'));
  }

  /* ---------- 7. 首頁：進度條 ---------- */

  // 首頁的進度條：已讀篇數 / ready 篇數（只算 ready 的）
  function buildProgress() {
    var box = $('#progress');
    if (!box) return;
    var readList = getReadList();
    var ready = ctx.items.filter(function (it) {
      return it.ready;
    });
    var done = ready.filter(function (it) {
      return readList.indexOf(it.id) !== -1;
    }).length;
    var pct = ready.length ? Math.round((done / ready.length) * 100) : 0;

    box.textContent = '';
    var wrap = make('div', 'progress');
    var track = make('div', 'progress-bar');
    var fill = make('div', 'progress-fill');
    fill.style.width = pct + '%';
    track.appendChild(fill);
    wrap.appendChild(track);
    wrap.appendChild(make('p', 'progress-text',
      '已讀 ' + done + ' / ' + ready.length + ' 篇（只記錄在這台電腦的瀏覽器）'));
    box.appendChild(wrap);
  }

  /* ---------- 8. 首頁：學習路線卡片 ---------- */

  // 首頁的學習路線：每個 section 一組卡片。
  // 編號採「全站連續」（01、02…，撰寫中的項目也計入），方便讀者對照章節順序。
  function buildRoadmap() {
    var box = $('#roadmap');
    if (!box) return;
    var readList = getReadList();
    var num = 0;

    box.textContent = '';
    ctx.nav.forEach(function (sec) {
      var section = make('section', 'roadmap-section');
      section.appendChild(make('h2', '', sec.section || ''));
      var ol = make('ol', 'roadmap-list');

      ((sec.items || [])).forEach(function (item) {
        if (!item || !item.id) return;
        num += 1;

        var li = make('li', 'roadmap-item');
        var card;
        var minutes;
        if (item.ready) {
          card = make('a', 'roadmap-card');
          card.href = ctx.root + item.id + '.html';
          if (readList.indexOf(item.id) !== -1) card.classList.add('is-read');
          minutes = item.minutes ? item.minutes + ' 分' : '';
        } else {
          card = make('div', 'roadmap-card is-disabled');
          minutes = '撰寫中';
        }
        card.appendChild(make('span', 'roadmap-num', pad2(num)));
        card.appendChild(make('span', 'roadmap-title', item.title || ''));
        card.appendChild(make('span', 'roadmap-minutes', minutes));

        li.appendChild(card);
        ol.appendChild(li);
      });

      section.appendChild(ol);
      box.appendChild(section);
    });
  }

  /* ---------- 9. Prism 程式高亮 ---------- */

  // Prism 載入成功才呼叫 highlightAll；Prism 載入失敗時 window.Prism 不存在，直接略過
  function highlight() {
    if (window.Prism && typeof window.Prism.highlightAll === 'function') {
      window.Prism.highlightAll();
    }
  }

  /* ---------- 進入點 ---------- */

  // 讀取目前頁資訊與站點資料，然後依序啟動各功能（每個功能都獨立包在 run 裡）
  function init() {
    var body = document.body;
    if (!body) return;
    ctx.page = body.dataset.page || '';
    ctx.root = body.dataset.root || '';
    ctx.nav = Array.isArray(window.SITE_NAV) ? window.SITE_NAV : [];
    run(function () {
      ctx.items = flattenItems(ctx.nav);
    });

    run(buildSidebar);
    run(buildToc);
    run(setupCodeCopy);
    run(setupTryit);
    run(setupReadMark);
    run(buildPager);
    run(buildProgress);
    run(buildRoadmap);
    run(highlight); // 放最後：要在 code-block 包好之後才高亮
  }

  // 腳本放在 </body> 前時 DOM 通常已就緒；保險起見仍檢查一次
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
