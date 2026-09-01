/* 모바일 내비 토글 + 모듈 검색. 외부 의존성 없음. */
(function () {
  'use strict';

  /* ---------------------------------------------------------- 모바일 내비 */
  var toggle = document.querySelector('[data-nav-toggle]');
  var menu = document.querySelector('[data-nav-menu]');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
  }

  /* ---------------------------------------------------------- 모듈 검색 */
  var input = document.querySelector('[data-search-input]');
  var countEl = document.querySelector('[data-search-count]');
  if (!input) return;

  var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-search-scope]'));
  var cards = [];
  scopes.forEach(function (scope) {
    Array.prototype.slice.call(scope.querySelectorAll('[data-search]')).forEach(function (c) {
      cards.push({ el: c, scope: scope, text: (c.getAttribute('data-search') || '') });
    });
  });

  // 한글 초성 검색을 위한 보조 인덱스
  var CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  function chosung(str) {
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (code >= 0xAC00 && code <= 0xD7A3) out += CHO[Math.floor((code - 0xAC00) / 588)];
      else out += str[i];
    }
    return out;
  }
  cards.forEach(function (c) { c.cho = chosung(c.text); });

  function apply() {
    var q = input.value.trim().toLowerCase();
    var qCho = chosung(q);
    var shown = 0;

    cards.forEach(function (c) {
      var hit = !q || c.text.indexOf(q) !== -1 || c.cho.indexOf(qCho) !== -1;
      c.el.style.display = hit ? '' : 'none';
      if (hit) shown++;
    });

    // 전부 숨겨진 그룹은 제목까지 함께 감춘다
    scopes.forEach(function (scope) {
      var any = cards.some(function (c) { return c.scope === scope && c.el.style.display !== 'none'; });
      scope.style.display = any ? '' : 'none';
      var head = scope.previousElementSibling;
      if (head && head.classList && head.classList.contains('sec-head')) {
        head.style.display = any ? '' : 'none';
      }
    });

    if (countEl) {
      countEl.textContent = !q ? '' : (shown === 0 ? '일치하는 모듈이 없습니다' : shown + '개 모듈');
    }
  }

  input.addEventListener('input', apply);
  input.addEventListener('search', apply);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { input.value = ''; apply(); }
  });
})();
