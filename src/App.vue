<script setup>
import Navibar from "@/components/Navibar.vue";
import Footer from "@/components/Footer.vue";
import Toast from 'primevue/toast'
import ConfirmPopup from 'primevue/confirmpopup'
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <Navibar></Navibar>
    <main class="flex-grow-1">
      <router-view></router-view>
    </main>
    <Footer></Footer>
    <Toast position="bottom-right"/>
    <ConfirmPopup></ConfirmPopup>
  </div>
</template>

<style scoped></style>
