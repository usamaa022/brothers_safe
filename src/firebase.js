// Import Firebase modules
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  setDoc, // Optional: If you use setDoc elsewhere
  onSnapshot 
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC477ptkDMnUvkk_5Z-l_XqAPW5x9xAvgA",
  authDomain: "brothers-37c26.firebaseapp.com",
  projectId: "brothers-37c26",
  storageBucket: "brothers-37c26.appspot.com", // Fixed typo here
  messagingSenderId: "962544350145",
  appId: "1:962544350145:web:68c0457b2ea86a8ad6b540",
  measurementId: "G-RCYYHGF1RR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);


// Export Firebase services and utility functions
export { 
  db, 
  auth, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc, // Optional: If you use setDoc elsewhere
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  onSnapshot
};