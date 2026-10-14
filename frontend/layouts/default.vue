<template>
  <div class="flex min-h-screen flex-col">
    <AppNav />
    <main class="container-page flex-1 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:py-8">
      <slot />
    </main>
  </div>
</template>
