<template>
    <q-dialog :model-value="visible" persistent @update:model-value="(value) => !value && !saving && emit('close')">
        <q-card class="docs-save-dialog column no-wrap" data-tour-id="docs-save-dialog">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ title }}</q-toolbar-title>
            </q-toolbar>
            <q-linear-progress v-if="saving" :value="doneCount / Math.max(shownRows.length, 1)" color="primary" />

            <q-banner v-if="outcomeMessage" dense class="docs-save-dialog__banner" :class="outcomeError ? 'bg-negative text-white' : 'bg-positive text-white'">
                <template #avatar><q-icon :name="outcomeError ? 'error' : 'check_circle'" /></template>
                {{ outcomeMessage }}
            </q-banner>

            <q-scroll-area class="col docs-save-dialog__list">
                <template v-for="group in groups" :key="group.kind">
                    <div v-if="group.rows.length" class="docs-save-dialog__group kn-editor-card-label">{{ $t(`managers.documentationManagement.save.group.${group.kind}`) }}</div>
                    <div v-for="row in group.rows" :key="rowKey(row)" class="docs-save-row row items-center no-wrap">
                        <DocsLetter :letter="row.letter" class="docs-save-row__letter" />
                        <div class="docs-save-row__text col">
                            <div class="ellipsis">
                                <template v-if="row.oldPath">
                                    <span class="docs-save-row__old">{{ row.oldPath }}</span> → {{ row.path }}
                                </template>
                                <template v-else>{{ row.path }}</template>
                            </div>
                            <div class="docs-save-row__reason">{{ stateOf(row).message || $t(`managers.documentationManagement.save.reason.${row.reason}`) }}</div>
                        </div>
                        <template v-if="started">
                            <q-spinner v-if="stateOf(row).state === 'running'" size="18px" color="primary" />
                            <q-icon v-else-if="stateOf(row).state === 'saved'" name="check_circle" color="positive" size="20px" />
                            <q-icon v-else-if="stateOf(row).state === 'failed'" name="error" color="negative" size="20px" />
                            <span v-else-if="stateOf(row).state === 'notTried'" class="docs-save-row__not-tried">{{ $t('managers.documentationManagement.save.notTried') }}</span>
                        </template>
                        <q-btn v-else flat dense no-caps size="sm" icon="undo" :label="$t('managers.documentationManagement.discard')" @click="discardRow(row)" />
                    </div>
                </template>
                <div v-if="!shownRows.length" class="docs-save-dialog__empty">{{ $t('managers.documentationManagement.save.nothing') }}</div>
            </q-scroll-area>

            <q-card-section class="docs-save-dialog__info row items-center no-wrap">
                <q-icon name="public" size="18px" class="q-mr-sm" />
                {{ $t('managers.documentationManagement.save.info') }}
            </q-card-section>
            <q-card-actions align="right">
                <q-btn v-if="!saving" flat no-caps :label="finished ? $t('common.close') : $t('common.cancel')" @click="emit('close')" />
                <q-btn v-if="!finished" unelevated no-caps color="primary" :loading="saving" :disable="!shownRows.length" :label="$t('managers.documentationManagement.save.saveAll')" data-test="save-all" @click="run" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useDocs } from '../useDocsWorkingCopy'
import type { iDocsChange } from '../DocumentationManagement'
import DocsLetter from '../drawer/DocsLetter.vue'

type iRowState = { state: 'pending' | 'running' | 'saved' | 'failed' | 'notTried'; message?: string }

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'saved'): void
}>()

const wc = useDocs()
const { t } = useI18n()
const $q = useQuasar()

const started = ref(false)
const saving = ref(false)
const finished = ref(false)
const frozenRows = ref<iDocsChange[]>([])
const states = ref<Record<string, iRowState>>({})
const outcomeMessage = ref('')
const outcomeError = ref(false)

const rowKey = (row: iDocsChange) => `${row.kind}:${row.path}`
// The list follows the working copy until Save starts. Then it is frozen, so the saved rows stay visible with their result.
const shownRows = computed(() => (started.value ? frozenRows.value : wc.changes.value))
const stateOf = (row: iDocsChange): iRowState => states.value[rowKey(row)] ?? { state: 'pending' }
const doneCount = computed(() => shownRows.value.filter((row) => ['saved', 'failed'].includes(stateOf(row).state)).length)
const groups = computed(() => [
    { kind: 'page', rows: shownRows.value.filter((row) => row.kind === 'page') },
    { kind: 'config', rows: shownRows.value.filter((row) => row.kind === 'config') },
    { kind: 'delete', rows: shownRows.value.filter((row) => row.kind === 'delete') }
])
const title = computed(() => (saving.value ? t('managers.documentationManagement.save.saving', { current: Math.min(doneCount.value + 1, shownRows.value.length), total: shownRows.value.length }) : t('managers.documentationManagement.save.title', shownRows.value.length)))

watch(
    () => props.visible,
    (visible) => {
        if (!visible) return
        started.value = false
        saving.value = false
        finished.value = false
        states.value = {}
        outcomeMessage.value = ''
        outcomeError.value = false
    }
)

// Discarding the last change leaves nothing to save.
watch(
    () => wc.changes.value.length,
    (count) => {
        if (props.visible && !started.value && count === 0) emit('close')
    }
)

function discardRow(row: iDocsChange) {
    if (row.kind === 'page') wc.discardFile(row.path)
    else if (row.kind === 'config') wc.discardConfig()
    else if (row.nodeId) wc.restoreNode(row.nodeId)
    else wc.restoreOrphan(row.path)
}

async function run() {
    const rows = [...wc.changes.value]
    frozenRows.value = rows
    started.value = true
    saving.value = true
    states.value = {}
    const outcome = await wc.save(rows, (index, state, message) => {
        states.value[rowKey(rows[index])] = { state, message }
    })
    saving.value = false
    finished.value = true
    rows.forEach((row, index) => {
        const result = outcome.results[index]
        states.value[rowKey(row)] = { state: result.state, message: result.message }
    })

    const failed = outcome.results.some((result) => result.state === 'failed') || !!outcome.error
    if (!failed) {
        $q.notify({ type: 'positive', message: t('managers.documentationManagement.save.success') })
        emit('saved')
        emit('close')
        return
    }
    outcomeError.value = true
    outcomeMessage.value = outcome.error?.status === 403 ? t('managers.documentationManagement.save.forbidden') : t('managers.documentationManagement.save.failed')
}
</script>

<style lang="scss" scoped>
.docs-save-dialog {
    width: min(680px, 94vw);
    height: min(600px, 86vh);
}

.docs-save-dialog__list {
    border-bottom: 1px solid var(--kn-color-borders);
}

.docs-save-dialog__group {
    padding: 12px 16px 4px;
}

.docs-save-dialog__empty {
    padding: 24px 16px;
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.54);
}

.docs-save-dialog__info {
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.6);
}

.docs-save-row {
    gap: 8px;
    min-height: 44px;
    padding: 4px 16px;
}

.docs-save-row__letter {
    flex: none;
}

.docs-save-row__text {
    min-width: 0;
    font-size: 0.85rem;
}

.docs-save-row__old {
    text-decoration: line-through;
    color: rgba(0, 0, 0, 0.5);
}

.docs-save-row__reason {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.54);
}

.docs-save-row__not-tried {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.54);
}
</style>
