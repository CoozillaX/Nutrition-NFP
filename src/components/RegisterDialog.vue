<template>
  <Dialog
    v-model:visible="visible"
    header="Register"
    modal
    dismissableMask
    :style="{ width: '30rem' }"
    :draggable="false"
  >
    <Form
      v-slot="$form"
      :resolver="registerFormResolver"
      :validateOnValueUpdate="false"
      @submit="submitRegisterForm"
    >
      <!-- Email -->
      <div>
        <label for="email" class="form-label">Email</label>
        <InputText
          name="email"
          type="text"
          placeholder="Enter your email"
          fluid
        />
        <Message
          v-if="$form.email?.error"
          severity="error"
          size="small"
          variant="simple"
          >{{ $form.email.errors }}</Message
        >
      </div>
      <!-- Password -->
      <div class="mt-3">
        <label for="password" class="form-label">Password</label>
        <InputText
          name="password"
          type="password"
          placeholder="Enter your password"
          fluid
        />
        <Message
          v-if="$form.password?.error"
          severity="error"
          size="small"
          variant="simple"
          >{{ $form.password.errors }}</Message
        >
      </div>
      <!-- Repeat Password -->
      <div class="mt-3">
        <label for="repeatPassword" class="form-label">Repeat Password</label>
        <InputText
          name="repeatPassword"
          type="password"
          placeholder="Repeat your password"
          fluid
        />
        <Message
          v-if="$form.repeatPassword?.error"
          severity="error"
          size="small"
          variant="simple"
          >{{ $form.repeatPassword.errors }}</Message
        >
      </div>
      <!-- Actions -->
      <div class="mt-3 gap-2 flex">
        <Button
          type="submit"
          label="Submit"
          tabindex="0"
          :disabled="submitting"
        ></Button>
      </div>
    </Form>
  </Dialog>
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import { register } from "@/firebase/auth";

const props = defineProps({
  showLoginDialog: Function
});

const toast = useToast();

const visible = ref(false);
const submitting = ref(false);

const registerFormResolver = async ({ values }) => {
  const errors = {};
  if (!values.email) {
    errors.email = "Email is required.";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email)) {
      errors.email = "Email is not valid.";
    }
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(values.password);
    const hasLowercase = /[a-z]/.test(values.password);
    const hasNumber = /\d/.test(values.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(values.password);

    if (values.password.length < minLength) {
      errors.password = `Password must be at least ${minLength} characters long.`;
    } else if (!hasUppercase) {
      errors.password = "Password must contain at least one uppercase letter.";
    } else if (!hasLowercase) {
      errors.password = "Password must contain at least one lowercase letter.";
    } else if (!hasNumber) {
      errors.password = "Password must contain at least one number.";
    } else if (!hasSpecialChar) {
      errors.password = "Password must contain at least one special character.";
    }
  }

  if (!values.repeatPassword) {
    errors.repeatPassword = "Please repeat your password.";
  } else if (values.password !== values.repeatPassword) {
    errors.repeatPassword = "Passwords do not match.";
  }

  return {
    values,
    errors
  };
};

const submitRegisterForm = ({ valid, values }) => {
  if (!valid) return;
  submitting.value = true;
  register(values.email, values.password)
    .then(() => {
      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Registration successful!",
        life: 3000
      });
      visible.value = false;
      props.showLoginDialog();
    })
    .catch((err) => {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: err.message,
        life: 3000
      });
    })
    .finally(() => {
      submitting.value = false;
    });
};

function show() {
  visible.value = true;
}

function hide() {
  visible.value = false;
}

defineExpose({ show, hide });
</script>
