/* 網站表單：直接送到協會的 Google 試算表（與水域聯盟入盟表單相同做法） */
(function () {
  var endpoint = (window.SITE_CONFIG || {}).formEndpoint;

  function resizeImage(file, max) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var s = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve({ type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.85).split(',')[1] });
        };
        img.onerror = function () { reject(new Error('照片無法讀取，請換一張 JPG 或 PNG')); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('照片無法讀取')); };
      reader.readAsDataURL(file);
    });
  }

  document.querySelectorAll('form[data-send]').forEach(function (form) {
    var msg = form.querySelector('.form-msg');
    var btn = form.querySelector('button[type=submit]');
    var photoInput = form.querySelector('input[type=file]');
    if (photoInput) {
      photoInput.addEventListener('change', function () {
        var prev = form.querySelector('.prev');
        var f = photoInput.files[0];
        if (prev && f) { prev.style.backgroundImage = 'url(' + URL.createObjectURL(f) + ')'; prev.textContent = ''; }
      });
    }
    function show(kind, text) { msg.className = 'form-msg ' + kind; msg.textContent = text; msg.hidden = false; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.hidden = true;
      // 必選的按鈕組
      var missing = [].filter.call(form.querySelectorAll('.pills[data-required]'), function (g) { return !g.querySelector('input:checked'); });
      if (missing.length) { show('err', '請選擇「' + missing[0].getAttribute('data-label') + '」'); missing[0].querySelector('input').focus(); return; }
      if (!endpoint) { show('err', '表單尚未設定收件位置，請直接聯絡協會窗口。'); return; }

      var fields = {};
      [].forEach.call(form.elements, function (el) {
        if (!el.name || el.type === 'file' || el.type === 'submit') return;
        if (el.type === 'checkbox' || el.type === 'radio') {
          if (!el.checked) return;
          var v = el.value === 'on' ? '是' : el.value;
          fields[el.name] = fields[el.name] ? fields[el.name] + '、' + v : v;
        } else fields[el.name] = el.value.trim();
      });
      var payload = { type: form.getAttribute('data-send'), fields: fields, website: fields.website || '' };
      delete fields.website;

      btn.disabled = true; var label = btn.textContent; btn.textContent = '送出中…';
      var photoFile = photoInput && photoInput.files[0];
      (photoFile ? resizeImage(photoFile, 1600) : Promise.resolve(null)).then(function (photo) {
        if (photo) payload.photo = photo;
        return fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (!res.ok) throw new Error(res.error || '送出失敗');
        form.reset();
        var prev = form.querySelector('.prev'); if (prev) { prev.style.backgroundImage = ''; prev.textContent = '尚未選擇'; }
        show('ok', form.getAttribute('data-done') || '已送出，謝謝！協會窗口會再與你聯絡。');
      }).catch(function (err) {
        show('err', '沒有送出成功：' + (err && err.message && err.message !== 'Failed to fetch' ? err.message : '網路連線有問題') + '。請稍後再試，或直接聯絡協會窗口。');
      }).then(function () { btn.disabled = false; btn.textContent = label; });
    });
  });
})();
