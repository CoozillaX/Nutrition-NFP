import { createRouter, createWebHistory } from "vue-router";
import { currentRole } from "@/firebase/init";

import Home from "@/views/Home.vue";
import Courses from "@/views/Courses.vue";
import Recipes from "@/views/Recipes.vue";
import Planner from "@/views/Planner.vue";
import RecipesManager from "@/views/RecipesManager.vue";
import CoursesManager from "@/views/CoursesManager.vue";

const beforeEnterAdmin = (_to, _from, next) => {
  if (currentRole.value !== "admin") {
    next({ path: "/" });
    return;
  }
  next();
};

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/courses", name: "Courses", component: Courses },
  { path: "/recipes", name: "Recipes", component: Recipes },
  { path: "/planner", name: "Planner", component: Planner },
  {
    path: "/courses-manager",
    name: "CoursesManager",
    component: CoursesManager,
    beforeEnter: beforeEnterAdmin
  },
  {
    path: "/recipes-manager",
    name: "RecipesManager",
    component: RecipesManager,
    beforeEnter: beforeEnterAdmin
  },
  { path: "/:pathMatch(.*)*", redirect: "/" } // Redirect unknown paths to Home
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
