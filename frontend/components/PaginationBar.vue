<script setup lang="ts">
// Previous / next links that set `?page=` and keep the rest of the query, so any page can be shared.
const props = defineProps<{ page: number; pageSize: number; total: number }>()

const NuxtLink = resolveComponent('NuxtLink')
const route = useRoute()
const lastPage = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const first = computed(() => Math.min(props.total, (props.page - 1) * props.pageSize + 1))
const last = computed(() => Math.min(props.total, props.page * props.pageSize))

// Newest first, so the previous page holds newer notes. Page 1 drops the parameter,
// keeping the canonical URL clean. At either end the control renders as a disabled span.
const links = computed(() =>
  [
    { rel: 'prev', label: 'Newer', page: props.page - 1, enabled: props.page > 1 },
    { rel: 'next', label: 'Older', page: props.page + 1, enabled: props.page < lastPage.value },
  ].map((link) => ({
    ...link,
    attrs: link.enabled
      ? { to: { query: { ...route.query, page: link.page > 1 ? String(link.page) : undefined } }, rel: link.rel }
      : { 'aria-disabled': 'true' },
  })),
)

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
      <component
        :is="link.enabled ? NuxtLink : 'span'"
        v-for="link in links"
        :key="link.rel"
        v-bind="link.attrs"
        class="btn-quiet"
        :class="!link.enabled && 'pointer-events-none opacity-40'"
      >
        <span v-if="link.rel === 'prev'" aria-hidden="true">←</span>
        {{ link.label }}
        <span v-if="link.rel === 'next'" aria-hidden="true">→</span>
      </component>
    </div>
  </nav>
</template>
