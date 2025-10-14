<template>
  <div class="min-h-screen">
    <!-- SearchBar -->
    <div
      id="searchBar"
      class="flex flex-col items-center text-center justify-center gap-4 h-72"
    >
      <h1 class="text-black text-4xl font-bold">Courses</h1>
      <p class="text-black">
        Learn new skills to improve your nutrition and well-being.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="loading && courses.length === 0"
      class="flex flex-col items-center justify-center h-full w-full py-40"
    >
      <ProgressSpinner aria-label="Loading" />
    </div>

    <!-- Empty -->
    <div
      v-if="!loading && courses.length === 0"
      class="flex flex-col items-center justify-center h-full w-full py-40"
    >
      <p class="text-muted-color">Hmm... looks a little empty here.</p>
    </div>

    <!-- Grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4 p-4"
    >
      <Card
        v-for="course in courses"
        style="overflow: hidden"
        :key="course.id"
        class="cursor-pointer"
        @click="openRecipeModal(course)"
      >
        <template #header>
          <img
            v-if="course.imageUrl"
            :alt="course.name"
            :src="course.imageUrl"
            class="w-full h-48 object-cover"
          />
          <img v-else class="w-full h-48 object-cover" />
        </template>
        <template #title>
          <h5 class="font-semibold text-lg">
            {{ course.name }}
          </h5>
        </template>
        <template #content>
          <p class="text-muted-color text-sm">
            {{ course.summary }}
          </p>
        </template>
      </Card>
    </div>
    <div class="flex p-4">
      <Button
        v-if="courses.length != 0 && hasMore"
        label="Load More"
        severity="secondary"
        :loading="loading"
        @click="loadPage"
        class="w-full sm:w-auto"
      ></Button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { query, limit, startAfter, getDocs } from "firebase/firestore";
import { generateDatatableQueryByFilters } from "@/firestore/utils";

const loading = ref(true);
const hasMore = ref(false);

const courses = ref([]);
const pageSize = 12;

let baseQuery = generateDatatableQueryByFilters("courses", null);
let cursor = null;
let prefetchPromise = null;

// Request a page of data and return the results
const fetchPage = async (cursor) => {
  let q = query(baseQuery, limit(pageSize));
  if (cursor) q = query(baseQuery, startAfter(cursor), limit(pageSize));

  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : cursor;
  const _hasMore = snap.docs.length === pageSize;
  return { rows, nextCursor: last, hasMore: _hasMore };
};

// Load a page of data, either from prefetch or directly
async function loadPage() {
  loading.value = true;
  // Get from prefetch
  if (prefetchPromise) {
    const { rows, nextCursor, hasMore: _hasMore } = await prefetchPromise;
    courses.value.push(...rows);
    cursor = nextCursor;
    hasMore.value = _hasMore;
    prefetchPromise = null;
  } else {
    const { rows, nextCursor, hasMore: _hasMore } = await fetchPage(cursor);
    courses.value.push(...rows);
    cursor = nextCursor;
    hasMore.value = _hasMore;
  }
  // Prefetch next page
  if (hasMore.value) {
    prefetchPromise = fetchPage(cursor);
  }
  loading.value = false;
}

onMounted(async () => {
  await loadPage();
});
</script>

<style scoped>
#searchBar {
  background:
    linear-gradient(rgba(128, 128, 128, 0), rgba(128, 128, 128, 1)),
    url("@/assets/imgs/bg-course.png") center/cover no-repeat;
}
</style>
