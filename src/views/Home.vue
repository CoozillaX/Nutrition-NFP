<template>
  <section
    class="h-screen flex flex-col items-center justify-center gap-4"
  >
    <h1 class="text-black text-5xl font-bold">Welcome to Nutrition NFP</h1>

    <p class="text-black">
      Learn about nutrition, cook healthy meals, and plan your diet.
    </p>

    <div class="flex justify-center gap-4">
      <router-link to="/courses">
        <Button label="Browse Courses" severity="contrast"></Button>
      </router-link>
      <router-link to="/recipes">
        <Button label="Explore Recipes" severity="secondary"></Button>
      </router-link>
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