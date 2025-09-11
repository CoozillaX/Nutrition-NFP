import { ref } from "vue";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

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

onAuthStateChanged(auth, async (user) => {
  currentUser.value = user;
  if (!user) {
    currentRole.value = null;
    return;
  }
  const tokenResult = await user.getIdTokenResult(true);
  currentRole.value = tokenResult.claims.role;
});

const db = getFirestore();

export { currentUser, currentRole, db };
