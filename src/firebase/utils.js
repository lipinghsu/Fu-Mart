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


// utils/removeBg.js
export async function removeBg(file, provider, keys) {
  switch (provider) {
    case "clipdrop": {
      const fd = new FormData();
      fd.append("image_file", file);
      const res = await fetch("https://clipdrop-api.co/remove-background/v1", {
        method: "POST",
        headers: { "x-api-key": keys.CLIPDROP_KEY },
        body: fd
      });
      if (!res.ok) throw new Error("ClipDrop failed");
      const blob = await res.blob();
      return new File([blob], `bgremoved-${file.name}`, { type: "image/png" });
    }

    case "photoroom": {
      const fd = new FormData();
      fd.append("image_file", file);
      // optional params: background_color, format, size, crop, etc.
      const res = await fetch("https://api.photoroom.com/v1/backgrounds/remove", {
        method: "POST",
        headers: { "x-api-key": keys.PHOTOROOM_KEY },
        body: fd
      });
      if (!res.ok) throw new Error("Photoroom failed");
      const blob = await res.blob();
      return new File([blob], `bgremoved-${file.name}`, { type: "image/png" });
    }

    case "cutoutpro": {
      const fd = new FormData();
      fd.append("image_file", file);
      // API also supports transparency, format, etc.
      const res = await fetch("https://www.cutout.pro/api/v1/matting?mattingType=6", {
        method: "POST",
        headers: { "APIKEY": keys.CUTOUTPRO_KEY },
        body: fd
      });
      if (!res.ok) throw new Error("Cutout.pro failed");
      const blob = await res.blob();
      return new File([blob], `bgremoved-${file.name}`, { type: "image/png" });
    }

    default:
      throw new Error("Unknown provider");
  }
}
