<template>
  <div id="swg" :class="isDark ? 'swagger-dark' : ''"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { SwaggerUIBundle } from "swagger-ui-dist";
import "swagger-ui-dist/swagger-ui.css";
import "@/assets/swagger-dark.css";

const media = window.matchMedia("(prefers-color-scheme: dark)");
const isDark = ref(false);

const listener = (e: MediaQueryListEvent) => {
  isDark.value = e.matches;
};

onMounted(async () => {
  SwaggerUIBundle({
    dom_id: "#swg",
    url: `${import.meta.env.BASE_URL}openapi.json`,
    docExpansion: "list"
  });
  isDark.value = media.matches;
  media.addEventListener("change", listener);
});

onUnmounted(() => {
  media.removeEventListener("change", listener);
});
</script>

<style scoped></style>
