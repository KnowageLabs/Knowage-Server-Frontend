<template>
    <q-dialog :model-value="visible" :persistent="busy" @update:model-value="(value) => !value && !busy && emit('close')" @hide="reset">
        <q-card class="docs-import-dialog column no-wrap">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('managers.documentationManagement.import.title') }}</q-toolbar-title>
                <q-btn flat round dense icon="close" :disable="busy" @click="emit('close')" />
            </q-toolbar>
            <q-linear-progress v-if="busy" indeterminate color="primary" />

            <q-card-section v-if="!summary" class="col">
                <div class="docs-import-dialog__drop column items-center justify-center" :class="{ 'docs-import-dialog__drop--active': dragging }" @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop">
                    <q-icon name="drive_folder_upload" size="2.5rem" color="grey-6" class="q-mb-sm" />
                    <span class="q-mb-sm">{{ $t('managers.documentationManagement.import.drop') }}</span>
                    <q-btn unelevated no-caps color="primary" icon="folder_zip" :label="$t('managers.documentationManagement.import.choose')" @click="fileInput?.click()" />
                    <input ref="fileInput" type="file" accept=".zip,application/zip" hidden @change="onChoose" />
                </div>
                <p class="docs-import-dialog__note q-mt-md q-mb-none">{{ $t('managers.documentationManagement.import.note') }}</p>
            </q-card-section>

            <q-scroll-area v-else class="col">
                <div class="docs-import-dialog__body">
                    <div class="docs-import-dialog__file ellipsis">
                        <q-icon name="folder_zip" size="18px" class="q-mr-xs" />{{ fileName }}
                    </div>
                    <div class="docs-import-dialog__counts">
                        <div v-for="count in counts" :key="count.key" class="docs-import-dialog__count">
                            <span class="docs-import-dialog__number" :class="`docs-import-dialog__number--${count.key}`">{{ count.value }}</span>
                            <span>{{ $t(`managers.documentationManagement.import.counts.${count.key}`) }}</span>
                        </div>
                    </div>
                    <q-banner v-if="summary.configNote" dense rounded class="bg-blue-1 text-blue-10 q-mb-sm">
                        <template #avatar><q-icon name="info" /></template>
                        {{ summary.configNote }}
                    </q-banner>
                    <q-checkbox v-model="deleteMissing" dense :label="$t('managers.documentationManagement.import.deleteMissing')" @update:model-value="recount" />
                    <div v-if="summary.skipped.length" class="q-mt-md">
                        <div class="kn-editor-card-label q-mb-xs">{{ $t('managers.documentationManagement.import.skipped') }}</div>
                        <div v-for="item in summary.skipped" :key="item.path" class="docs-import-dialog__skip row no-wrap">
                            <span class="ellipsis col">{{ item.path }}</span>
                            <span class="docs-import-dialog__reason">{{ $t(`managers.documentationManagement.import.skip.${item.reason}`) }}</span>
                        </div>
                    </div>
                </div>
            </q-scroll-area>

            <q-card-actions align="right">
                <q-btn flat no-caps :label="$t('common.cancel')" :disable="busy" @click="emit('close')" />
                <q-btn v-if="summary" unelevated no-caps color="primary" :loading="busy" :disable="!hasContent" :label="$t('managers.documentationManagement.import.run')" @click="run" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useDocs } from '../useDocsWorkingCopy'
import { filterZipEntries } from '../documentationManagementHelpers'
import type { iDocsSkipReason } from '../DocumentationManagement'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'imported'): void
}>()

const wc = useDocs()
const { t } = useI18n()
const $q = useQuasar()

interface iSummary {
    added: number
    changed: number
    removed: number
    skipped: { path: string; reason: iDocsSkipReason | 'badConfig' }[]
    images: number
    configNote: string
}

const fileInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const busy = ref(false)
const fileName = ref('')
const summary = ref<iSummary | null>(null)
const deleteMissing = ref(false)
let pages: { path: string; text: string }[] = []
let images: { path: string; data: Uint8Array }[] = []
let config: any | null = null

const counts = computed(() => [
    { key: 'added', value: summary.value?.added ?? 0 },
    { key: 'changed', value: summary.value?.changed ?? 0 },
    { key: 'removed', value: summary.value?.removed ?? 0 },
    { key: 'skipped', value: summary.value?.skipped.length ?? 0 }
])
const hasContent = ref(false)

function reset() {
    summary.value = null
    fileName.value = ''
    deleteMissing.value = false
    hasContent.value = false
    pages = []
    images = []
    config = null
}

function onChoose(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (file) read(file)
}

function onDrop(event: DragEvent) {
    dragging.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) read(file)
}

// Nothing goes to the server here. The zip is opened in the browser.
async function read(file: File) {
    busy.value = true
    try {
        const { unzipSync, strFromU8 } = await import('fflate')
        const data = new Uint8Array(await file.arrayBuffer())
        const entries: { path: string; size: number }[] = []
        unzipSync(data, {
            filter: (entry) => {
                entries.push({ path: entry.name, size: entry.originalSize })
                return false
            }
        })
        const accepted = filterZipEntries(entries)
        const wanted = new Set([...accepted.pages, ...accepted.images, ...(accepted.config ? [accepted.config] : [])].map((entry) => entry.path))
        const files = unzipSync(data, { filter: (entry) => wanted.has(entry.name) })

        pages = accepted.pages.map((entry) => ({ path: entry.path, text: strFromU8(files[entry.path]) }))
        images = accepted.images.map((entry) => ({ path: entry.path, data: files[entry.path] }))
        const skipped: iSummary['skipped'] = [...accepted.skipped]
        config = null
        let configNote = ''
        if (accepted.config) {
            try {
                const parsed = JSON.parse(strFromU8(files[accepted.config.path]))
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
                config = parsed
                configNote = t('managers.documentationManagement.import.configReplaces')
            } catch {
                skipped.push({ path: accepted.config.path, reason: 'badConfig' })
            }
        } else configNote = t('managers.documentationManagement.import.noConfig')

        fileName.value = file.name
        hasContent.value = pages.length > 0 || images.length > 0 || !!config
        summary.value = { added: 0, changed: 0, removed: 0, skipped, images: images.length, configNote }
        await recount()
    } catch (error: any) {
        reset()
        $q.notify({ type: 'negative', message: t('managers.documentationManagement.import.unreadable', { message: error?.message ?? '' }) })
    } finally {
        busy.value = false
    }
}

async function recount() {
    if (!summary.value) return
    busy.value = true
    try {
        const result = await wc.analyzeImport(pages, deleteMissing.value)
        summary.value = { ...summary.value, added: result.added, changed: result.changed, removed: result.removed.length }
    } finally {
        busy.value = false
    }
}

async function run() {
    busy.value = true
    try {
        for (const image of images) await wc.uploadAsset(image.path, new Blob([image.data as BlobPart]))
        await wc.applyImport({ config, pages, deleteMissing: deleteMissing.value })
        $q.notify({ type: 'positive', message: t('managers.documentationManagement.import.done') })
        emit('imported')
        emit('close')
    } catch (error: any) {
        $q.notify({ type: 'negative', message: error?.message ?? t('common.error.generic') })
    } finally {
        busy.value = false
    }
}
</script>

<style lang="scss" scoped>
.docs-import-dialog {
    width: min(620px, 94vw);
    height: min(560px, 86vh);
}

.docs-import-dialog__drop {
    height: 220px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    color: rgba(0, 0, 0, 0.6);
}

.docs-import-dialog__drop--active {
    border-color: var(--q-primary);
    background: var(--kn-color-selected);
}

.docs-import-dialog__note {
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.54);
}

.docs-import-dialog__body {
    padding: 16px;
}

.docs-import-dialog__file {
    margin-bottom: 12px;
    font-weight: 600;
}

.docs-import-dialog__counts {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 12px;
}

.docs-import-dialog__count {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    border: 1px solid var(--kn-color-borders);
    border-radius: 4px;
    font-size: 0.75rem;
}

.docs-import-dialog__number {
    font-size: 1.5rem;
    font-weight: 600;
}

.docs-import-dialog__number--added {
    color: var(--kn-docs-change-new);
}

.docs-import-dialog__number--changed {
    color: var(--kn-docs-change-modified);
}

.docs-import-dialog__number--removed {
    color: var(--kn-docs-change-deleted);
}

.docs-import-dialog__skip {
    gap: 8px;
    font-size: 0.8rem;
}

.docs-import-dialog__reason {
    flex: none;
    color: rgba(0, 0, 0, 0.54);
}
</style>
