<template>
  <nav>
    <Navibar></Navibar>
  </nav>
  <main>
    <router-view></router-view>
  </main>
  <footer>
    <Footer></Footer>
  </footer>
  <Toast position="bottom-right" />
  <ConfirmPopup></ConfirmPopup>
  <div class="fixed bottom-0 right-0">
    <Planner />
  </div>
</template>

<script setup lang="ts">
import Navibar from "@/components/Navibar.vue";
import Footer from "@/components/Footer.vue";
import Planner from "@/components/Planner.vue";
</script>

<style scoped></style>
