<template>
  <AppLayout>
    <section
      class="card flex min-h-[calc(100vh-9rem)] items-center justify-center px-6 py-16 text-center"
      aria-labelledby="usdt-recharge-title"
    >
      <div class="max-w-md">
        <div
          class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-dark-300"
          aria-hidden="true"
        >
          <svg
            class="h-9 w-9"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 6v12m3-9.75H10.5a2.25 2.25 0 000 4.5h3a2.25 2.25 0 010 4.5H9m12-3.25a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 id="usdt-recharge-title" class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ t('usdtRecharge.title') }}
        </h1>
        <p role="status" class="mt-3 text-base text-gray-500 dark:text-dark-400">
          {{ t('usdtRecharge.maintenance') }}
        </p>
      </div>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'

const { t } = useI18n()
</script>
