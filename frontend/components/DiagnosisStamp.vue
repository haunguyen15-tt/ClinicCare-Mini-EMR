<script setup lang="ts">
import type { Diagnosis } from '~/types/api'

// An ICD-10 code stamp whose description shows in a tooltip. Hover only works with a mouse,
// so the tooltip also opens on keyboard focus and toggles on tap.
defineProps<{ diagnosis: Diagnosis }>()

const tooltipId = useId()
const root = ref<HTMLElement>()
const hovered = ref(false)
const focused = ref(false)
const pinned = ref(false)
const open = computed(() => hovered.value || focused.value || pinned.value)

function close() {
  hovered.value = focused.value = pinned.value = false
}

function onPointerEnter(event: PointerEvent) {
  if (event.pointerType === 'mouse') hovered.value = true
}

// Only keyboard focus opens it; a mouse click or tap goes through the `pinned` toggle.
function onFocus(event: FocusEvent) {
  focused.value = (event.target as HTMLElement).matches(':focus-visible')
}

// A tap elsewhere closes a pinned tooltip.
function onDocumentPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) pinned.value = false
}

watch(pinned, (isPinned) => {
  if (isPinned) document.addEventListener('pointerdown', onDocumentPointerDown)
  else document.removeEventListener('pointerdown', onDocumentPointerDown)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <span
    ref="root"
    class="relative inline-flex"
    @pointerenter="onPointerEnter"
    @pointerleave="hovered = false"
  >
    <button
      type="button"
      class="code-stamp relative cursor-help bg-card transition-colors before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] hover:border-accent hover:text-accent aria-expanded:border-accent aria-expanded:bg-accent-soft"
      :aria-describedby="tooltipId"
      :aria-expanded="pinned"
      @click="pinned = !pinned"
      @focus="onFocus"
      @blur="focused = false"
      @keydown.esc="close"
    >
      {{ diagnosis.code }}
    </button>
    <!-- Always in the DOM so aria-describedby gives screen readers the description. -->
    <span
      :id="tooltipId"
      role="tooltip"
      class="absolute left-0 top-full z-20 mt-1.5 w-max max-w-[15rem] rounded-sm bg-ink px-3 py-2 text-[0.8125rem] leading-snug text-paper shadow-sheet"
      :class="open ? 'block animate-rise [animation-duration:0.2s]' : 'hidden'"
    >
      {{ diagnosis.description }}
    </span>
  </span>
</template>
