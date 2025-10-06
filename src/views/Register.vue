<template>
  <section class="container-fluid bg-light min-vh-100 row">
    <div class="pt-3 ms-2 col-md-6">
      <h3>Register</h3>
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
          <div id="emailHelp" class="form-text">
            Email address is used to identify your account.
          </div>
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
          <div id="passwordHelp" class="form-text">
            Password must be at least 8 characters long and include uppercase,
            lowercase, a number, and a special character.
          </div>
        </div>

        <!-- Repeat Password -->
        <div class="mb-3">
          <label for="inputRepeatPassword" class="form-label">Repeat Password</label>
          <input
            type="password"
            class="form-control"
            :class="
              errors.repeatPassword === null
                ? ''
                : errors.repeatPassword
                ? 'is-invalid'
                : 'is-valid'
            "
            id="inputRepeatPassword"
            v-model="formData.repeatPassword"
            @input="validateRepeatPassword"
            @blur="validateRepeatPassword"
            required
          />
          <div class="invalid-feedback">{{ errors.repeatPassword }}</div>
          <div id="repeatPasswordHelp" class="form-text">
            Please re-enter your password for confirmation.
          </div>
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
import { register } from "@/firebase/init";

const router = useRouter();

const formData = ref({
  email: "",
  password: "",
  repeatPassword: "",
});

const errors = ref({
  email: null,
  password: null,
  repeatPassword: null,
});

const submitting = ref(false);

const submitForm = async () => {
  validateEmail();
  validatePassword();
  validateRepeatPassword();

  if (!errors.value.email && !errors.value.password && !errors.value.repeatPassword) {
    submitting.value = true;
    let res = await register(formData.value.email, formData.value.password);
    if (res.success) {
      alert("Registration successful!");
      router.push("/login");
      clearForm();
    } else {
      alert(res.error.message);
    }
    submitting.value = false;
  }
};

const clearForm = () => {
  formData.value = { email: "", password: "", repeatPassword: "" };
  errors.value = { email: null, password: null, repeatPassword: null };
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
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    errors.value.password = `Password must be at least ${minLength} characters long.`;
  } else if (!hasUppercase) {
    errors.value.password = "Password must contain at least one uppercase letter.";
  } else if (!hasLowercase) {
    errors.value.password = "Password must contain at least one lowercase letter.";
  } else if (!hasNumber) {
    errors.value.password = "Password must contain at least one number.";
  } else if (!hasSpecialChar) {
    errors.value.password = "Password must contain at least one special character.";
  } else {
    errors.value.password = "";
  }
};

const validateRepeatPassword = () => {
  const { password, repeatPassword } = formData.value;
  if (repeatPassword !== password) {
    errors.value.repeatPassword = "Passwords do not match.";
  } else {
    errors.value.repeatPassword = "";
  }
};
</script>