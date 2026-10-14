<script setup lang="ts">
import type { Consultation, ConsultationCreate } from '~/types/api'

useHead({ title: 'New consultation' })

const api = useApi()
const { flash } = useFlash()

// Limits match the backend's ConsultationCreate schema.
const NAME_MIN = 2
const NAME_MAX = 100
const NOTES_MAX = 5000

// In form order. Each is also the id of its input, for moving focus to the first error.
const fields = ['patient_name', 'patient_dob', 'diagnosis_codes', 'notes'] as const
type Field = (typeof fields)[number]
const focusField = (field: Field) => document.getElementById(field)?.focus()

const form = reactive({ patient_name: '', patient_dob: '', diagnosis_codes: [] as string[], notes: '' })
const errors = reactive<Partial<Record<Field, string>>>({})
const serverError = ref<string | null>(null)
const submitting = ref(false)
const notesLength = computed(() => form.notes.trim().length)

// Today in the browser's time zone, for the date picker's upper bound. Set after mount so
// the server (possibly in another time zone) and the browser render the same HTML.
const today = ref<string>()
onMounted(() => {
  const now = new Date()
  today.value = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
})

const dobInput = ref<HTMLInputElement>()

function validateField(field: Field): string | undefined {
  switch (field) {
    case 'patient_name': {
      const name = form.patient_name.trim()
      if (!name) return 'Enter the patient’s name.'
      if (name.length < NAME_MIN) return `Use at least ${NAME_MIN} characters.`
      if (name.length > NAME_MAX) return `Use at most ${NAME_MAX} characters.`
      return undefined
    }
    case 'patient_dob':
      // An unparseable date leaves the input's value empty but marks it bad.
      if (dobInput.value?.validity.badInput) return 'Enter a valid date.'
      if (form.patient_dob && today.value && form.patient_dob > today.value) return 'Date of birth cannot be in the future.'
      return undefined
    case 'diagnosis_codes':
      // The picker itself stops at the backend's maximum of 20.
      return form.diagnosis_codes.length ? undefined : 'Add at least one diagnosis code.'
    case 'notes':
      if (!notesLength.value) return 'Write the consultation note.'
      if (notesLength.value > NOTES_MAX) return `Keep the note under ${NOTES_MAX.toLocaleString(LOCALE)} characters.`
      return undefined
  }
}

function validate(): boolean {
  for (const field of fields) errors[field] = validateField(field)
  const firstInvalid = fields.find((field) => errors[field])
  if (firstInvalid) focusField(firstInvalid)
  return !firstInvalid
}

// Once a field shows an error, re-check it as the user fixes it.
function revalidate(field: Field) {
  if (errors[field]) errors[field] = validateField(field)
}
watch(() => form.diagnosis_codes, () => revalidate('diagnosis_codes'))

async function onSubmit() {
  serverError.value = null
  if (!validate()) return

  const body: ConsultationCreate = {
    patient_name: form.patient_name.trim(),
    patient_dob: form.patient_dob || null,
    notes: form.notes.trim(),
    diagnosis_codes: form.diagnosis_codes,
  }

  submitting.value = true
  try {
    const created = await api<Consultation>('/consultation', { method: 'POST', body })
    flash.value = { message: `Consultation for ${created.patient_name} saved.`, consultationId: created.id }
    await navigateTo('/consultations')
  } catch (error) {
    // 422: show each message next to its field. Anything else (e.g. 400 for an unknown code) goes in the alert.
    const fieldErrors = getFieldErrors(error)
    const known = fields.filter((field) => fieldErrors[field])
    for (const field of known) errors[field] = fieldErrors[field]
    if (known.length) {
      serverError.value = 'Some fields need attention. Check the messages below.'
      focusField(known[0]!)
    } else {
      serverError.value = getErrorMessage(error)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-8 sm:space-y-10">
    <div>
      <NuxtLink to="/consultations" class="btn-quiet reveal -ml-3 mb-2 font-mono text-xs">
        <span aria-hidden="true">←</span> Consultations
      </NuxtLink>
      <PageHeader title="New consultation">
        Record the visit with at least one <span class="whitespace-nowrap">ICD-10</span> code.
      </PageHeader>
    </div>

    <form
      class="sheet sheet-margin reveal max-w-3xl py-7 pr-5 [--d:220ms] sm:py-9 sm:pr-9 sm:[--margin:2.5rem] sm:[--margin-gap:1.75rem]"
      novalidate
      @submit.prevent="onSubmit"
    >
      <AppAlert
        :message="serverError"
        title="Not saved"
        dismissible
        class="mb-8"
        @dismiss="serverError = null"
      />

      <fieldset>
        <legend class="eyebrow text-accent">Patient</legend>
        <div class="mt-5 grid gap-7 sm:grid-cols-[minmax(0,1fr)_11rem] sm:gap-6">
          <div>
            <label for="patient_name" class="form-label">Full name</label>
            <input
              id="patient_name"
              v-model="form.patient_name"
              type="text"
              name="patient_name"
              class="form-input"
              autocomplete="off"
              autocapitalize="words"
              :maxlength="NAME_MAX"
              required
              :aria-invalid="Boolean(errors.patient_name)"
              :aria-describedby="errors.patient_name ? 'patient_name-error' : undefined"
              @input="revalidate('patient_name')"
            >
            <p v-if="errors.patient_name" id="patient_name-error" class="form-error">{{ errors.patient_name }}</p>
          </div>

          <div>
            <label for="patient_dob" class="form-label">Date of birth</label>
            <input
              id="patient_dob"
              ref="dobInput"
              v-model="form.patient_dob"
              type="date"
              name="patient_dob"
              class="form-input"
              min="1900-01-01"
              :max="today"
              :aria-invalid="Boolean(errors.patient_dob)"
              :aria-describedby="errors.patient_dob ? 'patient_dob-error' : 'patient_dob-hint'"
              @input="revalidate('patient_dob')"
              @blur="revalidate('patient_dob')"
            >
            <p v-if="errors.patient_dob" id="patient_dob-error" class="form-error">{{ errors.patient_dob }}</p>
            <p v-else id="patient_dob-hint" class="mt-1.5 text-sm text-ink-faint">Optional</p>
          </div>
        </div>
      </fieldset>

      <fieldset class="mt-10">
        <legend class="eyebrow text-accent">Assessment</legend>
        <div class="mt-5">
          <label for="diagnosis_codes" class="form-label">Diagnosis codes</label>
          <DiagnosisPicker
            v-model="form.diagnosis_codes"
            input-id="diagnosis_codes"
            :invalid="Boolean(errors.diagnosis_codes)"
            :describedby="errors.diagnosis_codes ? 'diagnosis_codes-error' : undefined"
          />
          <p v-if="errors.diagnosis_codes" id="diagnosis_codes-error" class="form-error">{{ errors.diagnosis_codes }}</p>
        </div>

        <div class="mt-8">
          <div class="flex items-baseline justify-between gap-4">
            <label for="notes" class="form-label">Clinical note</label>
            <span
              class="font-mono text-xs"
              :class="notesLength > NOTES_MAX ? 'text-danger' : 'text-ink-faint'"
              aria-live="polite"
            >
              <span class="sr-only">Characters used: </span>{{ notesLength.toLocaleString(LOCALE) }} / {{ NOTES_MAX.toLocaleString(LOCALE) }}
            </span>
          </div>
          <!-- Ruled like a paper chart: the lines scroll with the text (bg-local) and match its line height. -->
          <textarea
            id="notes"
            v-model="form.notes"
            name="notes"
            rows="8"
            class="form-input min-h-[14rem] resize-y bg-local py-0 leading-[1.75rem] [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(1.75rem-1px),rgb(var(--rule))_calc(1.75rem-1px),rgb(var(--rule))_1.75rem)]"
            placeholder="History, examination, plan…"
            required
            :aria-invalid="Boolean(errors.notes)"
            :aria-describedby="errors.notes ? 'notes-error' : undefined"
            @input="revalidate('notes')"
          />
          <p v-if="errors.notes" id="notes-error" class="form-error">{{ errors.notes }}</p>
        </div>
      </fieldset>

      <div class="mt-10 flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-end">
        <NuxtLink to="/consultations" class="btn-quiet w-full sm:w-auto">Cancel</NuxtLink>
        <SubmitButton class="w-full sm:w-auto sm:min-w-48" :busy="submitting" busy-label="Saving…">
          Save consultation
        </SubmitButton>
      </div>
    </form>
  </div>
</template>
