// 全站文章清單：側欄、上一篇／下一篇、首頁路線圖都從這裡產生。
// 新增文章時，只要在這裡加一筆，並把 ready 改成 true。
window.SITE_NAV = [
  {
    section: '網頁基礎',
    items: [
      { id: 'basics/01-what-is-web', title: '網頁是什麼？', minutes: 30, ready: true },
      { id: 'basics/02-tools', title: '準備工具', minutes: 40, ready: true },
      { id: 'basics/03-html', title: 'HTML：網頁的骨架', minutes: 60, ready: true },
      { id: 'basics/04-css', title: 'CSS：網頁的衣服', minutes: 80, ready: true },
      { id: 'basics/05-javascript', title: 'JavaScript：網頁的動作', minutes: 100, ready: false },
      { id: 'basics/06-work-with-ai', title: '跟 AI 一起寫網頁', minutes: 80, ready: false },
      { id: 'basics/07-debugging', title: '除錯與看懂錯誤', minutes: 70, ready: false },
      { id: 'basics/08-publish', title: '把網頁放上網', minutes: 60, ready: false }
    ]
  },
  {
    section: '實戰範例',
    items: [
      { id: 'projects/01-lunch-picker', title: '今天吃什麼？午餐抽籤', minutes: 120, ready: false },
      { id: 'projects/02-signup-form', title: '部門聚餐報名表', minutes: 150, ready: false },
      { id: 'projects/03-todo-list', title: '我的待辦清單', minutes: 180, ready: false },
      { id: 'projects/04-pomodoro', title: '番茄鐘倒數計時器', minutes: 150, ready: false }
    ]
  }
];
