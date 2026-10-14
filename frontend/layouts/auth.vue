<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]"
  >
    <div class="w-full max-w-sm">
      <div class="mb-6 flex items-center justify-center gap-2 text-lg font-semibold text-brand-700">
        <span class="grid size-10 place-items-center rounded-lg bg-brand-600 font-bold text-white" aria-hidden="true">CC</span>
        ClinicCare
      </div>
      <main class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
