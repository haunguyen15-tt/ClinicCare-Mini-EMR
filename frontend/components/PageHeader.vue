<script setup lang="ts">
// Title block of a section page. The "Records · 02" number comes from the section's place in
// `sections`, so it follows the nav order. The default slot is the lead line.
defineProps<{ title: string }>()

const route = useRoute()
const index = computed(() => sections.findIndex((section) => section.to === route.path))
</script>

<template>
  <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0 max-w-2xl">
      <p v-if="index >= 0" class="eyebrow reveal">Records · {{ tabNumber(index) }}</p>
      <h1 class="page-title reveal mt-3 [--d:80ms]">{{ title }}</h1>
      <p v-if="$slots.default" class="reveal mt-3 text-[0.9375rem] text-ink-soft [--d:160ms]">
        <slot />
      </p>
    </div>
    <div v-if="$slots.actions" class="reveal shrink-0 [--d:200ms]">
      <slot name="actions" />
    </div>
  </header>
</template>
