<template>
  <Dialog
    v-model:visible="visible"
    header="Planner"
    position="bottomright"
    :draggable="false"
    :pt="{
      root: { class: '!w-[25rem] !h-[40rem]' },
      header: { class: 'h-16' },
      content: { class: 'flex flex-col h-full min-h-0 p-0' }
    }"
  >
    <ScrollPanel class="flex-1 overflow-y-auto">
      <div
        v-for="(message, index) in history"
        :key="index"
        :class="[
          'p-3 mb-3 rounded-2xl shadow-sm break-words w-fit max-w-[80%]',
          message.role === 'user'
            ? 'bg-blue-500 text-white self-end ml-auto'
            : 'bg-gray-100 text-gray-900 self-start mr-auto'
        ]"
      >
        <p class="m-0">{{ message.text }}</p>
      </div>
    </ScrollPanel>

    <div class="flex gap-2 items-end pt-4">
      <Textarea
        v-model="input"
        placeholder="Type your message..."
        class="flex-1 resize-none"
        :rows="1"
        autoResize
        style="max-height: 160px"
        @keydown.enter.prevent="sendMessage"
      ></Textarea>
      <Button
        icon="pi pi-send"
        :loading="loading"
        @click="sendMessage"
      ></Button>
    </div>
  </Dialog>
  <Button
    v-if="!visible"
    label="Planner"
    icon="pi pi-comments"
    severity="contrast"
    rounded
    class="bottom-6 right-6 !shadow-lg"
    @click="visible = true"
  ></Button>
</template>

<script setup lang="ts">
import { nextTick } from "vue";
import { Textarea } from "primevue";
import { ref } from "vue";
import axios from "axios";

const functionUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;

const visible = ref(false);
const input = ref("");
const history = ref([
  {
    role: "model",
    text: "Hello! I'm NutriBot, your AI cooking planner. I'm here to help you plan your meals and provide delicious recipes. How can I assist you today?"
  }
]);
const loading = ref(false);

const scrollToBottom = () => {
  const scrollPanel = document.querySelector(".p-scrollpanel-content");
  if (scrollPanel) {
    scrollPanel.scrollTop = scrollPanel.scrollHeight;
  }
};

const sendMessage = () => {
  if (input.value.trim() === "") return;
  if (loading.value) return;

  loading.value = true;
  axios
    .post(`${functionUrl}/planner/chat`, {
      prompt: input.value,
      history: history.value
    })
    .then((response) => {
      const botMessage = response.data;
      history.value.push({ role: "model", text: botMessage });
    })
    .catch((error) => {
      history.value.push({
        role: "model",
        text: `Sorry, an error occurred: ${error?.response?.data || error.message}`
      });
    })
    .finally(() => {
      loading.value = false;
      scrollToBottom();
    });

  history.value.push({ role: "user", text: input.value });
  nextTick(scrollToBottom);
  input.value = "";
};
</script>
