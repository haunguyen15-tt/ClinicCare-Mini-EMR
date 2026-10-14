<script setup lang="ts">
const links = [
  { to: '/consultations', label: 'Consultations' },
  { to: '/consultations/new', label: 'New consultation' },
  { to: '/search', label: 'Search' },
]

// RouterLink sets aria-current="page" on the exact-active link; style that instead of an extra class prop.
const linkClass =
  'flex min-h-11 items-center rounded-md px-3 font-medium hover:bg-slate-100 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-700'

const menuOpen = ref(false)
const route = useRoute()

// Close the mobile menu after navigating and on Escape.
watch(() => route.fullPath, () => {
  menuOpen.value = false
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') menuOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
    <nav class="container-page" aria-label="Main">
      <div class="flex h-14 items-center justify-between gap-4">
        <NuxtLink to="/" class="flex min-h-11 items-center gap-2 font-semibold text-brand-700">
          <span class="grid size-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white" aria-hidden="true">CC</span>
          <span class="truncate">ClinicCare</span>
        </NuxtLink>

        <!-- Desktop / tablet links -->
        <ul class="hidden items-center gap-1 md:flex">
          <li v-for="link in links" :key="link.to">
            <NuxtLink :to="link.to" :class="[linkClass, 'text-sm text-slate-600 hover:text-slate-900']">
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>

        <!-- Mobile menu toggle -->
        <button
          type="button"
          class="-mr-2 grid size-11 place-items-center rounded-md text-slate-600 hover:bg-slate-100 md:hidden"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          @click="menuOpen = !menuOpen"
        >
          <span class="sr-only">{{ menuOpen ? 'Close menu' : 'Open menu' }}</span>
          <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              :d="menuOpen ? 'M6 18 18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'"
            />
          </svg>
        </button>
      </div>

      <!-- Mobile links -->
      <ul v-show="menuOpen" id="mobile-menu" class="space-y-1 border-t border-slate-200 py-2 md:hidden">
        <li v-for="link in links" :key="link.to">
          <NuxtLink :to="link.to" :class="[linkClass, 'text-base text-slate-700']">
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
