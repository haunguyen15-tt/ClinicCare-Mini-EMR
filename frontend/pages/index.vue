<script setup lang="ts">
const { doctor } = useAuth()
</script>

<template>
  <div class="space-y-10 sm:space-y-14">
    <header class="max-w-2xl">
      <p class="eyebrow reveal">Front sheet</p>
      <h1 class="page-title reveal mt-3 [--d:80ms]">
        Welcome back<template v-if="doctor">,<br class="sm:hidden"> <em class="text-accent">{{ doctor.full_name }}</em></template>.
      </h1>
      <p class="reveal mt-4 text-[0.9375rem] leading-relaxed text-ink-soft [--d:160ms] sm:text-base">
        Record consultation notes with <span class="whitespace-nowrap">ICD-10</span> diagnosis codes and search past
        consultations.
      </p>
    </header>

    <ul class="grid gap-4 md:grid-cols-3 md:gap-5">
      <li v-for="(section, i) in sections" :key="section.to" class="reveal" :style="{ '--d': `${240 + i * 90}ms` }">
        <NuxtLink
          :to="section.to"
          class="sheet sheet-margin group flex h-full min-h-36 flex-col py-5 pr-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink)/0.45)]"
        >
          <span class="font-mono text-xs text-accent">{{ tabNumber(i) }}</span>
          <span class="mt-2 font-display text-[1.75rem] leading-tight text-ink">{{ section.label }}</span>
          <span class="mt-1 text-sm leading-relaxed text-ink-soft">{{ section.description }}</span>
          <span class="mt-auto pt-4 font-mono text-xs text-ink-faint transition-colors group-hover:text-ink" aria-hidden="true">
            Open →
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
