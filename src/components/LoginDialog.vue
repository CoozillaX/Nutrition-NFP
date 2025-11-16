<template>
  <Dialog
    v-model:visible="visible"
    header="Login"
    modal
    dismissableMask
    :style="{ width: '30rem' }"
    :draggable="false"
  >
    <Form
      v-slot="$form"
      :resolver="loginFormResolver"
      :validateOnValueUpdate="false"
      @submit="submitLoginForm"
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
      <!-- Actions -->
      <div class="mt-3 gap-2 flex">
        <Button
          type="submit"
          label="Submit"
          :disabled="submitting"
          tabindex="0"
        ></Button>
        <Button
          label="No account?"
          variant="link"
          tabindex="0"
          @click="switchToRegister"
        ></Button>
      </div>
    </Form>
  </Dialog>
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import { login } from "@/firebase/auth";

const props = defineProps({
  showRegisterDialog: Function
});

const toast = useToast();

const visible = ref(false);
const submitting = ref(false);

const loginFormResolver = async ({ values }) => {
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
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  }

  return {
    values,
    errors
  };
};

const submitLoginForm = async ({ valid, values }) => {
  if (!valid) return;
  submitting.value = true;
  login(values.email, values.password)
    .then(() => {
      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Login successful!",
        life: 3000
      });
      visible.value = false;
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

const switchToRegister = () => {
  hide();
  props.showRegisterDialog();
};

defineExpose({ show, hide });
</script>
