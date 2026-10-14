<script setup lang="ts">
// Previous / next links that set `?page=` and keep the rest of the query, so any page can be shared.
const props = defineProps<{ page: number; pageSize: number; total: number }>()

const route = useRoute()
const lastPage = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const first = computed(() => Math.min(props.total, (props.page - 1) * props.pageSize + 1))
const last = computed(() => Math.min(props.total, props.page * props.pageSize))

// Page 1 drops the parameter, keeping the canonical URL clean.
function pageLink(page: number) {
  return { query: { ...route.query, page: page > 1 ? String(page) : undefined } }
}

// The router keeps the scroll position when only the query changes; start the new page at the top.
watch(() => props.page, () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
})
</script>

<template>
  <nav
    v-if="total > pageSize"
    class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2"
    aria-label="Pagination"
  >
    <p class="font-mono text-xs text-ink-soft">
      <span class="text-ink">{{ first }}–{{ last }}</span> of {{ total }}
      <span class="text-ink-faint">· page {{ page }} / {{ lastPage }}</span>
    </p>

    <div class="-mr-3 flex items-center">
      <NuxtLink
        v-if="page > 1"
        :to="pageLink(page - 1)"
        class="btn-quiet"
        rel="prev"
      >
        <span aria-hidden="true">←</span> Newer
      </NuxtLink>
      <span v-else class="btn-quiet pointer-events-none opacity-40" aria-disabled="true">
        <span aria-hidden="true">←</span> Newer
      </span>
      <NuxtLink
        v-if="page < lastPage"
        :to="pageLink(page + 1)"
        class="btn-quiet"
        rel="next"
      >
        Older <span aria-hidden="true">→</span>
      </NuxtLink>
      <span v-else class="btn-quiet pointer-events-none opacity-40" aria-disabled="true">
        Older <span aria-hidden="true">→</span>
      </span>
    </div>
  </nav>
</template>
