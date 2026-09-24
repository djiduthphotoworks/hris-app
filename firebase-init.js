// ==========================================
// INISIALISASI FIREBASE & FIRESTORE
// ==========================================

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Konfigurasi project Firebase HRIS
const firebaseConfig = {
    apiKey: "AIzaSyDLA02hhkmPOqQrkjBkwYOZJRorVNvXo",
    authDomain: "hris-djiduth.firebaseapp.com",
    projectId: "hris-djiduth",
    storageBucket: "hris-djiduth.appspot.com",
    messagingSenderId: "24725846423",
    appId: "1:24725846423:web:edf023577b1732e0a7acd2",
    measurementId: "G-ZCYJHN74GC"
};

// Inisialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.log("🔥 Berhasil terhubung ke Firebase (hris-djiduth)!");