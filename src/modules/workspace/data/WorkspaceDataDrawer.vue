<template>
    <div v-if="row" class="column no-wrap fit" :data-ws-drawer-row="row.key">
        <WorkspaceDrawerHeader :name="row.name" :icon="row.kind === 'MODEL' ? 'sym_o_account_tree' : 'sym_o_database'">
            <template #subtitle>{{ row.kind === 'MODEL' ? $t('workspace.kind.MODEL') : `${$t('workspace.kind.DATASET')} · ${row.dsTypeCd ?? ''}` }}</template>
        </WorkspaceDrawerHeader>

        <WorkspaceDrawerAction v-if="primary" :primary="primary" :menu="menuActions" />

        <q-scroll-area class="col">
            <section class="column kn-ws-drawer__section">
                <span class="kn-ws-drawer__section-title">{{ $t('workspace.details') }}</span>
                <dl class="kn-ws-drawer__about">
                    <dt>{{ $t('workspace.columns.name') }}</dt>
                    <dd>{{ row.name }}</dd>
                    <template v-if="row.label">
                        <dt>{{ $t('workspace.label') }}</dt>
                        <dd>{{ row.label }}</dd>
                    </template>
                    <dt>{{ $t('workspace.columns.type') }}</dt>
                    <dd class="row items-center kn-ws-chips">
                        <span>{{ row.kind === 'MODEL' ? $t('workspace.kind.MODEL') : row.dsTypeCd }}</span>
                        <span v-if="parametrical" class="kn-ws-tag" data-ws="parametrical">{{ $t('workspace.myData.parametrical') }}</span>
                    </dd>
                    <template v-if="row.description">
                        <dt>{{ $t('common.description') }}</dt>
                        <dd class="kn-ws-drawer__multiline">{{ row.description }}</dd>
                    </template>
                    <template v-if="row.category">
                        <dt>{{ $t('workspace.columns.category') }}</dt>
                        <dd>{{ row.category }}</dd>
                    </template>
                    <template v-if="row.owner">
                        <dt>{{ $t('workspace.columns.owner') }}</dt>
                        <dd>{{ row.owner }}</dd>
                    </template>
                    <template v-if="modified">
                        <dt>{{ $t('workspace.columns.modified') }}</dt>
                        <dd>{{ modified }}</dd>
                    </template>
                    <template v-if="row.dataSourceLabel">
                        <dt>{{ $t('workspace.columns.dataSource') }}</dt>
                        <dd>{{ row.dataSourceLabel }}</dd>
                    </template>
                    <template v-if="row.tags.length">
                        <dt>{{ $t('workspace.columns.tags') }}</dt>
                        <dd class="row kn-ws-chips">
                            <span v-for="tag in row.tags" :key="tag" class="kn-ws-tag">{{ tag }}</span>
                        </dd>
                    </template>
                </dl>
            </section>
        </q-scroll-area>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import { WsDataRow } from '../Workspace'
import { parseServerDate } from '../workspaceHelpers'
import WorkspaceDrawerAction from '../common/WorkspaceDrawerAction.vue'
import WorkspaceDrawerHeader from '../common/WorkspaceDrawerHeader.vue'
import { useDataActions } from './useDataActions'

// Spec 9, round 2: the document drawer frame for a dataset or a business model. The main action is Preview,
// else Open in QBE (else the first action of 8.2); ▾ holds the rest.
const props = defineProps<{ row: WsDataRow | null; actions: ReturnType<typeof useDataActions> }>()

const allActions = computed(() => (props.row ? props.actions.menu(props.row, { insideDrawer: true, withPrimary: true }) : []))
const primary = computed(() => allActions.value[0] ?? null)
const menuActions = computed(() => allActions.value.slice(1))
// "Parametrical" only when the dataset has parameters or drivers, or the model has drivers (spec 9).
const parametrical = computed(() => !!props.row && ((props.row.raw?.pars?.length ?? 0) > 0 || (props.row.raw?.drivers?.length ?? 0) > 0))
const modified = computed(() => {
    const time = parseServerDate(props.row?.modified)
    return time ? formatDateWithLocale(time, { dateStyle: 'medium' }) : ''
})
</script>
