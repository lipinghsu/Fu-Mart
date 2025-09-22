/**
 * seedProductSalesHistory.js
 *
 * For each product:
 *  - Generates made-up sales events close to the product's current price
 *  - Writes:
 *      salesHistory: [{ date, price, soldBy, soldTo, quantity, currency, time }]
 *      priceHistory: [{ date, price }]   // ready for <PriceHistory data={...} />
 *
 * Usage: `node seedProductSalesHistory.js`
 */

import admin from 'firebase-admin';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// -------- ESM __dirname helpers --------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// -------- Load service account --------
const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
const rawServiceAccount = await fs.readFile(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(rawServiceAccount);

// -------- Init Firebase Admin --------
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// -------- Config --------
const PRODUCTS_COLLECTION = 'products';
const COMMIT_AT = 400;   // batch size
const DRY_RUN = false;   // true = log only, no writes

// How many events + how far back
const MIN_EVENTS = 20;
const MAX_EVENTS = 50;
const DAYS_LOOKBACK = 120;

// Price jitter (kept mostly close to current price)
const BASE_PCT_JITTER = 0.05;     // ±5% typical
const OCCASIONAL_EXTRA_JITTER = 0.08; // ±8% rare spike/dip

// Quantity distribution
const QTY_WEIGHTS = [
  { qty: 1, w: 0.70 },
  { qty: 2, w: 0.20 },
  { qty: 3, w: 0.07 },
  { qty: 4, w: 0.03 },
];

// -------- Sample buyers (soldTo) --------
const USER_ID_POOL = [
  'WqCXeNbzHtXwAiVNBiXi0UVCnw63',
  'Z96FgWxEwLaPDRVoCRaA8UunORG2',
  'jTy0gIoW6RZoQOZ99FBKWTOs6qD2',
  'nrkXyKRbkjPeWTL8FDIqiR7l10Z2',
  'pqp7ne7fdAQxByauLK3xpYW4kyv1',
  'vAhQXMAYBGaaDR2fy84y7kyCYb72',
];

function rng(seedStr = '') {
  // tiny seeded PRNG so re-runs are consistent per product
  let s = 0;
  for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) >>> 0;
  return () => {
    // xorshift32
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17; s >>>= 0;
    s ^= s << 5;  s >>>= 0;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function pickWeighted(weights, r) {
  const total = weights.reduce((a, b) => a + b.w, 0);
  let x = r() * total;
  for (const item of weights) {
    if (x < item.w) return item.qty;
    x -= item.w;
  }
  return weights[weights.length - 1].qty;
}

function toISODate(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function clamp2(n) {
  return Math.round(n * 100) / 100;
}

function deriveBasePrice(p) {
  const candidates = [
    Number(p?.price),
    Number(p?.currentPrice),
    Number(p?.salePrice),
  ].filter((n) => Number.isFinite(n) && n > 0);
  if (candidates.length) return candidates[0];
  return 9.99; // fallback
}

function sampleSoldBy(product, r) {
  // prefer usernames from sellBy array (string or object with username/user/userId)
  const sb = Array.isArray(product.sellBy) ? product.sellBy : [];
  const names = sb.map((x) => {
    if (!x) return null;
    if (typeof x === 'string') return x;
    if (typeof x === 'object') {
      return x.username || x.user || x.userId || null;
    }
    return null;
  }).filter(Boolean);

  if (names.length === 0) {
    const pool = ['system', 'shop', 'market', 'auto', 'guest'];
    return pool[Math.floor(r() * pool.length)];
  }
  return names[Math.floor(r() * names.length)];
}

function makeBuyerPicker(r) {
  // slight repeat-buyer bias: 25% chance to reuse last buyer, else random
  let last = null;
  return () => {
    if (last && r() < 0.25) return last;
    const pick = USER_ID_POOL[Math.floor(r() * USER_ID_POOL.length)];
    last = pick;
    return pick;
  };
}

function buildEventsForProduct(product, seed) {
  const r = rng(seed);
  const base = deriveBasePrice(product);

  const count = Math.floor(MIN_EVENTS + r() * (MAX_EVENTS - MIN_EVENTS + 1));
  const today = new Date();
  const dates = new Set();
  while (dates.size < count) {
    const back = Math.floor(r() * DAYS_LOOKBACK); // 0..DAYS_LOOKBACK-1
    const d = new Date(today);
    d.setDate(d.getDate() - back);
    dates.add(toISODate(d));
  }
  const sortedDates = Array.from(dates).sort((a, b) => new Date(a) - new Date(b));

  const pickBuyer = makeBuyerPicker(r);
  const events = [];

  for (const iso of sortedDates) {
    // price: mostly ±5%, sometimes ±8%
    const useExtra = r() < 0.15;
    const jitter = (useExtra ? OCCASIONAL_EXTRA_JITTER : BASE_PCT_JITTER);
    const pct = (r() * 2 - 0.999) * jitter;
    const price = clamp2(base * (1 + pct));

    const quantity = pickWeighted(QTY_WEIGHTS, r);
    const soldBy = sampleSoldBy(product, r);
    const soldTo = pickBuyer(); // <-- new

    // add some intra-day time so they don't all look like midnight
    const hour = Math.floor(r() * 24);
    const minute = Math.floor(r() * 60);
    const second = Math.floor(r() * 60);
    const dateTime = new Date(
      `${iso}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:${String(second).padStart(2,'0')}.000Z`
    );

    events.push({
      date: iso,               // chart uses this
      price,                   // chart uses this
      soldBy,
      soldTo,                  // <-- new: buyer user id
      quantity,
      currency: product.currency || 'USD',
      time: dateTime.toISOString(), // full timestamp
    });
  }

  const priceHistory = events.map(e => ({ date: e.date, price: e.price }));
  return { salesHistory: events, priceHistory };
}

async function seedProductSalesHistory() {
  console.log('⏳ Scanning products…');
  const snap = await db.collection(PRODUCTS_COLLECTION).get();

  if (snap.empty) {
    console.log('No products found. Exiting.');
    return;
  }

  console.log(`Found ${snap.size} product(s). Generating history…`);

  let batch = db.batch();
  let ops = 0;
  let updated = 0;

  async function flushBatch(reason = '') {
    if (ops === 0) return;
    if (!DRY_RUN) await batch.commit();
    console.log(`✔ Committed ${ops} updates${reason ? ` (${reason})` : ''}`);
    batch = db.batch();
    ops = 0;
  }

  for (const doc of snap.docs) {
    const ref = doc.ref;
    const data = doc.data() || {};

    const { salesHistory, priceHistory } = buildEventsForProduct(
      data,
      `${ref.id}:${data?.price || data?.currentPrice || ''}`
    );

    const updates = { salesHistory, priceHistory };

    if (DRY_RUN) {
      console.log(`(DRY_RUN) Would update ${ref.id}: salesHistory(${salesHistory.length}), priceHistory(${priceHistory.length})`);
    } else {
      batch.update(ref, updates);
      ops++;
      updated++;
      if (ops >= COMMIT_AT) {
        await flushBatch('batch size limit reached');
      }
    }
  }

  await flushBatch('final');

  console.log('✅ Done.');
  console.log(`Products scanned: ${snap.size}`);
  console.log(`Products updated: ${updated}`);
  if (DRY_RUN) console.log('ℹ️ DRY_RUN was ON — no writes were made.');
}

seedProductSalesHistory().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
