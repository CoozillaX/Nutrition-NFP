<template>
  <section class="container-fluid bg-light min-vh-100 row">
    <div class="pt-3 ms-2 col-md-6">
      <h3>Login</h3>
      <form class="pt-2" @submit.prevent="submitForm">
        <!-- Email -->
        <div class="mb-3">
          <label for="inputEmail" class="form-label">Email address</label>
          <input
            type="email"
            class="form-control"
            :class="
              errors.email === null
                ? ''
                : errors.email
                ? 'is-invalid'
                : 'is-valid'
            "
            id="inputEmail"
            v-model="formData.email"
            @input="validateEmail"
            @blur="validateEmail"
            required
          />
          <div class="invalid-feedback">{{ errors.email }}</div>
        </div>

        <!-- Password -->
        <div class="mb-3">
          <label for="inputPassword" class="form-label">Password</label>
          <input
            type="password"
            class="form-control"
            :class="
              errors.password === null
                ? ''
                : errors.password
                ? 'is-invalid'
                : 'is-valid'
            "
            id="inputPassword"
            v-model="formData.password"
            @input="validatePassword"
            @blur="validatePassword"
            required
          />
          <div class="invalid-feedback">{{ errors.password }}</div>
        </div>

        <!-- Actions -->
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span
            v-if="submitting"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
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
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { login } from "@/firebase/init";
import { useToast } from 'primevue/usetoast'

const router = useRouter();
const toast = useToast()

const formData = ref({
  email: "",
  password: "",
});

const errors = ref({
  email: null,
  password: null,
});

const submitting = ref(false);

const submitForm = async () => {
  validateEmail();
  validatePassword();

  if (!errors.value.email && !errors.value.password) {
    submitting.value = true;
    const res = await login(formData.value.email, formData.value.password);

    if (res.success) {
      toast.add({severity:'success', summary: 'Success', detail: 'Login successful!', life: 3000});
      router.push("/");
      clearForm();
    } else {
      toast.add({severity:'error', summary: 'Error', detail: res.error.message, life: 3000});
    }
    submitting.value = false;
  }
};

const clearForm = () => {
  formData.value = { email: "", password: "" };
  errors.value = { email: null, password: null };
};

// validators
const validateEmail = () => {
  const email = formData.value.email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    errors.value.email = "Email is required.";
  } else if (!emailRegex.test(email)) {
    errors.value.email = "Please enter a valid email address.";
  } else {
    errors.value.email = "";
  }
};

const validatePassword = () => {
  const password = formData.value.password;
  const minLength = 8;
  if (password.length < minLength) {
    errors.value.password = `Password must be at least ${minLength} characters long.`;
  } else {
    errors.value.password = "";
  }
};
</script>