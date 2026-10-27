/* 從 Google 試算表「導覽協會_網站內容」讀取老師、消息、活動。
   讀不到（尚未設定、未公開、離線）時，頁面保留原本的示範版面。 */
(function () {
  var cfg = window.SITE_CONFIG || {};
  if (!cfg.sheetId) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function paras(s) {
    return String(s || '').split(/\n+/).filter(Boolean).map(function (p) {
      return '<p class="lead" style="font-size: 17px; max-width: none">' + esc(p) + '</p>';
    }).join('');
  }
  function list(s) { return String(s || '').split(/[、,，\/\n]+/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function photo(u) {
    u = String(u || '').trim();
    if (!u) return '';
    var m = u.match(/\/d\/([\w-]{20,})/) || u.match(/[?&]id=([\w-]{20,})/);
    if (m) return 'https://lh3.googleusercontent.com/d/' + m[1];
    return u;
  }
  function img(u, alt, label) {
    var src = photo(u);
    if (!src) return '<div class="ph" style="width: 100%; height: 100%">' + esc(label || '照片待補') + '</div>';
    return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover">';
  }
  function dotDate(d) { return String(d || '').replace(/-/g, '.'); }

  function parseCSV(text) {
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (ch !== '\r') cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    var head = rows.shift() || [];
    return rows.map(function (r, idx) {
      var o = { _row: idx + 2 };
      head.forEach(function (h, k) { o[h.trim()] = (r[k] || '').trim(); });
      return o;
    }).filter(function (o) { return o['公開'] === '是'; });
  }
  function load(sheet) {
    var url = 'https://docs.google.com/spreadsheets/d/' + cfg.sheetId + '/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent(sheet);
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(parseCSV);
  }
  function byDateDesc(a, b) { return String(b['日期']).localeCompare(String(a['日期'])); }
  function param(k) { var m = location.search.match(new RegExp('[?&]' + k + '=([^&]+)')); return m ? decodeURIComponent(m[1]) : null; }

  /* ---------- 老師 ---------- */
  function teacherCard(t) {
    var kinds = list(t['語言']).concat(list(t['專長'])).join(' ');
    return '<a class="teacher" href="teacher.html?id=' + t._row + '" data-kind="' + esc(kinds) + '">' +
      '<div class="ph">' + img(t['照片網址'], t['姓名'] + ' 老師') +
      (t['一句話'] ? '<span class="quote">' + esc(t['一句話']) + '</span>' : '') + '</div>' +
      '<div class="meta"><span><small>' + esc([list(t['專長'])[0], list(t['語言']).join('・')].filter(Boolean).join('｜')) + '</small><b>' + esc(t['姓名']) + '</b></span></div></a>';
  }
  function sortTeachers(ts) {
    return ts.sort(function (a, b) { return (Number(a['排序']) || 999) - (Number(b['排序']) || 999); });
  }
  function teacherDetail(ts) {
    var id = Number(param('id'));
    var i = ts.findIndex(function (t) { return t._row === id; });
    if (i < 0) i = 0;
    var t = ts[i], next = ts[(i + 1) % ts.length];
    document.title = t['姓名'] + '｜日月潭觀光導覽暨交流協會';
    var tags = list(t['專長']).map(function (x) { return '<span class="tag solid">' + esc(x) + '</span>'; }).join('') +
      list(t['語言']).map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('');
    var facts = [['導覽年資', t['年資']], ['居住地', t['居住地']], ['相關證照', t['證照']]].filter(function (f) { return f[1]; })
      .map(function (f) { return '<dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('');
    var routes = String(t['擅長路線'] || '').split(/\n+/).filter(Boolean).map(function (r) {
      var parts = r.split(/[，,]/);
      return '<div class="panel white"><b style="font-size: 18px">' + esc(parts.shift()) + '</b>' +
        (parts.length ? '<span class="muted" style="font-size: 14px">' + esc(parts.join('・')) + '</span>' : '') + '</div>';
    }).join('');
    document.getElementById('detail').innerHTML =
      '<div class="wrap crumb"><a href="teachers.html">導覽老師</a>　／　' + esc(t['姓名']) + '</div>' +
      '<section class="wrap section" style="padding-top: 28px"><div class="profile">' +
        '<div class="ph portrait">' + img(t['照片網址'], t['姓名'] + ' 老師') + (t['一句話'] ? '<span class="quote">' + esc(t['一句話']) + '</span>' : '') + '</div>' +
        '<div class="info"><div class="stack" style="gap: 6px"><h1 style="font-size: clamp(32px, 4vw, 44px)">' + esc(t['姓名']) + '</h1>' +
          (t['英文名或族名'] ? '<span class="muted">' + esc(t['英文名或族名']) + '</span>' : '') + '</div>' +
          '<div class="row" style="gap: 10px">' + tags + '</div>' +
          (facts ? '<dl class="facts">' + facts + '</dl>' : '') + paras(t['自我介紹']) + '</div>' +
      '</div></section>' +
      (routes ? '<section class="soft"><div class="wrap section stack" style="gap: 28px"><h2 style="font-size: 24px">擅長的導覽路線</h2><div class="grid">' + routes + '</div></div></section>' : '') +
      '<section class="cta"><div class="wrap"><div class="stack" style="gap: 8px"><h2>想請' + esc(t['姓名']) + '老師導覽？</h2><p>所有導覽皆由協會窗口統一安排，預約時註明老師姓名即可。</p></div><a class="btn light" href="booking.html">透過協會預約</a></div></section>' +
      '<div class="wrap row" style="justify-content: space-between; padding-block: 40px; font-weight: 700"><a href="teachers.html" style="text-decoration: none">← 回老師列表</a>' +
      (ts.length > 1 ? '<a href="teacher.html?id=' + next._row + '" style="text-decoration: none">下一位：' + esc(next['姓名']) + ' →</a>' : '') + '</div>';
  }

  /* ---------- 消息 ---------- */
  function newsRow(n, withTag) {
    return '<a class="list-row" href="news-post.html?id=' + n._row + '" data-kind="' + esc(n['類型']) + '"><span class="date">' + esc(dotDate(n['日期'])) + '</span>' +
      (withTag ? '<span class="tag">' + esc(n['類型']) + '</span>' : '') + '<span class="title">' + esc(n['標題']) + '</span></a>';
  }
  function newsDetail(ns) {
    var id = Number(param('id'));
    var i = ns.findIndex(function (n) { return n._row === id; });
    if (i < 0) i = 0;
    var n = ns[i], newer = ns[i - 1], older = ns[i + 1];
    document.title = n['標題'] + '｜日月潭觀光導覽暨交流協會';
    function nav(x, label, right) {
      if (!x) return '<span></span>';
      return '<a class="boxed stack" href="news-post.html?id=' + x._row + '" style="gap: 6px; text-decoration: none; padding: 20px 24px' + (right ? '; text-align: right' : '') + '"><span class="tag" style="border: 0; padding: 0">' + label + '</span><span>' + esc(x['標題']) + '</span></a>';
    }
    document.getElementById('detail').innerHTML =
      '<article class="wrap narrow stack" style="padding-block: 24px 64px; gap: 24px">' +
        '<div class="crumb"><a href="news.html">最新消息</a>　／　' + esc(n['類型']) + '</div>' +
        '<div class="row" style="gap: 16px; align-items: center"><span class="muted" style="font-size: 15px; font-variant-numeric: tabular-nums">' + esc(dotDate(n['日期'])) + '</span><span class="tag solid">' + esc(n['類型']) + '</span></div>' +
        '<h1 style="font-size: clamp(26px, 3.4vw, 36px); line-height: 1.5">' + esc(n['標題']) + '</h1>' +
        '<div style="height: 3px; width: 64px; background: var(--accent)"></div>' + paras(n['內文']) +
        (n['附件網址'] ? '<a class="btn ghost" style="align-self: flex-start" href="' + esc(n['附件網址']) + '" target="_blank" rel="noopener">查看附件</a>' : '') +
      '</article>' +
      '<section class="wrap narrow grid" style="padding-bottom: 72px; gap: 16px">' + nav(older, '← 上一則') + nav(newer, '下一則 →', true) +
      '<a class="btn" href="news.html" style="grid-column: 1 / -1">回消息列表</a></section>';
  }

  /* ---------- 活動 ---------- */
  function actCard(a) {
    return '<a class="act" href="activity.html?id=' + a._row + '" data-kind="' + esc(a['類型']) + '">' +
      '<div class="ph">' + img(a['封面照片網址'], a['名稱'], '活動照片待補') + '<span class="tag solid">' + esc(a['類型']) + '</span></div>' +
      '<span class="tag" style="align-self: flex-start; border: 0; padding: 0">' + esc([dotDate(a['日期']), a['地點']].filter(Boolean).join('・')) + '</span>' +
      '<b>' + esc(a['名稱']) + '</b>' + (a['摘要'] ? '<span class="muted" style="font-size: 14px">' + esc(a['摘要']) + '</span>' : '') + '</a>';
  }
  function actDetail(as) {
    var id = Number(param('id'));
    var i = as.findIndex(function (a) { return a._row === id; });
    if (i < 0) i = 0;
    var a = as[i], next = as[(i + 1) % as.length];
    document.title = a['名稱'] + '｜日月潭觀光導覽暨交流協會';
    var info = [['日期', dotDate(a['日期'])], ['地點', a['地點']], ['類型', a['類型']], ['講師／接待', a['講師或接待']], ['參加人數', a['參加人數'] ? a['參加人數'] + ' 位老師' : '']]
      .filter(function (x) { return x[1]; }).map(function (x) { return '<div class="info-row"><b>' + x[0] + '</b><span>' + esc(x[1]) + '</span></div>'; }).join('');
    var gallery = list(a['其他照片網址']).map(function (u) { return '<figure class="shot" style="aspect-ratio: 4 / 3">' + img(u, a['名稱']) + '</figure>'; }).join('');
    document.getElementById('detail').innerHTML =
      '<div class="wrap crumb"><a href="activities.html">協會活動</a>　／　' + esc(a['類型']) + '</div>' +
      '<section class="wrap" style="padding-top: 24px"><div class="ph cover">' + img(a['封面照片網址'], a['名稱'], '活動照片待補') +
        '<span class="label"><span style="font-size: 17px; font-weight: 900">' + esc(a['類型']) + '</span></span></div></section>' +
      '<section class="wrap section row" style="gap: 48px; align-items: flex-start"><div class="stack" style="flex: 2 1 520px">' +
        '<h1 style="font-size: clamp(28px, 3.4vw, 36px)">' + esc(a['名稱']) + '</h1><div style="height: 3px; width: 64px; background: var(--accent)"></div>' +
        paras(a['內文'] || a['摘要']) + '</div>' + (info ? '<aside class="panel" style="flex: 1 1 280px; gap: 0">' + info + '</aside>' : '') + '</section>' +
      (gallery ? '<section class="soft"><div class="wrap section stack" style="gap: 28px"><h2 style="font-size: 24px">活動照片</h2><div class="grid" style="gap: 12px">' + gallery + '</div></div></section>' : '') +
      '<div class="wrap row" style="justify-content: space-between; padding-block: 40px; font-weight: 700"><a href="activities.html" style="text-decoration: none">← 回活動列表</a>' +
      (as.length > 1 ? '<a href="activity.html?id=' + next._row + '" style="text-decoration: none">下一場：' + esc(next['名稱']) + ' →</a>' : '') + '</div>';
  }

  /* ---------- 依頁面套用 ---------- */
  var path = location.pathname.split('/').pop() || 'index.html';
  function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }

  if (path === 'teachers.html' || path === 'teacher.html' || path === 'index.html' || path === '') {
    load('老師').then(function (ts) {
      if (!ts.length) return;
      ts = sortTeachers(ts);
      if (path === 'teachers.html') setHTML('teacher-list', ts.map(teacherCard).join(''));
      else if (path === 'teacher.html') teacherDetail(ts);
      else setHTML('home-teachers', ts.slice(0, 3).map(teacherCard).join(''));
    }).catch(function () {});
  }
  if (path === 'news.html' || path === 'news-post.html' || path === 'index.html' || path === '') {
    load('消息').then(function (ns) {
      if (!ns.length) return;
      ns.sort(byDateDesc);
      if (path === 'news.html') setHTML('news-list', ns.map(function (n) { return newsRow(n, true); }).join(''));
      else if (path === 'news-post.html') newsDetail(ns);
      else setHTML('home-news', '<h2 style="font-size: 22px; margin-bottom: 16px">最新消息</h2>' + ns.slice(0, 3).map(function (n) { return newsRow(n, false); }).join('') +
        '<a href="news.html" style="font-weight: 700; font-size: 15px; color: var(--accent); margin-top: 16px">看全部消息</a>');
    }).catch(function () {});
  }
  if (path === 'activities.html' || path === 'activity.html' || path === 'index.html' || path === '') {
    load('活動').then(function (as) {
      if (!as.length) return;
      as.sort(byDateDesc);
      if (path === 'activities.html') setHTML('act-list', as.map(actCard).join(''));
      else if (path === 'activity.html') actDetail(as);
      else {
        var a = as[0], el = document.getElementById('home-activity');
        if (el) {
          el.href = 'activity.html?id=' + a._row;
          el.innerHTML = '<h2 style="font-size: 22px">最近一場活動</h2><div class="ph" style="aspect-ratio: 16 / 9">' + img(a['封面照片網址'], a['名稱'], '活動照片待補') +
            '</div><span><span class="tag">' + esc(a['類型']) + '</span>　<b>' + esc(a['名稱']) + '</b></span>';
        }
      }
    }).catch(function () {});
  }
})();
