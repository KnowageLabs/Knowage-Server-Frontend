<template>
    <div class="kn-ws-tab column no-wrap" data-ws-tab="scheduled">
        <!-- no New button: jobs are created in the Scheduler (spec 10.2) -->
        <!-- reload bar: right under the tabs, full width; the first load shows the skeleton instead -->
        <div class="kn-ws-progress-slot">
            <q-linear-progress v-if="store.scheduledLoading && store.scheduledLoaded" indeterminate color="primary" />
        </div>

        <WorkspaceToolbar :scope="query.view" :scope-options="VIEW_OPTIONS" :search="query.q" :search-placeholder="$t('workspace.search.scheduled')" @update:scope="update({ view: $event })" @update:search="update({ q: $event })">
            <template #filters>
                <WorkspaceFiltersButton v-if="query.view === 'outputs'" :groups="filterGroups" @toggle="(groupId, value) => toggleInList(groupId === 'job' ? 'job' : 'format', value)" @clear="update({ job: [], format: [] })" />
            </template>
        </WorkspaceToolbar>

        <div class="col column no-wrap kn-ws-body">
            <KnHint v-if="scheduledEmpty" class="col" title="workspace.empty.scheduledTitle" hint="workspace.empty.scheduledHint" data-ws="empty" />
            <WorkspaceOutputsTable v-else-if="query.view === 'outputs'" :rows="outputRows" :loading="!store.scheduledLoaded" :filtered="filtered" data-tour-id="ws-list" @clear="clearAll" />
            <WorkspaceJobsTable v-else :rows="jobRows" :loading="!store.scheduledLoaded" :can-run="canRun" :running="running" data-tour-id="ws-list" @run="runJob" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import mainStore from '@/App.store'
import KnHint from '@/components/UI/KnHint.vue'
import useWorkspaceStore from '../workspace.store'
import { ITrigger, WsJobRow } from '../Workspace'
import { runTriggers } from '../workspaceApi'
import { canRunJobs, filterJobs, filterOutputs } from '../workspaceHelpers'
import { useWorkspaceQuery } from '../common/useWorkspaceQuery'
import WorkspaceFiltersButton, { WsFilterGroup } from '../common/WorkspaceFiltersButton.vue'
import WorkspaceToolbar, { WsScopeOption } from '../common/WorkspaceToolbar.vue'
import WorkspaceJobsTable from './WorkspaceJobsTable.vue'
import WorkspaceOutputsTable from './WorkspaceOutputsTable.vue'

const VIEW_OPTIONS: WsScopeOption[] = [
    { value: 'outputs', labelKey: 'workspace.scope.outputs', icon: 'sym_o_inbox' },
    { value: 'jobs', labelKey: 'workspace.scope.jobs', icon: 'sym_o_schedule' }
]

const appStore = mainStore()
const store = useWorkspaceStore()

const {
    state: query,
    update,
    toggleInList
} = useWorkspaceQuery({
    view: { param: 'view', kind: 'enum', values: ['outputs', 'jobs'], default: 'outputs' },
    job: { param: 'job', kind: 'list' },
    format: { param: 'format', kind: 'list' },
    q: { param: 'q', kind: 'string' }
} as const)

const canRun = computed(() => canRunJobs(appStore.user))

const outputRows = computed(() => filterOutputs(store.outputs, { jobs: query.value.job, formats: query.value.format, q: query.value.q }))
const jobRows = computed(() => [...filterJobs(store.jobs, query.value.q)].sort((a, b) => a.jobName.localeCompare(b.jobName, undefined, { sensitivity: 'base' })))
const filtered = computed(() => query.value.job.length > 0 || query.value.format.length > 0 || !!query.value.q)
const scheduledEmpty = computed(() => store.scheduledLoaded && store.outputs.length === 0 && store.jobs.length === 0)

const countBy = (predicate: (row: (typeof store.outputs)[number]) => boolean) => store.outputs.filter(predicate).length

// Counts are over all outputs, before the filters (spec 6.2). A value in the URL that has no output still shows, so it can be unchecked.
const filterGroups = computed<WsFilterGroup[]>(() => {
    const jobs = [...new Set([...store.outputs.map((o) => o.jobName), ...query.value.job])].sort((a, b) => a.localeCompare(b))
    const formats = [...new Set([...store.outputs.map((o) => o.format), ...query.value.format])].sort()
    return [
        { id: 'job', labelKey: 'workspace.filter.job', options: jobs.map((job) => ({ value: job, label: job, count: countBy((o) => o.jobName === job), selected: query.value.job.includes(job) })) },
        { id: 'format', labelKey: 'workspace.filter.format', options: formats.map((format) => ({ value: format, label: format, count: countBy((o) => o.format === format), selected: query.value.format.includes(format) })) }
    ]
})

const clearAll = () => update({ job: [], format: [], q: '' })

// executeMultipleTrigger, then the toast the old page showed (spec 10.2)
const running = ref<string | null>(null)
async function runJob(row: WsJobRow, triggers: ITrigger[]) {
    if (running.value || !triggers.length) return
    running.value = row.key
    try {
        const response = await runTriggers(triggers.map(({ jobName, jobGroup, triggerName, triggerGroup }) => ({ jobName, jobGroup, triggerName, triggerGroup })))
        if (response.data?.resp === 'ok') appStore.setInfo({ title: 'common.information', msg: 'managers.scheduler.schedulationExecuted' })
    } catch {
        // the axios interceptor shows the error
    } finally {
        running.value = null
    }
}

onMounted(() => {
    store.loadScheduled().catch(() => {})
})
</script>
