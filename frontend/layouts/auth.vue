<script setup lang="ts">
// Decorative ICD-10 stamps scattered on the chart cover (desktop only).
const stamps = [
  { code: 'E11.9', class: 'left-[12%] top-[58%] -rotate-6' },
  { code: 'I10', class: 'left-[46%] top-[66%] rotate-3' },
  { code: 'J45.909', class: 'left-[24%] top-[76%] rotate-[8deg]' },
  { code: 'M54.5', class: 'left-[60%] top-[80%] -rotate-[4deg]' },
]
</script>

<template>
  <div class="min-h-screen lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
    <!-- Chart cover: a header band on phones, a full-height panel from lg up. -->
    <section
      class="relative overflow-hidden bg-pine-deep pb-10 pt-[max(2rem,env(safe-area-inset-top))] short:pb-6 short:pt-[max(1.25rem,env(safe-area-inset-top))] text-paper lg:flex lg:min-h-screen lg:flex-col lg:pb-12 lg:pt-12"
    >
      <!-- Ruled lines and the vermilion margin, like the front of a paper record. -->
      <div
        class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,rgb(var(--paper)/0.06)_31px,rgb(var(--paper)/0.06)_32px)]"
        aria-hidden="true"
      />
      <div class="pointer-events-none absolute inset-y-0 left-6 w-px origin-top animate-draw-rule bg-mint/60 sm:left-10 lg:left-14" aria-hidden="true" />

      <div class="relative flex flex-1 flex-col pl-12 pr-6 sm:pl-[4.5rem] sm:pr-10 lg:pl-24 lg:pr-14">
        <AppLogo inverted class="reveal" />

        <div class="mt-10 max-w-xl short:mt-5 lg:mt-auto">
          <p class="eyebrow reveal !text-paper/60 [--d:120ms]">Consultation records</p>
          <h1 class="reveal mt-3 font-display text-[2.75rem] leading-[0.98] tracking-tight [--d:200ms] sm:text-6xl lg:text-7xl short:text-4xl">
            Every visit,
            <em class="text-mint">on the record.</em>
          </h1>
          <p class="reveal mt-5 hidden max-w-md text-[0.9375rem] leading-relaxed text-paper/70 [--d:280ms] sm:block short:hidden">
            Search ICD&#8209;10 codes, write consultation notes and find any past visit by patient or diagnosis.
          </p>
        </div>

        <div class="relative mt-auto hidden h-40 lg:block" aria-hidden="true">
          <!-- Rotation sits on the wrapper: the reveal animation owns the inner element's transform. -->
          <span v-for="(stamp, i) in stamps" :key="stamp.code" class="absolute" :class="stamp.class">
            <span
              class="reveal block rounded-[3px] border border-paper/40 px-2 py-1 font-mono text-sm text-paper/50"
              :style="{ '--d': `${400 + i * 90}ms` }"
            >
              {{ stamp.code }}
            </span>
          </span>
        </div>

        <p class="eyebrow mt-8 hidden !text-paper/45 lg:block">Confidential · Authorised clinicians only</p>
      </div>
    </section>

    <!-- The form side. -->
    <main
      class="flex justify-center px-6 pb-[max(3rem,env(safe-area-inset-bottom))] pt-10 sm:px-10 sm:pt-14 short:pt-6 lg:items-center lg:py-12"
    >
      <div class="reveal w-full max-w-sm [--d:240ms]">
        <slot />
      </div>
    </main>
  </div>
</template>
