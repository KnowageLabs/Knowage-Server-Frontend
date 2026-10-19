<template>
    <div class="associations-detail column no-wrap">
        <Teleport to="body">
            <q-banner v-if="selectedAssociationProp.fields.length < 2 && dismissedFor !== selectedAssociationProp.id" dense rounded class="associations-detail__info bg-blue-8 text-white" data-test="association-error">
                <template #avatar>
                    <q-icon name="info" />
                </template>
                {{ $t('dashboard.datasetEditor.emptyAssociationError') }}
                <template #action>
                    <q-btn flat dense round icon="close" size="sm" data-test="association-info-dismiss" @click="dismissedFor = selectedAssociationProp.id" />
                </template>
            </q-banner>
        </Teleport>

        <div class="associations-detail__filter row items-center no-wrap">
            <q-input v-model="filter" :placeholder="$t('dashboard.datasetEditor.filterFields')" dense outlined clearable class="col" data-test="association-filter">
                <template #prepend><q-icon name="search" size="16px" /></template>
            </q-input>
            <q-btn-toggle v-model="filterMode" unelevated no-caps toggle-color="primary" color="white" text-color="grey-8" class="associations-detail__mode" :options="filterModeOptions" data-test="association-filter-mode" />
        </div>

        <div class="associations-detail__grid">
            <DataCard v-for="dataset in selectedDatasetsProp" :key="dataset.id.dsId" :dataset-prop="dataset" :selected-association-prop="selectedAssociationProp" :field-usage="fieldUsage" :filter="filter ?? ''" :filter-mode="filterMode" @fieldSelected="$emit('fieldSelected', $event)" @fieldUnselected="$emit('fieldUnselected', $event)" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IAssociation } from '../../../Dashboard'
import DataCard from './DatasetEditorAssociationsCard.vue'
import { getFieldUsage } from '../DatasetEditorAssociationsHelper'

export default defineComponent({
    name: 'dataset-editor-associations-detail',
    components: { DataCard },
    props: { dashboardAssociationsProp: { required: true, type: Array as PropType<IAssociation[]> }, selectedDatasetsProp: { required: true, type: Array as any }, selectedAssociationProp: { required: true, type: Object as PropType<IAssociation> } },
    emits: ['fieldSelected', 'fieldUnselected'],
    data() {
        return { filter: '' as string | null, filterMode: 'highlight' as 'highlight' | 'hide', dismissedFor: null as string | null }
    },
    computed: {
        filterModeOptions(): any[] {
            return [
                { value: 'highlight', icon: 'fas fa-highlighter', attrs: { title: this.$t('dashboard.datasetEditor.filterHighlight') } },
                { value: 'hide', icon: 'visibility_off', attrs: { title: this.$t('dashboard.datasetEditor.filterHide') } }
            ]
        },
        fieldUsage(): (datasetId: number, column: string) => string[] {
            return getFieldUsage(this.dashboardAssociationsProp, this.selectedAssociationProp, this.selectedDatasetsProp)
        }
    }
})
</script>

<style lang="scss" scoped>
.associations-detail {
    gap: 12px;
    padding: 16px;

    // Floats above the content, bottom center of the screen
    &__info {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 7000;
        max-width: 90vw;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    &__filter {
        gap: 8px;
        max-width: 420px;
    }

    &__mode {
        border: 1px solid var(--kn-color-borders);
        border-radius: 4px;
    }

    // Masonry-like flow: each card keeps its full height, so there is little empty space and no scroll inside a card
    &__grid {
        column-width: 260px;
        column-gap: 12px;
    }
}
</style>
