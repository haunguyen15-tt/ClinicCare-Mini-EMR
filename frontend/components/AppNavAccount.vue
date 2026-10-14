<script setup lang="ts">
const { doctor, logout } = useAuth()
</script>

<template>
  <div class="flex items-end justify-between gap-3">
    <div v-if="doctor" class="min-w-0">
      <p class="eyebrow">Signed in</p>
      <p class="mt-1 truncate font-display text-xl leading-tight" :title="doctor.full_name">{{ doctor.full_name }}</p>
      <p class="truncate font-mono text-xs text-ink-faint">@{{ doctor.username }}</p>
    </div>
    <button type="button" class="btn-quiet -mr-3 ml-auto shrink-0" @click="logout">
      <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M12 13l3-3-3-3M15 10H8" />
      </svg>
      Log out
    </button>
  </div>
</template>
