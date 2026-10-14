<script setup lang="ts">
// A consultation note clamped to a few lines, with a toggle to read the rest.
withDefaults(defineProps<{ text: string; lines?: 2 | 3 }>(), { lines: 3 })

const noteId = useId()
const note = ref<HTMLElement>()
const expanded = ref(false)
// Whether the clamp hides part of the note. It depends on the rendered width, so it is
// measured in the browser and kept up to date as the layout changes.
const overflows = ref(false)

function measure() {
  if (note.value && !expanded.value) overflows.value = note.value.scrollHeight > note.value.clientHeight + 1
}

let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(measure)
  if (note.value) observer.observe(note.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="min-w-0">
    <p
      :id="noteId"
      ref="note"
      class="whitespace-pre-line break-words text-[0.9375rem] leading-relaxed text-ink-soft"
      :class="!expanded && (lines === 2 ? 'line-clamp-2' : 'line-clamp-3')"
    >
      {{ text }}
    </p>
    <button
      v-if="overflows || expanded"
      type="button"
      class="-ml-2 mt-0.5 inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 font-mono text-xs text-accent hover:text-ink"
      :aria-expanded="expanded"
      :aria-controls="noteId"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : 'Read full note' }}
      <span class="inline-block transition-transform" :class="expanded && 'rotate-180'" aria-hidden="true">↓</span>
    </button>
  </div>
</template>
