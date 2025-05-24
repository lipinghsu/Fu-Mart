const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Replace with your path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const addMissingSubCategory = async () => {
  const snapshot = await db.collection('products').get();

  const batch = db.batch();
  let batchCounter = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();

    if (!data.hasOwnProperty('subCategory')) {
      const docRef = db.collection('products').doc(doc.id);
      batch.update(docRef, { subCategory: 'miscellaneous' }); // <-- Customize default value
      batchCounter++;
    }
  });

  if (batchCounter > 0) {
    await batch.commit();
    console.log(`${batchCounter} documents updated with 'subCategory'.`);
  } else {
    console.log('All documents already have the "subCategory" field.');
  }
};

addMissingSubCategory().catch(console.error);