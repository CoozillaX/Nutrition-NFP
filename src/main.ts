import { createApp } from "vue";
import "@/assets/styles.css";
import App from "./App.vue";
// PrimeVue Imports
import "primeicons/primeicons.css";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
// Router Import
import router from "@/router";
// Firebase Init
import "@/firebase/init";

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
});
app.use(ToastService);
app.use(ConfirmationService);
app.mount("#app");
