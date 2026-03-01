/**
 * mergeFreezerAndRefrigeratedToChilled.js
 *
 * Merges all products with category == "Freezer" OR "Refrigerated"
 * → into category = "Chilled", preserving existing subCategory values.
 *
 * Usage:
 *   node mergeFreezerAndRefrigeratedToChilled.js
 */

import admin from 'firebase-admin';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// -------- ESM helpers --------
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
const OLD_CATEGORIES = ['Freezer', 'Refrigerated'];
const NEW_CATEGORY = 'Chilled';
const COMMIT_AT = 400;
const DRY_RUN = false; // set to true to preview without writing

/* ----------------------- main ----------------------- */
async function mergeFreezerAndRefrigerated() {
  console.log(`⏳ Searching for products in categories: ${OLD_CATEGORIES.join(', ')}`);

  let totalFound = 0;
  let totalUpdated = 0;

  for (const oldCat of OLD_CATEGORIES) {
    const snap = await db
      .collection(PRODUCTS_COLLECTION)
      .where('category', '==', oldCat)
      .get();

    if (snap.empty) {
      console.log(`⚪ No products found in category "${oldCat}".`);
      continue;
    }

    console.log(`📦 Found ${snap.size} product(s) in category "${oldCat}"`);

    let batch = db.batch();
    let ops = 0;

    async function flushBatch(reason = '') {
      if (ops === 0) return;
      if (!DRY_RUN) await batch.commit();
      console.log(`✔ Committed ${ops} updates${reason ? ` (${reason})` : ''}`);
      batch = db.batch();
      ops = 0;
    }

    for (const doc of snap.docs) {
      const ref = doc.ref;
      const data = doc.data();

      const payload = {
        category: NEW_CATEGORY,
        subCategory: data.subCategory || null, // preserve if exists
      };

      if (DRY_RUN) {
        console.log(`(DRY_RUN) Would update [${ref.id}] ->`, payload);
      } else {
        batch.update(ref, payload);
        ops++;
        totalUpdated++;
        if (ops >= COMMIT_AT) await flushBatch('batch size limit reached');
      }
    }

    await flushBatch('final');
    totalFound += snap.size;
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`Found total: ${totalFound} products`);
  console.log(`Updated total: ${totalUpdated} → category "${NEW_CATEGORY}"`);
  if (DRY_RUN) console.log('ℹ️ DRY_RUN was ON — no writes were made.');
}

mergeFreezerAndRefrigerated().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
