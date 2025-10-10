<template>
  <div
    class="mx-auto px-6 flex flex-col md:flex-row justify-between gap-8 my-4"
  >
    <div class="font-bold">
      <img
        src="@/assets/imgs/logo-dark.svg"
        alt="Nutrition NFP"
        class="h-20 dark:invert"
      />
    </div>

    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-3/4 text-sm"
    >
      <div>
        <h6 class="font-semibold mb-3 text-gray-700 dark:text-gray-200">
          About
        </h6>
        <ul class="space-y-2 text-gray-500 dark:text-gray-400">
          <li><a href="#" class="hover:text-primary-500">About Us</a></li>
          <li>
            <a href="#" class="hover:text-primary-500">Mission & Vision</a>
          </li>
          <li><a href="#" class="hover:text-primary-500">Partners</a></li>
          <li>
            <a href="#" class="hover:text-primary-500">Privacy Policy</a>
          </li>
        </ul>
      </div>

      <div>
        <h6 class="font-semibold mb-3 text-gray-700 dark:text-gray-200">
          Support
        </h6>
        <ul class="space-y-2 text-gray-500 dark:text-gray-400">
          <li><a href="#" class="hover:text-primary-500">FAQs</a></li>
          <li>
            <a href="#" class="hover:text-primary-500"
              >Accessibility Statement</a
            >
          </li>
        </ul>
      </div>

      <div>
        <h6 class="font-semibold mb-3 text-gray-700 dark:text-gray-200">
          Contact
        </h6>
        <ul class="space-y-2 text-gray-500 dark:text-gray-400">
          <li>
            Email:
            <a
              href="mailto:example@example.com"
              class="text-gray-500 hover:text-primary-500 transition-colors duration-200"
              aria-label="Email Nutrition NFP at example@example.com"
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
            >
              (+61) 3&nbsp;1234&nbsp;5678
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
