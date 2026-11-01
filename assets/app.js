/* =========================================================
   班會好好玩 — 互動邏輯
   ========================================================= */
(function () {
  'use strict';

  var CAT_ORDER = ['icebreaker', 'teamwork', 'talk', 'brain', 'reflect', 'wind'];
  var FAV_KEY = 'bgh-fav-v1';
  var OPEN_KEY = 'bgh-open-v1';

  var state = {
    q: '',
    cat: 'all',
    dur: 'all',
    players: 'all',
    place: 'all',
    favOnly: false
  };

  var favs = readJSON(FAV_KEY, []);
  var openIds = new Set(readJSON(OPEN_KEY, []));

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* ---------------- Category chips ---------------- */

  function buildChips() {
    var wrapEl = $('#catChips');
    var html = '<button class="chip" data-cat="all" aria-pressed="true"><span class="swatch" style="background:#1F1B16"></span>全部</button>';
    CAT_ORDER.forEach(function (key) {
      var c = CATS[key];
      html += '<button class="chip" data-cat="' + key + '" aria-pressed="false">' +
        '<span class="swatch" style="background:' + c.color + '"></span>' + esc(c.name) +
        '</button>';
    });
    wrapEl.innerHTML = html;

    wrapEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      state.cat = btn.getAttribute('data-cat');
      $$('.chip', wrapEl).forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      render();
    });
  }

  /* ---------------- Filtering ---------------- */

  function matches(game) {
    if (state.favOnly && favs.indexOf(game.id) === -1) return false;
    if (state.cat !== 'all' && game.cat !== state.cat) return false;

    if (state.dur !== 'all') {
      var d = game.duration;
      if (state.dur === 'short' && d > 10) return false;
      if (state.dur === 'mid' && (d <= 10 || d > 20)) return false;
      if (state.dur === 'long' && d <= 20) return false;
    }

    if (state.players !== 'all') {
      if (state.players === 'small' && game.players[0] > 15) return false;
      if (state.players === 'mid' && (game.players[1] < 16 || game.players[0] > 30)) return false;
      if (state.players === 'large' && game.players[1] < 31) return false;
    }

    if (state.place !== 'all') {
      var p = game.place;
      if (p !== '兩者皆可' && p !== state.place) return false;
    }

    if (state.q) {
      var hay = [game.title, game.en || '', game.summary, game.materials.join(' '),
        game.steps.join(' '), game.tips.join(' '), CATS[game.cat].name].join(' ').toLowerCase();
      var terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < terms.length; i++) {
        if (hay.indexOf(terms[i]) === -1) return false;
      }
    }
    return true;
  }

  /* ---------------- Card rendering ---------------- */

  function metaHtml(g) {
    var cat = CATS[g.cat];
    var placeIcon = g.place === '操場' ? 'i-pin' : 'i-door';
    return '' +
      '<div class="meta">' +
        '<span><svg width="13" height="13" aria-hidden="true"><use href="#i-time"/></svg>' + g.duration + ' 分鐘</span>' +
        '<span><svg width="13" height="13" aria-hidden="true"><use href="#i-users"/></svg>' + g.players[0] + '–' + g.players[1] + ' 人</span>' +
        '<span><svg width="13" height="13" aria-hidden="true"><use href="#' + placeIcon + '"/></svg>' + esc(g.place) + '</span>' +
        '<span class="energy" data-level="' + g.energy + '" title="體能強度"><i></i><i></i><i></i></span>' +
      '</div>';
  }

  function detailHtml(g) {
    var steps = g.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    var tips = g.tips.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    var variants = (g.variants || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    var materials = g.materials.length
      ? '<ul class="material-list">' + g.materials.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>'
      : '<p class="tool-note" style="color:var(--muted);margin:0 0 18px">無需物資</p>';

    return '' +
      '<div class="card-body">' +
        '<div class="col-a">' +
          '<p class="block-title">玩法</p>' +
          '<ol class="steps">' + steps + '</ol>' +
          (g.warn ? '<p class="callout"><b>安全提示：</b>' + esc(g.warn) + '</p>' : '') +
        '</div>' +
        '<div class="col-b">' +
          '<p class="block-title">需要物資</p>' + materials +
          '<p class="block-title">帶領貼士</p>' +
          '<ul class="tips">' + tips + '</ul>' +
          (variants ? '<p class="block-title">變化玩法</p><ul class="plain-list">' + variants + '</ul>' : '') +
        '</div>' +
      '</div>';
  }

  function cardHtml(g, index) {
    var isOpen = openIds.has(g.id);
    var isFav = favs.indexOf(g.id) !== -1;
    return '' +
      '<article class="card' + (isOpen ? ' open' : '') + '" id="g-' + g.id + '" data-id="' + g.id + '" style="animation-delay:' + Math.min(index * 22, 340) + 'ms">' +
        '<button class="card-head" type="button" aria-expanded="' + isOpen + '" aria-controls="body-' + g.id + '">' +
          '<div class="card-top"><span class="cat-tag" style="background:' + CATS[g.cat].color + '">' + esc(CATS[g.cat].name) + '</span></div>' +
          '<span class="card-title">' + esc(g.title) + (g.en ? '<span class="card-en">' + esc(g.en) + '</span>' : '') + '</span>' +
          '<span class="card-summary">' + esc(g.summary) + '</span>' +
          metaHtml(g) +
          '<svg class="chev" width="16" height="16" aria-hidden="true"><use href="#i-chev"/></svg>' +
        '</button>' +
        '<button class="fav-btn" type="button" data-fav="' + g.id + '" aria-pressed="' + isFav + '" aria-label="收藏 ' + esc(g.title) + '" title="收藏">' +
          '<svg width="17" height="17" aria-hidden="true"><use href="#i-star"/></svg>' +
        '</button>' +
        '<div class="card-body-wrap" id="body-' + g.id + '">' + (isOpen ? detailHtml(g) : '') + '</div>' +
      '</article>';
  }

  /* ---------------- Render ---------------- */

  var grid = $('#grid');
  var cardsById = {};

  function render() {
    var list = GAMES.filter(matches);
    grid.innerHTML = list.length
      ? list.map(cardHtml).join('')
      : '<p class="empty">沒有符合條件的遊戲。試試放寬「時間」或「人數」，或按「重設篩選」。</p>';

    cardsById = {};
    GAMES.forEach(function (g) { cardsById[g.id] = g; });

    $('#count').textContent = list.length + ' 個遊戲';
    $('#countTotal').textContent = GAMES.length;
    if (window.requestIdleCallback) {} // no-op, keep linters calm
  }

  /* ---------------- Card interactions ---------------- */

  grid.addEventListener('click', function (e) {
    var fav = e.target.closest('[data-fav]');
    if (fav) {
      var id = fav.getAttribute('data-fav');
      var i = favs.indexOf(id);
      if (i === -1) { favs.push(id); toast('已加入收藏'); }
      else { favs.splice(i, 1); toast('已取消收藏'); }
      fav.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
      save(FAV_KEY, favs);
      if (state.favOnly) render();
      return;
    }

    var head = e.target.closest('.card-head');
    if (head) {
      var card = head.closest('.card');
      var gid = card.getAttribute('data-id');
      var open = card.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      var body = card.querySelector('.card-body-wrap');
      if (open) {
        body.innerHTML = detailHtml(cardsById[gid]);
        openIds.add(gid);
      } else {
        body.innerHTML = '';
        openIds.delete(gid);
      }
      save(OPEN_KEY, Array.from(openIds));
    }
  });

  /* ---------------- Toolbar ---------------- */

  $('#search').addEventListener('input', function (e) {
    state.q = e.target.value.trim();
    render();
  });
  $('#durSel').addEventListener('change', function (e) { state.dur = e.target.value; render(); });
  $('#playerSel').addEventListener('change', function (e) { state.players = e.target.value; render(); });
  $('#placeSel').addEventListener('change', function (e) { state.place = e.target.value; render(); });

  $('#favOnly').addEventListener('click', function (e) {
    state.favOnly = !state.favOnly;
    e.currentTarget.setAttribute('aria-pressed', state.favOnly ? 'true' : 'false');
    render();
    if (state.favOnly && favs.length === 0) toast('你還沒有收藏任何遊戲');
  });

  $('#resetBtn').addEventListener('click', function () {
    state = { q: '', cat: 'all', dur: 'all', players: 'all', place: 'all', favOnly: false };
    $('#search').value = '';
    $('#durSel').value = 'all';
    $('#playerSel').value = 'all';
    $('#placeSel').value = 'all';
    $('#favOnly').setAttribute('aria-pressed', 'false');
    $$('#catChips .chip').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-cat') === 'all' ? 'true' : 'false');
    });
    render();
  });

  /* ---------------- Random picker ---------------- */

  function pickRandom() {
    var pool = GAMES.filter(matches);
    if (!pool.length) pool = GAMES.slice();
    var g = pool[Math.floor(Math.random() * pool.length)];
    state.cat = 'all';
    state.q = '';
    $('#search').value = '';
    $$('#catChips .chip').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-cat') === 'all' ? 'true' : 'false');
    });
    render();

    openIds.add(g.id);
    save(OPEN_KEY, Array.from(openIds));
    render();

    var card = grid.querySelector('[data-id="' + g.id + '"]');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.querySelector('.card-head').focus({ preventScroll: true });
    }
    toast('抽到：' + g.title + '（' + g.duration + ' 分鐘）');
  }

  $$('[data-random]').forEach(function (b) { b.addEventListener('click', pickRandom); });

  /* ---------------- Toast ---------------- */

  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  /* ---------------- Timer ---------------- */

  var timer = { total: 300, left: 300, id: null, running: false };

  var timeEl = $('#timerText');
  var ringEl = $('#timerRing');
  var RING_LEN = 2 * Math.PI * 52;

  function paintTimer() {
    var m = Math.floor(timer.left / 60);
    var s = timer.left % 60;
    timeEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    timeEl.classList.toggle('low', timer.left <= 10);
    var ratio = timer.total ? timer.left / timer.total : 0;
    ringEl.style.strokeDashoffset = String(RING_LEN * (1 - ratio));
    ringEl.style.stroke = timer.left <= 10 ? '#F08A5D' : '#E9C46A';
  }

  function stopTimer() {
    clearInterval(timer.id);
    timer.id = null;
    timer.running = false;
    $('#timerToggle').textContent = '開始';
  }

  function startTimer() {
    if (timer.running) return;
    if (timer.left <= 0) timer.left = timer.total;
    timer.running = true;
    $('#timerToggle').textContent = '暫停';
    var end = Date.now() + timer.left * 1000;
    timer.id = setInterval(function () {
      timer.left = Math.max(0, Math.round((end - Date.now()) / 1000));
      paintTimer();
      if (timer.left === 0) {
        stopTimer();
        beep();
        toast('時間到！');
      }
    }, 200);
  }

  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      [0, 0.28, 0.56].forEach(function (offset) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + offset + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.22);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + offset);
        o.stop(ctx.currentTime + offset + 0.24);
      });
    } catch (e) { /* no audio, no problem */ }
  }

  $('#timerToggle').addEventListener('click', function () {
    if (timer.running) { stopTimer(); }
    else if (timer.left <= 0) { timer.left = timer.total; paintTimer(); startTimer(); }
    else { startTimer(); }
  });

  $('#timerReset').addEventListener('click', function () {
    stopTimer();
    timer.left = timer.total;
    paintTimer();
  });

  $$('.timer-presets button').forEach(function (b) {
    b.addEventListener('click', function () {
      stopTimer();
      timer.total = Number(b.getAttribute('data-min')) * 60;
      timer.left = timer.total;
      paintTimer();
    });
  });

  $('#timerSubmit').addEventListener('click', function () {
    var v = Number($('#timerMin').value);
    if (!v || v <= 0) { toast('請輸入分鐘數'); return; }
    stopTimer();
    timer.total = Math.min(v, 120) * 60;
    timer.left = timer.total;
    paintTimer();
  });

  /* ---------------- Group generator ---------------- */

  function parseNames(raw) {
    return raw.split(/[\n,，、;；]+|\s{2,}/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  $('#groupBtn').addEventListener('click', function () {
    var names = parseNames($('#namesInput').value);
    var groups = Math.max(2, Math.min(12, Number($('#groupCount').value) || 4));
    var out = $('#groupOut');

    if (names.length < groups) {
      out.innerHTML = '<p class="tool-note">名單人數要至少等於組數（' + groups + ' 組）。</p>';
      return;
    }

    var pool = shuffle(names.slice());
    var buckets = [];
    for (var i = 0; i < groups; i++) buckets.push([]);
    pool.forEach(function (n, i) {
      var idx = i < groups ? i : i % groups;
      buckets[idx].push(n);
    });

    out.innerHTML = buckets.map(function (b, i) {
      return '<div class="group-row"><b>第 ' + (i + 1) + ' 組</b>' + esc(b.join('、')) +
        '<span style="color:#8C8273"> （' + b.length + ' 人）</span></div>';
    }).join('');

    window.__lastGroups = buckets;
    toast(names.length + ' 人已分成 ' + groups + ' 組');
  });

  $('#groupCopy').addEventListener('click', function () {
    var buckets = window.__lastGroups;
    if (!buckets) { toast('請先按「隨機分組」'); return; }
    var text = buckets.map(function (b, i) {
      return '第 ' + (i + 1) + ' 組：' + b.join('、');
    }).join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('已複製分組結果'); },
        function () { toast('瀏覽器不支援複製，請手動選取'); });
    } else {
      toast('瀏覽器不支援複製，請手動選取');
    }
  });

  /* ---------------- Print ---------------- */

  window.addEventListener('beforeprint', function () {
    GAMES.forEach(function (g) {
      var card = grid.querySelector('[data-id="' + g.id + '"]');
      if (!card) return;
      var body = card.querySelector('.card-body-wrap');
      if (!body.querySelector('.card-body')) body.innerHTML = detailHtml(g);
    });
  });

  /* ---------------- Boot ---------------- */

  buildChips();
  render();
  paintTimer();
  $('#year').textContent = new Date().getFullYear();

  function openFromHash() {
    var m = (location.hash || '').match(/^#g-([\w-]+)$/);
    if (!m || !cardsById[m[1]]) return;
    openIds.add(m[1]);
    save(OPEN_KEY, Array.from(openIds));
    render();
    var card = grid.querySelector('[data-id="' + m[1] + '"]');
    if (card) card.scrollIntoView({ block: 'start' });
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
})();
