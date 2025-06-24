import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const db = getFirestore();

async function addMediaLinkToAllProducts() {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);

  const updates = snapshot.docs.map(async (docSnap) => {
    const data = docSnap.data();
    if (!('mediaLink' in data)) {
      const productRef = doc(db, 'products', docSnap.id);
      await updateDoc(productRef, {
        mediaLink: "" // or some default like "https://example.com"
      });
      console.log(`Updated ${docSnap.id}`);
    }
  });

  await Promise.all(updates);
  console.log('✅ All missing mediaLink fields added.');
}

addMediaLinkToAllProducts().catch(console.error);
