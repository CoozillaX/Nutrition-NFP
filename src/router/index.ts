import {
  createRouter,
  createWebHistory,
  createWebHashHistory
} from "vue-router";
import Routes from "./routes";

const isGhPages = import.meta.env.MODE === "gh-pages";

const router = createRouter({
  history: isGhPages
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes: Routes,
  scrollBehavior() {
    // Always scroll to top
    return {
      left: 0,
      top: 0
    };
  }
});

export default router;
