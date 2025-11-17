import { createRouter, createWebHistory } from "vue-router";
import Routes from "./routes";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: Routes,
  scrollBehavior() {  // Always scroll to top
    return {
      left: 0,
      top: 0,
    };
  },
});

export default router;
