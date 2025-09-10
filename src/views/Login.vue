<template>
  <section class="container-fluid bg-light min-vh-100 row">
    <div class="pt-3 ms-2 col-md-6">
      <h3>Login</h3>
      <form class="pt-2" @submit.prevent="submitForm">
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
            aria-describedby="emailHelp"
            v-model="formData.email"
            @input="() => validateEmail()"
            @blur="() => validateEmail()"
            required
          />
          <div class="invalid-feedback">
            {{ errors.email }}
          </div>
        </div>
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
            @input="() => validatePassword()"
            @blur="() => validatePassword()"
            required
          />
          <div class="invalid-feedback">
            {{ errors.password }}
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Submit</button>
        <button type="button" class="btn btn-secondary ms-2" @click="clearForm">
          Clear
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "vue-router";

const router = useRouter();

const formData = ref({
  email: "",
  password: ""
});

const submitForm = () => {
  validateEmail();
  validatePassword();
  if (!errors.value.email && !errors.value.password) {
    signInWithEmailAndPassword(
      getAuth(),
      formData.value.email,
      formData.value.password
    )
      .then((_) => {
        alert("Login successful!");
        router.push("/");
      })
      .catch((error) => {
        const errorMessage = error.message;
        alert(errorMessage);
      })
      .finally(() => {
        clearForm();
      });
  }
};

const clearForm = () => {
  formData.value = {
    email: "",
    password: ""
  };
  errors.value = {
    email: null,
    password: null
  };
};

const errors = ref({
  email: null,
  password: null
});

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
    errors.value.password =
      "Password must contain at least one uppercase letter.";
  } else if (!hasLowercase) {
    errors.value.password =
      "Password must contain at least one lowercase letter.";
  } else if (!hasNumber) {
    errors.value.password = "Password must contain at least one number.";
  } else if (!hasSpecialChar) {
    errors.value.password =
      "Password must contain at least one special character.";
  } else {
    errors.value.password = "";
  }
};
</script>

<style scoped></style>
