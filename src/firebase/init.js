import { ref } from "vue";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDdosu4kT56ygIc79HYZdlQ3QHoryeBD3w",
  authDomain: "fit5032-assessments.firebaseapp.com",
  projectId: "fit5032-assessments",
  storageBucket: "fit5032-assessments.firebasestorage.app",
  messagingSenderId: "369854823336",
  appId: "1:369854823336:web:672b0ff3229b5a2c31bb9d"
};

initializeApp(firebaseConfig);

const auth = getAuth();
const currentUser = ref(null);
const currentRole = ref(null);
const db = getFirestore();
const storage = getStorage();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser.value = null;
    currentRole.value = null;
    return;
  }
  const tokenResult = await user.getIdTokenResult(true);
  currentUser.value = user;
  currentRole.value = tokenResult.claims.role;
});

async function register(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

async function logout() {
  try {
    await signOut(auth);
    currentUser.value = null;
    currentRole.value = null;
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

export { currentUser, currentRole, db, storage, register, login, logout };
