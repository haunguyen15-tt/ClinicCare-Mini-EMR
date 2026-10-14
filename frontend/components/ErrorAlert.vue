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
    class="reveal flex items-start gap-3 border-l-2 border-danger bg-danger-soft/70 py-3 pl-4 pr-3 text-sm text-ink"
  >
    <div class="min-w-0 flex-1">
      <p class="eyebrow text-danger">{{ title }}</p>
      <!-- 422 messages come one per line. -->
      <p class="mt-1 whitespace-pre-line break-words leading-relaxed">{{ message }}</p>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="-my-1.5 grid size-11 shrink-0 place-items-center rounded-sm text-danger hover:bg-danger/10"
      @click="$emit('dismiss')"
    >
      <span class="sr-only">Dismiss</span>
      <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
        <path stroke-linecap="round" d="M5 5l10 10M15 5 5 15" />
      </svg>
    </button>
  </div>
</template>
