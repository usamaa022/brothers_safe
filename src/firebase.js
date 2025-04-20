import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, onSnapshot, setDoc, query, where } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC477ptkDMnUvkk_5Z-l_XqAPW5x9xAvgA",
  authDomain: "brothers-37c26.firebaseapp.com",
  projectId: "brothers-37c26",
  storageBucket: "brothers-37c26.appspot.com",
  messagingSenderId: "962544350145",
  appId: "1:962544350145:web:68c0457b2ea86a8ad6b540",
  measurementId: "G-RCYYHGF1RR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Function to check admin status and fetch username
export const checkAdminStatus = async (user) => {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      user.displayName = userData.username; // Set the displayName to the username
      return userData.isAdmin;
    } else {
      console.error("No user document found!");
      return false;
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Function to create a new user and user document
export const registerUser = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create a user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      username: username,
      isAdmin: false, // Set default admin status
    });

    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

// Function to get user data by username
export const getUserDataByUsername = async (username) => {
  const userRef = collection(db, "users");
  const q = query(userRef, where("username", "==", username));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }
  return null;
};

export {
  db,
  auth,
  storage,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  ref,
  uploadBytes,
  getDownloadURL,
  query,
  where
};
