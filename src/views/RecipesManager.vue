<template>
  <!-- Recipes DataTable -->
  <ManagerDataTable
    ref="dataTable"
    title="Recipes"
    collectionName="recipes"
    :recordDeleteFunc="deleteRecipe"
    @modalOpen="openModal"
  />
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
import { ref, reactive } from "vue";
import { useToast } from "primevue/usetoast";
import { addRecipe, updateRecipe, deleteRecipe } from "@/firestore/recipes";
import { uploadImage, deleteImage } from "@/firebase/storage";
import ManagerDataTable from "@/components/ManagerDataTable.vue";

const toast = useToast();
const dataTable = ref(null);

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
  }
  imageData.value = null;
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
      // Update basic info
      let updatedFields = {
        name: values.name.trim(),
        summary: values.summary.trim(),
        details: values.details.trim()
      };

      // Handle image update
      const newImg = imageData.value;
      const oldImgPath = values.imagePath;

      // Delete old image if needed
      if (oldImgPath && (newImg || !values.imageUrl)) {
        await deleteImage(oldImgPath);
        updatedFields.imageUrl = null;
        updatedFields.imagePath = null;
      }
      // Upload new image
      if (newImg) {
        const { url, path } = await uploadImage(newImg);
        updatedFields.imageUrl = url;
        updatedFields.imagePath = path;
      }

      // Update recipe
      await updateRecipe(values.id, updatedFields);
      dataTable?.value?.updateRecord(values.id, updatedFields);
    } else {
      await addRecipe(
        {
          name: values.name.trim(),
          summary: values.summary.trim(),
          details: values.details.trim()
        },
        imageData.value
      );
      dataTable?.value?.reload();
    }

    modalVisible.value = false;

    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Recipe updated successfully!",
      life: 1000
    });
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Error: ${err.message}`,
      life: 1000
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
:deep(.p-progressbar) {
  display: none !important;
}
:deep(.p-fileupload-file-badge) {
  display: none !important;
}
</style>
