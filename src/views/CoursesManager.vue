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
        @click="openCourseModal()"
      ></Button>
      <Button label="Export" icon="pi pi-upload" severity="secondary"></Button>
    </template>
  </Toolbar>

  <!-- Course Modal -->
  <Dialog
    v-model:visible="courseModalVisible"
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
            :initialValues="courseInitialValues"
            :resolver="courseFormResolver"
            @submit="
              onCourseFormSubmit(() => {
                activateCallback('2');
              })($event)
            "
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
              <div v-if="currentCourse?.imageUrl" class="mt-2">
                <div class="flex items-center gap-3">
                  <Image
                    :src="currentCourse?.imageUrl"
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
                    @click="onFileRemove"
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
                onLocationSubmit(() => {
                  activateCallback('3');
                })
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
              @click="courseModalVisible = false"
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
        <span class="mr-3">What do you want to do?</span>
      </div>
      <div class="flex justify-end mt-3">
        <Button
          label="Edit"
          icon="pi pi-pencil"
          class="mr-2"
          size="small"
          @click="openCourseSlotModal"
        ></Button>
        <Button
          label="Delete"
          icon="pi pi-trash"
          severity="danger"
          size="small"
          @click="deleteEvent"
        ></Button>
      </div>
    </div>
  </Popover>
  <!-- Course Slot Modal -->
  <Dialog
    v-model:visible="courseSlotModalVisible"
    modal
    header="Course Slot Editor"
    :style="{ width: '34rem' }"
    :draggable="false"
  >
    <Form
      :initialValues="courseSlotInitialValues"
      @submit="onCourseSlotFormSubmit($event)"
    >
      <!-- Capacity -->
      <div>
        <label for="capacity" class="form-label">Capacity *</label>
        <InputNumber
          name="capacity"
          :min="1"
          :max="1000"
          placeholder="e.g., 20"
          fluid
        />
      </div>
      <!-- Operations -->
      <div class="flex pt-6 justify-end">
        <Button label="Save" type="submit" :loading="submitting"></Button>
      </div>
    </Form>
  </Dialog>
</template>

<script setup>
import { ref, reactive, nextTick } from "vue";
import { useToast } from "primevue/usetoast";
import { getDocs } from "firebase/firestore";
import {
  MapboxMap,
  MapboxMarker,
  MapboxGeocoder,
  MapboxNavigationControl
} from "@studiometa/vue-mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css";

import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { addCourse, updateCourse } from "@/firestore/courses";
import { updateImage } from "@/firestore/utils";

import {
  generateCourseSlotsQueryByFilters,
  addCourseSlot,
  updateCourseSlot,
  deleteCourseSlot
} from "@/firestore/courseSlots";

const toast = useToast();

// Mapbox
const mapbox_token = import.meta.env.VITE_MAPBOX_TOKEN;
const map_center = ref([144.9631, -37.8136]); // Melbourne

function onMapClick(event) {
  courseLngLat.value = [event.lngLat.lng, event.lngLat.lat];
}

// FullCalendar
const fc = ref(null);
const cp = ref(null);
let currentEvent = null;

const reloadCalendar = () => {
  nextTick(() => {
    fc.value?.getApi().refetchEvents();
    fc.value?.getApi().render();
  });
};

const deleteEvent = () => {
  currentEvent.remove();
  fc.value?.getApi().render();
  cp.value?.hide();
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
    if (!currentCourse.value?.id) {
      failureCallback("No course selected");
      return;
    }
    // Generate query
    const query = generateCourseSlotsQueryByFilters({
      courseId: currentCourse.value.id,
      start: fetchInfo.start,
      end: fetchInfo.end
    });
    // Fetch data
    getDocs(query)
      .then((querySnapshot) => {
        const events = [];
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

  // Add new event
  select(arg) {
    const api = fc.value.getApi();
    // Ensure start and end are on the same day
    const startDate = arg.startStr.split("T")[0];
    const endDate = arg.endStr.split("T")[0];
    if (startDate !== endDate) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Course slot must start and end on the same day.",
        life: 3000
      });
    } else {
      currentEvent = arg;
      openCourseSlotModal();
    }
    api.unselect();
  },

  // Context menu
  eventClick(arg) {
    currentEvent = arg.event;
    cp.value?.toggle(arg.jsEvent, arg.jsEvent.target);
  },

  // Update event
  eventChange(arg) {
    updateCourseSlot(arg.event.id, {
      start: arg.event.start,
      end: arg.event.end,
      capacity: arg.event.extendedProps.capacity || 1
    })
      .then((_) => {
        toast.add({
          severity: "success",
          summary: "Success",
          detail: "Course slot updated.",
          life: 3000
        });
        fc.value?.getApi().refetchEvents();
      })
      .catch((err) => {
        toast.add({
          severity: "error",
          summary: "Error",
          detail: `Error: ${err.message}`,
          life: 3000
        });
        arg.revert();
      });
  },

  // Delete event
  eventRemove(arg) {
    deleteCourseSlot(arg.event)
      .then((_) => {
        toast.add({
          severity: "success",
          summary: "Success",
          detail: "Course slot deleted.",
          life: 3000
        });
      })
      .catch((err) => {
        toast.add({
          severity: "error",
          summary: "Error",
          detail: `Error: ${err.message}`,
          life: 3000
        });
        arg.revert();
      });
  }
};

// Course Modal
const currentCourse = ref(null);
const courseInitialValues = reactive({
  name: "",
  summary: "",
  details: ""
});

const courseModalVisible = ref(false);
const imageData = ref(null);
const courseLngLat = ref(null);
const submitting = ref(false);

const openCourseModal = (course) => {
  currentCourse.value = course;
  imageData.value = null;
  if (course) {
    // Edit existing course
    courseInitialValues.name = course.name;
    courseInitialValues.summary = course.summary;
    courseInitialValues.details = course.details;
    courseLngLat.value = course.location;
  } else {
    // Create new course
    courseInitialValues.name = "";
    courseInitialValues.summary = "";
    courseInitialValues.details = "";
    courseLngLat.value = null;
  }
  courseModalVisible.value = true;
};

const courseFormResolver = ({ values }) => {
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

function onFileRemove() {
  if (currentCourse.value) {
    currentCourse.value.imageUrl = "";
  }
  imageData.value = null;
}

function onCourseFormSubmit(nextStepFn) {
  return async ({ valid, values }) => {
    if (!valid) return;
    try {
      submitting.value = true;
      if (currentCourse.value) {
        // Update basic info
        let updatedFields = {
          name: values.name.trim(),
          summary: values.summary.trim(),
          details: values.details.trim()
        };

        // Update image if changed
        if (
          imageData.value || // New image selected
          (!currentCourse.value?.imageUrl && currentCourse.value?.imagePath) // Existing image removed
        ) {
          const { imageUrl, imagePath } = await updateImage(
            currentCourse.value?.imagePath,
            imageData.value
          );
          updatedFields.imageUrl = imageUrl;
          updatedFields.imagePath = imagePath;
        }

        // Save to Firestore
        await updateCourse(currentCourse.value.id, updatedFields);
        nextTick(() => {
          currentCourse.value = { ...currentCourse.value, ...updatedFields };
        });
      } else {
        // Creating new course
        const courseRef = await addCourse(
          {
            name: values.name.trim(),
            summary: values.summary.trim(),
            details: values.details.trim()
          },
          imageData.value
        );
        nextTick(() => {
          currentCourse.value = { id: courseRef.id, ...values };
        });
      }

      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Course basic info saved.",
        life: 3000
      });

      nextStepFn();
    } catch (err) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: `Error: ${err.message}`,
        life: 3000
      });
    } finally {
      submitting.value = false;
    }
  };
}

// Location Step
function onLocationSubmit(nextStepFn) {
  updateCourse(currentCourse.value.id, {
    location: courseLngLat.value
  })
    .then(() => {
      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Course location saved.",
        life: 3000
      });
      nextStepFn();
      reloadCalendar();
    })
    .catch((err) => {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: `Error: ${err.message}`,
        life: 3000
      });
    });
}

// Time Slots Modal
const courseSlotInitialValues = reactive({
  capacity: 1
});

const courseSlotModalVisible = ref(false);

const openCourseSlotModal = () => {
  if (currentEvent?.extendedProps) {
    // Edit existing slot
    courseSlotInitialValues.capacity = currentEvent.extendedProps.capacity || 1;
  } else {
    // Create new slot
    courseSlotInitialValues.capacity = 1;
  }
  cp.value?.hide();
  courseSlotModalVisible.value = true;
};

const onCourseSlotFormSubmit = async ({ valid, values }) => {
  if (!valid || !currentEvent) return;
  submitting.value = true;

  try {
    if (currentEvent.id && currentEvent.id !== "null") {
      // Update existing slot (only capacity changed)
      currentEvent.setExtendedProp("capacity", values.capacity);
    } else {
      // Add new slot
      await addCourseSlot({
        courseId: currentCourse.value.id,
        start: currentEvent.start,
        end: currentEvent.end,
        capacity: values.capacity
      });
      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Course slot added.",
        life: 3000
      });
      fc.value?.getApi().refetchEvents();
    }
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Error: ${err.message}`,
      life: 3000
    });
  } finally {
    courseSlotModalVisible.value = false;
    submitting.value = false;
  }
};
</script>

<style scoped>
:deep(.p-progressbar) {
  display: none !important;
}
:deep(.p-fileupload-file-badge) {
  display: none !important;
}
</style>
