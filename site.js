(function () {
  var NAV = [
    ['about', 'about.html', '關於協會'],
    ['teachers', 'teachers.html', '導覽老師'],
    ['activities', 'activities.html', '協會活動'],
    ['news', 'news.html', '最新消息'],
    ['join', 'join.html', '加入協會'],
    ['members', 'members.html', '會員專區']
  ];
  var page = document.body.getAttribute('data-page') || '';

  var head = document.getElementById('site-header');
  if (head) {
    var links = NAV.map(function (n) {
      return '<a href="' + n[1] + '"' + (n[0] === page ? ' aria-current="page"' : '') + '>' + n[2] + '</a>';
    }).join('');
    head.outerHTML =
      '<header class="site-header"><div class="wrap">' +
      '<a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">標誌</span>' +
      '<span class="brand-name"><b>日月潭觀光導覽暨交流協會</b><small>SUN MOON LAKE GUIDE ASSOCIATION</small></span></a>' +
      '<button class="menu-btn" type="button" id="menu-btn" aria-expanded="false" aria-controls="site-nav">選單</button>' +
      '<nav class="nav" id="site-nav" aria-label="主選單">' + links +
      '<a class="book" href="booking.html"' + (page === 'booking' ? ' aria-current="page"' : '') + '>預約<br>導覽</a></nav>' +
      '</div></header>';
  }

  var foot = document.getElementById('site-footer');
  if (foot) {
    foot.outerHTML =
      '<footer class="site-footer"><div class="wrap">' +
      '<span>日月潭觀光導覽暨交流協會｜立案字號 [字號]</span>' +
      '<span>[地址]｜[電話]｜[Email]</span>' +
      '</div></footer>';
  }

  var btn = document.getElementById('menu-btn');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? '關閉' : '選單';
    });
  }

  // 篩選按鈕：<div data-filter-for="list-id"><button class="chip" data-filter="全部">
  document.querySelectorAll('[data-filter-for]').forEach(function (group) {
    var list = document.getElementById(group.getAttribute('data-filter-for'));
    if (!list) return;
    group.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var val = chip.getAttribute('data-filter');
        group.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        list.querySelectorAll('[data-kind]').forEach(function (item) {
          var kinds = item.getAttribute('data-kind').split(' ');
          item.hidden = !(val === '全部' || kinds.indexOf(val) !== -1);
        });
      });
    });
  });

  // 會員專區分頁
  var tabs = document.querySelectorAll('[data-tab]');
  function showTab(id) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      var panel = document.getElementById('panel-' + t.getAttribute('data-tab'));
      if (panel) panel.hidden = !on;
    });
  }
  if (tabs.length) {
    tabs.forEach(function (t) { t.addEventListener('click', function () { showTab(t.getAttribute('data-tab')); }); });
    var start = (location.hash || '').replace('#', '');
    showTab(document.getElementById('panel-' + start) ? start : tabs[0].getAttribute('data-tab'));
  }

  // 表單：目前為示範，不會送出
  document.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = f.querySelector('.form-note');
      if (note) note.hidden = false;
    });
  });
})();

// 表單按鈕接到 config.js 的網址
(function () {
  var forms = (window.SITE_CONFIG || {}).forms || {};
  document.querySelectorAll('[data-form]').forEach(function (a) {
    var url = forms[a.getAttribute('data-form')];
    if (url) a.href = url;
    else { a.removeAttribute('target'); a.addEventListener('click', function (e) { e.preventDefault(); }); a.style.opacity = '0.5'; a.title = '表單尚未設定'; }
  });
})();
