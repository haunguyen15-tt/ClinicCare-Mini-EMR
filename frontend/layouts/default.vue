<template>
  <!-- One column on phones and tablets (AppNav is a top bar); sidebar + content from lg up. -->
  <div class="min-h-screen lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
    <!-- First tab stop: jumps past the navigation. not-sr-only resets padding, hence focus:px/py. -->
    <a
      href="#main"
      class="btn-primary sr-only left-4 top-[calc(1rem+env(safe-area-inset-top))] z-50 focus:not-sr-only focus:fixed focus:px-5 focus:py-2"
    >
      Skip to content
    </a>
    <AppNav />
    <!-- tabindex lets the skip link move focus here; no ring around the whole page. -->
    <main
      id="main"
      tabindex="-1"
      class="min-w-0 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-8 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:pt-10 lg:pt-14"
    >
      <div class="container-page">
        <slot />
      </div>
    </main>
  </div>
</template>
