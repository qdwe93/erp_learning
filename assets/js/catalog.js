/* SAP Learning 전체 Catalog 검색·필터. 외부 의존성 없음. */
(function () {
  'use strict';

  var rows = Array.isArray(window.SAP_LEARNING_CATALOG) ? window.SAP_LEARNING_CATALOG : [];
  var pageSize = 50;
  var currentPage = 1;
  var filtered = rows.slice();

  var search = document.querySelector('[data-catalog-search]');
  var typeFilter = document.querySelector('[data-catalog-type]');
  var languageFilter = document.querySelector('[data-catalog-language]');
  var categoryFilter = document.querySelector('[data-catalog-category]');
  var surfaceFilter = document.querySelector('[data-catalog-surface]');
  var body = document.querySelector('[data-catalog-body]');
  var count = document.querySelector('[data-catalog-count]');
  var pageLabel = document.querySelector('[data-catalog-page]');
  var empty = document.querySelector('[data-catalog-empty]');
  var previous = document.querySelector('[data-catalog-prev]');
  var next = document.querySelector('[data-catalog-next]');
  var reset = document.querySelector('[data-catalog-reset]');

  if (!search || !body) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function normalized(value) {
    return String(value == null ? '' : value).toLocaleLowerCase('ko-KR');
  }

  function surfaceOf(row) {
    return /^https:\/\/learning\.sap\.com(?:\/|$)/i.test(row.direct_url || '') ? 'learning' : 'hub';
  }

  function hasMaterial(row) {
    return row.learning_type === 'Standalone course' || row.learning_type === 'Learning Journey';
  }

  function typeLabel(type) {
    return {
      'Standalone course': '과정',
      'Learning Journey': 'Learning Journey',
      'Practice System': '실습 시스템',
      'Certification': 'Certification',
      'Video': '영상'
    }[type] || type || '—';
  }

  function duration(row) {
    if (row.duration_hours) {
      var hours = Number(row.duration_hours);
      if (Number.isFinite(hours)) return hours.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + '시간';
    }
    return row.video_duration || '—';
  }

  function option(value, label) {
    var el = document.createElement('option');
    el.value = value;
    el.textContent = label;
    return el;
  }

  function populateFilters() {
    var types = Array.from(new Set(rows.map(function (row) { return row.learning_type; }).filter(Boolean))).sort();
    var categories = Array.from(new Set(rows.map(function (row) { return row.product_category; }).filter(Boolean))).sort();
    types.forEach(function (value) { typeFilter.appendChild(option(value, typeLabel(value))); });
    categories.forEach(function (value) { categoryFilter.appendChild(option(value, value)); });
  }

  function rowHtml(row) {
    var safeUrl = /^https:\/\/learning\.sap\.com(?:\/|$)/i.test(row.direct_url || '') ? row.direct_url : '';
    var title = safeUrl
      ? '<a href="' + escapeHtml(safeUrl) + '" target="_blank" rel="noopener">' + escapeHtml(row.title) + '</a>'
      : escapeHtml(row.title);
    var language = row.language === 'ko'
      ? '<span class="badge badge-ko">한국어</span>'
      : '<span class="badge badge-en">영어</span>';
    var surface = surfaceOf(row) === 'learning'
      ? '<span class="badge badge-learning">SAP Learning에서도 이용 가능</span>'
      : '<span class="badge badge-hub">SAP Learning Hub 전용</span>';
    var material = hasMaterial(row)
      ? '<span class="badge badge-download">교재 다운로드 가능</span>'
      : '<span class="badge badge-none">과정 교재 해당 없음</span>';
    var productMeta = [row.product, row.product_subcategory].filter(Boolean).map(escapeHtml).join(' · ');

    return '<tr>' +
      '<td>' + language + '</td>' +
      '<td><span class="badge badge-tier">' + escapeHtml(typeLabel(row.learning_type)) + '</span></td>' +
      '<td><code>' + escapeHtml(row.learning_object_id) + '</code></td>' +
      '<td class="catalog-title">' + title + (productMeta ? '<span class="catalog-meta">' + productMeta + '</span>' : '') + '</td>' +
      '<td>' + escapeHtml(row.product_category || '—') + '</td>' +
      '<td class="num">' + escapeHtml(duration(row)) + '</td>' +
      '<td>' + escapeHtml(row.level || '—') + '</td>' +
      '<td>' + surface + '</td>' +
      '<td>' + material + '</td>' +
      '</tr>';
  }

  function render() {
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);
    var start = (currentPage - 1) * pageSize;
    var pageRows = filtered.slice(start, start + pageSize);
    body.innerHTML = pageRows.map(rowHtml).join('');
    count.textContent = filtered.length.toLocaleString('ko-KR') + '개 항목';
    pageLabel.textContent = currentPage.toLocaleString('ko-KR') + ' / ' + totalPages.toLocaleString('ko-KR') + ' 페이지';
    previous.disabled = currentPage <= 1;
    next.disabled = currentPage >= totalPages;
    empty.style.display = filtered.length ? 'none' : 'block';
  }

  function applyFilters() {
    var query = normalized(search.value.trim());
    var type = typeFilter.value;
    var language = languageFilter.value;
    var category = categoryFilter.value;
    var surface = surfaceFilter.value;

    filtered = rows.filter(function (row) {
      var haystack = normalized([
        row.learning_object_id, row.title, row.product, row.product_category,
        row.product_subcategory, row.role
      ].join(' '));
      return (!query || haystack.indexOf(query) !== -1) &&
        (!type || row.learning_type === type) &&
        (!language || row.language === language) &&
        (!category || row.product_category === category) &&
        (!surface || surfaceOf(row) === surface);
    });
    currentPage = 1;
    render();
  }

  populateFilters();
  [search, typeFilter, languageFilter, categoryFilter, surfaceFilter].forEach(function (control) {
    control.addEventListener(control === search ? 'input' : 'change', applyFilters);
  });
  previous.addEventListener('click', function () { currentPage -= 1; render(); window.scrollTo({ top: 260, behavior: 'smooth' }); });
  next.addEventListener('click', function () { currentPage += 1; render(); window.scrollTo({ top: 260, behavior: 'smooth' }); });
  reset.addEventListener('click', function () {
    search.value = '';
    typeFilter.value = '';
    languageFilter.value = '';
    categoryFilter.value = '';
    surfaceFilter.value = '';
    applyFilters();
  });
  search.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') reset.click();
  });

  render();
})();
