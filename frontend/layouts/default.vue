<template>
  <!-- One column on phones and tablets (AppNav is a top bar); sidebar + content from lg up. -->
  <div class="min-h-screen lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
    <AppNav />
    <main class="min-w-0 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-8 sm:pt-10 lg:pt-14">
      <div class="container-page">
        <slot />
      </div>
    </main>
  </div>
</template>
