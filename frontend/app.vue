<script setup lang="ts">
// Pages set a short title ("Search"); pages without one get the app name.
useHead({ titleTemplate: (title) => (title ? `${title} · ClinicCare` : 'ClinicCare Mini EMR') })
</script>

<template>
  <!-- Reads the new page title to screen readers after client-side navigation. -->
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
