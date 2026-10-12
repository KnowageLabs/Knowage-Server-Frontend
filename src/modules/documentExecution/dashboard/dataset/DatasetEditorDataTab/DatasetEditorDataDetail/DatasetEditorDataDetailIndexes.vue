<template>
    <q-card flat bordered class="dataset-detail-card">
        <q-card-section class="dataset-detail-card__header row items-center no-wrap q-py-xs">
            <div class="kn-editor-card-label col">{{ $t('dashboard.datasetEditor.indexesTitle') }}</div>
            <q-icon name="help_outline" size="18px" class="kn-editor-card-hint">
                <q-tooltip anchor="center left" self="center right" max-width="300px">{{ $t('dashboard.datasetEditor.indexHint') }}</q-tooltip>
            </q-icon>
        </q-card-section>
        <q-separator />
        <q-card-section>
            <q-select v-model="selectedDataset.modelIndexes" :options="selectedDatasetProp.metadata.fieldsMeta" option-label="alias" option-value="alias" emit-value map-options multiple use-chips outlined dense hide-bottom-space options-dense :label="$t('common.fields')" data-test="indexes-select" />
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'dataset-editor-data-detail-indexes',
    props: { selectedDatasetProp: { required: true, type: Object } },
    data() {
        return {
            selectedDataset: {} as any
        }
    },
    watch: {
        selectedDatasetProp() {
            this.selectedDataset = this.selectedDatasetProp
        }
    },
    created() {
        this.selectedDataset = this.selectedDatasetProp
    }
})
</script>
