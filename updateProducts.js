/**
 * addOriginIfMissing.js
 *
 * Adds the `origin` field to any product in Firestore that doesn't already have one.
 * Usage: `node addOriginIfMissing.js`
 */

import admin from 'firebase-admin';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Resolve __dirname (ESM)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load and parse service account
const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
const rawServiceAccount = await fs.readFile(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(rawServiceAccount);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function addOriginIfMissing() {
  try {
    const snapshot = await db.collection('products').get();
    const products = snapshot.docs;
    console.log(`Found ${products.length} product documents.`);

    let updatedCount = 0;

    for (let i = 0; i < products.length; i += 500) {
      const batch = db.batch();
      const chunk = products.slice(i, i + 500);

      chunk.forEach((doc) => {
        const data = doc.data();
        if (!data.origin) {
          batch.update(doc.ref, { origin: 'Unknown' }); // <-- Set your default value here
          updatedCount++;
        }
      });

      await batch.commit();
      console.log(`✔ Updated batch of ${chunk.length} documents`);
    }

    console.log(`✅ Added origin to ${updatedCount} product(s).`);
  } catch (err) {
    console.error('❌ Error updating products:', err);
  }
}

addOriginIfMissing();
