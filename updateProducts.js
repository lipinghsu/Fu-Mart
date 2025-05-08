import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function updateAllProducts() {
  const snapshot = await db.collection('products').get();

  const updates = snapshot.docs.map(async (doc) => {
    const data = doc.data();

    const updatedData = {
      quantity: data.quantity || 0,
      sizeLabel: data.sizeLabel || '',
      productFeature: data.productFeature || [],
      sku: data.sku || '',
      tags: data.tags || [],
      weight: data.weight || '',
      dimensions: data.dimensions || '',
      priceDiscount: data.priceDiscount || 0,
      isOnSale: data.isOnSale || false,
      rating: data.rating || 0,
      reviewCount: data.reviewCount || 0,
      expirationDate: data.expirationDate || '',
      origin: data.origin || '',
      ingredients: data.ingredients || [],
      instructions: data.instructions || ''
    };

    return doc.ref.update(updatedData);
  });

  await Promise.all(updates);
  console.log('All products updated successfully!');
}

updateAllProducts().catch(console.error);
