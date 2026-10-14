<script setup lang="ts">
// `inverted` is for the dark chart-cover panel on the login page.
withDefaults(defineProps<{ inverted?: boolean }>(), { inverted: false })
</script>

<template>
  <span class="inline-flex items-center gap-3">
    <span
      class="relative grid size-9 shrink-0 place-items-center rounded-sm"
      :class="inverted ? 'bg-paper text-pine' : 'bg-pine text-paper'"
      aria-hidden="true"
    >
      <span class="font-display text-[1.375rem] italic leading-none">C</span>
      <span class="absolute inset-y-1.5 left-1.5 w-px" :class="inverted ? 'bg-accent' : 'bg-mint'" />
    </span>
    <span class="flex flex-col leading-none">
      <span class="font-display text-[1.375rem]" :class="inverted ? 'text-paper' : 'text-ink'">ClinicCare</span>
      <span class="eyebrow mt-1 text-[0.625rem]" :class="inverted ? '!text-paper/60' : ''">Mini EMR</span>
    </span>
  </span>
</template>
