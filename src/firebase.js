// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPnDAtCcb22cPnLQbdfrom6OLDvksR-Ek",
  authDomain: "fu-mart-8.firebaseapp.com",
  projectId: "fu-mart-8",
  storageBucket: "fu-mart-8.firebasestorage.app",
  messagingSenderId: "660975126234",
  appId: "1:660975126234:web:78cc22d2f8f552188447e3",
  measurementId: "G-VQQ35YKD4N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);