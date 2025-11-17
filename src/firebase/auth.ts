import { ref } from "vue";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification
} from "firebase/auth";
import { app } from "@/firebase/init";
import type { User, UserCredential } from "firebase/auth";

const auth = getAuth(app);
const currentUser = ref<User | null>(null);
const isAdminUser = ref<boolean>(false);

// Monitor auth state changes
onAuthStateChanged(auth, async (user) => {
  currentUser.value = null;
  isAdminUser.value = false;
  // Only set currentUser if email is verified
  if (user && user.emailVerified) {
    currentUser.value = user;
    const tokenResult = await user.getIdTokenResult();
    isAdminUser.value = tokenResult.claims.role === "admin";
  }
});

/**
 * Register a new user with email and password.
 * @param email - The user's email address.
 * @param password - The user's password.
 * @returns A promise that resolves when the user is registered.
 */
function register(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Log in a user with email and password.
 * @param email - The user's email address.
 * @param password - The user's password.
 * @returns A promise that resolves when the user is logged in.
 */
function login(email: string, password: string): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = credential.user;
      // Check if email is verified
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        throw new Error(
          "You need to verify your email address. A verification email has been sent."
        );
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Log out the current user.
 * @returns A promise that resolves when the user is logged out.
 */
function logout(): Promise<void> {
  return signOut(auth);
}

export { currentUser, isAdminUser, register, login, logout };
