<template>
  <Toolbar>
    <template #start>
      <h2 class="font-bold text-xl">Recipes Manager</h2>
    </template>

    <template #end>
      <Button
        label="New"
        icon="pi pi-plus"
        class="mr-2"
        @click="openModal()"
      ></Button>
      <Button
        label="Export"
        icon="pi pi-upload"
        severity="secondary"
        @click="exportRecipesCSV($event)"
      ></Button>
    </template>
  </Toolbar>
  <!-- Recipes DataTable -->
  <DataTable
    tableStyle="min-width: 50rem"
    lazy
    paginator
    filterDisplay="row"
    :first="first"
    :value="recipesData"
    :rows="rowsPerPage"
    :totalRecords="totalRecords"
    :loading="loading"
    :filters="filters"
    @page="onRecipeLazyLoad"
    @filter="onRecipeFilter"
  >
    <template #empty>
      <div class="text-center">No recipes found</div>
    </template>
    <template #loading>
      <ProgressSpinner aria-label="Loading" />
    </template>
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
    <Column
      field="name"
      header="Name"
      :showFilterMenu="true"
      :filterMatchModeOptions="[
        { label: 'Equals', value: FilterMatchMode.EQUALS }
      ]"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          @blur="filterCallback()"
          placeholder="Filter by name"
          fluid
        />
      </template>
    </Column>

    <Column
      field="summary"
      header="Summary"
      :showFilterMenu="true"
      :filterMatchModeOptions="[
        { label: 'Equals', value: FilterMatchMode.EQUALS }
      ]"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          @blur="filterCallback()"
          placeholder="Filter by summary"
          fluid
        />
      </template>
    </Column>
    <Column
      field="createdAt"
      header="Created At"
      :showFilterMenu="true"
      :filterMatchModeOptions="[
        { label: 'Between', value: FilterMatchMode.BETWEEN }
      ]"
    >
      <template #body="slotProps">
        {{ formatDate(slotProps.data.createdAt) }}
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <DatePicker
          v-model="filterModel.value"
          selection-mode="range"
          date-format="yy-mm-dd"
          @date-select="filterCallback()"
          placeholder="Filter by date"
          :show-icon="true"
          fluid
        />
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
        ></Button>
        <Button
          type="button"
          icon="pi pi-trash"
          rounded
          severity="danger"
          class="ms-2"
          @click="(event) => confirmDeleteRecipe(event, slotProps.data)"
        ></Button>
      </template>
    </Column>
  </DataTable>

  <!-- Recipe Modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    header="Recipe Editor"
    :style="{ width: '50rem' }"
    :draggable="false"
  >
    <Form
      v-slot="$form"
      :initialValues="initialValues"
      :resolver="formResolver"
      @submit="onDialogSubmit"
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
          v-if="$form.name?.error"
          severity="error"
          size="small"
          variant="simple"
          >{{ $form.name.errors }}</Message
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
          placeholder="Ingredients, steps, tips..."
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

      <!-- Actions -->
      <div class="mt-3">
        <Button type="submit" label="Submit" :disabled="submitting"></Button>
      </div>
    </Form>
  </Dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { FilterMatchMode } from "@primevue/core/api";
import {
  generateRecipesQueryByFilters,
  addRecipe,
  updateRecipe,
  deleteRecipe
} from "@/firestore/recipes";
import { fetchByPage, getTotalCount } from "@/firestore/utils";

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
const filters = ref({
  name: { value: null, matchMode: FilterMatchMode.EQUALS },
  summary: { value: null, matchMode: FilterMatchMode.EQUALS },
  createdAt: { value: null, matchMode: FilterMatchMode.BETWEEN }
});

const first = ref(0);
const recipesData = ref([]);
const totalRecords = ref(0);
const loading = ref(false);

const rowsPerPage = 10;

let currQuery = generateRecipesQueryByFilters(null);
let cursors = [];

async function reloadDataTable() {
  cursors = [];
  totalRecords.value = 0;
  await onRecipeLazyLoad();
}

const onRecipeFilter = (event) => {
  const { filters } = event || {};
  if (filters) {
    const newQuery = generateRecipesQueryByFilters(filters);
    if (!newQuery) return; // Invalid state, do nothing
    currQuery = newQuery;
    reloadDataTable();
  }
};

const onRecipeLazyLoad = async (event) => {
  loading.value = true;
  try {
    const { page = 0, rows = rowsPerPage } = event?.originalEvent || {};

    // Fetch total count only once
    if (page === 0 && totalRecords.value === 0) {
      totalRecords.value = await getTotalCount(currQuery);
    }

    // Fetch data for the current page
    const { data, cursors: newCursors } = await fetchByPage(
      page,
      currQuery,
      rows,
      cursors
    );

    recipesData.value = data;
    first.value = page * rows;
    cursors = newCursors;
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

async function onDialogSubmit({ valid, values }) {
  if (!valid) return;
  try {
    submitting.value = true;

    // Create or update recipe
    if (values.id) {
      await updateRecipe(
        {
          id: values.id,
          name: values.name,
          summary: values.summary,
          details: values.details,
          imagePath: values.imagePath,
          imageUrl: values.imageUrl
        },
        imageData.value
      );
    } else {
      await addRecipe(
        {
          name: values.name,
          summary: values.summary,
          details: values.details
        },
        imageData.value
      );
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
  const deleteFunc = async (recipe) => {
    try {
      await deleteRecipe(recipe);

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
      deleteFunc(recipe);
    }
  });
}

// Export CSV
async function exportRecipesCSV() {
  // fetch all data without pagination
  const count = await getTotalCount(currQuery);
  fetchByPage(0, currQuery, count, []).then(({ data }) => {
    // convert to CSV format
    const csv = [
      ["ID", "Name", "Summary", "Created At"].join(","),
      ...data.map((r) =>
        [
          `"${r.id}"`,
          `"${r.name.replace(/"/g, '""')}"`,
          `"${r.summary.replace(/"/g, '""')}"`,
          `"${formatDate(r.createdAt)}"`
        ].join(",")
      )
    ].join("\n");

    // download as CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipes_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
}

onMounted(() => {
  onRecipeLazyLoad();
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
