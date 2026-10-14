<script setup lang="ts">
definePageMeta({ layout: 'auth', guest: true })
useHead({ title: 'Sign in · ClinicCare' })

const { login } = useAuth()
const route = useRoute()

// Limits match the backend's LoginRequest schema.
const form = reactive({ username: '', password: '' })
const errors = reactive<{ username?: string; password?: string }>({})
const serverError = ref<string | null>(null)
const submitting = ref(false)

const usernameInput = ref<HTMLInputElement>()
const passwordInput = ref<HTMLInputElement>()

function validate(): boolean {
  errors.username = form.username.trim() ? undefined : 'Enter your username.'
  errors.password = form.password ? undefined : 'Enter your password.'
  if (errors.username) usernameInput.value?.focus()
  else if (errors.password) passwordInput.value?.focus()
  return !errors.username && !errors.password
}

async function onSubmit() {
  serverError.value = null
  if (!validate()) return

  submitting.value = true
  try {
    await login({ username: form.username.trim(), password: form.password })
    await navigateTo(safeRedirect(route.query.redirect))
  } catch (error) {
    serverError.value = getErrorMessage(error)
    form.password = ''
    passwordInput.value?.focus()
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <p class="eyebrow">Clinician sign-in</p>
      <h2 class="mt-2 font-display text-[2.5rem] leading-none tracking-tight">Sign in</h2>
      <p class="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">Use your doctor account to open the consultation records.</p>
    </div>

    <ErrorAlert :message="serverError" title="Sign-in failed" />

    <form class="space-y-7" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="username" class="form-label">Username</label>
        <input
          id="username"
          ref="usernameInput"
          v-model="form.username"
          type="text"
          name="username"
          class="form-input"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          maxlength="50"
          required
          :aria-invalid="Boolean(errors.username)"
          :aria-describedby="errors.username ? 'username-error' : undefined"
          @input="errors.username = undefined"
        >
        <p v-if="errors.username" id="username-error" class="form-error">{{ errors.username }}</p>
      </div>

      <div>
        <label for="password" class="form-label">Password</label>
        <input
          id="password"
          ref="passwordInput"
          v-model="form.password"
          type="password"
          name="password"
          class="form-input"
          autocomplete="current-password"
          maxlength="128"
          required
          :aria-invalid="Boolean(errors.password)"
          :aria-describedby="errors.password ? 'password-error' : undefined"
          @input="errors.password = undefined"
        >
        <p v-if="errors.password" id="password-error" class="form-error">{{ errors.password }}</p>
      </div>

      <button type="submit" class="btn-primary group w-full justify-between" :disabled="submitting">
        {{ submitting ? 'Signing in…' : 'Sign in' }}
        <svg v-if="submitting" class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <span v-else class="font-mono transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
      </button>
    </form>
  </div>
</template>
