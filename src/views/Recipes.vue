<template>
  <section class="d-flex flex-column min-vh-100">
    <!-- SearchBar -->
    <div id="searchBar" class="container-fluid text-center py-5">
      <h1 class="display-5 fw-bold pt-5">Recipes</h1>
      <p class="lead text-muted">
        Cook nutritious meals with simple steps and fresh ingredients.
      </p>
      <div class="d-flex justify-content-center gap-3 mt-4 pb-5">
        <form class="d-flex" role="search" @submit.prevent>
          <input
            class="form-control me-2"
            type="search"
            placeholder="Search"
            aria-label="Search"
          />
          <button class="btn btn-dark" type="submit">Search</button>
        </form>
      </div>
    </div>

    <!-- Content -->
    <div class="container-fluid py-5 flex-grow-1 d-flex flex-column">
      <!-- Loading -->
      <div
        v-if="loading"
        class="flex-grow-1 d-flex justify-content-center align-items-center"
      >
        <p class="text-muted mb-0">Loading...</p>
      </div>

      <!-- Empty -->
      <div
        v-else-if="!loading && totalCount === 0"
        class="flex-grow-1 d-flex justify-content-center align-items-center"
      >
        <p class="text-muted mb-0">Hmm... looks a little empty here.</p>
      </div>

      <!-- Grid -->
      <div v-else class="row g-3">
        <div
          v-for="recipe in paginatedRecipes"
          :key="recipe.id"
          class="col-12 col-sm-6 col-md-4 col-lg-3 col-xxl-2 d-flex"
        >
          <div
            class="card h-100 flex-fill text-start"
            style="cursor: pointer"
            @click="openRecipeModal(recipe)"
          >
            <div class="ratio ratio-16x9">
              <img
                v-if="recipe.imageUrl"
                :src="recipe.imageUrl"
                class="card-img-top"
                alt="Recipe image"
                style="object-fit: cover"
              />
              <div v-else class="bg-secondary w-100 h-100"></div>
            </div>

            <div class="card-body">
              <h5 class="card-title mb-1">{{ recipe.name }}</h5>
              <p class="card-text text-muted mb-0">{{ recipe.summary }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="container-fluid pt-5 mt-auto" v-if="totalPages > 1">
        <nav aria-label="Recipes pagination">
          <ul class="pagination justify-content-center mb-0">
            <li class="page-item" :class="{ disabled: currentPage === 0 }">
              <button
                class="page-link"
                @click="goPrev"
                :disabled="currentPage === 0"
              >
                Previous
              </button>
            </li>

            <li
              v-for="n in pageWindow"
              :key="n"
              class="page-item"
              :class="{ active: n === currentPage + 1 }"
            >
              <button class="page-link" @click="goPage(n)">{{ n }}</button>
            </li>

            <li
              class="page-item"
              :class="{ disabled: currentPage === totalPages - 1 }"
            >
              <button
                class="page-link"
                @click="goNext"
                :disabled="currentPage === totalPages - 1"
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Modal -->
    <div
      class="modal fade"
      tabindex="-1"
      ref="modalEl"
      aria-labelledby="recipeModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content" v-if="selected">
          <div class="modal-header">
            <h5 class="modal-title" id="recipeModalLabel">
              {{ selected.name }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeRecipeModal"
              aria-label="Close"
            ></button>
          </div>

          <div class="modal-body">
            <div class="ratio ratio-16x9 mb-3">
              <img
                v-if="selected.imageUrl"
                :src="selected.imageUrl"
                class="w-100 h-100"
                alt="Recipe image"
                style="object-fit: cover"
              />
              <div v-else class="bg-secondary w-100 h-100"></div>
            </div>

            <p class="lead">{{ selected.summary }}</p>

            <!-- Rating summary -->
            <div class="d-flex align-items-center mb-3">
              <Rating v-model="ratingAvg" readonly />
              <div class="small text-muted ms-2">
                <span class="fw-semibold">{{ displayAvg }}</span>
                ·
                <span>{{ ratingCount }}</span> ratings
              </div>
            </div>

            <div v-if="selected.details">
              <h6 class="mt-4">Details</h6>
              <p class="mb-3">{{ selected.details }}</p>
            </div>

            <!-- My rating -->
            <div class="border-top pt-2">
              <div
                v-if="currentUser"
                class="d-flex align-items-center justify-content-between"
              >
                <div class="me-3">Your rating</div>

                <div class="d-flex align-items-center">
                  <Rating
                    v-model="myRating"
                    :disabled="ratingSaving"
                    @update:modelValue="setMyRating"
                  />

                  <button
                    :disabled="ratingSaving || myRating === 0"
                    type="button"
                    class="btn btn-sm btn-outline-secondary ms-2 d-inline-flex align-items-center justify-content-center"
                    style="width: 54px; height: 30px"
                    @click="clearMyRating"
                  >
                    <span
                      v-if="ratingSaving"
                      class="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    <span v-else>Clear</span>
                  </button>
                </div>
              </div>
              <div v-else class="text-muted small mt-2">
                Sign in to rate this recipe.
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-dark" @click="closeRecipeModal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import Modal from "bootstrap/js/dist/modal";
import { currentUser } from "@/firebase/init";
import { getCountFromServer } from "firebase/firestore";
import {
  generateRecipesQueryByFilters,
  getRecipesByPage
} from "@/firestore/recipes";
import { getRating, setRating, clearRating } from "@/firestore/ratings";

/* pagination */
const loading = ref(true);
const paginatedRecipes = ref([]);

const modalEl = ref(null);
let modal = null;
const selected = ref(null);

const currentPage = ref(0);
const pageSize = 12;
const totalCount = ref(0);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / pageSize))
);

let currQuery = generateRecipesQueryByFilters(null);
let cursors = [];

async function fetchTotalCount() {
  const snap = await getCountFromServer(currQuery);
  totalCount.value = snap.data().count || 0;
}

async function loadPage(n) {
  loading.value = true;
  try {
    const pages = Math.max(1, Math.ceil(totalCount.value / pageSize));
    const page = Math.min(Math.max(0, n), pages);

    // Fetch data for the current page
    const { data, cursors: newCursors } = await getRecipesByPage(
      page,
      currQuery,
      pageSize,
      cursors
    );

    cursors = newCursors;
    paginatedRecipes.value = data;
    currentPage.value = page;
  } finally {
    loading.value = false;
  }
}

const pageWindow = computed(() => {
  const maxBtns = 5;
  const pages = totalPages.value;
  const cur = currentPage.value;
  if (pages <= maxBtns) return Array.from({ length: pages }, (_, i) => i + 1);
  let start = Math.max(1, cur - Math.floor(maxBtns / 2));
  let end = start + maxBtns - 1;
  if (end > pages) {
    end = pages;
    start = pages - maxBtns + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

async function goPage(n) {
  await loadPage(n - 1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function goPrev() {
  if (currentPage.value <= 0 || loading.value) return;
  await loadPage(currentPage.value - 1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function goNext() {
  if (currentPage.value >= totalPages.value || loading.value) return;
  await loadPage(currentPage.value + 1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* modal */
const ratingAvg = ref(0);
const ratingCount = ref(0);
const myRating = ref(0);
const hover = ref(0);

async function openRecipeModal(recipe) {
  selected.value = recipe;
  // reset ratings
  ratingAvg.value = 0;
  ratingCount.value = 0;
  myRating.value = 0;
  await loadRating(recipe.id);
  modal?.show();
}

function closeRecipeModal() {
  modal?.hide();
  hover.value = 0;
}

/* ratings */
const ratingSaving = ref(false);

const displayAvg = computed(() =>
  ratingCount.value ? ratingAvg.value.toFixed(1) : "0.0"
);

async function loadRating(recipeId) {
  const { count, avg, myRating: myR } = await getRating(recipeId);
  ratingCount.value = count;
  ratingAvg.value = avg;
  myRating.value = myR;
}

async function setMyRating() {
  ratingSaving.value = true;
  try {
    await setRating(selected.value.id, myRating.value);
    await loadRating(selected.value.id);
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
  modal = new Modal(modalEl.value);
  await fetchTotalCount();
  if (totalCount.value > 0) await loadPage(0);
  else loading.value = false;
});

onBeforeUnmount(() => {
  modal?.dispose?.();
});
</script>

<style scoped>
#searchBar {
  background:
    linear-gradient(rgba(128, 128, 128, 0), rgba(128, 128, 128, 1)),
    url("@/assets/imgs/bg.jpg") center/cover no-repeat;
}
</style>
