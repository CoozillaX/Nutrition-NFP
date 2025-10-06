<template>
  <section class="container-fluid py-4">
    <h3 class="mb-2">Recipes Manager</h3>
    <hr class="my-3" />

    <div class="row g-4">
      <div class="col-12 col-lg-8">
        <h5>Add Recipe</h5>

        <form class="pt-2" @submit.prevent="submitForm" novalidate>
          <!-- Name -->
          <div class="mb-3">
            <label for="name" class="form-label">Recipe Name *</label>
            <input
              id="name"
              type="text"
              class="form-control"
              :class="inputClass(errors.name)"
              v-model.trim="formData.name"
              @input="validateName"
              @blur="validateName"
              required
              maxlength="80"
              placeholder="e.g., Pumpkin Soup"
            />
            <div class="invalid-feedback">{{ errors.name }}</div>
          </div>

          <!-- Summary -->
          <div class="mb-3">
            <label for="summary" class="form-label"
              >Summary (≤ 160 chars) *</label
            >
            <textarea
              id="summary"
              class="form-control"
              :class="inputClass(errors.summary)"
              rows="3"
              v-model.trim="formData.summary"
              @input="validateSummary"
              @blur="validateSummary"
              required
              maxlength="160"
              placeholder="A short description of the recipe."
            />
            <div class="d-flex justify-content-between">
              <div class="invalid-feedback">{{ errors.summary }}</div>
              <small class="text-muted ms-auto"
                >{{ formData.summary.length }}/160</small
              >
            </div>
          </div>

          <!-- Details -->
          <div class="mb-3">
            <label for="details" class="form-label">Details *</label>
            <textarea
              id="details"
              class="form-control"
              :class="inputClass(errors.details)"
              rows="6"
              v-model.trim="formData.details"
              @input="validateDetails"
              @blur="validateDetails"
              required
              placeholder="Ingredients, steps, tips..."
            />
            <div class="invalid-feedback">{{ errors.details }}</div>
          </div>

          <!-- Image (optional) -->
          <div class="mb-3">
            <label for="image" class="form-label">Image (optional)</label>
            <input
              id="image"
              type="file"
              class="form-control"
              accept="image/png,image/jpeg,image/webp"
              ref="fileInput"
              @change="onFileChange"
            />

            <div v-if="formData.imageFile" class="mt-2">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary mt-2"
                @click="clearImage"
              >
                Remove image
              </button>
            </div>
            <div class="form-text">
              PNG/JPEG/WebP, ≤ 5MB. Leave empty to skip upload.
            </div>

            <div v-if="errors.image" class="text-danger small mt-1">
              {{ errors.image }}
            </div>
          </div>

          <!-- Actions -->
          <div class="d-flex align-items-center">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="submitting || hasErrors"
            >
              <span
                v-if="submitting"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              Submit
            </button>
            <button
              type="button"
              class="btn btn-secondary ms-2"
              :disabled="submitting"
              @click="clearForm"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>

    <hr class="my-4" />
    <div>
      <h5>Edit Recipe</h5>
      <p class="text-muted">WIP...</p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, currentUser } from "@/firebase/init";
import { uploadImage } from "@/firebase/uploader";
import { useToast } from "primevue/usetoast";

const toast = useToast();

const formData = ref({
  name: "",
  summary: "",
  details: "",
  imageFile: null
});

const fileInput = ref(null);
const submitting = ref(false);

const errors = ref({
  name: null,
  summary: null,
  details: null,
  image: null
});

const inputClass = (err) =>
  err === null ? "" : err ? "is-invalid" : "is-valid";
const hasErrors = computed(
  () =>
    !!(
      errors.value.name ||
      errors.value.summary ||
      errors.value.details ||
      errors.value.image
    )
);

// Validators
function validateName() {
  const v = formData.value.name.trim();
  if (!v) errors.value.name = "Name is required.";
  else if (v.length > 80) errors.value.name = "Name must be ≤ 80 characters.";
  else errors.value.name = "";
}

function validateSummary() {
  const v = formData.value.summary.trim();
  if (!v) errors.value.summary = "Summary is required.";
  else if (v.length > 160)
    errors.value.summary = "Summary must be ≤ 160 characters.";
  else errors.value.summary = "";
}

function validateDetails() {
  const v = formData.value.details.trim();
  if (!v) errors.value.details = "Details are required.";
  else errors.value.details = "";
}

function onFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return clearImage();

  // basic checks
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    errors.value.image = "Only PNG, JPEG, or WebP are allowed.";
    clearImage(false);
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    errors.value.image = "File must be ≤ 5MB.";
    clearImage(false);
    return;
  }

  errors.value.image = "";
  formData.value.imageFile = file;
}

function clearImage(resetInput = true) {
  formData.value.imageFile = null;
  if (resetInput && fileInput.value) {
    fileInput.value.value = ""; // reset <input type="file">
  }
}

// Submit
async function submitForm() {
  // validate
  validateName();
  validateSummary();
  validateDetails();
  if (hasErrors.value) return;

  try {
    submitting.value = true;

    let imageUrl = null;
    let imagePath = null;

    if (formData.value.imageFile) {
      const { url, path } = await uploadImage(formData.value.imageFile);
      imageUrl = url;
      imagePath = path;
    }

    await addDoc(collection(db, "recipes"), {
      name: formData.value.name,
      summary: formData.value.summary,
      details: formData.value.details,
      imageUrl,
      imagePath,
      createdBy: currentUser.value?.uid || null,
      createdAt: serverTimestamp()
    });

    toast.add({severity:'success', summary: 'Success', detail: 'Recipe added successfully!', life: 3000});
    clearForm();
  } catch (err) {
    toast.add({severity:'error', summary: 'Error', detail: `Error: ${err.message}`, life: 3000});
  } finally {
    submitting.value = false;
  }
}

function clearForm() {
  formData.value = {
    name: "",
    summary: "",
    details: "",
    imageFile: null
  };
  errors.value = { name: null, summary: null, details: null, image: null };

  // ensure the file input resets visually
  if (fileInput.value) fileInput.value.value = "";
}
</script>
