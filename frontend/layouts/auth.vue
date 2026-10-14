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
      class="surface-cover sheet-margin overflow-hidden pb-10 pr-6 pt-[max(2rem,env(safe-area-inset-top))] [--margin-gap:1.5rem] [--margin:1.5rem] sm:pr-10 sm:[--margin:2.5rem] short:pb-6 short:pt-[max(1.25rem,env(safe-area-inset-top))] lg:flex lg:min-h-screen lg:flex-col lg:pb-12 lg:pr-14 lg:pt-12 lg:[--margin:3.5rem]"
    >
      <!-- Ruled lines, like the front of a paper record. -->
      <div
        class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,rgb(var(--ink)/0.06)_31px,rgb(var(--ink)/0.06)_32px)]"
        aria-hidden="true"
      />

      <div class="relative flex flex-1 flex-col">
        <AppLogo class="reveal" />

        <div class="mt-10 max-w-xl short:mt-5 lg:mt-auto">
          <p class="eyebrow reveal [--d:120ms]">Consultation records</p>
          <h1 class="reveal mt-3 font-display text-[2.75rem] leading-[0.98] tracking-tight [--d:200ms] sm:text-6xl short:text-4xl lg:text-7xl">
            Every visit,
            <em class="text-accent">on the record.</em>
          </h1>
          <p class="reveal mt-5 hidden max-w-md text-[0.9375rem] leading-relaxed text-ink-soft [--d:280ms] sm:block short:hidden">
            Search <span class="whitespace-nowrap">ICD-10</span> codes, write consultation notes and find any past visit
            by patient or diagnosis.
          </p>
        </div>

        <div class="relative mt-auto hidden h-40 lg:block" aria-hidden="true">
          <span
            v-for="(stamp, i) in stamps"
            :key="stamp.code"
            class="code-stamp reveal absolute border-ink/40 px-2 py-1 text-sm font-normal text-ink-faint"
            :class="stamp.class"
            :style="{ '--d': `${400 + i * 90}ms` }"
          >
            {{ stamp.code }}
          </span>
        </div>

        <p class="eyebrow mt-8 hidden lg:block">Confidential · Authorised clinicians only</p>
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
