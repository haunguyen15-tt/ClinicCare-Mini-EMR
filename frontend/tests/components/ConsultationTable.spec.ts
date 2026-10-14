import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ConsultationTable from '~/components/ConsultationTable.vue'
import type { Consultation } from '~/types/api'

function consultation(overrides: Partial<Consultation> & Pick<Consultation, 'id' | 'patient_name'>): Consultation {
  return {
    patient_dob: null,
    notes: 'Follow-up visit.',
    consultation_date: '2026-10-01T09:30:00Z',
    doctor_id: 1,
    doctor_name: 'Dr. Jane Smith',
    created_at: '2026-10-01T09:30:00Z',
    diagnoses: [],
    ...overrides,
  }
}

const CONSULTATIONS: Consultation[] = [
  consultation({
    id: 7,
    patient_name: 'Alice Morgan',
    patient_dob: '1980-03-07',
    notes: 'Blood sugar well controlled. Continue metformin.',
    diagnoses: [
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
      { code: 'I10', description: 'Essential (primary) hypertension' },
    ],
  }),
  consultation({
    id: 42,
    patient_name: 'Brian Cole',
    doctor_id: null,
    doctor_name: null,
    diagnoses: [{ code: 'J45.909', description: 'Unspecified asthma, uncomplicated' }],
  }),
]

const mountTable = (props: InstanceType<typeof ConsultationTable>['$props']) => mountSuspended(ConsultationTable, { props })

describe('ConsultationTable', () => {
  it('renders one ledger row per consultation, in order', async () => {
    const wrapper = await mountTable({ consultations: CONSULTATIONS })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.get('th[scope="row"]').text())).toEqual([
      expect.stringContaining('Alice Morgan'),
      'Brian Cole',
    ])
  })

  it('shows the record number, date of birth, codes, note and doctor of a row', async () => {
    const wrapper = await mountTable({ consultations: CONSULTATIONS })

    const row = wrapper.findAll('tbody tr')[0]!
    expect(row.text()).toContain('007')
    expect(row.text()).toContain('b. 07 Mar 1980')
    expect(row.findAll('.code-stamp').map((stamp) => stamp.text())).toEqual(['E11.9', 'I10'])
    expect(row.get('[role="tooltip"]').text()).toBe('Type 2 diabetes mellitus without complications')
    expect(row.text()).toContain('Blood sugar well controlled. Continue metformin.')
    expect(row.text()).toContain('Dr. Jane Smith')
  })

  it('labels notes from before sign-in existed as recorded by an unknown doctor', async () => {
    const wrapper = await mountTable({ consultations: CONSULTATIONS })

    expect(wrapper.findAll('tbody tr')[1]!.text()).toContain('Unknown')
    expect(wrapper.findAll('ul[aria-label="Consultations"] > li')[1]!.text()).toContain('Recorded by unknown')
  })

  it('renders the same consultations as cards for phones', async () => {
    const wrapper = await mountTable({ consultations: CONSULTATIONS, caption: 'Search results' })

    const cards = wrapper.findAll('ul[aria-label="Search results"] > li')
    expect(cards).toHaveLength(2)
    expect(cards[0]!.get('h3').text()).toBe('Alice Morgan')
    expect(cards[0]!.text()).toContain('No. 007')
    expect(cards[0]!.findAll('.code-stamp').map((stamp) => stamp.text())).toEqual(['E11.9', 'I10'])
    expect(wrapper.get('caption').text()).toBe('Search results')
  })

  it('marks the highlighted consultation in both views', async () => {
    const wrapper = await mountTable({ consultations: CONSULTATIONS, highlightId: 42 })

    expect(wrapper.findAll('tbody tr').map((row) => row.classes('bg-accent-soft/60'))).toEqual([false, true])
    expect(wrapper.findAll('ul[aria-label="Consultations"] > li').map((card) => card.classes('ring-2'))).toEqual([
      false,
      true,
    ])
  })

  it('shows the default empty state when there is nothing to list', async () => {
    const wrapper = await mountTable({ consultations: [] })

    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.text()).toContain('Nothing on file.')
    expect(wrapper.text()).toContain('No consultations to show.')
  })

  it('lets the page replace the empty state through the empty slot', async () => {
    const wrapper = await mountSuspended(ConsultationTable, {
      props: { consultations: [] },
      slots: { empty: () => h('p', 'No consultations match “Zed”.') },
    })

    expect(wrapper.text()).toContain('No consultations match “Zed”.')
    expect(wrapper.text()).not.toContain('Nothing on file.')
  })

  it('shows placeholders while the first page loads', async () => {
    const wrapper = await mountTable({ consultations: [], loading: true })

    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    expect(wrapper.get('[role="status"]').text()).toBe('Loading consultations…')
    expect(wrapper.text()).not.toContain('Nothing on file.')
  })

  it('keeps the rows, dimmed, while the next page loads', async () => {
    const wrapper = await mountTable({ consultations: CONSULTATIONS, loading: true })

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.get('[aria-busy="true"]').classes()).toContain('opacity-50')
  })
})
