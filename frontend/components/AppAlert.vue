<script setup lang="ts">
// A message banner: errors (announced right away) or confirmations. The default slot holds
// actions such as a retry button.
const props = withDefaults(
  defineProps<{
    message?: string | null
    title?: string
    tone?: 'danger' | 'success'
    dismissible?: boolean
  }>(),
  { message: null, title: undefined, tone: 'danger' },
)

defineEmits<{ dismiss: [] }>()

const danger = computed(() => props.tone === 'danger')
</script>

<template>
  <div
    v-if="message"
    :role="danger ? 'alert' : 'status'"
    class="reveal flex items-start gap-3 border-l-2 py-3 pl-4 pr-3 text-sm text-ink"
    :class="danger ? 'border-danger bg-danger-soft/70' : 'border-accent bg-accent-soft/70'"
  >
    <svg
      v-if="!danger"
      class="mt-0.5 size-4 shrink-0 text-accent"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="m4 10.5 4 4 8-9" />
    </svg>
    <div class="min-w-0 flex-1">
      <p v-if="title" class="eyebrow mb-1" :class="danger && 'text-danger'">{{ title }}</p>
      <!-- 422 messages come one per line. -->
      <p class="whitespace-pre-line break-words leading-relaxed">{{ message }}</p>
      <div v-if="$slots.default" class="-ml-3 mt-1">
        <slot />
      </div>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="-my-1.5 grid size-11 shrink-0 place-items-center rounded-sm"
      :class="danger ? 'text-danger hover:bg-danger/10' : 'text-ink-soft hover:bg-accent/10 hover:text-ink'"
      @click="$emit('dismiss')"
    >
      <span class="sr-only">Dismiss</span>
      <IconClose />
    </button>
  </div>
</template>
