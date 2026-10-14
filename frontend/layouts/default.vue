<template>
  <!-- One column on phones and tablets (AppNav is a top bar); sidebar + content from lg up. -->
  <div class="min-h-screen lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
    <!-- First tab stop: jumps past the navigation. Parked above the viewport until focused. -->
    <a
      href="#main"
      class="btn-primary fixed left-4 top-[calc(1rem+env(safe-area-inset-top))] z-50 -translate-y-[200%] focus:translate-y-0"
    >
      Skip to content
    </a>
    <AppNav />
    <!-- tabindex lets the skip link move focus here. -->
    <main id="main" tabindex="-1" class="min-w-0 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-8 outline-none sm:pt-10 lg:pt-14">
      <div class="container-page">
        <slot />
      </div>
    </main>
  </div>
</template>
