<script setup lang="ts">
const links = [
  { to: '/consultations', label: 'Consultations', index: '01' },
  { to: '/consultations/new', label: 'New consultation', index: '02' },
  { to: '/search', label: 'Search', index: '03' },
]

const { doctor, isAuthenticated, fetchMe, logout } = useAuth()

// After a refresh only the token survives; load the doctor once (on the server when possible).
// A 401 here is handled by the api plugin, and any other failure just leaves the name out.
if (isAuthenticated.value && !doctor.value) await fetchMe().catch(() => {})

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
  <!-- Phones and tablets: sticky top bar with a full-width menu sheet. -->
  <header class="sticky top-0 z-30 border-b border-rule bg-paper/90 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
    <nav class="container-page" aria-label="Main">
      <div class="flex h-16 items-center justify-between gap-4">
        <NuxtLink to="/" class="-ml-1 flex min-h-11 items-center rounded-sm px-1">
          <AppLogo />
        </NuxtLink>

        <button
          type="button"
          class="btn-quiet -mr-3 gap-2.5"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          @click="menuOpen = !menuOpen"
        >
          <span class="eyebrow text-ink-soft">{{ menuOpen ? 'Close' : 'Menu' }}</span>
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path
              stroke-linecap="round"
              :d="menuOpen ? 'M6 18 18 6M6 6l12 12' : 'M4 8h16M4 16h16'"
            />
          </svg>
        </button>
      </div>

      <div v-show="menuOpen" id="mobile-menu" class="pb-5">
        <ul class="border-t border-rule">
          <li v-for="(link, i) in links" :key="link.to" class="reveal" :style="{ '--d': `${i * 50}ms` }">
            <NuxtLink
              :to="link.to"
              class="group flex min-h-14 items-baseline gap-4 border-b border-rule py-3 font-display text-[1.75rem] leading-none text-ink aria-[current=page]:text-accent"
            >
              <span class="font-mono text-xs text-ink-faint group-aria-[current=page]:text-accent">{{ link.index }}</span>
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
        <div class="mt-4 flex items-center justify-between gap-3">
          <div v-if="doctor" class="min-w-0">
            <p class="eyebrow">Signed in</p>
            <p class="truncate font-display text-xl">{{ doctor.full_name }}</p>
          </div>
          <button type="button" class="btn-quiet ml-auto -mr-3 shrink-0 underline decoration-rule-strong underline-offset-4" @click="logout">
            Log out
          </button>
        </div>
      </div>
    </nav>
  </header>

  <!-- Desktop: index-tab sidebar, like the dividers in a paper chart folder. -->
  <aside class="sticky top-0 hidden h-screen flex-col border-r border-rule bg-paper-deep/60 lg:flex">
    <div class="px-6 pb-8 pt-8">
      <NuxtLink to="/" class="-m-1 inline-flex rounded-sm p-1">
        <AppLogo />
      </NuxtLink>
    </div>

    <nav class="flex-1 px-3" aria-label="Main">
      <p class="eyebrow px-3 pb-3">Records</p>
      <ul class="space-y-1">
        <li v-for="link in links" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="group flex min-h-11 items-center gap-3 rounded-r-sm border-l-2 border-transparent px-3 text-[0.9375rem] font-medium text-ink-soft transition-colors hover:bg-card/70 hover:text-ink aria-[current=page]:border-accent aria-[current=page]:bg-card aria-[current=page]:text-ink aria-[current=page]:shadow-sheet"
          >
            <span class="font-mono text-[0.6875rem] text-ink-faint group-aria-[current=page]:text-accent">{{ link.index }}</span>
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="m-3 border-t border-rule px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
      <template v-if="doctor">
        <p class="eyebrow">Signed in</p>
        <p class="mt-1 truncate font-display text-xl leading-tight" :title="doctor.full_name">{{ doctor.full_name }}</p>
        <p class="truncate font-mono text-xs text-ink-faint">@{{ doctor.username }}</p>
      </template>
      <button type="button" class="btn-quiet -ml-3 mt-2" @click="logout">
        <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M12 13l3-3-3-3M15 10H8" />
        </svg>
        Log out
      </button>
    </div>
  </aside>
</template>
