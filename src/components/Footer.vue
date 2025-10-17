<template>
  <div
    class="mx-auto px-6 flex flex-col md:flex-row justify-between gap-8 my-4"
  >
    <div class="font-bold">
      <img
        src="@/assets/imgs/logo-dark.svg"
        alt="logo"
        class="h-20 dark:invert"
      />
    </div>

    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-3/4 text-sm"
    >
      <div>
        <div class="font-semibold mb-3 text-gray-700 dark:text-gray-200">
          About
        </div>
        <ul class="space-y-2 text-gray-500 dark:text-gray-400">
          <li>
            <a href="#" class="hover:text-primary-500" tabindex="0">About Us</a>
          </li>
          <li>
            <a href="#" class="hover:text-primary-500" tabindex="0"
              >Mission & Vision</a
            >
          </li>
          <li>
            <a href="#" class="hover:text-primary-500" tabindex="0">Partners</a>
          </li>
          <li>
            <a href="#" class="hover:text-primary-500" tabindex="0"
              >Privacy Policy</a
            >
          </li>
        </ul>
      </div>

      <div>
        <div class="font-semibold mb-3 text-gray-700 dark:text-gray-200">
          Support
        </div>
        <ul class="space-y-2 text-gray-500 dark:text-gray-400">
          <li>
            <a href="#" class="hover:text-primary-500" tabindex="0">FAQs</a>
          </li>
          <li>
            <a href="#" class="hover:text-primary-500" tabindex="0"
              >Accessibility Statement</a
            >
          </li>
          <li>
            <router-link
              to="/openapi"
              class="hover:text-primary-500"
              tabindex="0"
              >OpenAPI</router-link
            >
          </li>
        </ul>
      </div>

      <div>
        <div class="font-semibold mb-3 text-gray-700 dark:text-gray-200">
          Contact
        </div>
        <ul class="space-y-2 text-gray-500 dark:text-gray-400">
          <li>
            Email:
            <a
              href="mailto:example@example.com"
              class="text-gray-500 hover:text-primary-500 transition-colors duration-200"
              aria-label="Email Nutrition NFP at example@example.com"
              tabindex="0"
            >
              example@example.com
            </a>
          </li>
          <li>
            Phone:
            <a
              href="tel:+61312345678"
              class="text-gray-500 hover:text-primary-500 transition-colors duration-200"
              aria-label="Call Nutrition NFP at +61 3 1234 5678"
              tabindex="0"
            >
              (+61) 3&nbsp;1234&nbsp;5678
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
