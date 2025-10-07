<template>
  <!-- Recipes DataTable -->
  <DataTable
    ref="dataTableRef"
    tableStyle="min-width: 50rem"
    lazy
    paginator
    :value="recipesData"
    :rows="rowsPerPage"
    :totalRecords="totalRecords"
    :loading="loading"
    @page="onRecipeLazyLoad"
  >
    <template #header>
      <div
        class="d-flex flex-wrap align-items-center justify-content-between mb-2"
      >
        <span class="fs-4 fw-bold">Recipes Management</span>
        <Button
          icon="pi pi-plus"
          @click="openModal(null)"
          rounded
          raised
        ></Button>
      </div>
    </template>
    <Column field="name" header="Name"></Column>
    <Column header="Image">
      <template #body="slotProps">
        <Image
          :src="slotProps.data.imageUrl"
          :alt="slotProps.data.image"
          width="96"
          height="96"
          preview
        ></Image>
      </template>
    </Column>
    <Column field="summary" header="Summary"></Column>
    <Column field="createdAt" header="Created At">
      <template #body="slotProps">
        {{ formatDate(slotProps.data.createdAt) }}
      </template>
    </Column>
    <Column style="width: 10rem">
      <template #body="slotProps">
        <Button
          type="button"
          icon="pi pi-pencil"
          rounded
          severity="success"
          @click="() => openModal(slotProps.data)"
        />
        <Button
          type="button"
          icon="pi pi-trash"
          rounded
          severity="danger"
          class="ms-2"
          @click="(event) => confirmDeleteRecipe(event, slotProps.data)"
        />
      </template>
    </Column>
  </DataTable>

  <!-- Recipe Modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    header="Recipe Editor"
    :style="{ width: '50rem' }"
    @hide="imageData = null"
  >
    <Form
      v-slot="$form"
      :initialValues="initialValues"
      :resolver="formResolver"
      @submit="updateRecipe"
    >
      <!-- Hidden attributes -->
      <InputText name="id" type="hidden" />
      <InputText name="imagePath" type="hidden" />
      <InputText name="imageUrl" type="hidden" />
      <!-- Name -->
      <div>
        <label for="name" class="form-label">Name *</label>
        <InputText
          name="name"
          type="text"
          placeholder="e.g., Pumpkin Soup"
          fluid
        />
        <Message
          v-if="$form.name?.invalid"
          severity="error"
          size="small"
          variant="simple"
          >{{ $form.name.error.message }}</Message
        >
      </div>
      <!-- Summary -->
      <div class="mt-3">
        <label for="summary" class="form-label">Summary (≤ 160 chars) *</label>
        <Textarea
          name="summary"
          type="text"
          rows="3"
          placeholder="A short description of the recipe"
          fluid
        ></Textarea>
        <Message
          v-if="$form.summary?.invalid"
          severity="error"
          size="small"
          variant="simple"
          >{{ $form.summary.error.message }}</Message
        >
      </div>
      <!-- Details -->
      <div class="mt-3">
        <label for="details" class="form-label">Details *</label>
        <Textarea
          name="details"
          type="text"
          rows="6"
          placeholder="Ingredients, steps, tips..."
          fluid
        >
        </Textarea>
        <Message
          v-if="$form.details?.invalid"
          severity="error"
          size="small"
          variant="simple"
          >{{ $form.details.error.details }}</Message
        >
      </div>
      <!-- Image (optional) -->
      <div class="mt-3">
        <label for="image" class="form-label">Image (optional)</label>
        <div v-if="$form.imageUrl?.value" class="mt-2">
          <div class="d-flex align-items-center gap-3">
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
              class="flex-shrink-0"
              @click="
                $form.imageUrl.value = '';
                imageData = null;
              "
              :disabled="submitting"
              size="small"
            />
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

      <!-- Actions -->
      <div class="mt-3">
        <Button type="submit" label="Submit" :disabled="submitting"></Button>
      </div>
    </Form>
  </Dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";

import { db, currentUser } from "@/firebase/init";
import { uploadImage, deleteImage } from "@/firebase/uploader";
import {
  addDoc,
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

import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import FileUpload from "primevue/fileupload";
import { Form } from "@primevue/forms";
import Message from "primevue/message";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useConfirm } from "primevue/useconfirm";
import Image from "primevue/image";

const toast = useToast();
const confirm = useConfirm();

function formatDate(timestamp) {
  if (!timestamp) return "-";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Recipes DataTable
const initialValues = reactive({
  id: "",
  name: "",
  summary: "",
  details: "",
  imagePath: "",
  imageUrl: ""
});

const dataTableRef = ref(null);
const recipesData = ref([]);
const totalRecords = ref(0);
const loading = ref(false);

const rowsPerPage = 10;

let cursors = [];

async function reloadDataTable() {
  cursors = [];
  totalRecords.value = 0;
  await onRecipeLazyLoad({ first: 0, rows: rowsPerPage });
}

async function getCursorForPage(targetPage, recipesCol, order, rows) {
  // If we already have the cursor for the target page, return it
  if (cursors[targetPage - 1]) return cursors[targetPage - 1];

  // Find the last known cursor before the target page
  let lastKnownPage = -1;
  for (let i = targetPage - 1; i >= 0; i--) {
    if (cursors[i]) {
      lastKnownPage = i;
      break;
    }
  }

  // Start querying from the last known cursor
  let q = query(recipesCol, order, limit(rows));
  let snap;

  if (lastKnownPage >= 0) {
    q = query(
      recipesCol,
      order,
      startAfter(cursors[lastKnownPage]),
      limit(rows)
    );
  }

  // Fetch pages until we reach the target page
  for (let i = lastKnownPage + 1; i < targetPage; i++) {
    snap = await getDocs(q);
    if (snap.empty) return null;
    cursors[i] = snap.docs[snap.docs.length - 1];

    q = query(recipesCol, order, startAfter(cursors[i]), limit(rows));
  }

  return cursors[targetPage - 1];
}

const onRecipeLazyLoad = async (event) => {
  loading.value = true;
  try {
    const { first, rows } = event;
    const page = Math.floor(first / rows);

    const recipesCol = collection(db, "recipes");
    const order = orderBy("createdAt", "desc");

    // Fetch total count only once
    if (page === 0 && totalRecords.value === 0) {
      const snapCount = await getCountFromServer(query(recipesCol));
      totalRecords.value = snapCount.data().count || 0;
    }

    // Fetch page data
    const cursor = await getCursorForPage(page, recipesCol, order, rows);

    let q = query(recipesCol, order, limit(rows));
    if (cursor) q = query(recipesCol, order, startAfter(cursor), limit(rows));

    const snap = await getDocs(q);
    recipesData.value = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (snap.docs.length > 0) {
      cursors[page] = snap.docs[snap.docs.length - 1];
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Error loading recipes: ${error.message}`,
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Recipe Modal
const modalVisible = ref(false);
const imageData = ref(null);
const submitting = ref(false);

const openModal = (recipe) => {
  if (recipe) {
    initialValues.id = recipe.id || "";
    initialValues.name = recipe.name || "";
    initialValues.summary = recipe.summary || "";
    initialValues.details = recipe.details || "";
    initialValues.imagePath = recipe.imagePath || "";
    initialValues.imageUrl = recipe.imageUrl || "";
  } else {
    initialValues.id = "";
    initialValues.name = "";
    initialValues.summary = "";
    initialValues.details = "";
    initialValues.imagePath = "";
    initialValues.imageUrl = "";
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

async function updateRecipe({ valid, values }) {
  if (!valid || !values) return;
  try {
    submitting.value = true;

    let { imageUrl, imagePath } = values;

    // Delete old image if removed
    if (!imageUrl && imagePath) {
      try {
        deleteImage(imagePath);
      } catch {}
      imagePath = "";
    }

    // Upload new image if selected
    if (imageData.value) {
      const { url, path } = await uploadImage(imageData.value);
      imageUrl = url;
      imagePath = path;
    }

    // Create or update recipe
    if (values.id) {
      await setDoc(
        doc(db, "recipes", values.id),
        {
          name: values.name,
          summary: values.summary,
          details: values.details,
          imageUrl,
          imagePath
        },
        { merge: true }
      );
    } else {
      await addDoc(collection(db, "recipes"), {
        name: values.name,
        summary: values.summary,
        details: values.details,
        imageUrl,
        imagePath,
        createdBy: currentUser.value?.uid || null,
        createdAt: serverTimestamp()
      });
    }

    modalVisible.value = false;

    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Recipe updated successfully!",
      life: 3000
    });

    reloadDataTable();
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
}

async function confirmDeleteRecipe(event, recipe) {
  if (!recipe || !recipe.id) return;
  // Function to delete recipe
  const deleteRecipe = async (recipe) => {
    try {
      if (recipe.imagePath) {
        try {
          deleteImage(recipe.imagePath);
        } catch {}
      }
      await deleteDoc(doc(db, "recipes", recipe.id));

      const qAll = query(
        collection(db, "ratings"),
        where("recipeId", "==", recipe.id)
      );
      const snap = await getDocs(qAll);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Recipe deleted successfully!",
        life: 3000
      });

      reloadDataTable();
    } catch (err) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: `Error: ${err.message}`,
        life: 3000
      });
    }
  };
  // Show confirmation dialog
  confirm.require({
    target: event.currentTarget,
    message: "Do you want to delete this recipe?",
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
      deleteRecipe(recipe);
    }
  });
}

onMounted(() => {
  onRecipeLazyLoad({ first: 0, rows: rowsPerPage });
});
</script>

<style scoped>
:deep(.p-progressbar) {
  display: none !important;
}
:deep(.p-fileupload-file-badge) {
  display: none !important;
}
</style>
