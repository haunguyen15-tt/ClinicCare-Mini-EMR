<script setup lang="ts">
useHead({ title: 'Consultations' })

const { page, data, pending, error, refresh } = useConsultationPage('consultations')

// Set by the new consultation form after saving.
const notice = ref(useFlash().take())
</script>

<template>
  <div class="space-y-8 sm:space-y-10">
    <PageHeader title="Consultations">
      <template v-if="data">{{ plural(data.total, 'note') }} on file, newest first.</template>
      <template v-else>Notes on file, newest first.</template>
      <template #actions>
        <NuxtLink to="/consultations/new" class="btn-primary w-full sm:w-auto">
          <span aria-hidden="true" class="font-mono">+</span> New consultation
        </NuxtLink>
      </template>
    </PageHeader>

    <AppAlert
      v-if="notice"
      tone="success"
      :message="notice.message"
      dismissible
      @dismiss="notice = null"
    />

    <AppAlert v-if="error" :message="getErrorMessage(error)" title="Could not load consultations">
      <button type="button" class="btn-quiet" @click="refresh()">Try again</button>
    </AppAlert>

    <div v-else class="reveal space-y-5 [--d:240ms]">
      <ConsultationTable
        :consultations="data?.items ?? []"
        :heading-level="2"
        :loading="pending"
        :highlight-id="notice?.consultationId"
      >
        <template #empty>
          <template v-if="page > 1">
            <p class="empty-title">No notes on this page.</p>
            <NuxtLink to="/consultations" class="btn-quiet -ml-3 mt-2">← Back to the newest notes</NuxtLink>
          </template>
          <template v-else>
            <p class="empty-title">Nothing on file yet.</p>
            <p class="empty-lead">Notes you write appear here, newest first.</p>
            <NuxtLink to="/consultations/new" class="btn-primary mt-5">Write the first consultation</NuxtLink>
          </template>
        </template>
      </ConsultationTable>

      <PaginationBar :page="page" :page-size="PAGE_SIZE" :total="data?.total ?? 0" />
    </div>
  </div>
</template>
