<template>
  <div class="min-h-screen">
    <!-- SearchBar -->
    <div
      id="searchBar"
      class="flex flex-col items-center text-center justify-center gap-4 h-72"
    >
      <h1 class="text-black text-4xl font-bold">Recipes</h1>
      <p class="text-black">
        Cook nutritious meals with simple steps and fresh ingredients.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center h-full w-full py-40"
    >
      <ProgressSpinner aria-label="Loading" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!loading && totalCount === 0"
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
        v-for="recipe in paginatedRecipes"
        style="overflow: hidden"
        :key="recipe.id"
        class="cursor-pointer"
        tabindex="0"
        @click="openRecipeModal(recipe)"
        @keydown.enter.prevent="openRecipeModal(recipe)"
      >
        <template #header>
          <img
            v-if="recipe.imageUrl"
            :src="recipe.imageUrl"
            alt=""
            class="w-full h-48 object-cover"
          />
          <img v-else class="w-full h-48 object-cover" alt=""/>
        </template>
        <template #title>
          <h5 class="font-semibold text-lg">
            {{ recipe.name }}
          </h5>
        </template>
        <template #content>
          <p class="text-muted-color text-sm">
            {{ recipe.summary }}
          </p>
        </template>
      </Card>
      <Paginator
        ref="paginator"
        class="col-span-full"
        tabindex="0"
        :first="offset"
        :rows="pageSize"
        :totalRecords="totalCount"
        @page="loadPage"
        @keydown.left.prevent="paginator?.changePageToPrev($event)"
        @keydown.right.prevent="paginator?.changePageToNext($event)"
      />
    </div>
  </div>
  <!-- Modal -->
  <Dialog
    class="mx-4"
    v-model:visible="modalVisible"
    :header="selected ? selected.name : ''"
    :modal="true"
    :dismissableMask="true"
    :draggable="false"
    :style="{ width: '90%', maxWidth: '800px' }"
    @hide="modalVisible = false"
  >
    <!-- Image -->
    <img
      v-if="selected?.imageUrl"
      :src="selected.imageUrl"
      alt=""
      class="w-full h-112 object-cover mb-4 rounded-lg"
    />
    <img v-else class="w-full h-112 object-cover mb-4 rounded-lg" alt=""/>
    <!-- Summary -->
    <p class="mb-4 text-muted-color" v-if="selected?.summary">
      {{ selected.summary }}
    </p>
    <!-- Ratings -->
    <div class="mb-4">
      <div class="flex items-center mb-2">
        <Rating v-model="ratingAvg" readonly />
        <div class="small text-muted ms-2">
          <span class="font-semibold">{{ displayAvg }}</span>
          ·
          <span>{{ ratingCount }}</span> ratings
        </div>
      </div>
    </div>
    <!-- Details -->
    <div v-if="selected?.details" class="mb-4">
      <h5 class="font-semibold mb-2">Details</h5>
      <p>
        {{ selected.details }}
      </p>
    </div>
    <!-- My Rating -->
    <Divider />
    <div class="pt-2 space-y-1">
      <div v-if="currentUser" class="flex items-center">
        <span class="font-semibold me-3">Your rating</span>
        <div class="flex items-center">
          <Rating
            v-model="myRating"
            :disabled="ratingSaving"
            @update:modelValue="setMyRating"
          />
          <Button
            v-if="myRating !== 0"
            label="Clear"
            size="small"
            severity="danger"
            :disabled="ratingSaving || myRating === 0"
            tabindex="0"
            @click="clearMyRating"
            class="ms-3 text-xs"
          ></Button>
        </div>
      </div>

      <div v-else class="flex items-center text-muted-color">
        <i class="pi pi-info-circle me-2"></i>
        <span>Sign in to rate this recipe.</span>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { currentUser } from "@/firebase/auth";
import {
  generateDatatableQueryByFilters,
  fetchByPage,
  getTotalCount
} from "@/firestore/utils";
import { getRating, setRating, clearRating } from "@/firestore/ratings";
import Paginator from "primevue/paginator";
import { Query, QueryDocumentSnapshot } from "firebase/firestore";

// set to any to access internal methods
const paginator = ref<any>(null);

/* pagination */
const loading = ref(true);
const offset = ref(0);
const paginatedRecipes = ref<RecipeEntity[]>([]);

const pageSize = 12;
const totalCount = ref(0);

let currQuery = generateDatatableQueryByFilters("recipes") as Query<RecipeEntity, RecipeEntity>;
let cursors: QueryDocumentSnapshot<RecipeEntity, RecipeEntity>[] = [];

async function loadPage({ first, page }: { first: number; page: number }) {
  loading.value = true;
  offset.value = first;
  try {
    // If first load, fetch total count
    if (totalCount.value === 0 && page === 0) {
      totalCount.value = await getTotalCount(currQuery);
    }

    // Fetch data for the current page
    const { data, cursors: newCursors } = await fetchByPage<RecipeEntity>(
      page,
      currQuery,
      pageSize,
      cursors
    );

    cursors = newCursors;
    paginatedRecipes.value = data;
  } finally {
    loading.value = false;
  }
}

/* modal */
const modalVisible = ref(false);
const selected = ref<RecipeEntity | null>(null);

const ratingAvg = ref(0);
const ratingCount = ref(0);
const myRating = ref(0);

async function openRecipeModal(recipe: RecipeEntity) {
  selected.value = recipe;
  // reset ratings
  ratingAvg.value = 0;
  ratingCount.value = 0;
  myRating.value = 0;
  await loadRating(recipe.id);
  modalVisible.value = true;
}

/* ratings */
const ratingSaving = ref(false);

const displayAvg = computed(() =>
  ratingCount.value ? ratingAvg.value.toFixed(1) : "0.0"
);

async function loadRating(recipeId: string) {
  const { count, avg, myRating: myR } = await getRating(recipeId);
  ratingCount.value = count;
  ratingAvg.value = avg;
  myRating.value = myR;
}

async function setMyRating() {
  ratingSaving.value = true;
  try {
    await setRating(selected.value!.id, myRating.value);
    await loadRating(selected.value!.id);
  } finally {
    ratingSaving.value = false;
  }
}

async function clearMyRating() {
  if (!currentUser.value || !selected.value?.id) return;
  if (!myRating.value) return;

  myRating.value = 0;
  ratingSaving.value = true;
  try {
    await clearRating(selected.value.id);
    await loadRating(selected.value.id);
  } finally {
    ratingSaving.value = false;
  }
}

onMounted(async () => {
  await loadPage({ first: 0, page: 0 });
});
</script>

<style scoped>
#searchBar {
  background:
    linear-gradient(rgba(128, 128, 128, 0), rgba(128, 128, 128, 1)),
    url("@/assets/imgs/bg-recipe.jpg") center/cover no-repeat;
}
</style>
