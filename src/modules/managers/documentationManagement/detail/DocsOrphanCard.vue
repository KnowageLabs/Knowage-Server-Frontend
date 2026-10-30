<template>
    <q-card data-tour-id="docs-orphan-card">
        <q-card-section class="docs-card__header row items-center no-wrap">
            <div class="kn-editor-card-label col">{{ $t('managers.documentationManagement.orphan.title') }}</div>
            <DocsLetter :letter="letter" />
        </q-card-section>
        <q-separator />
        <q-card-section>
            <p class="q-mb-sm">
                <span class="docs-card__code">{{ path }}</span>
            </p>
            <p class="docs-card__note q-mb-md">{{ $t('managers.documentationManagement.orphan.description') }}</p>
            <q-banner v-if="deleted" dense rounded class="bg-grey-3 q-mb-md">
                <template #avatar><q-icon name="delete" /></template>
                {{ $t('managers.documentationManagement.orphan.deletedBanner') }}
                <template #action>
                    <q-btn flat dense no-caps icon="restore" :label="$t('managers.documentationManagement.restoreItem')" @click="wc.restoreOrphan(path)" />
                </template>
            </q-banner>
            <div v-else class="row q-gutter-sm">
                <q-btn unelevated dense no-caps color="primary" icon="playlist_add" :label="$t('managers.documentationManagement.orphan.addToMenu')" class="q-px-sm" @click="addToMenu" />
                <q-btn flat dense no-caps icon="delete" :label="$t('managers.documentationManagement.orphan.deleteFile')" class="q-px-sm" @click="confirmDelete" />
            </div>
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useDocs } from '../useDocsWorkingCopy'
import DocsLetter from '../drawer/DocsLetter.vue'

const props = defineProps<{ path: string }>()
const emit = defineEmits<{
    (e: 'selectNode', id: string): void
    (e: 'closed'): void
}>()

const wc = useDocs()
const { t } = useI18n()
const $q = useQuasar()

const letter = computed(() => wc.letterOfFile(props.path))
const deleted = computed(() => wc.deletedPaths.value.includes(props.path))

function addToMenu() {
    emit('selectNode', wc.addOrphanToMenu(props.path).id)
}

function confirmDelete() {
    $q.dialog({ title: t('common.toast.deleteConfirmTitle'), message: t('managers.documentationManagement.orphan.deleteMessage', { path: props.path }), cancel: true, persistent: true }).onOk(() => {
        wc.deleteOrphan(props.path)
        // A new file is gone at once. A saved file stays until Save, so it can be restored.
        if (!wc.baseFiles.value[props.path]) emit('closed')
    })
}
</script>
