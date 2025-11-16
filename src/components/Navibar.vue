<template>
  <Menubar :model="filteredNavbarItems">
    <template #start>
      <router-link to="/" class="flex items-center gap-2" tabindex="0">
        <img src="@/assets/imgs/logo.svg" alt="logo" class="h-10 w-auto" />
        <h4 class="font-bold">Nutrition NFP</h4>
      </router-link>
    </template>
    <template #item="{ item, props, hasSubmenu, root }">
      <router-link
        class="flex items-center"
        v-bind="props.action"
        :to="item.to || ''"
      >
        <i v-if="item.icon" :class="item.icon"></i>
        <span>{{ item.label }}</span>
        <i
          v-if="hasSubmenu"
          :class="[
            'pi pi-angle-down ml-auto',
            { 'pi-angle-down': root, 'pi-angle-right': !root }
          ]"
        ></i>
      </router-link>
    </template>
    <template #end>
      <Button
        v-if="!currentUser"
        label="Login"
        icon="pi pi-sign-in"
        class="h-10"
        severity="contrast"
        tabindex="0"
        @click="showLoginDialog"
      ></Button>
      <div v-else>
        <Avatar
          icon="pi pi-user"
          shape="circle"
          @click="toggleAvatar"
          aria-haspopup="menu"
          aria-controls="userMenu"
          @keydown.enter.prevent="toggleAvatar"
          tabindex="0"
          class="cursor-pointer h-10"
        />
        <Menu
          ref="userMenuRef"
          id="userMenu"
          :model="userMenuItems"
          :popup="true"
        >
          <template #start>
            <button
              v-ripple
              class="flex items-center w-full p-3 pl-4 border-0 bg-transparent rounded-none cursor-pointer transition-colors duration-200 hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <Avatar icon="pi pi-user" shape="circle" class="mr-2" />
              <div class="text-left">
                <div class="font-bold">
                  {{ currentUser?.displayName || currentUser?.email }}
                </div>
                <div class="text-sm text-muted-color">
                  {{ isAdminUser ? "Admin" : "User" }}
                </div>
              </div>
            </button>
          </template>
        </Menu>
      </div>
    </template>
  </Menubar>
  <LoginDialog
    ref="loginDialogRef"
    :show-register-dialog="showRegisterDialog"
  />
  <RegisterDialog
    ref="registerDialogRef"
    :show-login-dialog="showLoginDialog"
  />
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { currentUser, isAdminUser, logout } from "@/firebase/auth";
import { useToast } from "primevue/usetoast";
import LoginDialog from "@/components/LoginDialog.vue";
import RegisterDialog from "@/components/RegisterDialog.vue";

const loginDialogRef = ref(null);
const registerDialogRef = ref(null);
const userMenuRef = ref(null);

const router = useRouter();
const toast = useToast();

const navbarItems = ref([
  {
    label: "Courses",
    icon: "pi pi-lightbulb",
    to: "/courses"
  },
  {
    label: "Recipes",
    icon: "pi pi-book",
    to: "/recipes"
  },
  {
    label: "Management",
    icon: "pi pi-cog",
    items: [
      { label: "Courses", to: "/courses-manager" },
      { label: "Recipes", to: "/recipes-manager" }
    ],
    adminOnly: true
  }
]);

function filterMenu(items, isAdmin) {
  return items
    .filter((item) => !item.adminOnly || isAdmin)
    .map((item) => ({
      ...item,
      items: item.items ? filterMenu(item.items, isAdmin) : undefined
    }));
}

const filteredNavbarItems = computed(() =>
  filterMenu(navbarItems.value, isAdminUser.value)
);

const userMenuItems = ref([
  {
    label: "Logout",
    icon: "pi pi-sign-out",
    command: () => {
      logout()
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Success",
            detail: "Logout successful!",
            life: 3000
          });
          router.push("/");
        })
        .catch((err) => {
          toast.add({
            severity: "error",
            summary: "Error",
            detail: err.message,
            life: 3000
          });
        });
    }
  }
]);

const toggleAvatar = (event) => {
  userMenuRef.value?.toggle(event);
};

const showLoginDialog = () => {
  loginDialogRef.value?.show();
};

const showRegisterDialog = () => {
  registerDialogRef.value?.show();
};
</script>
