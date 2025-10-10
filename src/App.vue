<script setup>
import Navibar from "@/components/Navibar.vue";
import Footer from "@/components/Footer.vue";
</script>

<template>
  <Navibar></Navibar>
  <main>
    <router-view></router-view>
  </main>
  <footer>
    <Footer></Footer>
  </footer>
  <Toast position="bottom-right" />
  <ConfirmPopup></ConfirmPopup>
</template>

<style scoped></style>
