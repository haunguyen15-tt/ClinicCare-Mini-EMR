<script setup lang="ts">
// The primary submit button of a form: label and arrow, or the busy label and a spinner.
defineProps<{ busy: boolean; busyLabel: string }>()
</script>

<template>
  <button type="submit" class="btn-primary group justify-between" :disabled="busy">
    <template v-if="busy">{{ busyLabel }}</template>
    <slot v-else />
    <AppSpinner v-if="busy" />
    <span v-else class="font-mono transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
  </button>
</template>
