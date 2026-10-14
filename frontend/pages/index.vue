<script setup lang="ts">
const { doctor } = useAuth()

const actions = [
  {
    to: '/consultations/new',
    index: '01',
    title: 'New consultation',
    // Non-breaking hyphen keeps "ICD-10" on one line.
    body: 'Write up a visit and attach one or more ICD‑10 codes.',
  },
  {
    to: '/consultations',
    index: '02',
    title: 'Consultations',
    body: 'Read past notes, newest first.',
  },
  {
    to: '/search',
    index: '03',
    title: 'Search',
    body: 'Find visits by patient name or diagnosis code.',
  },
]
</script>

<template>
  <div class="space-y-10 sm:space-y-14">
    <header class="max-w-2xl">
      <p class="eyebrow reveal">Front sheet</p>
      <h1 class="page-title reveal mt-3 [--d:80ms]">
        Welcome back<template v-if="doctor">,<br class="sm:hidden"> <em class="text-accent">{{ doctor.full_name }}</em></template>.
      </h1>
      <p class="reveal mt-4 text-[0.9375rem] leading-relaxed text-ink-soft [--d:160ms] sm:text-base">
        Record consultation notes with ICD&#8209;10 diagnosis codes and search past consultations.
      </p>
    </header>

    <ul class="grid gap-4 md:grid-cols-3 md:gap-5">
      <li v-for="(action, i) in actions" :key="action.to" class="reveal" :style="{ '--d': `${240 + i * 90}ms` }">
        <NuxtLink
          :to="action.to"
          class="sheet sheet-margin group flex h-full min-h-36 flex-col py-5 pl-11 pr-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink)/0.45)] sm:pl-14"
        >
          <span class="font-mono text-xs text-accent">{{ action.index }}</span>
          <span class="mt-2 font-display text-[1.75rem] leading-tight text-ink">{{ action.title }}</span>
          <span class="mt-1 text-sm leading-relaxed text-ink-soft">{{ action.body }}</span>
          <span class="mt-auto pt-4 font-mono text-xs text-ink-faint transition-colors group-hover:text-ink" aria-hidden="true">
            Open →
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
