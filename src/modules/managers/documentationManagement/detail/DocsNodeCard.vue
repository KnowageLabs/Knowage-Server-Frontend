<template>
    <q-card v-if="node" data-tour-id="docs-node-card">
        <q-card-section class="docs-card__header row items-center no-wrap">
            <div class="kn-editor-card-label col">{{ $t('managers.documentationManagement.node.title') }}</div>
            <DocsLetter :letter="letter" />
        </q-card-section>
        <q-separator />

        <q-banner v-if="node.deleted" dense class="bg-grey-3 docs-node-card__deleted">
            <template #avatar><q-icon name="delete" /></template>
            {{ $t('managers.documentationManagement.node.deletedBanner') }}
            <template #action>
                <q-btn flat dense no-caps icon="restore" :label="$t('managers.documentationManagement.restoreItem')" @click="wc.restoreNode(node.id)" />
            </template>
        </q-banner>

        <q-card-section>
            <div class="row q-col-gutter-sm">
                <div class="col-12 col-md-4">
                    <q-input v-model="node.label" outlined dense hide-bottom-space :disable="node.deleted" :label="$t('managers.documentationManagement.node.label') + ' *'" :error="!node.label.trim()" :error-message="$t('common.validation.required', { fieldName: $t('managers.documentationManagement.node.label') })" />
                </div>
                <div class="col-12 col-md-4">
                    <q-input
                        v-if="node.file"
                        v-model="fileDraft"
                        outlined
                        dense
                        hide-bottom-space
                        input-class="docs-node-card__file"
                        :disable="node.deleted"
                        :label="$t('managers.documentationManagement.node.file') + ' *'"
                        :error="!!fileError"
                        :error-message="fileError"
                        @blur="applyFile"
                        @keyup.enter="applyFile"
                    >
                        <template #append>
                            <q-icon name="help_outline" size="18px">
                                <q-tooltip>{{ $t('managers.documentationManagement.node.fileHint') }}</q-tooltip>
                            </q-icon>
                        </template>
                    </q-input>
                    <!-- The empty state under the card creates the page, so the field only says that there is none. -->
                    <q-input v-else model-value="" outlined dense hide-bottom-space readonly stack-label :label="$t('managers.documentationManagement.node.file')" :placeholder="$t('managers.documentationManagement.node.noPage')" />
                </div>
                <div class="col-12 col-md-4" data-tour-id="docs-roles">
                    <q-select
                        v-model="node.roles"
                        outlined
                        dense
                        hide-bottom-space
                        multiple
                        emit-value
                        map-options
                        options-dense
                        :options="roleOptions"
                        :display-value="node.roles.length ? node.roles.join(', ') : $t('managers.documentationManagement.node.allRoles')"
                        :disable="node.deleted"
                        :label="$t('managers.documentationManagement.node.visibility')"
                        :error="hiddenByParent.length > 0"
                        :error-message="$t('managers.documentationManagement.node.hiddenByParent', { roles: hiddenByParent.join(', ') })"
                    >
                        <template #append>
                            <q-icon name="help_outline" size="18px" @click.stop>
                                <q-tooltip>{{ $t('managers.documentationManagement.node.visibilityHint') }}</q-tooltip>
                            </q-icon>
                        </template>
                        <template #option="{ opt, itemProps }">
                            <q-item v-bind="itemProps">
                                <q-item-section>{{ opt.label }}</q-item-section>
                                <q-item-section v-if="opt.hiddenBy" side class="docs-node-card__caption">{{ $t('managers.documentationManagement.node.hiddenBy', { label: opt.hiddenBy }) }}</q-item-section>
                            </q-item>
                        </template>
                        <template #no-option>
                            <q-item>
                                <q-item-section class="text-grey">{{ $t('managers.documentationManagement.node.noRoles') }}</q-item-section>
                            </q-item>
                        </template>
                    </q-select>
                </div>
                <div v-if="renamed" class="col-12">
                    <q-banner dense rounded class="bg-blue-1 text-blue-10">
                        <template #avatar><q-icon name="info" /></template>
                        {{ $t('managers.documentationManagement.node.renameWarning') }}
                    </q-banner>
                </div>
            </div>
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDocs } from '../useDocsWorkingCopy'
import { ancestorIds, HOME_FILE, isValidFileName } from '../documentationManagementHelpers'
import DocsLetter from '../drawer/DocsLetter.vue'

const props = defineProps<{ id: string }>()

const wc = useDocs()
const { t } = useI18n()

const node = computed(() => wc.nodeById(props.id))
const letter = computed(() => wc.letters.value.get(props.id) ?? '')
const fileDraft = ref(node.value?.file ?? '')
const fileError = ref('')

watch(
    () => node.value?.file,
    (file) => {
        fileDraft.value = file ?? ''
        fileError.value = ''
    }
)

const renamed = computed(() => {
    const base = wc.baseNodes.value.find((b) => b.id === props.id)
    return !!base && !!base.file && !!node.value?.file && base.file !== node.value.file
})

// A node is visible only to roles that every parent with roles allows (spec 2.3, item 3). The closest parent that hides a role names it.
const parentsWithRoles = computed(() =>
    ancestorIds(wc.nodes.value, props.id)
        .map((id) => wc.nodeById(id))
        .filter((parent) => !!parent && parent.roles.length > 0)
)
const hiddenBy = (role: string) => parentsWithRoles.value.find((parent) => !parent!.roles.includes(role))?.label ?? ''
const hiddenByParent = computed(() => (node.value?.roles ?? []).filter((role) => hiddenBy(role)))

// A role that the node lists but the server does not know (a hand-written config) stays in the list, so it can be removed.
const roleOptions = computed(() =>
    [...new Set([...wc.roles.value, ...(node.value?.roles ?? [])])].map((role) => {
        const parent = hiddenBy(role)
        // A role that the node already lists stays selectable, so the user can remove it.
        return { label: role, value: role, hiddenBy: parent, disable: !!parent && !node.value?.roles.includes(role) }
    })
)

function validateFile(value: string): string {
    if (!value.endsWith('.md')) return t('managers.documentationManagement.node.fileExtension')
    if (!isValidFileName(value)) return t('managers.documentationManagement.node.fileInvalid')
    const taken = wc.allKnownFiles().includes(value) && value !== HOME_FILE
    if (taken) return t('managers.documentationManagement.node.fileExists')
    return ''
}

async function applyFile() {
    const current = node.value
    if (!current || fileDraft.value === current.file) return
    const value = fileDraft.value.trim().replace(/^\/+/, '')
    fileError.value = validateFile(value)
    if (fileError.value) return
    try {
        await wc.setNodeFile(current.id, value)
    } catch (error: any) {
        fileError.value = error?.message ?? t('common.error.generic')
    }
}
</script>

<style lang="scss" scoped>
.docs-node-card__deleted {
    border-bottom: 1px solid var(--kn-color-borders);
}

:deep(.docs-node-card__file) {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.8125rem;
}

.docs-node-card__caption {
    font-size: 0.75rem;
}
</style>
