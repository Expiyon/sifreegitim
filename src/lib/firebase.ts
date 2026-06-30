import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvS_1u9jIQ4SZsOeeh0LLK8w95c00fr2o",
  authDomain: "sifreegitim-ccafc.firebaseapp.com",
  projectId: "sifreegitim-ccafc",
  storageBucket: "sifreegitim-ccafc.firebasestorage.app",
  messagingSenderId: "758312836984",
  appId: "1:758312836984:web:44fd14799a479a4468728d",
  measurementId: "G-WCG158HSKG",
};

// Prevent duplicate-app errors on Vite HMR restarts
const app = getApps().find(a => a.name === '[DEFAULT]') ?? initializeApp(firebaseConfig);
const secondaryApp = getApps().find(a => a.name === 'Secondary') ?? initializeApp(firebaseConfig, "Secondary");

export { app, secondaryApp };
export const auth = getAuth(app);
export const db = getFirestore(app);
export const secondaryAuth = getAuth(secondaryApp);
