<template>
  <section
    class="bg-light text-center d-flex flex-column justify-content-center min-vh-100"
  >
    <div class="container">
      <h1 class="display-5 fw-bold">Welcome to Nutrition NFP</h1>

      <p class="lead text-muted">
        Learn about nutrition, cook healthy meals, and plan your diet.
      </p>

      <div class="d-flex justify-content-center gap-3 mt-4">
        <router-link to="/courses" class="btn btn-dark btn-lg">
          Browse Courses
        </router-link>
        <router-link to="/recipes" class="btn btn-outline-dark btn-lg">
          Explore Recipes
        </router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
section {
  background: linear-gradient(
      rgba(128,128,128,0),
      rgba(128,128,128,1)
    ),
    url('@/assets/imgs/bg.jpg') center/cover no-repeat;
}
</style>