<template>
  <nav class="navbar navbar-expand-md navbar-light bg-light border-bottom">
    <div class="container-fluid">
      <router-link class="navbar-brand d-flex align-items-center" to="/">
        <img src="@/assets/imgs/logo.svg" alt="Nutrition NFP" height="40" />
        <span class="fw-bold ms-2">Nutrition NFP</span>
      </router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav ms-auto gap-2">
          <li class="nav-item">
            <router-link class="nav-link" to="/courses">Courses</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/recipes">Recipes</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/planner">Planner</router-link>
          </li>
          <li v-if="currentRole == 'admin'" class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Management
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <router-link class="dropdown-item" to="/courses-manager">Courses</router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/recipes-manager">Recipes</router-link>
              </li>
            </ul>
          </li>
          <li v-if="!currentUser" class="nav-item">
            <router-link
              class="btn btn-outline-dark btn-sm mt-1 w-100"
              to="/login"
              >Login</router-link
            >
          </li>
          <li v-if="!currentUser" class="nav-item">
            <router-link class="btn btn-dark btn-sm mt-1 w-100" to="/register"
              >Register</router-link
            >
          </li>
          <li v-else class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {{ currentUser.displayName || currentUser.email }}
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <a class="dropdown-item" href="#" @click.prevent="handleLogout">
                  Logout
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from "vue-router";
import { currentUser, currentRole } from "@/firebase/init";

const router = useRouter();

const handleLogout = async () => {
  try {
    await signOut(getAuth());
    router.push("/");
  } catch (error) {}
};
</script>
