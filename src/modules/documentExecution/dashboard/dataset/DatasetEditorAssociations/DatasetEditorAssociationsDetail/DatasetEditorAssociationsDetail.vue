<template>
    <div class="associations-detail column no-wrap">
        <q-banner v-if="selectedAssociationProp.fields.length < 2" dense rounded class="associations-detail__error" data-test="association-error">
            <template #avatar>
                <q-icon name="error" />
            </template>
            {{ $t('dashboard.datasetEditor.emptyAssociationError') }}
        </q-banner>

        <div class="associations-detail__grid">
            <DataCard
                v-for="dataset in selectedDatasetsProp"
                :key="dataset.id.dsId"
                :dataset-prop="dataset"
                :selected-association-prop="selectedAssociationProp"
                :field-usage="fieldUsage"
                @fieldSelected="$emit('fieldSelected', $event)"
                @fieldUnselected="$emit('fieldUnselected', $event)"
            />
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
    computed: {
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

    &__error {
        background-color: var(--kn-editor-panel-background);
        border: 1px solid var(--kn-color-error);
        color: var(--kn-color-error);
    }

    // Masonry-like flow: each card keeps its full height, so there is little empty space and no scroll inside a card
    &__grid {
        column-width: 260px;
        column-gap: 12px;
    }
}
</style>
