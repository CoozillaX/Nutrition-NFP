<script setup>
import Navibar from "@/components/Navibar.vue";
import Footer from "@/components/Footer.vue";
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <Navibar></Navibar>
    <main class="flex-grow-1">
      <h1>You did it!</h1>
      <p>
        Visit
        <a href="https://vuejs.org/" target="_blank" rel="noopener"
          >vuejs.org</a
        >
        to read the documentation
      </p>
    </main>
    <Footer></Footer>
  </div>
</template>

<style scoped></style>
