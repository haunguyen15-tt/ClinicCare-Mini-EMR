<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string | null
    title?: string
    dismissible?: boolean
  }>(),
  { message: null, title: 'Something went wrong', dismissible: false },
)

defineEmits<{ dismiss: [] }>()
</script>

<template>
  <div
    v-if="message"
    role="alert"
    class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:p-4"
  >
    <svg class="mt-0.5 size-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fill-rule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clip-rule="evenodd"
      />
    </svg>
    <div class="min-w-0 flex-1">
      <p class="font-medium">{{ title }}</p>
      <!-- 422 messages come one per line. -->
      <p class="mt-1 whitespace-pre-line break-words">{{ message }}</p>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="-m-2 grid size-11 shrink-0 place-items-center rounded-md text-red-600 hover:bg-red-100"
      @click="$emit('dismiss')"
    >
      <span class="sr-only">Dismiss</span>
      <svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
      </svg>
    </button>
  </div>
</template>
