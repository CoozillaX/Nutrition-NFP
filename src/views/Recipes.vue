<template>
  <section class="bg-light d-flex flex-column min-vh-100">
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
          <div class="card h-100 flex-fill text-start">
            <div class="ratio ratio-16x9">
              <img
                v-if="recipe.imageUrl"
                :src="recipe.imageUrl"
                class="card-img-top"
                alt="Recipe image"
                style="object-fit: cover; cursor: pointer"
                @click="openRecipe(recipe)"
              />
              <div
                v-else
                class="bg-secondary w-100 h-100"
                style="cursor: pointer"
                @click="openRecipe(recipe)"
              ></div>
            </div>

            <div
              class="card-body"
              @click="openRecipe(recipe)"
              style="cursor: pointer"
            >
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
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button
                class="page-link"
                @click="goPrev"
                :disabled="currentPage === 1"
              >
                Previous
              </button>
            </li>

            <li
              v-for="n in pageWindow"
              :key="n"
              class="page-item"
              :class="{ active: n === currentPage }"
            >
              <button class="page-link" @click="goPage(n)">{{ n }}</button>
            </li>

            <li
              class="page-item"
              :class="{ disabled: currentPage === totalPages }"
            >
              <button
                class="page-link"
                @click="goNext"
                :disabled="currentPage === totalPages"
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
              @click="closeModal"
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
              <Rating v-model="ratingAvg" readonly/>
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
                  <Rating v-model="myRating" :disabled="ratingSaving" @update:modelValue="setMyRating"/>

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
            <button
              v-if="currentRole === 'admin'"
              class="btn btn-danger"
              @click="onDelete()"
            >
              Delete
            </button>
            <button class="btn btn-dark" @click="closeModal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import Modal from "bootstrap/js/dist/modal";
import { db, storage, currentRole, currentUser } from "@/firebase/init";
import { ref as storageRef, deleteObject } from "firebase/storage";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
  doc,
  deleteDoc,
  where,
  setDoc,
  serverTimestamp,
  getAggregateFromServer,
  count,
  average
} from "firebase/firestore";
import Rating from 'primevue/rating';

/* pagination */
const loading = ref(true);
const paginatedRecipes = ref([]);

const modalEl = ref(null);
let modal = null;
const selected = ref(null);

const currentPage = ref(1);
const pageSize = 12;
const totalCount = ref(0);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / pageSize))
);

const baseCol = collection(db, "recipes");
const baseQuery = () => query(baseCol, orderBy("createdAt", "desc"));

async function fetchTotalCount() {
  const snap = await getCountFromServer(baseQuery());
  totalCount.value = snap.data().count || 0;
}

async function getCursorForPage(n) {
  if (n <= 1) return null;
  let cursor = null;
  for (let i = 0; i < n - 1; i++) {
    let q = query(baseCol, orderBy("createdAt", "desc"), limit(pageSize));
    if (cursor)
      q = query(
        baseCol,
        orderBy("createdAt", "desc"),
        startAfter(cursor),
        limit(pageSize)
      );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    cursor = snap.docs[snap.docs.length - 1];
  }
  return cursor;
}

async function loadPage(n) {
  loading.value = true;
  try {
    const pages = Math.max(1, Math.ceil(totalCount.value / pageSize));
    const target = Math.min(Math.max(1, n), pages);
    const cursor = await getCursorForPage(target);
    let q = query(baseCol, orderBy("createdAt", "desc"), limit(pageSize));
    if (cursor)
      q = query(
        baseCol,
        orderBy("createdAt", "desc"),
        startAfter(cursor),
        limit(pageSize)
      );
    const snap = await getDocs(q);
    paginatedRecipes.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    currentPage.value = target;
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
  await loadPage(n);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function goPrev() {
  if (currentPage.value <= 1 || loading.value) return;
  await loadPage(currentPage.value - 1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function goNext() {
  if (currentPage.value >= totalPages.value || loading.value) return;
  await loadPage(currentPage.value + 1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ratings */
const ratingAvg = ref(0);
const ratingCount = ref(0);
const myRating = ref(0);
const hover = ref(0);
const ratingSaving = ref(false);

const displayAvg = computed(() =>
  ratingCount.value ? ratingAvg.value.toFixed(1) : "0.0"
);

async function loadRatingsFor(recipeId) {
  // get all ratings for this recipe
  const qAll = query(
    collection(db, "ratings"),
    where("recipeId", "==", recipeId)
  );

  const snap = await getAggregateFromServer(qAll, {
    avg: average("value"),
    count: count()
  });

  ratingCount.value = snap.data().count || 0;
  ratingAvg.value = snap.data().avg || 0;

  // my own rating
  if (currentUser.value) {
    const qMine = query(
      collection(db, "ratings"),
      where("recipeId", "==", recipeId),
      where("userId", "==", currentUser.value.uid),
      limit(1)
    );
    const mineSnap = await getDocs(qMine);
    if (!mineSnap.empty) {
      const val = Number(mineSnap.docs[0].data().value || 0);
      myRating.value = val;
    }
  }
}

async function openRecipe(recipe) {
  selected.value = recipe;
  // reset ratings
  ratingAvg.value = 0;
  ratingCount.value = 0;
  myRating.value = 0;
  await loadRatingsFor(recipe.id);
  modal?.show();
}

function closeModal() {
  modal?.hide();
  hover.value = 0;
}

async function setMyRating() {
  ratingSaving.value = true;
  const docId = `${selected.value.id}_${currentUser.value.uid}`;
  try {
    await setDoc(
      doc(db, "ratings", docId),
      {
        recipeId: selected.value.id,
        userId: currentUser.value.uid,
        value: myRating.value,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    await loadRatingsFor(selected.value.id);
  } finally {
    ratingSaving.value = false;
  }
}

async function clearMyRating() {
  if (!currentUser.value || !selected.value?.id) return;
  if (!myRating.value) return;

  myRating.value = 0;
  ratingSaving.value = true;
  const docId = `${selected.value.id}_${currentUser.value.uid}`;
  try {
    // remove my rating document entirely
    await deleteDoc(doc(db, "ratings", docId));
    await loadRatingsFor(selected.value.id);
  } finally {
    ratingSaving.value = false;
  }
}

/* delete */
async function onDelete() {
  if (!selected?.value?.id) return;
  if (currentRole.value !== "admin") return;
  if (!confirm("Are you sure to delete this recipe?")) return;

  try {
    if (selected.value.imagePath) {
      try {
        const fileRef = storageRef(storage, selected.value.imagePath);
        await deleteObject(fileRef);
      } catch {}
    }
    await deleteDoc(doc(db, "recipes", selected.value.id));

    const qAll = query(
      collection(db, "ratings"),
      where("recipeId", "==", selected.value.id)
    );
    const snap = await getDocs(qAll);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

    await fetchTotalCount();
    await loadPage(currentPage.value);
    closeModal();
  } catch {
    alert("Delete failed.");
  }
}

onMounted(async () => {
  modal = new Modal(modalEl.value);
  await fetchTotalCount();
  if (totalCount.value > 0) await loadPage(1);
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
