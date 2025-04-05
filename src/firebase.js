
import { initializeApp } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDNS37JMFQC3A7Xofwgo8mK-ogOEq17YNQ",
    authDomain: "brothersapp-c4311.firebaseapp.com",
    projectId: "brothersapp-c4311",
    storageBucket: "brothersapp-c4311.firebasestorage.app",
    messagingSenderId: "889449322214",
    appId: "1:889449322214:web:feb761e31905af89204d27",
    measurementId: "G-TJXDSMTD3C"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Create references to your collections
export const contributionsRef = collection(db, 'contributions');
export const expensesRef = collection(db, 'expenses');
export const pendingRef = collection(db, 'pending');


