import { initializeApp } from "firebase/app";

const app = initializeApp({
  apiKey: "AIzaSyDdosu4kT56ygIc79HYZdlQ3QHoryeBD3w",
  authDomain: "fit5032-assessments.firebaseapp.com",
  projectId: "fit5032-assessments",
  storageBucket: "fit5032-assessments.firebasestorage.app",
  messagingSenderId: "369854823336",
  appId: "1:369854823336:web:672b0ff3229b5a2c31bb9d"
});

const storageName = "fit5032-assessments-database";

export { app, storageName };
