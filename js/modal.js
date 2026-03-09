/* =========================================================
   modal.js — Card detail modal
   ========================================================= */

import { fetchCardDetail, getRatesForCard, cardImageUrl } from './api.js';

// ── State ─────────────────────────────────────────────────
let currentIndex  = 0;
let currentList   = [];
let currentLang   = 'ko';   // default Korean
let currentEffect = true;   // ring effect on/off

// ── Type → Korean name ────────────────────────────────────
const TYPE_KO = {
  Grass:     '풀',
  Fire:      '불꽃',
  Water:     '물',
  Lightning: '번개',
  Psychic:   '초능력',
  Fighting:  '격투',
  Darkness:  '악',
  Metal:     '강철',
  Dragon:    '드래곤',
  Colorless: '무색',
};

// ── Stage → Korean name (TCGdex: "Stage1"/"Stage2" no space) ─
const STAGE_KO = {
  'Basic':   '기본',
  'Stage1':  '1진화',
  'Stage2':  '2진화',
  'Stage 1': '1진화',
  'Stage 2': '2진화',
  'EX':      'EX',
  'V':       'V',
  'VMAX':    'VMAX',
  'Restored':'복원',
};

// ── Set ID → Korean name ──────────────────────────────────
const SET_NAME_KO = {
  'A1':     '최강의 유전자',
  'A1a':    '환상이 있는 섬',
  'A2':     '시공의 격투',
  'A2a':    '초극의 빛',
  'A2b':    '샤이닝 하이',
  'A3':     '쌍천의 수호자',
  'A3a':    '이차원 크라이시스',
  'A3b':    '이브이 가든',
  'A4':     '하늘과 바다의 인도',
  'A4a':    '미지의 수역',
  'A4b':    '하이클래스팩 ex',
  'PROMO-A':'프로모 A',
};

// ── Type → gradient ───────────────────────────────────────
const TYPE_GRADIENT = {
  Grass:     'radial-gradient(ellipse at center, #1e5c1e 0%, #0a1a0a 60%, #0f0f0f 100%)',
  Fire:      'radial-gradient(ellipse at center, #5a2000 0%, #1a0800 60%, #0f0f0f 100%)',
  Water:     'radial-gradient(ellipse at center, #003a8c 0%, #001230 60%, #0f0f0f 100%)',
  Lightning: 'radial-gradient(ellipse at center, #665200 0%, #1a1400 60%, #0f0f0f 100%)',
  Psychic:   'radial-gradient(ellipse at center, #5c005c 0%, #1a001a 60%, #0f0f0f 100%)',
  Fighting:  'radial-gradient(ellipse at center, #5c2e00 0%, #1a0c00 60%, #0f0f0f 100%)',
  Darkness:  'radial-gradient(ellipse at center, #1a1a3a 0%, #0a0a18 60%, #0f0f0f 100%)',
  Metal:     'radial-gradient(ellipse at center, #2a3a47 0%, #0e1318 60%, #0f0f0f 100%)',
  Dragon:    'radial-gradient(ellipse at center, #003355 0%, #001020 60%, #0f0f0f 100%)',
  Colorless: 'radial-gradient(ellipse at center, #2a2a2a 0%, #141414 60%, #0f0f0f 100%)',
};

// ── Energy type → icon file ───────────────────────────────
const ENERGY_ICON = {
  Grass:     'assets/types/grass.png',
  Fire:      'assets/types/fire.png',
  Water:     'assets/types/water.png',
  Lightning: 'assets/types/lightning.png',
  Psychic:   'assets/types/psychic.png',
  Fighting:  'assets/types/fighting.png',
  Darkness:  'assets/types/darkness.png',
  Metal:     'assets/types/metal.png',
  Dragon:    'assets/types/dragon.png',
  Colorless: 'assets/types/colorless.png',
};

// ── pocketgg 에너지 코드 → TCGdex 타입명 ─────────────────
const ENERGY_CODE_MAP = {
  GR: 'Grass',
  FI: 'Fire',
  WA: 'Water',
  EL: 'Lightning',
  PS: 'Psychic',
  FG: 'Fighting',
  DA: 'Darkness',
  ST: 'Metal',
  DR: 'Dragon',
  CO: 'Colorless',
};

// ─────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────
export function openModal(cardId, cardList) {
  currentList  = cardList || [];
  currentIndex = currentList.findIndex(c => c.id === cardId);
  currentLang  = 'ko';
  _renderModal(cardId);
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', _onKeyDown);
  _removeTrapFocus();
}

// ─────────────────────────────────────────────────────────
// Internal render
// ─────────────────────────────────────────────────────────
async function _renderModal(cardId) {
  const overlay = document.getElementById('modal-overlay');
  const panel   = document.getElementById('modal-panel');
  if (!overlay || !panel) return;

  overlay.classList.add('open');
  document.body.classList.add('modal-open');
  panel.innerHTML = _loadingHTML();
  _trapFocus(panel);

  overlay.onclick = e => { if (e.target === overlay) closeModal(); };
  document.addEventListener('keydown', _onKeyDown);

  try {
    const stub  = currentList[currentIndex] || { id: cardId };
    const setId   = stub.setId   || cardId.split('-')[0];
    const localId = stub.localId || cardId.replace(/^[^-]+-/, '');

    const card = await fetchCardDetail(setId, localId);
    if (!card) throw new Error('No card data');

    panel.innerHTML = _cardHTML(card);
    _bindEvents(panel, card);

  } catch {
    panel.innerHTML = _errorHTML();
    panel.querySelector('#modal-close')?.addEventListener('click', closeModal);
  }
}

// ─────────────────────────────────────────────────────────
// HTML builders
// ─────────────────────────────────────────────────────────
function _loadingHTML() {
  return `
    <div class="modal-loading" role="status" aria-live="polite">
      <img src="assets/card-back.png" alt="로딩 중" class="modal-loading-img" />
      <p>카드 정보를 불러오는 중...</p>
      <button class="modal-close-btn" id="modal-close" aria-label="닫기">✕</button>
    </div>`;
}

function _errorHTML() {
  return `
    <div class="modal-error">
      <p>카드 정보를 불러올 수 없습니다.</p>
      <button class="modal-close-btn" id="modal-close" aria-label="닫기">✕</button>
    </div>`;
}

function _cardHTML(card) {
  const imgKo     = cardImageUrl(card, 'ko');
  const imgEn     = cardImageUrl(card, 'en');
  const imgDefault     = currentLang === 'ko' ? imgKo : imgEn;
  const rawEffectClass = _effectClass(card);
  const effectClass    = currentEffect ? rawEffectClass : '';
  const rates          = getRatesForCard(card);
  const hasPrev   = currentIndex > 0;
  const hasNext   = currentIndex < currentList.length - 1;
  const typeKo       = TYPE_KO[card.type]  || card.type;
  const stageKo      = STAGE_KO[card.stage] || card.stage;
  const TRAINER_TYPE_KO = { Item: '아이템', Tool: '포켓몬의 도구', Supporter: '서포트', Stadium: '스타디움' };
  const isTrainer    = card.category === 'Trainer';
  const trainerLabel = TRAINER_TYPE_KO[card.trainerType] || card.trainerType;

  return `
    <button class="modal-close-btn" id="modal-close" aria-label="닫기">✕</button>

    ${hasPrev ? `<button class="modal-nav modal-prev" id="modal-prev" aria-label="이전 카드">‹</button>` : ''}
    ${hasNext ? `<button class="modal-nav modal-next" id="modal-next" aria-label="다음 카드">›</button>` : ''}

    <div class="modal-inner">

      <!-- LEFT -->
      <div class="modal-left">
        <div class="modal-card-wrap">
          <div class="card-scene">
            <div class="card-tilt-wrap" id="card-tilt-wrap">
              <img
                id="modal-card-img"
                src="${imgDefault}"
                data-en="${imgEn}"
                data-ko="${imgKo}"
                alt="${card.name}"
                class="modal-card-img${effectClass ? ' ' + effectClass : ''}"
                onerror="if(this.src!==this.dataset.en){this.src=this.dataset.en}else{this.src='assets/card-back.png'}"
              />
              <div class="card-gloss" id="card-gloss"></div>
            </div>
            <div class="card-shadow" id="card-shadow"></div>
          </div>
          ${hasPrev ? `<div class="card-nav-hint card-nav-prev">‹</div>` : ''}
          ${hasNext ? `<div class="card-nav-hint card-nav-next">›</div>` : ''}
        </div>
        <button class="lang-toggle-btn" id="lang-toggle" aria-label="언어 전환">
          ${currentLang === 'ko' ? 'KO' : 'EN'}
        </button>
        ${rawEffectClass ? `<button class="fx-toggle-btn${currentEffect ? '' : ' fx-off'}" id="effect-toggle" aria-label="이펙트 전환">✦</button>` : ''}
      </div>

      <!-- RIGHT -->
      <div class="modal-right">

        <div class="modal-title-row">
          <h2 class="modal-card-name">${card.name}</h2>
          <div class="modal-number-rarity">
            ${card.rarity ? `<span class="rarity-sym">${card.rarity}</span>` : ''}
            <span class="card-number">#${card.number}</span>
          </div>
        </div>

        <div class="modal-badges">
          ${!isTrainer && card.stage   ? `<span class="badge badge-stage">${stageKo}</span>`       : ''}
          ${isTrainer  && trainerLabel ? `<span class="badge badge-trainer">${trainerLabel}</span>` : ''}
          ${card.type ? `<span class="badge badge-type">${_energyBadge(card.type)} ${typeKo}</span>` : ''}
          ${card.hp   ? `<span class="badge badge-hp">HP ${card.hp}</span>` : ''}
        </div>

        ${card.desc ? `<p class="modal-desc">${card.desc}</p>` : ''}

        ${_trainerEffectHTML(card)}
        ${_abilityHTML(card)}
        ${_attacksHTML(card)}

        <div class="modal-divider"></div>

        <div class="modal-stats-row">
          <div class="modal-stat">
            <span class="stat-label">약점</span>
            <span class="stat-val">
              ${card.weakness
                ? `${_energyBadge(card.weakness)} ${TYPE_KO[card.weakness] || card.weakness}`
                : '없음'}
            </span>
          </div>
          <div class="modal-stat">
            <span class="stat-label">후퇴</span>
            <span class="stat-val">${_retreatHTML(card.retreat)}</span>
          </div>
        </div>

        ${_packHTML(card)}
        ${_pullRatesHTML(rates)}
        ${_relatedCardsHTML(card)}

        ${card.illustrator ? `
        <div class="modal-divider"></div>
        <div class="modal-illustrator">
          <span class="stat-label">일러스트레이터</span>
          <span class="illustrator-name">${card.illustrator}</span>
        </div>` : ''}

      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────
// Section builders
// ─────────────────────────────────────────────────────────
function _trainerEffectHTML(card) {
  if (card.category !== 'Trainer' || !card.effect) return '';
  return `
    <div class="modal-divider"></div>
    <div class="modal-section-label">효과</div>
    <div class="attack-row">
      <p class="attack-desc">${_inlineEnergy(card.effect)}</p>
    </div>`;
}

function _abilityHTML(card) {
  if (!card.ability) return '';
  return `
    <div class="modal-divider"></div>
    <div class="modal-section-label">특성</div>
    <div class="attack-row ability-row">
      <div class="attack-header">
        <span class="ability-name">${card.ability.name}</span>
      </div>
      ${card.ability.effect ? `<p class="attack-desc">${_inlineEnergy(card.ability.effect)}</p>` : ''}
    </div>`;
}

function _attacksHTML(card) {
  if (!card.attacks || !card.attacks.length) return '';
  return `
    <div class="modal-divider"></div>
    <div class="modal-section-label">기술</div>
    <div class="modal-attacks">
      ${card.attacks.map(a => `
        <div class="attack-row">
          <div class="attack-header">
            <div class="attack-cost-name">
              <div class="attack-cost">
                ${(a.cost || []).map(t => _energyBadge(t)).join('')}
              </div>
              <span class="attack-name">${a.name}</span>
            </div>
            <span class="attack-dmg">${a.damage || '—'}</span>
          </div>
          ${a.desc ? `<p class="attack-desc">${_inlineEnergy(a.desc)}</p>` : ''}
        </div>`).join('')}
    </div>`;
}

function _packHTML(card) {
  if (!card.setId) return '';
  const label = SET_NAME_KO[card.setId] || card.setName || card.setId;
  return `
    <div class="modal-divider"></div>
    <div class="modal-pack-row">
      <span class="stat-label">팩</span>
      <span class="pack-name">${label}</span>
    </div>`;
}

function _pullRatesHTML(_rates) {
  // 출현율 데이터 준비 중 — 추후 제공 예정
  return '';
}

// ─────────────────────────────────────────────────────────
// Related cards
// ─────────────────────────────────────────────────────────

// Strip TCG suffixes to get base Pokémon name (e.g. "Pikachu ex" → "Pikachu")
function _baseName(name) {
  return name.replace(/\s+(ex|EX|V|VMAX|VSTAR|GX)$/i, '').trim();
}

// Build the full evolution family (Set of English base names) from currentList
// evolveFrom is always English from TCGdex — must match against nameEn, not name
function _buildFamily(card) {
  if (card.category === 'Trainer' || !card.nameEn) return new Set();

  const family = new Set();
  family.add(_baseName(card.nameEn));

  // Walk UP via evolveFrom chain
  let cur = card;
  const seen = new Set([card.id]);
  while (cur?.evolveFrom) {
    const parentBase = _baseName(cur.evolveFrom);
    if (family.has(parentBase)) break;
    family.add(parentBase);
    cur = currentList.find(c => !seen.has(c.id) && _baseName(c.nameEn) === parentBase);
    if (cur) seen.add(cur.id);
  }

  // Walk DOWN: find all cards that evolve from any family member
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of currentList) {
      if (c.evolveFrom && !family.has(_baseName(c.nameEn))) {
        if (family.has(_baseName(c.evolveFrom))) {
          family.add(_baseName(c.nameEn));
          changed = true;
        }
      }
    }
  }

  return family;
}

function _relatedCardsHTML(card) {
  if (card.category === 'Trainer') return '';

  const family  = _buildFamily(card);
  const related = currentList.filter(c =>
    c.id !== card.id &&
    c.category !== 'Trainer' &&
    family.has(_baseName(c.nameEn))
  );

  if (!related.length) return '';

  const thumbs = related.map(c => {
    const img = cardImageUrl(c, currentLang);
    const fallback = cardImageUrl(c, 'en');
    return `
      <button class="related-card-thumb" data-card-id="${c.id}" aria-label="${c.name}">
        <img src="${img}" alt="${c.name}"
          onerror="if(this.src!=='${fallback}')this.src='${fallback}'">
        ${c.rarity ? `<span class="related-card-rarity">${c.rarity}</span>` : ''}
      </button>`;
  }).join('');

  return `
    <div class="modal-divider"></div>
    <div class="modal-section-label">관련 카드</div>
    <div class="related-cards-scroll">${thumbs}</div>`;
}

// ─────────────────────────────────────────────────────────
// Effect class resolver
// ─────────────────────────────────────────────────────────
function _effectClass(card) {
  const r = card.rarity || '';
  if (r === '♛')    return 'fx-crown';
  if (r === '☆☆☆')  return 'fx-star3';
  if (r === '☆☆')   return 'fx-star2';
  if (r === '☆')    return 'fx-star1';
  if (r === '◇◇◇◇') return `fx-type-${(card.type || 'Colorless').toLowerCase()}`;
  return '';
}

const _ALL_FX = [
  'fx-star1','fx-star2','fx-star3','fx-crown',
  'fx-type-grass','fx-type-fire','fx-type-water','fx-type-lightning',
  'fx-type-psychic','fx-type-fighting','fx-type-darkness',
  'fx-type-metal','fx-type-dragon','fx-type-colorless',
];

// ─────────────────────────────────────────────────────────
// Energy badge (PNG image)
// ─────────────────────────────────────────────────────────
function _energyBadge(type) {
  const src = ENERGY_ICON[type] || ENERGY_ICON.Colorless;
  const label = TYPE_KO[type] || type;
  return `<img class="type-icon" src="${src}" alt="${label}" title="${label}">`;
}

// 설명 텍스트 안의 "PS에너지", "EL 에너지" 등을 이미지로 교체
function _inlineEnergy(text) {
  if (!text) return text;
  const codes = Object.keys(ENERGY_CODE_MAP).join('|');
  const re = new RegExp(`(${codes})\\s?에너지`, 'g');
  return text.replace(re, (_, code) => {
    const type = ENERGY_CODE_MAP[code];
    const src  = ENERGY_ICON[type] || ENERGY_ICON.Colorless;
    const label = TYPE_KO[type] || type;
    return `<img class="type-icon-sm" src="${src}" alt="${label}" title="${label}">에너지`;
  });
}

function _retreatHTML(count) {
  if (!count) return '없음';
  return Array(count).fill(_energyBadge('Colorless')).join('');
}

// ─────────────────────────────────────────────────────────
// Event binding
// ─────────────────────────────────────────────────────────
function _bindEvents(panel, card) {
  panel.querySelector('#modal-close')?.addEventListener('click', closeModal);

  panel.querySelector('#lang-toggle')?.addEventListener('click', () => {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    const img = panel.querySelector('#modal-card-img');
    const btn = panel.querySelector('#lang-toggle');
    if (img) img.src = currentLang === 'ko' ? img.dataset.ko : img.dataset.en;
    if (btn) btn.textContent = currentLang === 'ko' ? 'KO' : 'EN';
  });

  panel.querySelector('#effect-toggle')?.addEventListener('click', () => {
    currentEffect = !currentEffect;
    const img = panel.querySelector('#modal-card-img');
    const btn = panel.querySelector('#effect-toggle');
    if (img) {
      _ALL_FX.forEach(c => img.classList.remove(c));
      if (currentEffect) {
        const cls = _effectClass(card);
        if (cls) img.classList.add(cls);
      }
    }
    if (btn) btn.classList.toggle('fx-off', !currentEffect);
  });

  panel.querySelector('#modal-prev')?.addEventListener('click', () => {
    if (currentIndex > 0) { currentIndex--; _renderModal(currentList[currentIndex].id); }
  });

  panel.querySelector('#modal-next')?.addEventListener('click', () => {
    if (currentIndex < currentList.length - 1) { currentIndex++; _renderModal(currentList[currentIndex].id); }
  });

  panel.querySelector('#modal-card-img')?.addEventListener('click', e => {
    const half = e.currentTarget.offsetWidth / 2;
    if (e.offsetX < half) {
      if (currentIndex > 0) { currentIndex--; _renderModal(currentList[currentIndex].id); }
    } else {
      if (currentIndex < currentList.length - 1) { currentIndex++; _renderModal(currentList[currentIndex].id); }
    }
  });

  panel.querySelectorAll('.related-card-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      const id  = btn.dataset.cardId;
      const idx = currentList.findIndex(c => c.id === id);
      if (idx !== -1) { currentIndex = idx; _renderModal(id); }
    });
  });

  // ── 3D 틸트 (C안: 틸트 + 글로스 + 다이나믹 그림자) ──
  const tiltWrap = panel.querySelector('#card-tilt-wrap');
  const gloss    = panel.querySelector('#card-gloss');
  const shadow   = panel.querySelector('#card-shadow');
  const MAX_TILT = 14;

  if (tiltWrap) {
    tiltWrap.addEventListener('mousemove', e => {
      const rect = tiltWrap.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
      const dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
      tiltWrap.classList.remove('resetting');
      tiltWrap.style.transform = `rotateX(${-dy * MAX_TILT}deg) rotateY(${dx * MAX_TILT}deg)`;
      if (gloss) {
        const gx = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
        const gy = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
        gloss.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 38%, transparent 65%)`;
        gloss.style.opacity = '1';
      }
      if (shadow) shadow.style.transform = `translateX(${dx * 14}px) scaleX(${1 - Math.abs(dx) * 0.15})`;
    });

    tiltWrap.addEventListener('mouseleave', () => {
      tiltWrap.classList.add('resetting');
      tiltWrap.style.transform = 'rotateX(0deg) rotateY(0deg)';
      if (gloss) { gloss.style.opacity = '0'; gloss.style.background = ''; }
      if (shadow) shadow.style.transform = '';
    });
  }
}

// ─────────────────────────────────────────────────────────
// Keyboard
// ─────────────────────────────────────────────────────────
function _onKeyDown(e) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay?.classList.contains('open')) return;

  if (e.key === 'Escape') {
    closeModal();
  } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
    currentIndex--; _renderModal(currentList[currentIndex].id);
  } else if (e.key === 'ArrowRight' && currentIndex < currentList.length - 1) {
    currentIndex++; _renderModal(currentList[currentIndex].id);
  }
}

// ─────────────────────────────────────────────────────────
// Focus trap
// ─────────────────────────────────────────────────────────
function _trapFocus(panel) {
  panel._focusTrap = e => {
    if (e.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
    )];
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  panel.addEventListener('keydown', panel._focusTrap);
  setTimeout(() => panel.querySelector('#modal-close')?.focus(), 50);
}

function _removeTrapFocus() {
  const panel = document.getElementById('modal-panel');
  if (panel?._focusTrap) {
    panel.removeEventListener('keydown', panel._focusTrap);
    delete panel._focusTrap;
  }
}
