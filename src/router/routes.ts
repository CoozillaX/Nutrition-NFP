import type { RouteRecordRaw } from "vue-router";
// Firebase Auth State
import { isAdminUser } from "@/firebase/auth";
// View Imports
import Home from "@/views/Home.vue";
import Courses from "@/views/Courses.vue";
import Recipes from "@/views/Recipes.vue";
import RecipesManager from "@/views/RecipesManager.vue";
import CoursesManager from "@/views/CoursesManager.vue";
import OpenAPI from "@/views/OpenAPI.vue";

// Admin Route Guard
const beforeEnterAdmin = async (_to: any, _from: any, next: any) => {
  isAdminUser.value ? next() : next({ path: "/" });
};

const Routes: Array<RouteRecordRaw> = [
  { path: "/", name: "Home", component: Home },
  { path: "/courses", name: "Courses", component: Courses },
  { path: "/recipes", name: "Recipes", component: Recipes },
  { path: "/openapi", name: "OpenAPI", component: OpenAPI },
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

export default Routes;
