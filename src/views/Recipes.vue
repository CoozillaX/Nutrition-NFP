<script setup>
import recipes from "@/assets/json/recipes.json";
</script>

<template>
  <section class="bg-light">
    <!-- searchBar -->
    <div id="searchBar" class="container-fluid text-center py-5">
      <h1 class="display-5 fw-bold pt-5">Recipes</h1>
      <p class="lead text-muted">
        Cook nutritious meals with simple steps and fresh ingredients.
      </p>
      <div class="d-flex justify-content-center gap-3 mt-4 pb-5">
        <form class="d-flex" role="search">
          <input
            class="form-control me-2"
            type="search"
            placeholder="Search"
            aria-label="Search"
          />
          <button class="btn btn-dark" type="submit">Search</button>
        </form>
      </div>
    </div>
    <!-- recipes -->
    <div class="container-fluid py-5">
      <div class="row g-3">
        <div
          class="col-12 col-sm-6 col-md-4 col-lg-3 col-xxl-2"
          v-for="recipe in recipes"
          :key="recipe.id"
        >
          <div class="card h-100">
            <div class="ratio ratio-16x9 bg-secondary"></div>
            <div class="card-body">
              <h5 class="card-title">{{ recipe.name }}</h5>
              <p class="card-text">{{ recipe.summary }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
#searchBar {
  background:
    linear-gradient(rgba(128, 128, 128, 0), rgba(128, 128, 128, 1)),
    url("@/assets/imgs/bg.jpg") center/cover no-repeat;
}
</style>
