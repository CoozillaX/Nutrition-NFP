<template>
  <Toolbar>
    <template #start>
      <h2 class="font-bold text-xl">Courses Manager</h2>
    </template>

    <template #end>
      <Button
        label="New"
        icon="pi pi-plus"
        class="mr-2"
        @click="openModal()"
      ></Button>
      <Button label="Export" icon="pi pi-upload" severity="secondary"></Button>
    </template>
  </Toolbar>

  <!-- Course Modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    header="Course Editor"
    :style="{ width: '54rem' }"
    :draggable="false"
  >
    <Stepper value="1" linear>
      <StepList>
        <Step value="1">Basic Info</Step>
        <Step value="2">Location</Step>
        <Step value="3">Time Slots</Step>
      </StepList>

      <StepPanels>
        <StepPanel v-slot="{ activateCallback }" value="1">
          <Form
            v-slot="$form"
            :initialValues="initialValues"
            :resolver="formResolver"
            @submit="onDialogSubmit(activateCallback)($event)"
          >
            <!-- Name -->
            <div>
              <label for="name" class="form-label">Name *</label>
              <InputText
                name="name"
                type="text"
                placeholder="e.g., Barista Coffee Course"
                fluid
              />
              <Message
                v-if="$form.name?.error"
                severity="error"
                size="small"
                variant="simple"
                >{{ $form.name.errors }}</Message
              >
            </div>
            <!-- Summary -->
            <div class="mt-3">
              <label for="summary" class="form-label"
                >Summary (≤ 160 chars) *</label
              >
              <Textarea
                name="summary"
                type="text"
                rows="3"
                placeholder="A short description of the course"
                fluid
              ></Textarea>
              <Message
                v-if="$form.summary?.error"
                severity="error"
                size="small"
                variant="simple"
                >{{ $form.summary.errors }}</Message
              >
            </div>
            <!-- Details -->
            <div class="mt-3">
              <label for="details" class="form-label">Details *</label>
              <Textarea
                name="details"
                type="text"
                rows="6"
                placeholder="A detailed description of the course"
                fluid
              >
              </Textarea>
              <Message
                v-if="$form.details?.error"
                severity="error"
                size="small"
                variant="simple"
                >{{ $form.details.errors }}</Message
              >
            </div>
            <!-- Image (optional) -->
            <div class="mt-3">
              <label for="image" class="form-label">Image (optional)</label>
              <div v-if="$form.imageUrl?.value" class="mt-2">
                <div class="flex items-center gap-3">
                  <Image
                    :src="$form.imageUrl.value"
                    width="96"
                    height="96"
                    preview
                  ></Image>
                  <Button
                    type="button"
                    label="Remove"
                    icon="pi pi-times"
                    severity="danger"
                    outlined
                    @click="
                      $form.imageUrl.value = '';
                      imageData = null;
                    "
                    :disabled="submitting"
                    size="small"
                  ></Button>
                </div>
              </div>

              <FileUpload
                v-else
                name="image"
                accept="image/*"
                chooseLabel="Select Image"
                :maxFileSize="5000000"
                :customUpload="false"
                :auto="false"
                :showUploadButton="false"
                :showCancelButton="false"
                :disabled="submitting"
                @select="onFileSelect"
                @remove="imageData = null"
              >
                <template #empty>
                  <small>PNG/JPEG/WebP, ≤ 5MB</small>
                </template>
              </FileUpload>
            </div>
            <div class="flex pt-6 justify-end">
              <Button
                label="Next"
                type="submit"
                icon="pi pi-arrow-right"
                :loading="submitting"
              ></Button>
            </div>
          </Form>
        </StepPanel>
        <StepPanel v-slot="{ activateCallback }" value="2">
          <MapboxMap
            :accessToken="mapbox_token"
            :center="map_center"
            :zoom="10"
            style="height: 400px; width: 100%"
            map-style="mapbox://styles/mapbox/streets-v11"
            @mb-click="onMapClick"
          >
            <MapboxMarker v-if="courseLngLat" :lng-lat="courseLngLat" />
            <MapboxGeocoder :marker="false" />
            <MapboxNavigationControl position="bottom-right" />
          </MapboxMap>
          <div class="flex items-center gap-3 mt-4">
            <FloatLabel variant="on">
              <InputText
                id="location"
                placeholder="Click on the map to select location (leave blank if online)"
                :value="courseLngLat ? courseLngLat.join(', ') : ''"
                readonly
                fluid
              />
              <label for="location">Location</label>
            </FloatLabel>
            <Button
              v-if="courseLngLat"
              label="Clear"
              icon="pi pi-trash"
              severity="danger"
              outlined
              @click="courseLngLat = null"
            ></Button>
          </div>
          <div class="flex pt-6 justify-end">
            <Button
              label="Next"
              icon="pi pi-arrow-right"
              iconPos="right"
              @click="
                activateCallback('3');
                updateCalendar();
              "
            ></Button>
          </div>
        </StepPanel>
        <StepPanel value="3">
          <FullCalendar ref="fc" :options="calendarOptions" />
          <div class="flex pt-6 justify-end">
            <Button
              label="Done"
              icon="pi pi-check"
              iconPos="right"
              class="ml-2"
              :loading="submitting"
              @click="modalVisible = false"
            ></Button>
          </div>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </Dialog>
</template>

<script setup>
import { ref, reactive, nextTick } from "vue";
import { useConfirm } from "primevue/useconfirm";
import {
  MapboxMap,
  MapboxMarker,
  MapboxGeocoder,
  MapboxNavigationControl
} from "@studiometa/vue-mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import "@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css";

import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const confirm = useConfirm();

// Mapbox
const mapbox_token = import.meta.env.VITE_MAPBOX_TOKEN;
const map_center = ref([144.9631, -37.8136]); // Melbourne

function onMapClick(event) {
  courseLngLat.value = [event.lngLat.lng, event.lngLat.lat];
}

// FullCalendar
const fc = ref(null);

const updateCalendar = () => {
  nextTick(() => fc.value?.getApi().render());
};

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: "timeGridWeek",
  allDaySlot: false,
  slotMinTime: "08:00:00",
  slotMaxTime: "22:00:00",
  selectable: true,
  selectMirror: true,
  editable: true,
  eventResizableFromStart: true,
  eventOverlap: false,
  selectOverlap: false,

  // Load events dynamically
  events(fetchInfo, successCallback, failureCallback) {
    // console.log(fetchInfo.startStr, fetchInfo.endStr)
    successCallback([
      { id: "1", start: "2025-10-13T10:00:00", end: "2025-10-13T12:00:00" },
      { id: "1", start: "2025-10-14T14:00:00", end: "2025-10-14T16:00:00" }
    ]);
  },

  // Add new event
  select(arg) {
    const api = fc.value.getApi();
    api.addEvent({
      id: null,
      start: arg.start,
      end: arg.end
    });
    api.unselect();
  },

  // Delete event
  eventClick(arg) {
    confirm.require({
      target: arg.jsEvent.target,
      message: "Do you want to delete this slot?",
      icon: "pi pi-info-circle",
      rejectProps: {
        label: "Cancel",
        severity: "secondary",
        outlined: true
      },
      acceptProps: {
        label: "Delete",
        severity: "danger"
      },
      accept: () => {
        arg.event.remove();
      }
    });
    fc.value?.getApi().render();
  }
};

function getAllEvents() {
  const api = fc.value.getApi();
  return api.getEvents().map((ev) => {
    return {
      id: ev.id,
      start: ev.start,
      end: ev.end
    };
  });
}

// Course Modal
const initialValues = reactive({
  id: "",
  name: "",
  summary: "",
  details: "",
  imagePath: "",
  imageUrl: ""
});

const modalVisible = ref(false);
const imageData = ref(null);
const courseLngLat = ref(null);
const submitting = ref(false);

const openModal = (course) => {
  courseLngLat.value = null;
  if (course) {
    // Edit existing course
    initialValues.id = course.id;
    initialValues.name = course.name;
    initialValues.summary = course.summary;
    initialValues.details = course.details;
    initialValues.imagePath = course.imagePath || "";
    initialValues.imageUrl = course.imageUrl || "";
    courseLngLat.value = course.location || null;
  } else {
    // Create new course
    initialValues.id = "";
    initialValues.name = "";
    initialValues.summary = "";
    initialValues.details = "";
    initialValues.imagePath = "";
    initialValues.imageUrl = "";
    imageData.value = null;
  }
  modalVisible.value = true;
};

const formResolver = ({ values }) => {
  const errors = {};

  if (!values.name || !values.name.trim()) {
    errors.name = "Name is required.";
  } else if (values.name.trim().length > 80) {
    errors.name = "Name must be ≤ 80 characters.";
  }

  if (!values.summary || !values.summary.trim()) {
    errors.summary = "Summary is required.";
  } else if (values.summary.trim().length > 160) {
    errors.summary = "Summary must be ≤ 160 characters.";
  }

  if (!values.details || !values.details.trim()) {
    errors.details = "Details are required.";
  }

  return {
    values,
    errors
  };
};

function onFileSelect(e) {
  const file = e.files?.[0];
  if (file) imageData.value = file;
}

function onDialogSubmit(nextStepFn) {
  return ({ valid, values }) => {
    if (!valid) return;
    console.log("Form Values:", values);
    console.log("Image Data:", imageData.value);
    console.log("Course Location:", courseLngLat.value);
    console.log("Course Time Slots:", getAllEvents());

    nextStepFn("2");
  };
}
</script>
