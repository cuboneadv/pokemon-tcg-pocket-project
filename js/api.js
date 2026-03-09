/* =========================================================
   api.js — TCGdex API + Pull Rates data layer
   ========================================================= */

const API_BASE = 'https://api.tcgdex.net/v2/en';
const PULL_RATES_URL =
  'https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/pullRates.json';

const TARGET_SETS = ['A1', 'A1a', 'A2'];

// ── Rarity text → symbol mapping (API returns English text) ──
const RARITY_TEXT_TO_SYM = {
  'One Diamond':    '◇',
  'Two Diamond':    '◇◇',
  'Three Diamond':  '◇◇◇',
  'Four Diamond':   '◇◇◇◇',
  'One Star':       '☆',
  'Two Star':       '☆☆',
  'Three Star':     '☆☆☆',
  'Crown':          '♛',
  'Promo':          'PROMO',
};

// ── Manual rarity overrides (TCGdex returns "None" for these) ──
const RARITY_OVERRIDE = {
  'A1-265': '☆☆',   // Wigglytuff ex — TCGdex data gap
  'A1-279': '☆☆',   // Wigglytuff ex — TCGdex data gap
};

// ── Rarity symbol → pull-rates JSON code ─────────────────
const RARITY_CODE = {
  '◇':    'C',
  '◇◇':   'U',
  '◇◇◇':  'R',
  '◇◇◇◇': 'RR',
  '☆':    'SR',
  '☆☆':   'SAR',
  '☆☆☆':  'IM',
  '♛':    'UR',
};

// ── In-memory caches ──────────────────────────────────────
let _pullRates = null;
let _koData    = null;   // data/ko.json

// ─────────────────────────────────────────────────────────
// localStorage helpers (24 hr TTL)
// ─────────────────────────────────────────────────────────
const CACHE_TTL = 24 * 60 * 60 * 1000;

const CACHE_PREFIX = 'tcgp_v12_';

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + key); return null; }
    return data;
  } catch { return null; }
}

function cacheSet(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* quota exceeded — skip */ }
}

// ─────────────────────────────────────────────────────────
// Core fetch helper
// ─────────────────────────────────────────────────────────
async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────
// Fetch Korean translation data (data/ko.json)
// ─────────────────────────────────────────────────────────
export async function fetchKoData() {
  if (_koData) return _koData;
  try {
    const res = await fetch('data/ko.json');
    if (!res.ok) throw new Error(`ko.json ${res.status}`);
    _koData = await res.json();
  } catch {
    _koData = {};  // silent fail — English fallback
  }
  return _koData;
}

// Apply Korean translations to a normalised card (mutates in-place)
function applyKo(card) {
  if (!_koData) return card;
  const ko = _koData[card.id];
  if (!ko) return card;

  if (ko.name)   card.name   = ko.name;
  if (ko.desc)   card.desc   = ko.desc;
  if (ko.effect) card.effect = ko.effect;

  if (ko.attacks && ko.attacks.length) {
    card.attacks = card.attacks.map((atk, i) => {
      const koAtk = ko.attacks[i];
      if (!koAtk) return atk;
      return {
        ...atk,
        name: koAtk.name || atk.name,
        desc: koAtk.effect !== undefined ? (koAtk.effect ?? '') : atk.desc,
      };
    });
  }

  if (ko.ability && ko.ability.name) {
    card.ability = {
      name:   ko.ability.name,
      effect: ko.ability.effect ?? card.ability?.effect ?? '',
    };
  }

  return card;
}

// ─────────────────────────────────────────────────────────
// Fetch all cards for the target sets (with full detail)
// ─────────────────────────────────────────────────────────
export async function fetchAllCards(onProgress) {
  const allCards = [];

  for (const setId of TARGET_SETS) {
    const cards = await fetchSetAllCards(setId, onProgress);
    allCards.push(...cards);
  }

  return allCards;
}

// Fetch all card details for one set
async function fetchSetAllCards(setId, onProgress) {
  const cacheKey = `set_full_${setId}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    if (onProgress) onProgress(cached.length, cached.length);
    return cached;
  }

  // Step 1: get card list (stubs)
  const setData = await apiFetch(`/sets/${setId}`);
  const setName = setData.name || setId;
  const stubs = setData.cards || [];

  // Step 2: batch-fetch individual cards (20 at a time)
  const BATCH = 20;
  const results = [];
  let done = 0;

  for (let i = 0; i < stubs.length; i += BATCH) {
    const batch = stubs.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map(stub => fetchCardSingle(setId, stub.localId))
    );
    settled.forEach((r, j) => {
      if (r.status === 'fulfilled' && r.value) {
        results.push(r.value);
      } else {
        // Fallback: use stub data only
        results.push(normaliseStub(batch[j], setId, setName));
      }
    });
    done += batch.length;
    if (onProgress) onProgress(done, stubs.length);
  }

  cacheSet(cacheKey, results);
  return results;
}

// Fetch a single card detail
async function fetchCardSingle(setId, localId) {
  const cacheKey = `card_${setId}_${localId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const raw = await apiFetch(`/sets/${setId}/${localId}`);
  const card = normaliseCardDetail(raw, setId);
  cacheSet(cacheKey, card);
  return card;
}

// ─────────────────────────────────────────────────────────
// Fetch full card detail for modal (re-uses single fetch)
// ─────────────────────────────────────────────────────────
export async function fetchCardDetail(setId, localId) {
  return fetchCardSingle(setId, localId);
}

// ─────────────────────────────────────────────────────────
// Fetch pull rates
// ─────────────────────────────────────────────────────────
export async function fetchPullRates() {
  if (_pullRates) return _pullRates;
  const cached = cacheGet('pull_rates');
  if (cached) { _pullRates = cached; return _pullRates; }

  try {
    const res = await fetch(PULL_RATES_URL);
    if (!res.ok) throw new Error(`Pull rates HTTP ${res.status}`);
    const data = await res.json();
    cacheSet('pull_rates', data);
    _pullRates = data;
  } catch {
    _pullRates = {};
  }
  return _pullRates;
}

// ─────────────────────────────────────────────────────────
// Get slot pull rates for a card
// ─────────────────────────────────────────────────────────
export function getRatesForCard(card) {
  if (!_pullRates || !card.setId || !card.rarity) return null;
  const setRates = _pullRates[card.setId];
  if (!setRates) return null;
  const code = RARITY_CODE[card.rarity];
  if (!code) return null;

  const result = {};
  for (const [packType, packData] of Object.entries(setRates)) {
    if (!packData.slots) continue;
    const slotRates = {};
    for (const [slot, rarities] of Object.entries(packData.slots)) {
      slotRates[slot] = rarities[code] ?? null;
    }
    result[packType] = slotRates;
  }
  return Object.keys(result).length ? result : null;
}

// ─────────────────────────────────────────────────────────
// Normalisation
// ─────────────────────────────────────────────────────────
function normaliseRarity(raw) {
  if (!raw || raw === 'None') return '';
  return RARITY_TEXT_TO_SYM[raw] || raw;
}

function normaliseCardDetail(raw, setId) {
  const id     = raw.id || `${setId}-${raw.localId}`;
  const rarity = RARITY_OVERRIDE[id] || normaliseRarity(raw.rarity);
  const card = {
    id,
    localId:     String(raw.localId || ''),
    setId,
    setName:     raw.set?.name || setId,
    image:       raw.image || '',
    name:        raw.name || '???',
    nameEn:      raw.name || '???',   // always English — used for evolveFrom matching
    rarity,
    evolveFrom:  raw.evolveFrom || '',
    number:      String(raw.localId || ''),
    hp:          raw.hp || 0,
    type:        (raw.types && raw.types[0]) || '',
    category:    raw.category || 'Pokemon',
    trainerType: raw.trainerType || '',
    stage:       raw.stage || '',
    weakness:    raw.weaknesses?.[0]?.type || '',
    retreat:     raw.retreat || 0,
    desc:        raw.description || '',
    effect:      raw.effect || '',
    illustrator: raw.illustrator || '',
    ability:     raw.abilities?.[0]
                   ? { name: raw.abilities[0].name || '', effect: raw.abilities[0].effect || '' }
                   : null,
    attacks:     (raw.attacks || []).map(a => ({
      name:   a.name || '',
      cost:   a.cost || [],
      damage: a.damage || '',
      desc:   a.effect || '',
    })),
    _detailLoaded: true,
  };
  return applyKo(card);
}

function normaliseStub(raw, setId, setName) {
  return {
    id:          raw.id || `${setId}-${raw.localId}`,
    localId:     String(raw.localId || ''),
    setId,
    setName,
    image:       raw.image || '',
    name:        raw.name || '???',
    rarity:      '',
    number:      String(raw.localId || ''),
    hp:          0,
    type:        '',
    category:    '',
    trainerType: '',
    stage:       '',
    weakness:    '',
    retreat:     0,
    desc:        '',
    effect:      '',
    illustrator: '',
    attacks:     [],
    _detailLoaded: false,
  };
}

// ─────────────────────────────────────────────────────────
// Image URL
// ─────────────────────────────────────────────────────────
export function cardImageUrl(card, lang = 'en') {
  if (card.image) {
    return card.image.replace('/en/', `/${lang}/`) + '/high.webp';
  }
  return `https://assets.tcgdex.net/${lang}/tcgp/${card.setId}/${card.localId}/high.webp`;
}
