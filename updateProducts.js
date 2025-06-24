/**
 * removeQuantity.js
 *
 * Deletes the `quantity` field from every document
 * in the "products" collection.
 *
 * Usage: `node removeQuantity.js`
 */

import admin from 'firebase-admin';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Resolve __dirname (ESM)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load and parse the service account JSON
const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
const rawServiceAccount = await fs.readFile(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(rawServiceAccount);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeQuantityField() {
  try {
    // 1. Fetch all documents in the "products" collection
    const productsSnapshot = await db.collection('products').get();
    const allDocs = productsSnapshot.docs;
    console.log(`Found ${allDocs.length} product documents.`);

    if (allDocs.length === 0) {
      console.log('No products found. Nothing to update.');
      return;
    }

    // 2. Firestore batch write limit is 500 writes per batch
    const BATCH_SIZE = 500;
    let batchCount = 0;

    // 3. Iterate in chunks of 500
    for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = allDocs.slice(i, i + BATCH_SIZE);

      chunk.forEach(doc => {
        // Stage deletion of `quantity` field
        batch.update(doc.ref, { quantity: admin.firestore.FieldValue.delete() });
      });

      // Commit the batch
      await batch.commit();
      batchCount++;
      console.log(`✔ Committed batch ${batchCount} (${chunk.length} documents)`);
    }

    console.log('✅ All `quantity` fields have been removed from products.');
  } catch (error) {
    console.error('Error removing `quantity` fields:', error);
  }
}

// Execute the function
removeQuantityField();
