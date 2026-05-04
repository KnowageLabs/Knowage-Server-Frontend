<template>
    <div v-if="!widgetModel.dataset" class="row items-center text-warning">
        <q-icon name="warning" class="q-mr-sm" />
        {{ $t('managers.functionsCatalog.noDatasetSelected') }}
    </div>
    <div v-else class="text-caption text-grey-7">
        {{ $t('dashboard.widgetEditor.editorTags.hint.repeatIndex') }}
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'widget-editor-repeat-index',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: ['insertChanged']
})
</script>
