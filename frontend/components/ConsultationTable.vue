<script setup lang="ts">
import type { Consultation } from '~/types/api'

// Consultation notes as a ruled ledger from md up, and as stacked chart cards on phones.
// Both views are always rendered; CSS shows one of them.
withDefaults(
  defineProps<{
    consultations: Consultation[]
    /** A request is in flight: shows placeholders when there is nothing yet, else dims the rows. */
    loading?: boolean
    /** Accessible name for the table. */
    caption?: string
    /** A consultation to mark, e.g. the one just saved. */
    highlightId?: number
  }>(),
  { loading: false, caption: 'Consultations', highlightId: undefined },
)

// Record number printed in the margin: 7 -> "007".
const recordNo = (id: number) => String(id).padStart(3, '0')

const dateProps = { locale: 'en-GB', day: '2-digit', month: 'short', year: 'numeric' } as const
const timeProps = { locale: 'en-GB', hour: '2-digit', minute: '2-digit' } as const
</script>

<template>
  <!-- Loading with nothing to show yet. -->
  <div v-if="loading && !consultations.length" class="sheet divide-y divide-rule" aria-busy="true">
    <p class="sr-only" role="status">Loading consultations…</p>
    <div v-for="n in 3" :key="n" class="flex gap-4 px-5 py-5" aria-hidden="true">
      <div class="h-3 w-16 shrink-0 animate-pulse rounded-full bg-rule" />
      <div class="flex-1 space-y-2.5">
        <div class="h-4 w-2/5 animate-pulse rounded-full bg-rule" />
        <div class="h-3 w-4/5 animate-pulse rounded-full bg-rule/70" />
        <div class="h-3 w-3/5 animate-pulse rounded-full bg-rule/70" />
      </div>
    </div>
  </div>

  <!-- Empty: an unused sheet. -->
  <div
    v-else-if="!consultations.length"
    class="sheet sheet-margin flex flex-col items-start gap-1 py-10 pr-6 sm:py-12"
  >
    <slot name="empty">
      <p class="font-display text-[1.75rem] leading-tight">Nothing on file.</p>
      <p class="text-[0.9375rem] text-ink-soft">No consultations to show.</p>
    </slot>
  </div>

  <div v-else class="transition-opacity" :class="loading && 'pointer-events-none opacity-50'" :aria-busy="loading">
    <!-- Phones: one chart card per consultation. -->
    <ul class="space-y-4 md:hidden" :aria-label="caption">
      <li
        v-for="item in consultations"
        :key="item.id"
        class="sheet sheet-margin py-4 pr-4 [--margin:1.25rem] [--margin-gap:1rem]"
        :class="item.id === highlightId && 'ring-2 ring-accent'"
      >
        <div class="flex items-baseline justify-between gap-3 font-mono text-xs">
          <span class="text-ink-soft">
            <NuxtTime :datetime="item.consultation_date" v-bind="dateProps" />
            <span class="text-ink-faint"> · <NuxtTime :datetime="item.consultation_date" v-bind="timeProps" /></span>
          </span>
          <span class="text-ink-faint">No. {{ recordNo(item.id) }}</span>
        </div>

        <h3 class="mt-2 break-words text-xl font-semibold leading-tight tracking-tight">{{ item.patient_name }}</h3>
        <p v-if="item.patient_dob" class="mt-0.5 font-mono text-xs text-ink-faint">
          b. {{ formatDate(item.patient_dob) }} · {{ ageFrom(item.patient_dob) }} y
        </p>

        <ul class="mt-4 space-y-2" aria-label="Diagnoses">
          <li v-for="diagnosis in item.diagnoses" :key="diagnosis.code" class="flex items-baseline gap-3">
            <span class="code-stamp shrink-0">{{ diagnosis.code }}</span>
            <span class="min-w-0 text-sm leading-snug text-ink-soft">{{ diagnosis.description }}</span>
          </li>
        </ul>

        <ExpandableNote class="mt-4 border-t border-dashed border-rule-strong pt-3" :text="item.notes" />

        <p class="eyebrow mt-2 truncate">
          Recorded by <span class="text-ink-soft">{{ item.doctor_name ?? 'unknown' }}</span>
        </p>
      </li>
    </ul>

    <!-- md and up: a ruled ledger, the record number in the margin. -->
    <div class="sheet hidden md:block">
      <table class="w-full table-fixed border-collapse text-left">
        <caption class="sr-only">{{ caption }}</caption>
        <!-- table-fixed takes the column widths from this row; Note gets the rest. -->
        <thead>
          <tr class="border-b border-rule-strong">
            <th scope="col" class="eyebrow w-[3.25rem] border-r border-accent/50 py-3 pr-3 text-right font-medium xl:w-[3.75rem]">No.</th>
            <th scope="col" class="eyebrow w-[6.75rem] px-3 py-3 font-medium xl:w-[7.25rem] xl:px-4">Date</th>
            <th scope="col" class="eyebrow w-[9.5rem] px-3 py-3 font-medium xl:w-[12rem] xl:px-4">Patient</th>
            <th scope="col" class="eyebrow w-[9.75rem] px-3 py-3 font-medium xl:w-[11rem] xl:px-4">Diagnoses</th>
            <th scope="col" class="eyebrow px-3 py-3 font-medium xl:px-4">Note</th>
            <th scope="col" class="eyebrow hidden w-[9rem] px-3 py-3 font-medium xl:table-cell xl:px-4">Doctor</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in consultations"
            :key="item.id"
            class="border-b border-rule align-top transition-colors last:border-0"
            :class="item.id === highlightId ? 'bg-accent-soft/60' : 'hover:bg-paper/70'"
          >
            <td class="border-r border-accent/50 py-4 pr-3 text-right font-mono text-xs text-ink-faint">
              {{ recordNo(item.id) }}
            </td>
            <td class="px-3 py-4 xl:px-4">
              <NuxtTime class="block text-sm text-ink" :datetime="item.consultation_date" v-bind="dateProps" />
              <NuxtTime class="block font-mono text-xs text-ink-faint" :datetime="item.consultation_date" v-bind="timeProps" />
              <!-- Below xl the doctor sits under the date instead of in its own column. -->
              <p class="mt-2 break-words text-xs text-ink-soft xl:hidden">
                {{ item.doctor_name ?? 'Doctor unknown' }}
              </p>
            </td>
            <th scope="row" class="px-3 py-4 text-left font-normal xl:px-4">
              <span class="block break-words text-base font-semibold leading-snug text-ink">{{ item.patient_name }}</span>
              <span v-if="item.patient_dob" class="mt-1 block font-mono text-xs leading-relaxed text-ink-faint">
                <span class="block">b. {{ formatDate(item.patient_dob) }}</span>
                <span class="block">{{ ageFrom(item.patient_dob) }} years</span>
              </span>
            </th>
            <td class="px-3 py-4 xl:px-4">
              <ul class="flex flex-wrap gap-1.5" aria-label="Diagnoses">
                <li v-for="diagnosis in item.diagnoses" :key="diagnosis.code">
                  <DiagnosisStamp :diagnosis="diagnosis" />
                </li>
              </ul>
            </td>
            <td class="px-3 py-3.5 xl:px-4">
              <ExpandableNote :text="item.notes" :lines="2" />
            </td>
            <td class="hidden break-words px-3 py-4 text-sm text-ink-soft xl:table-cell xl:px-4">
              {{ item.doctor_name ?? 'Unknown' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
