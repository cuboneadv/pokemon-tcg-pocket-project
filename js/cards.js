/* =========================================================
   cards.js — Card grid rendering, search, and filter logic
   ========================================================= */

import { fetchAllCards, fetchPullRates, fetchKoData, cardImageUrl } from './api.js';
import { openModal } from './modal.js';

// ── State ─────────────────────────────────────────────────
let ALL_CARDS = [];
let filteredCards = [];

const state = {
  query:      '',
  categories: new Set(),  // multi-select: 'Pokemon' | 'Item' | 'Tool' | 'Supporter' | 'Stadium'
  types:      new Set(),  // multi-select
  setIds:     new Set(),  // multi-select
  rarities:   new Set(),  // multi-select
};

// ── DOM references ────────────────────────────────────────
let gridEl, countEl, searchEl, progressEl;

// ─────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────
export async function init() {
  gridEl    = document.getElementById('card-grid');
  countEl   = document.getElementById('card-count');
  searchEl  = document.getElementById('search-input');
  progressEl = document.getElementById('load-progress');

  bindFilters();
  bindSearch();
  showSkeletons(calcSkeletonCount());

  try {
    // ko.json + pull rates를 카드 로딩 전에 병렬 준비
    await Promise.all([fetchKoData(), fetchPullRates()]);

    ALL_CARDS = await fetchAllCards((done, total) => {
      updateProgress(done, total);
    });

    hideProgress();
    applyFilters();
  } catch (err) {
    hideProgress();
    gridEl.innerHTML = `
      <div class="error-msg">
        카드 데이터를 불러올 수 없습니다.<br>네트워크 연결을 확인해 주세요.
      </div>`;
  }
}

// ─────────────────────────────────────────────────────────
// Progress indicator
// ─────────────────────────────────────────────────────────
function updateProgress(done, total) {
  if (!progressEl) return;
  progressEl.style.display = 'block';
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressEl.querySelector('.progress-bar').style.width = pct + '%';
  progressEl.querySelector('.progress-text').textContent =
    `카드 로딩 중... ${done} / ${total}`;
}

function hideProgress() {
  if (!progressEl) return;
  progressEl.style.display = 'none';
}

// ─────────────────────────────────────────────────────────
// Filter + search
// ─────────────────────────────────────────────────────────
function applyFilters() {
  const q = state.query.toLowerCase();

  filteredCards = ALL_CARDS.filter(c => {
    if (q && !c.name.toLowerCase().includes(q)) return false;

    // 카테고리 다중 선택
    if (state.categories.size) {
      const match = [...state.categories].some(cat =>
        cat === 'Pokemon'
          ? c.category === 'Pokemon'
          : c.category === 'Trainer' && c.trainerType === cat
      );
      if (!match) return false;
    }

    if (state.types.size    && !state.types.has(c.type))     return false;
    if (state.setIds.size   && !state.setIds.has(c.setId))   return false;
    if (state.rarities.size && !state.rarities.has(c.rarity)) return false;
    return true;
  });

  updateCount();
  renderCards(filteredCards);
}

function updateCount() {
  if (!countEl) return;
  countEl.textContent = `${filteredCards.length}`;
}

// ─────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────
export function renderCards(cards) {
  if (!gridEl) return;

  if (cards.length === 0) {
    gridEl.innerHTML = `<div class="no-results">검색 결과가 없습니다.</div>`;
    return;
  }

  gridEl.innerHTML = cards.map(cardHTML).join('');

  gridEl.querySelectorAll('.card-item').forEach(el => {
    el.addEventListener('click', () => openModal(el.dataset.id, filteredCards));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(el.dataset.id, filteredCards);
      }
    });
  });

  observeImages();
}

function cardHTML(c) {
  const imgKo = cardImageUrl(c, 'ko');
  const imgEn = cardImageUrl(c, 'en');
  return `
    <div class="card-item" data-id="${c.id}" role="listitem button" tabindex="0"
         aria-label="${c.name} 카드 보기">
      <div class="card-img-wrap">
        <img
          class="card-img"
          data-src="${imgKo}"
          data-src-en="${imgEn}"
          src="assets/card-back.png"
          alt="${c.name}"
        />
        <div class="card-shimmer active"></div>
      </div>
      <div class="card-info">
        <div class="card-name">${c.name}</div>
        <div class="card-meta">
          <span class="card-set">${c.setId}</span>
          <span class="card-num">#${c.number}</span>
          ${c.rarity ? `<span class="card-rarity">${c.rarity}</span>` : ''}
        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────
function calcSkeletonCount() {
  // Mirrors CSS: auto-fill minmax(160px, 1fr) gap 16px
  // cols = floor((containerWidth + gap) / (minColWidth + gap))
  const containerWidth = gridEl ? gridEl.clientWidth : window.innerWidth;
  const cols = Math.max(1, Math.floor((containerWidth + 16) / (160 + 16)));
  const rows = Math.ceil(window.innerHeight / 245) + 1;
  return cols * rows;
}

function showSkeletons(count = 20) {
  if (!gridEl) return;
  gridEl.innerHTML = Array(count).fill(`
    <div class="card-item skeleton-card" aria-hidden="true">
      <div class="card-img-wrap">
        <img src="assets/card-back.png" alt="" class="card-img skeleton-img" />
        <div class="card-shimmer active"></div>
      </div>
      <div class="card-info">
        <div class="skel-line skel-name"></div>
        <div class="skel-line skel-meta"></div>
      </div>
    </div>`).join('');
}

// ─────────────────────────────────────────────────────────
// Lazy image loading
// ─────────────────────────────────────────────────────────
function observeImages() {
  const imgs = gridEl.querySelectorAll('img[data-src]');
  if (!imgs.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;

      function tryLoad(src, fallbackSrc) {
        const newImg = new Image();
        newImg.onload = () => {
          img.src = src;
          img.removeAttribute('data-src');
          img.closest('.card-img-wrap')?.querySelector('.card-shimmer')?.classList.remove('active');
        };
        newImg.onerror = () => {
          if (fallbackSrc && src !== fallbackSrc) {
            tryLoad(fallbackSrc, null);
          } else {
            img.removeAttribute('data-src');
            img.closest('.card-img-wrap')?.querySelector('.card-shimmer')?.classList.remove('active');
          }
        };
        newImg.src = src;
      }

      tryLoad(img.dataset.src, img.dataset.srcEn);
      obs.unobserve(img);
    });
  }, { rootMargin: '300px' });

  imgs.forEach(img => observer.observe(img));
}

// ─────────────────────────────────────────────────────────
// Search binding
// ─────────────────────────────────────────────────────────
function bindSearch() {
  if (!searchEl) return;
  searchEl.addEventListener('input', () => {
    state.query = searchEl.value.trim();
    applyFilters();
  });
}

// ─────────────────────────────────────────────────────────
// Filter button bindings
// ─────────────────────────────────────────────────────────
function bindFilters() {
  document.querySelectorAll('[data-filter-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleSet(state.categories, btn.dataset.filterCategory);
      syncActiveSet('[data-filter-category]', 'data-filter-category', state.categories);
      applyFilters();
    });
  });

  document.querySelectorAll('[data-filter-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleSet(state.types, btn.dataset.filterType);
      syncActiveSet('[data-filter-type]', 'data-filter-type', state.types);
      applyFilters();
    });
  });

  document.querySelectorAll('[data-filter-set]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleSet(state.setIds, btn.dataset.filterSet);
      syncActiveSet('[data-filter-set]', 'data-filter-set', state.setIds);
      applyFilters();
    });
  });

  document.querySelectorAll('[data-filter-rarity]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleSet(state.rarities, btn.dataset.filterRarity);
      syncActiveSet('[data-filter-rarity]', 'data-filter-rarity', state.rarities);
      applyFilters();
    });
  });
}

function toggleSet(set, val) {
  if (set.has(val)) set.delete(val);
  else set.add(val);
}

function syncActiveSet(selector, attr, activeSet) {
  document.querySelectorAll(selector).forEach(btn => {
    btn.classList.toggle('active', activeSet.has(btn.getAttribute(attr)));
  });
}

// ─────────────────────────────────────────────────────────
// Expose for modal prev/next
// ─────────────────────────────────────────────────────────
export function getFilteredCards() {
  return filteredCards;
}
