<template>
    <WorkspaceTableFrame v-slot="{ scrollTarget }" :skeleton="showSkeleton" :columns="columns" name-column="document">
        <q-table class="kn-ws-table kn-ws-table--static" flat dense virtual-scroll :virtual-scroll-target="scrollTarget" :hide-bottom="items.length > 0" :rows-per-page-options="[0]" :rows="items" :columns="columns" row-key="key">
            <template #body="props">
                <q-tr v-if="props.row.group" :props="props" class="kn-ws-group-row" :data-ws-group="props.row.group">
                    <q-td colspan="100%">{{ $t('workspace.' + props.row.group) }}</q-td>
                </q-tr>
                <q-tr v-else :props="props" :data-ws-output="props.row.key">
                    <q-td key="document" :props="props">
                        <div class="row items-center no-wrap kn-ws-name">
                            <span class="kn-ws-name__icon"><q-icon :name="iconOf(props.row)" size="18px" /></span>
                            <div class="column no-wrap kn-ws-name__text">
                                <span class="kn-ws-name__title ellipsis">{{ props.row.documentName }}</span>
                                <span v-if="props.row.name && props.row.name !== props.row.documentName" class="kn-ws-name__sub ellipsis">{{ props.row.name }}</span>
                            </div>
                        </div>
                    </q-td>
                    <q-td key="job" :props="props" class="kn-ws-muted">{{ props.row.jobName }}</q-td>
                    <q-td key="produced" :props="props" class="kn-ws-muted">
                        {{ produced(props.row) }}
                        <q-tooltip>{{ fullDate(props.row.created) }}</q-tooltip>
                    </q-td>
                    <q-td key="format" :props="props">
                        <span class="kn-ws-format">{{ props.row.format }}</span>
                    </q-td>
                    <q-td key="actions" :props="props" auto-width>
                        <q-btn flat dense no-caps icon="sym_o_download" :label="$t('workspace.download')" class="kn-ws-row-btn" :loading="downloading === props.row.key" data-ws-download @click="download(props.row)" />
                    </q-td>
                </q-tr>
            </template>
            <template #no-data>
                <div class="full-width row items-center justify-center kn-ws-no-data">
                    <span>{{ $t('workspace.empty.noOutputs') }}</span>
                    <q-btn v-if="filtered" flat no-caps color="primary" class="q-ml-sm" :label="$t('workspace.clearFilters')" @click="emit('clear')" />
                </div>
            </template>
        </q-table>
    </WorkspaceTableFrame>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'
import { formatDateWithLocale, getLocale } from '@/helpers/commons/localeHelper'
import useWorkspaceStore from '../workspace.store'
import { WsOutputRow } from '../Workspace'
import { downloadSnapshot } from '../workspaceApi'
import { documentTypeIcon, outputGroup, WsOutputGroup } from '../workspaceHelpers'
import WorkspaceTableFrame from '../common/WorkspaceTableFrame.vue'

type Item = WsOutputRow | { key: string; group: WsOutputGroup }

// rows come sorted newest first (filterOutputs); a group header goes in front of each group (spec 10.1)
const props = defineProps<{ rows: WsOutputRow[]; loading: boolean; filtered: boolean }>()
const emit = defineEmits<{ clear: [] }>()
const { t } = useI18n()
const store = useWorkspaceStore()

const downloading = ref<string | null>(null)

// first load: header and placeholder rows instead of an empty table
const showSkeleton = computed(() => props.loading && !props.rows.length)

const items = computed<Item[]>(() => {
    const out: Item[] = []
    let current: WsOutputGroup | null = null
    for (const row of props.rows) {
        const group = outputGroup(row.created)
        if (group !== current) {
            out.push({ key: 'group-' + group, group })
            current = group
        }
        out.push(row)
    }
    return out
})

const columns = computed(() => [
    { name: 'document', label: t('workspace.columns.document'), field: 'documentName', align: 'left' as const },
    { name: 'job', label: t('workspace.columns.job'), field: 'jobName', align: 'left' as const },
    { name: 'produced', label: t('workspace.columns.produced'), field: 'created', align: 'left' as const },
    { name: 'format', label: t('workspace.columns.format'), field: 'format', align: 'left' as const },
    { name: 'actions', label: '', field: 'key', align: 'right' as const }
])

// the type icon of the document when the documents list knows it
const typeById = computed(() => new Map(store.documents.filter((d) => d.kind === 'DOCUMENT').map((d) => [d.biObjectId, d.typeCode])))
const iconOf = (row: WsOutputRow) => documentTypeIcon(typeById.value.get(row.biObjectId) ?? '')

// Today: 07:00. This week: Mon 07:00. Earlier: 1 Oct 07:00 (and the year when it is not this year).
function produced(row: WsOutputRow): string {
    const date = new Date(row.created)
    const group = outputGroup(row.created)
    const time = { hour: '2-digit', minute: '2-digit' } as const
    const options: Intl.DateTimeFormatOptions = group === 'today' ? time : group === 'thisWeek' ? { weekday: 'short', ...time } : { day: 'numeric', month: 'short', ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}), ...time }
    return new Intl.DateTimeFormat(getLocale(true), options).format(date)
}
const fullDate = (time: number) => formatDateWithLocale(time, { dateStyle: 'medium', timeStyle: 'short' })

async function download(row: WsOutputRow) {
    downloading.value = row.key
    try {
        downloadDirectFromResponse(await downloadSnapshot(row.biObjectId, row.snapshotId))
    } catch {
        // the axios interceptor shows the error
    } finally {
        downloading.value = null
    }
}
</script>
