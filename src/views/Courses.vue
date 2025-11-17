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
        class="cursor-pointer"
        tabindex="0"
        :key="course.id"
        @click="openCourseModal(course)"
        @keydown.enter.prevent="openCourseModal(course)"
      >
        <template #header>
          <div class="relative">
            <img
              v-if="course.imageUrl"
              :src="course.imageUrl"
              class="w-full h-48 object-cover"
              alt=""
            />
            <img v-else class="w-full h-48 object-cover" alt="" />
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
        class="w-full sm:w-auto"
        tabindex="0"
        :loading="loading"
        @click="loadPage"
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
        <Step value="3">Bookings</Step>
      </StepList>

      <StepPanels>
        <StepPanel v-slot="{ activateCallback }" value="1">
          <!-- Image -->
          <img
            v-if="selected?.imageUrl"
            :src="selected.imageUrl"
            alt=""
            class="w-full h-112 object-cover mb-4 rounded-lg"
          />
          <img
            v-else
            class="w-full h-112 object-cover mb-4 rounded-lg"
            alt=""
          />
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
              icon="pi pi-arrow-right"
              tabindex="0"
              @click="activateCallback('2')"
            ></Button>
          </div>
        </StepPanel>
        <StepPanel v-slot="{ activateCallback }" value="2">
          <!-- Location -->
          <div v-if="selected?.location" class="mb-4">
            <MapboxMap
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
          <div class="flex justify-between">
            <Button
              label="Back"
              icon="pi pi-arrow-left"
              tabindex="0"
              @click="activateCallback('1')"
            ></Button>
            <Button
              v-if="currentUser"
              label="Next"
              icon="pi pi-arrow-right"
              tabindex="0"
              @click="onEnterBookingStep(() => activateCallback('3'))"
            ></Button>
            <div v-else class="flex items-center text-sm text-muted-color">
              <i class="pi pi-info-circle me-2"></i>
              Login is required to book this course.
            </div>
          </div>
        </StepPanel>
        <StepPanel v-slot="{ activateCallback }" value="3">
          <FullCalendar ref="fc" :options="calendarOptions" />
          <div class="flex pt-6 justify-start">
            <Button
              label="Back"
              icon="pi pi-arrow-left"
              tabindex="0"
              @click="activateCallback('2')"
            ></Button>
          </div>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </Dialog>
  <!-- Context Menu for FullCalendar -->
  <Popover ref="cp">
    <div class="flex flex-col">
      <div>
        <i class="pi pi-question-circle mr-2"></i>
        <span v-if="currentEventIsBooked" class="mr-3"
          >Do you want to cancel your booking?</span
        >
        <span v-else class="mr-3">Do you want to book this course slot?</span>
      </div>
      <div class="flex justify-end mt-3">
        <Button
          id="cp-btn"
          label="Yes"
          icon="pi pi-check"
          size="small"
          :severity="currentEventIsBooked ? 'danger' : 'success'"
          :loading="popoverLoading"
          @click="onPopoverConfirm"
        ></Button>
      </div>
    </div>
  </Popover>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useToast } from "primevue/usetoast";
import { query, limit, startAfter, getDocs } from "firebase/firestore";
import { generateDatatableQueryByFilters } from "@/firestore/utils";
import { currentUser } from "@/firebase/auth";
import {
  MapboxMap,
  MapboxMarker,
  MapboxNavigationControl
} from "@studiometa/vue-mapbox-gl";
// @ts-ignore: Could not find a declaration file for '@mapbox/mapbox-gl-directions'
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { generateCourseSlotsQueryByFilters } from "@/firestore/courseSlots";
import { isBooked, addBooking, deleteBooking } from "@/firestore/bookings";

// Types
import Popover from "primevue/popover";
import type { Query, QueryDocumentSnapshot } from "firebase/firestore";
import type { Map } from "mapbox-gl";
import type {
  EventApi,
  EventInput,
  CalendarOptions
} from "@fullcalendar/core";

const toast = useToast();

// Mapbox
const mapbox_token = import.meta.env.VITE_MAPBOX_TOKEN;
const mapInstance = ref<Map | null>(null);

const map_center = ref([144.9631, -37.8136]); // Melbourne

function onMapCreated(m: Map) {
  mapInstance.value = m;
  // Add directions control
  const directions = new MapboxDirections({
    accessToken: mapbox_token,
    unit: "metric",
    profile: "mapbox/driving",
    interactive: false
  });

  // @ts-ignore
  mapInstance.value.addControl(directions as any, "top-left");

  // Remove unwanted UI elements
  document.querySelector(".directions-reverse")?.remove();
  document
    .querySelector("#mapbox-directions-destination-input input")
    ?.setAttribute("disabled", "true");
  document
    .querySelector("#mapbox-directions-destination-input button")
    ?.remove();

  // Set destination to course location
  directions.setDestination(selected.value!.location);
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
// Course entity type
const courses = ref<CourseEntity[]>([]);
const pageSize = 12;

// Base query and cursor
let baseQuery: Query = generateDatatableQueryByFilters("courses")!;
// Current cursor
let cursor: QueryDocumentSnapshot | null = null;
// Prefetch promise
let prefetchPromise: Promise<{
  rows: CourseEntity[];
  nextCursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}> | null = null;

// Request a page of data and return the results
const fetchPage = async (cursor: QueryDocumentSnapshot | null) => {
  let q = query(baseQuery, limit(pageSize));
  if (cursor) q = query(baseQuery, startAfter(cursor), limit(pageSize));

  const snap = await getDocs(q);
  const rows = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as CourseEntity
  );
  const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1]! : cursor;
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
const selected = ref<CourseEntity | null>(null);

async function openCourseModal(course: CourseEntity) {
  selected.value = course;
  modalVisible.value = true;
}

// FullCalendar
const fc = ref<InstanceType<typeof FullCalendar> | null>(null);
const cp = ref<InstanceType<typeof Popover> | null>(null);

let currentEvent: EventApi | null = null;
const currentEventIsBooked = ref(false);
const popoverLoading = ref(false);

// Reload FullCalendar events
const reloadCalendar = () => {
  nextTick(() => {
    fc.value?.getApi().refetchEvents();
    fc.value?.getApi().render();
  });
};

// When entering booking step
const onEnterBookingStep = (activateCallback: () => void) => {
  activateCallback();
  reloadCalendar();
};

// FullCalendar options
const calendarOptions: CalendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: "timeGridWeek",
  allDaySlot: false,
  slotMinTime: "08:00:00",
  slotMaxTime: "22:00:00",
  eventOverlap: false,
  selectOverlap: false,
  eventInteractive: true,

  // Load events dynamically
  events(fetchInfo, successCallback, failureCallback) {
    if (!selected.value?.id) {
      failureCallback(new Error("No course selected"));
      return;
    }
    // Generate query
    const query = generateCourseSlotsQueryByFilters({
      courseId: selected.value.id,
      // Cast to any to avoid type incompatibility between FullCalendar's Date and expected filter types
      start: fetchInfo.start as unknown as any,
      end: fetchInfo.end as unknown as any
    });
    // Fetch data
    getDocs(query)
      .then((querySnapshot) => {
        const events: EventInput[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          events.push({
            id: doc.id,
            title: `Capacity: ${data.capacity}`,
            start: data.start?.toDate?.() ?? data.start,
            end: data.end?.toDate?.() ?? data.end,
            capacity: data.capacity
          });
        });
        successCallback(events);
      })
      .catch((err) => {
        failureCallback(err);
      });
  },

  // Context menu
  async eventClick(arg) {
    currentEvent = arg.event;
    currentEventIsBooked.value = await isBooked(arg.event.id);
    cp.value?.toggle(arg.jsEvent, arg.jsEvent.target);
    nextTick(() => {
      document.getElementById("cp-btn")?.focus();
    });
  }
};

// Handle popover confirm
const onPopoverConfirm = async () => {
  popoverLoading.value = true;
  try {
    if (currentEventIsBooked.value) {
      // Cancel booking
      await deleteBooking(currentEvent!.id);
    } else {
      // Add booking
      await addBooking(currentEvent!.id);
    }
    toast.add({
      severity: "success",
      summary: "Success",
      detail: currentEventIsBooked.value
        ? "Booking cancelled"
        : "Booking added",
      life: 1000
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Error: ${(error as any)?.response?.data || (error as any)?.message || String(error)}`,
      life: 1000
    });
  } finally {
    popoverLoading.value = false;
    cp.value?.hide();
  }
};

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
