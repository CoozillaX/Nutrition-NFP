import { createApp } from 'vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import router from './router';
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDdosu4kT56ygIc79HYZdlQ3QHoryeBD3w",
  authDomain: "fit5032-assessments.firebaseapp.com",
  projectId: "fit5032-assessments",
  storageBucket: "fit5032-assessments.firebasestorage.app",
  messagingSenderId: "369854823336",
  appId: "1:369854823336:web:672b0ff3229b5a2c31bb9d"
};

initializeApp(firebaseConfig);

const app = createApp(App);
app.use(router);
app.mount('#app');
