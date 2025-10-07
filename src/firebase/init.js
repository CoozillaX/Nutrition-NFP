import { ref } from "vue";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDdosu4kT56ygIc79HYZdlQ3QHoryeBD3w",
  authDomain: "fit5032-assessments.firebaseapp.com",
  projectId: "fit5032-assessments",
  storageBucket: "fit5032-assessments.firebasestorage.app",
  messagingSenderId: "369854823336",
  appId: "1:369854823336:web:672b0ff3229b5a2c31bb9d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const currentUser = ref(null);
const currentRole = ref(null);
const db = getFirestore(app, "fit5032-assessments-database");
const storage = getStorage();

onAuthStateChanged(auth, async (user) => {
  if (user && user.emailVerified) {
    const tokenResult = await user.getIdTokenResult(true);
    currentUser.value = user;
    currentRole.value = tokenResult.claims.role;
  } else {
    currentUser.value = null;
    currentRole.value = null;
  }
});

async function register(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    currentUser.value = null;
    currentRole.value = null;
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

async function login(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    if (!user.emailVerified) {
      await sendEmailVerification(user);
      await signOut(auth);
      return {
        success: false,
        error: {
          message:
            "Your need to verify your email address. A verification email has been sent to your email address."
        }
      };
    }
    const tokenResult = await user.getIdTokenResult(true);
    currentUser.value = user;
    currentRole.value = tokenResult.claims.role;
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
