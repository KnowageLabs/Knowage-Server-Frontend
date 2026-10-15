<template>
    <div class="dossier-placeholder-list">
        <div class="row items-center no-wrap q-pa-sm">
            <q-input v-model="search" outlined dense clearable hide-bottom-space :placeholder="$t('common.search')" class="col kn-field-compact" data-test="placeholder-search">
                <template #prepend>
                    <q-icon name="search" size="16px" />
                </template>
            </q-input>
        </div>
        <q-separator />
        <WidgetEditorDrawerList :searchable="false" :items="filteredPlaceholders" item-key="imageName" :active-key="selectedName" @item-click="(item) => emit('select', item.imageName)">
            <template #label="{ item }">
                <span data-test="placeholder-list-item">
                    {{ item.imageName }}
                    <q-tooltip :delay="500">{{ item.imageName }}</q-tooltip>
                </span>
            </template>
            <template #trailing="{ item }">
                <span v-if="missing.has(item.imageName)" class="row items-center no-wrap">
                    <q-icon name="error" size="16px" class="dossier-placeholder-list__error">
                        <q-tooltip :delay="300">{{ $t('documentExecution.dossier.designer.notInTemplate') }}</q-tooltip>
                    </q-icon>
                    <q-btn flat round dense size="sm" icon="delete" class="kn-editor-action" data-test="remove-placeholder" @click.stop="emit('remove', item.imageName)">
                        <q-tooltip :delay="500">{{ $t('common.delete') }}</q-tooltip>
                    </q-btn>
                </span>
                <q-icon v-else-if="incomplete.has(item.imageName)" name="error" size="16px" class="dossier-placeholder-list__error" data-test="placeholder-incomplete">
                    <q-tooltip :delay="300">{{ $t('documentExecution.dossier.designer.driverTypeMissing') }}</q-tooltip>
                </q-icon>
                <q-icon v-else-if="item.label" name="link" size="16px" data-test="placeholder-linked">
                    <q-tooltip :delay="300">{{ item.label }}</q-tooltip>
                </q-icon>
                <q-icon v-else name="warning" size="16px" class="dossier-placeholder-list__warning" data-test="placeholder-not-linked">
                    <q-tooltip :delay="300">{{ $t('documentExecution.dossier.designerDialog.noDocumentLinkedToThePlaceholder') }}</q-tooltip>
                </q-icon>
            </template>
        </WidgetEditorDrawerList>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import WidgetEditorDrawerList from '@/modules/documentExecution/dashboard/widget/WidgetEditor/common/WidgetEditorDrawerList.vue'
import type { iPlaceholder } from './DossierTemplate'

const props = defineProps<{ placeholders: iPlaceholder[]; selectedName: string | null; missing: Set<string>; incomplete: Set<string> }>()
const emit = defineEmits<{ (e: 'select', name: string): void; (e: 'remove', name: string): void }>()

const search = ref('')

const filteredPlaceholders = computed(() => {
    const text = (search.value ?? '').trim().toLowerCase()
    return text ? props.placeholders.filter((placeholder) => placeholder.imageName?.toLowerCase().includes(text)) : props.placeholders
})
</script>

<style lang="scss" scoped>
.dossier-placeholder-list__warning {
    color: var(--kn-color-warning);
}

.dossier-placeholder-list__error {
    color: var(--kn-color-error);
}
</style>
