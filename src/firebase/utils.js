// src/firebase/utils.js
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { firebaseConfig } from './config';

const app = initializeApp(firebaseConfig);
getAnalytics(app);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// Create or return Firestore user doc
export const handleUserProfile = async ({ userAuth, additionalData }) => {
  if (!userAuth) return null;
  const { uid, displayName, email } = userAuth;
  const userRef = doc(firestore, `users/${uid}`);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    const timestamp = new Date();
    const userRoles = ['user'];
    await setDoc(userRef, {
      displayName,
      email,
      createdDate: timestamp,
      userRoles,
      ...additionalData,
    });
  }
  return userRef;
};

// Returns a Promise that resolves once auth state is known
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (userAuth) => {
        unsubscribe();
        resolve(userAuth);
      },
      (err) => {
        unsubscribe();
        reject(err);
      }
    );
  });
};
