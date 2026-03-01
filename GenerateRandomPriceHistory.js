/**
 * seedProductPriceHistory.js
 * Skips products under the "Merch" category.
 */

import admin from 'firebase-admin';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account
const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
const rawServiceAccount = await fs.readFile(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(rawServiceAccount);

// Init Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Config
const PRODUCTS_COLLECTION = 'products';
const COMMIT_AT = 400;
const DRY_RUN = false;

const MIN_POINTS = 20;
const MAX_POINTS = 50;
const DAYS_LOOKBACK = 120;

const BASE_PCT_JITTER = 0.05;
const OCCASIONAL_EXTRA_JITTER = 0.08;

function rng(seedStr = '') {
  let s = 0;
  for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) >>> 0;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17; s >>>= 0;
    s ^= s << 5;  s >>>= 0;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function toISODate(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function clamp2(n) {
  return Math.round(n * 100) / 100;
}

function deriveBasePrice(p) {
  const candidates = [Number(p?.price), Number(p?.currentPrice), Number(p?.salePrice)]
    .filter((n) => Number.isFinite(n) && n > 0);
  return candidates.length ? candidates[0] : 9.99;
}

function hasUsablePriceHistory(data) {
  if (!data) return false;
  const ph = data.priceHistory;
  if (!Array.isArray(ph) || ph.length === 0) return false;
  const first = ph[0];
  return typeof first?.price === 'number' && !!first.date;
}

function buildPriceHistoryForProduct(product, seed) {
  const r = rng(seed);
  const base = deriveBasePrice(product);
  const count = Math.floor(MIN_POINTS + r() * (MAX_POINTS - MIN_POINTS + 1));
  const today = new Date();

  const dates = new Set();
  while (dates.size < count) {
    const back = Math.floor(r() * DAYS_LOOKBACK);
    const d = new Date(today);
    d.setDate(d.getDate() - back);
    dates.add(toISODate(d));
  }

  const sortedDates = Array.from(dates).sort((a, b) => new Date(a) - new Date(b));
  return sortedDates.map((iso) => {
    const useExtra = r() < 0.15;
    const jitter = useExtra ? OCCASIONAL_EXTRA_JITTER : BASE_PCT_JITTER;
    const pct = (r() * 2 - 0.999) * jitter;
    return { date: iso, price: clamp2(base * (1 + pct)) };
  });
}

async function seedProductPriceHistory() {
  console.log('⏳ Scanning products…');
  const snap = await db.collection(PRODUCTS_COLLECTION).get();

  if (snap.empty) {
    console.log('No products found.');
    return;
  }

  console.log(`Found ${snap.size} products. Generating priceHistory where missing…`);

  let batch = db.batch();
  let ops = 0, updated = 0, skipped = 0, merchSkipped = 0;

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
    const category = (data.category || '').trim();

    // Skip "Merch" category
    if (category.toLowerCase() === 'merch') {
      merchSkipped++;
      continue;
    }

    if (hasUsablePriceHistory(data)) {
      skipped++;
      continue;
    }

    const priceHistory = buildPriceHistoryForProduct(
      data,
      `${ref.id}:${data?.price || data?.currentPrice || data?.salePrice || ''}`
    );

    if (DRY_RUN) {
      console.log(`(DRY_RUN) Would update ${ref.id}: priceHistory(${priceHistory.length})`);
    } else {
      batch.update(ref, { priceHistory });
      ops++;
      updated++;
      if (ops >= COMMIT_AT) await flushBatch('batch limit reached');
    }
  }

  await flushBatch('final');

  console.log('✅ Done.');
  console.log(`Products scanned: ${snap.size}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (had history): ${skipped}`);
  console.log(`Skipped (Merch): ${merchSkipped}`);
  if (DRY_RUN) console.log('ℹ️ DRY_RUN was ON — no writes made.');
}

seedProductPriceHistory().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
