<template>
    <q-card flat bordered class="dataset-detail-card">
        <q-card-section class="dataset-detail-card__header row items-center no-wrap q-py-xs">
            <div class="kn-editor-card-label col ellipsis">{{ selectedDataset.label }}</div>
            <q-btn flat round dense size="sm" icon="visibility" class="kn-editor-action" data-test="preview-button" @click="$emit('preview')">
                <q-tooltip :delay="500">{{ $t('common.preview') }}</q-tooltip>
            </q-btn>
        </q-card-section>
        <q-separator />
        <q-card-section class="dataset-info">
            <q-input :model-value="selectedDataset.label" :label="$t('common.label')" readonly outlined dense stack-label hide-bottom-space />
            <q-input :model-value="selectedDataset.name" :label="$t('common.name')" readonly outlined dense stack-label hide-bottom-space />
            <q-input :model-value="dataDialogDescriptor.datasetTypes[selectedDataset.type] ?? selectedDataset.type" :label="$t('common.type')" readonly outlined dense stack-label hide-bottom-space />
            <q-input :model-value="selectedDataset.description || '-'" :label="$t('common.description')" readonly outlined dense stack-label hide-bottom-space autogrow class="dataset-info__wide" />
            <q-input v-model="selectedDataset.frequency" type="number" :label="$t('dashboard.datasetEditor.frequency')" outlined dense stack-label hide-bottom-space data-test="frequency-input" />
            <q-toggle v-model="selectedDataset.modelCache" :disable="cacheDisabled" :label="$t('dashboard.datasetEditor.cached')" class="dataset-info__toggle" data-test="cache-toggle" />
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import dataDialogDescriptor from '../DatasetEditorDataDialog/DatasetEditorDataDialogDescriptor.json'

export default defineComponent({
    name: 'dataset-editor-data-detail-info',
    props: { selectedDatasetProp: { required: true, type: Object } },
    emits: ['preview'],
    data() {
        return {
            dataDialogDescriptor,
            selectedDataset: {} as any
        }
    },
    watch: {
        selectedDatasetProp: {
            handler() {
                this.selectedDataset = this.selectedDatasetProp
            },
            deep: true
        }
    },
    computed: {
        cacheDisabled(): boolean {
            return (this.selectedDatasetProp.isCachingSupported && !this.selectedDatasetProp.isNearRealtimeSupported) || (!this.selectedDatasetProp.isCachingSupported && this.selectedDatasetProp.isNearRealtimeSupported) || this.selectedDatasetProp.isRealtime
        }
    },
    created() {
        this.selectedDataset = this.selectedDatasetProp
    }
})
</script>

<style lang="scss" scoped>
.dataset-info {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    align-items: center;

    &__wide {
        grid-column: 1 / -1;
    }

    &__toggle {
        grid-column: span 2;
    }

    :deep(.q-field--readonly .q-field__control) {
        cursor: default;
    }
}
</style>
