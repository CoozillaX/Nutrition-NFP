<script setup>
import Navibar from "@/components/Navibar.vue";
import Footer from "@/components/Footer.vue";
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <Navibar></Navibar>
    <main class="flex-grow-1">
      <router-view></router-view>
    </main>
    <Footer></Footer>
  </div>
</template>

<style scoped></style>
