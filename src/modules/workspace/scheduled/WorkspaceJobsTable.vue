<template>
    <WorkspaceTableFrame v-slot="{ scrollTarget }" :skeleton="showSkeleton" :columns="frameColumns">
        <q-table class="kn-ws-table kn-ws-table--static" flat dense virtual-scroll :virtual-scroll-target="scrollTarget" :hide-bottom="rows.length > 0" binary-state-sort :rows-per-page-options="[0]" :rows="rows" :columns="columns" :visible-columns="visibleColumns" row-key="key">
            <template #body-cell-name="props">
                <q-td :props="props" :data-ws-job="props.row.key">
                    <div class="row items-center no-wrap kn-ws-name">
                        <span class="kn-ws-name__icon"><q-icon name="sym_o_schedule" size="18px" /></span>
                        <div class="column no-wrap kn-ws-name__text">
                            <span class="kn-ws-name__title ellipsis">{{ props.row.jobName }}</span>
                            <span v-if="props.row.jobGroup" class="kn-ws-name__sub ellipsis">{{ props.row.jobGroup }}</span>
                        </div>
                    </div>
                </q-td>
            </template>
            <template #body-cell-documents="props">
                <q-td :props="props">
                    <div class="row no-wrap items-center kn-ws-tags">
                        <span v-for="name in props.row.documents.slice(0, MAX_TAGS)" :key="name" class="kn-ws-tag ellipsis">{{ name }}</span>
                        <span v-if="props.row.documents.length > MAX_TAGS" class="kn-ws-tag kn-ws-tag--more">
                            +{{ props.row.documents.length - MAX_TAGS }}
                            <q-tooltip>{{ props.row.documents.slice(MAX_TAGS).join(', ') }}</q-tooltip>
                        </span>
                    </div>
                </q-td>
            </template>
            <template #body-cell-actions="props">
                <q-td :props="props" auto-width>
                    <!-- one trigger: run it; several: All triggers or one of them (spec 10.2) -->
                    <q-btn flat dense no-caps icon="sym_o_play_arrow" :label="$t('workspace.runNow')" class="kn-ws-row-btn" :disable="!props.row.triggers.length" :loading="running === props.row.key" data-ws-run-job @click="props.row.triggers.length === 1 ? emit('run', props.row, props.row.triggers) : undefined">
                        <q-icon v-if="props.row.triggers.length > 1" name="sym_o_expand_more" size="18px" class="kn-ws-control__icon" />
                        <q-tooltip v-if="!props.row.triggers.length">{{ $t('workspace.noTriggers') }}</q-tooltip>
                        <q-menu v-if="props.row.triggers.length > 1" class="kn-ws-menu kn-ws-action-menu" anchor="bottom right" self="top right" :offset="[0, 4]">
                            <div class="kn-ws-menu__list">
                                <MainMenuPopupRow v-close-popup icon="sym_o_play_arrow" :label="$t('workspace.allTriggers')" data-ws-trigger="all" @activate="emit('run', props.row, props.row.triggers)" />
                                <div class="kn-ws-menu__separator"></div>
                                <MainMenuPopupRow v-for="trigger in props.row.triggers" :key="trigger.triggerGroup + '/' + trigger.triggerName" v-close-popup icon="sym_o_schedule" :label="trigger.triggerName" :data-ws-trigger="trigger.triggerName" @activate="emit('run', props.row, [trigger])" />
                            </div>
                        </q-menu>
                    </q-btn>
                </q-td>
            </template>
            <template #no-data>
                <div class="full-width row items-center justify-center kn-ws-no-data">{{ $t('workspace.empty.noJobs') }}</div>
            </template>
        </q-table>
    </WorkspaceTableFrame>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'
import { ITrigger, WsJobRow } from '../Workspace'
import WorkspaceTableFrame from '../common/WorkspaceTableFrame.vue'

const MAX_TAGS = 2

const props = defineProps<{ rows: WsJobRow[]; loading: boolean; canRun: boolean; running: string | null }>()
const emit = defineEmits<{ run: [row: WsJobRow, triggers: ITrigger[]] }>()
const { t } = useI18n()

const sortText = (a: string, b: string) => (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' })

const columns = computed(() => [
    { name: 'name', label: t('workspace.columns.job'), field: 'jobName', align: 'left' as const, sortable: true, sort: sortText },
    { name: 'description', label: t('workspace.columns.description'), field: 'description', align: 'left' as const, sortable: true, sort: sortText, classes: 'kn-ws-muted ellipsis' },
    { name: 'documents', label: t('workspace.columns.documents'), field: 'documents', align: 'left' as const },
    { name: 'triggers', label: t('workspace.columns.triggers'), field: (row: WsJobRow) => row.triggers.length, align: 'right' as const, sortable: true, classes: 'kn-ws-muted' },
    { name: 'actions', label: '', field: 'key', align: 'right' as const }
])

// Run now needs RunSnapshotsFunctionality (spec 10.2)
const visibleColumns = computed(() => ['name', 'description', 'documents', 'triggers', ...(props.canRun ? ['actions'] : [])])

// first load: header and placeholder rows instead of an empty table
const showSkeleton = computed(() => props.loading && !props.rows.length)
const frameColumns = computed(() => columns.value.filter((c) => visibleColumns.value.includes(c.name)))
</script>
