<template>
    <div v-if="row" class="column no-wrap fit" :data-ws-drawer-row="row.key">
        <div class="row items-start no-wrap kn-ws-drawer__header">
            <span class="kn-ws-name__icon"><q-icon :name="row.kind === 'MODEL' ? 'account_tree' : 'database'" size="18px" /></span>
            <div class="column col kn-ws-name__text">
                <span class="kn-ws-drawer__name">{{ row.name }}</span>
                <span class="kn-ws-name__sub">{{ row.kind === 'MODEL' ? $t('workspace.kind.MODEL') : `${$t('workspace.kind.DATASET')} · ${row.dsTypeCd ?? ''}` }}</span>
            </div>
            <q-btn v-close-popup flat round dense icon="close" :aria-label="$t('workspace.close')" data-ws-drawer-close>
                <q-tooltip class="kn-ws-above-drawer">{{ $t('workspace.close') }}</q-tooltip>
            </q-btn>
        </div>
        <q-separator />

        <q-scroll-area class="col">
            <div class="row kn-ws-drawer__section kn-ws-chips">
                <q-btn v-if="actions.canPreview(row)" unelevated no-caps color="primary" icon="sym_o_visibility" :label="$t('common.preview')" class="col" @click="actions.preview(row)" />
                <q-btn v-if="actions.canOpenInQbe(row)" :unelevated="!actions.canPreview(row)" :outline="actions.canPreview(row)" no-caps color="primary" icon="sym_o_manage_search" :label="$t('workspace.openInQbe')" class="col" @click="actions.openInQbe(row)" />
            </div>

            <div class="column kn-ws-drawer__section">
                <span class="kn-ws-drawer__section-title">{{ $t('workspace.about') }}</span>
                <dl class="kn-ws-drawer__about">
                    <template v-if="row.label">
                        <dt>{{ $t('workspace.label') }}</dt>
                        <dd>{{ row.label }}</dd>
                    </template>
                    <template v-if="row.description">
                        <dt>{{ $t('common.description') }}</dt>
                        <dd>{{ row.description }}</dd>
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
                            <q-badge v-for="tag in row.tags" :key="tag" outline color="grey-8" :label="tag" />
                        </dd>
                    </template>
                </dl>
            </div>

            <div v-if="menuActions.length" class="column kn-ws-drawer__section">
                <span class="kn-ws-drawer__section-title">{{ $t('workspace.details') }}</span>
                <q-list dense>
                    <q-item v-for="action in menuActions" :key="action.id" clickable :data-ws-action="action.id" @click="action.run()">
                        <q-item-section avatar class="kn-ws-item-icon"><q-icon :name="action.icon" size="18px" /></q-item-section>
                        <q-item-section>{{ $t(action.labelKey) }}</q-item-section>
                    </q-item>
                </q-list>
            </div>
        </q-scroll-area>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import { WsDataRow } from '../Workspace'
import { parseServerDate } from '../workspaceHelpers'
import { useDataActions } from './useDataActions'

// The interim drawer content of a data row (spec 9): name, kind and type, Preview or Open in QBE, About, actions.
const props = defineProps<{ row: WsDataRow | null; actions: ReturnType<typeof useDataActions> }>()

const menuActions = computed(() => (props.row ? props.actions.menu(props.row, { insideDrawer: true }) : []))
const modified = computed(() => {
    const time = parseServerDate(props.row?.modified)
    return time ? formatDateWithLocale(time, { dateStyle: 'medium' }) : ''
})
</script>
