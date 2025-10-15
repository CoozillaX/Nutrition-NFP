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
        @click="openCourseModal(course)"
      >
        <template #header>
          <div class="relative">
            <img
              v-if="course.imageUrl"
              :alt="course.name"
              :src="course.imageUrl"
              class="w-full h-48 object-cover"
            />
            <img v-else class="w-full h-48 object-cover" />
            <Tag
              :value="course.location ? 'In-Person' : 'Online'"
              class="absolute top-2 right-2"
              :severity="course.location ? 'info' : 'success'"
              rounded
            />
          </div>
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
    <Stepper value="1" linear>
      <StepList>
        <Step value="1">Basic Info</Step>
        <Step value="2">Location</Step>
      </StepList>

      <StepPanels>
        <StepPanel v-slot="{ activateCallback }" value="1">
          <!-- Image -->
          <img
            v-if="selected?.imageUrl"
            :alt="selected.name"
            :src="selected.imageUrl"
            class="w-full h-112 object-cover mb-4 rounded-lg"
          />
          <img v-else class="w-full h-112 object-cover mb-4 rounded-lg" />
          <!-- Summary -->
          <p class="mb-4 text-muted-color" v-if="selected?.summary">
            {{ selected.summary }}
          </p>
          <!-- Details -->
          <div v-if="selected?.details" class="mb-4">
            <h5 class="font-semibold mb-2">Details</h5>
            <p>
              {{ selected.details }}
            </p>
          </div>
          <!-- Actions -->
          <div class="flex justify-end">
            <Button
              label="Next"
              type="submit"
              icon="pi pi-arrow-right"
              @click="activateCallback('2')"
            ></Button>
          </div>
        </StepPanel>
        <StepPanel v-slot="{ activateCallback }" value="2">
          <!-- Location -->
          <div v-if="selected?.location" class="mb-4">
            <MapboxMap
              ref="mapboxRef"
              :accessToken="mapbox_token"
              :center="map_center"
              :zoom="10"
              style="height: 660px; width: 100%"
              map-style="mapbox://styles/mapbox/streets-v11"
              @mb-created="onMapCreated"
            >
              <MapboxMarker
                v-if="selected.location"
                :lng-lat="selected.location"
              />
              <MapboxNavigationControl position="bottom-right" />
            </MapboxMap>
          </div>
          <div v-else class="flex flex-col h-96 mb-4">
            <div
              class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-950 flex-auto flex justify-center items-center font-medium"
            >
              <i class="pi pi-info-circle me-2"></i>
              This course is conducted online.
            </div>
          </div>
          <!-- Actions -->
          <div class="flex justify-start">
            <Button
              label="Back"
              type="submit"
              icon="pi pi-arrow-left"
              @click="activateCallback('1')"
            ></Button>
          </div>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </Dialog>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { query, limit, startAfter, getDocs } from "firebase/firestore";
import { generateDatatableQueryByFilters } from "@/firestore/utils";
import {
  MapboxMap,
  MapboxMarker,
  MapboxNavigationControl
} from "@studiometa/vue-mapbox-gl";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";

// Mapbox
const mapbox_token = import.meta.env.VITE_MAPBOX_TOKEN;
const map_center = ref([144.9631, -37.8136]); // Melbourne

const mapboxRef = ref(null);
const mapInstance = ref(null);

function onMapCreated(m) {
  mapInstance.value = m;
  const directions = new MapboxDirections({
    accessToken: mapbox_token,
    unit: "metric",
    profile: "mapbox/driving",
    interactive: false,
  });

  mapInstance.value.addControl(directions, "top-left");
  document.querySelector(".directions-reverse")?.remove();
  document
    .querySelector("#mapbox-directions-destination-input input")
    ?.setAttribute("disabled", "true");
  document
    .querySelector("#mapbox-directions-destination-input button")
    ?.remove();

  // Set destination to course location
  directions.setDestination(selected.value.location);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const userCoords = [pos.coords.longitude, pos.coords.latitude];
      directions.setOrigin(userCoords);
    },
    (err) => {
      console.warn(`ERROR(${err.code}): ${err.message}`);
      directions.setOrigin(map_center.value);
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
}

// DataView
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

/* modal */
const modalVisible = ref(false);
const selected = ref(null);

async function openCourseModal(course) {
  selected.value = course;
  modalVisible.value = true;
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
