<template>
    <div v-if="selectedDatasetProp.id" id="dataset-editor-data-detail-container" class="dataset-detail">
        <InfoCard :selected-dataset-prop="selectedDatasetProp" @preview="$emit('preview')" />
        <!-- Right below the Cached toggle, so the toggle visibly opens it -->
        <IndexesCard v-if="selectedDatasetProp.modelCache" :selected-dataset-prop="selectedDatasetProp" />
        <ParamsCard v-if="selectedDatasetProp.parameters?.length > 0" :selected-dataset-prop="selectedDatasetProp" :document-drivers-prop="documentDriversProp" />
        <DriversCard v-if="selectedDatasetProp.drivers?.length > 0" :selected-dataset-prop="selectedDatasetProp" :document-drivers-prop="documentDriversProp" :dashboard-id="dashboardId" />
    </div>
    <div v-else class="dataset-detail">
        <KnHint :title="'dashboard.datasetEditor.dataDetailTitle'" :hint="'dashboard.datasetEditor.dataDetailMsg'" data-test="dataset-hint"></KnHint>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import InfoCard from './DatasetEditorDataDetailInfo.vue'
import ParamsCard from './DatasetEditorDataDetailPrameters.vue'
import DriversCard from './DatasetEditorDataDetailDrivers.vue'
import IndexesCard from './DatasetEditorDataDetailIndexes.vue'
import KnHint from '@/components/UI/KnHint.vue'

export default defineComponent({
    name: 'dataset-editor-data-detail',
    components: { InfoCard, ParamsCard, DriversCard, IndexesCard, KnHint },
    props: { selectedDatasetProp: { required: true, type: Object }, dashboardDatasetsProp: { required: true, type: Array as any }, documentDriversProp: { type: Array as any }, dashboardId: { type: String, required: true } },
    emits: ['preview']
})
</script>
