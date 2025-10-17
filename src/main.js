import { createApp } from "vue";
import App from "./App.vue";

import "@/assets/styles.css";

import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import "primeicons/primeicons.css";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";

import router from "@/router";
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
