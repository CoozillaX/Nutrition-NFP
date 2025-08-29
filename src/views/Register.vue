<template>
  <section class="container-fluid bg-light min-vh-100 row">
    <div class="pt-3 ms-2 col-md-6">
      <h3>Register</h3>
      <form class="pt-2" @submit.prevent="submitForm">
        <div class="mb-3">
          <label for="inputUsername" class="form-label">Username</label>
          <input
            type="text"
            class="form-control"
            :class="
              errors.username === null
                ? ''
                : errors.username
                  ? 'is-invalid'
                  : 'is-valid'
            "
            id="inputUsername"
            aria-describedby="usernameHelp"
            v-model="formData.username"
            @input="() => validateName()"
            @blur="() => validateName()"
            required
          />
          <div class="invalid-feedback">
            {{ errors.username }}
          </div>
          <div id="usernameHelp" class="form-text">
            Everyone can see your user name.
          </div>
        </div>
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
          <div id="emailHelp" class="form-text">
            Email address is used to identify your account.
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
          <div id="passwordHelp" class="form-text">
            Password must be at least 8 characters long and include uppercase,
            lowercase, a number, and a special character.
          </div>
        </div>
        <button type="submit" class="btn btn-primary" @click="submitForm">Submit</button>
        <button type="button" class="btn btn-secondary ms-2" @click="clearForm">
          Clear
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";

const formData = ref({
  username: "",
  email: "",
  password: ""
});

const submitForm = () => {
  validateName();
  validateEmail();
  validatePassword();
  if (!errors.value.username && !errors.value.email && !errors.value.password) {
    alert(JSON.stringify(formData.value, null, 2));
    clearForm();
  }
};

const clearForm = () => {
  formData.value = {
    username: "",
    email: "",
    password: ""
  };
  errors.value = {
    username: null,
    email: null,
    password: null
  }
};

const errors = ref({
  username: null,
  email: null,
  password: null
});

const validateName = () => {
  if (formData.value.username.length < 3) {
    errors.value.username = "Name must be at least 3 characters";
  } else {
    errors.value.username = "";
  }
};

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
