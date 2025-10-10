<template>
  <Dialog v-model:visible="visible" header="Login" modal dismissableMask :style="{ width: '30rem' }">
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
        <Button type="submit" label="Submit" :disabled="submitting"></Button>
        <Button label="No account?" variant="link" @click="$emit('open-register')"></Button>
      </div>
    </Form>
  </Dialog>
</template>

<script setup>
import { ref, defineExpose, defineEmits } from "vue";
import { useToast } from "primevue/usetoast";
import { login } from "@/firebase/init";

const emit = defineEmits(['open-register'])

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

  const res = await login(values.email, values.password);
  if (res.success) {
    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Login successful!",
      life: 3000
    });
    visible.value = false;
  } else {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: res.error.message,
      life: 3000
    });
  }

  submitting.value = false;
};

function show() {
  visible.value = true;
}

function hide() {
  visible.value = false;
}

defineExpose({ show, hide });
</script>
